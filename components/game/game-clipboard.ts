type ClipboardBridge = {readClipboard?: () => Promise<string>; writeClipboard?: (text: string) => Promise<void>};
function bridge(): ClipboardBridge | undefined {
  return (window as Window & {desktopBridge?: ClipboardBridge}).desktopBridge;
}
export async function readGameClipboard() {
  const desktop = bridge();
  const text = desktop?.readClipboard ? await desktop.readClipboard() : await navigator.clipboard.readText();
  if (text.length > 60000) throw new Error('Clipboard too large');
  return text;
}
export async function writeGameClipboard(text: string) {
  if (text.length > 60000) throw new Error('Clipboard too large');
  const desktop = bridge();
  if (desktop?.writeClipboard) await desktop.writeClipboard(text);
  else await navigator.clipboard.writeText(text);
}
