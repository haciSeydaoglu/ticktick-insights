/**
 * RFC 4180 compliant CSV parser with TickTick-specific handling.
 * Handles: UTF-8 BOM, multiline quoted fields, metadata rows, field normalization.
 */

const EXPECTED_HEADERS = ['Folder Name', 'List Name', 'Title', 'Status', 'Priority'];

const STATUS_MAP = {
  0: 'pending',
  1: 'completed',
  2: 'completed',
  '-1': 'deleted',
};

const PRIORITY_MAP = {
  0: 0,
  1: 1,
  3: 3,
  5: 5,
};

/**
 * Parse a TickTick backup CSV string into structured task objects.
 * @param {string} raw - Raw CSV file content
 * @returns {{ tasks: Object[], metadata: string, headerRow: string[] }}
 * @throws {Error} If the file format is invalid
 */
export function parseTickTickCSV(raw) {
  // Strip UTF-8 BOM
  let text = raw;
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  // Parse all rows using RFC 4180 state machine
  const allRows = parseCSVRows(text);

  if (allRows.length < 2) {
    throw new Error('File is too short to be a valid TickTick backup.');
  }

  // Find header row by looking for "Folder Name" in the first column
  let headerIndex = -1;
  let metadataLines = '';

  for (let i = 0; i < Math.min(allRows.length, 20); i++) {
    if (allRows[i][0] && allRows[i][0].trim() === 'Folder Name') {
      headerIndex = i;
      break;
    }
    metadataLines += allRows[i].join(',') + '\n';
  }

  if (headerIndex === -1) {
    throw new Error(
      'Could not find header row. Expected a row starting with "Folder Name".'
    );
  }

  const headers = allRows[headerIndex].map((h) => h.trim());

  // Validate expected columns exist
  for (const expected of EXPECTED_HEADERS) {
    if (!headers.includes(expected)) {
      throw new Error(`Missing expected column: "${expected}".`);
    }
  }

  // Build column index map
  const colIndex = {};
  headers.forEach((h, i) => {
    colIndex[h] = i;
  });

  // Parse data rows
  const tasks = [];
  for (let i = headerIndex + 1; i < allRows.length; i++) {
    const row = allRows[i];
    if (row.length < headers.length) continue;
    if (row.every((cell) => cell.trim() === '')) continue;

    const task = normalizeTask(row, colIndex);
    if (task) tasks.push(task);
  }

  if (tasks.length === 0) {
    throw new Error('No valid tasks found in the CSV file.');
  }

  return {
    tasks,
    metadata: metadataLines.trim(),
    headerRow: headers,
  };
}

/**
 * Normalize a CSV row into a structured task object.
 * @param {string[]} row - Raw CSV row values
 * @param {Object} col - Column name to index mapping
 * @returns {Object|null} Normalized task object
 */
function normalizeTask(row, col) {
  const get = (name) => (col[name] !== undefined ? (row[col[name]] || '').trim() : '');

  const statusRaw = parseInt(get('Status'), 10);
  const status = STATUS_MAP[statusRaw] || 'pending';
  const priorityRaw = parseInt(get('Priority'), 10);
  const priority = PRIORITY_MAP[priorityRaw] !== undefined ? PRIORITY_MAP[priorityRaw] : 0;

  const tagsRaw = get('Tags');
  const tags = tagsRaw
    ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return {
    folderName: get('Folder Name'),
    listName: get('List Name'),
    title: get('Title'),
    kind: get('Kind') || 'TEXT',
    tags,
    content: get('Content'),
    isChecklist: get('Is Check list') === 'TRUE',
    startDate: get('Start Date') || null,
    dueDate: get('Due Date') || null,
    reminder: get('Reminder') || null,
    repeat: get('Repeat') || null,
    priority,
    priorityRaw,
    status,
    statusRaw,
    createdTime: get('Created Time') || null,
    completedTime: get('Completed Time') || null,
    timezone: get('Timezone') || null,
    isAllDay: get('Is All Day') === 'TRUE',
    isFloating: get('Is Floating') === 'TRUE',
    columnName: get('Column Name') || null,
    taskId: get('taskId') || null,
    parentId: get('parentId') || null,
  };
}

/**
 * RFC 4180 CSV parser - state machine approach.
 * Handles quoted fields with embedded newlines, commas, and escaped quotes.
 * @param {string} text - Raw CSV text
 * @returns {string[][]} Array of rows, each row is array of field strings
 */
function parseCSVRows(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote ""
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentField += '"';
          i += 2;
        } else {
          // End of quoted field
          inQuotes = false;
          i++;
        }
      } else {
        currentField += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
      } else if (char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
        i++;
      } else if (char === '\r') {
        // Handle \r\n
        if (i + 1 < text.length && text[i + 1] === '\n') {
          i++;
        }
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
        i++;
      } else {
        currentField += char;
        i++;
      }
    }
  }

  // Don't forget the last field/row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Validate that a file is likely a TickTick backup CSV.
 * @param {File} file
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const name = file.name.toLowerCase();
  if (!name.endsWith('.csv')) {
    return { valid: false, error: 'Please select a CSV file (.csv).' };
  }

  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File is too large (max 50MB).' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' };
  }

  return { valid: true, error: null };
}
