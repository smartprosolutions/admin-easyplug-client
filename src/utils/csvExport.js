/**
 * Escape a value for CSV (RFC-style quoting).
 */
export function escapeCsvValue(value) {
  if (value == null) return "";
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Build a CSV string from column defs and row objects.
 * @param {{ key: string, label: string, getValue?: (row: object) => unknown }[]} columns
 * @param {object[]} rows
 */
export function rowsToCsv(columns, rows) {
  const header = columns.map((col) => escapeCsvValue(col.label)).join(",");
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        const raw = col.getValue ? col.getValue(row) : row[col.key];
        return escapeCsvValue(raw);
      })
      .join(","),
  );
  return [header, ...lines].join("\r\n");
}

/**
 * Trigger a browser download of CSV content.
 * @param {string} filename e.g. "admins-2026-08-11.csv"
 * @param {string} csvContent
 */
export function downloadCsv(filename, csvContent) {
  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function formatExportDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
