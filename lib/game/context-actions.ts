/** Quote a literal path for the simulated shell, including apostrophes and operators. */
export function shellPath(path: string): string {
  return "'" + path.replaceAll("'", "'\\''") + "'";
}

export function siblingPath(folder: string, name: string): string | null {
  const clean = name.trim();
  if (!clean || clean === '.' || clean === '..' || /[\/\\\x00-\x1f\x7f]/.test(clean)) return null;
  const path = (folder === '/' ? '' : folder) + '/' + clean;
  return path.length <= 300 ? path : null;
}

export function insertClipboard(value: string, start: number, end: number, text: string, singleLine = false) {
  const inserted = singleLine ? text.replace(/[\r\n\t]+/g, ' ') : text;
  return {text: value.slice(0, start) + inserted + value.slice(end), caret: start + inserted.length};
}
