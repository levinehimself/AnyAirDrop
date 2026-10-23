import { downloadZip } from 'client-zip';

export interface ZipInput {
  name: string;
  file: File;
}

export type ZipResult = 'saved' | 'cancelled' | 'too-large';

// Without a save dialog the archive is built in memory before it downloads, so very large
// ones are refused there and can still be saved file by file.
const MEMORY_LIMIT = 1024 * 1024 * 1024;

/** Makes names unique inside the archive: "a.pdf", "a (2).pdf", "a (3).pdf". */
export function uniqueNames(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    let candidate = name;
    const dot = name.lastIndexOf('.');
    const stem = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : '';
    for (let n = 2; used.has(candidate.toLowerCase()); n++) candidate = `${stem} (${n})${ext}`;
    used.add(candidate.toLowerCase());
    return candidate;
  });
}

type SaveFilePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{ createWritable(): Promise<WritableStream> }>;

/**
 * Packs the files into one ZIP and saves it. Files are stored as they are (no extra
 * compression), which is fast and does not hurt photos, videos or documents that are
 * already compressed. Where the browser has a save dialog the ZIP streams straight to disk.
 */
export async function saveAsZip(files: ZipInput[], zipName: string): Promise<ZipResult> {
  const names = uniqueNames(files.map((f) => f.name));
  const make = (): Response =>
    downloadZip(files.map((f, i) => ({ name: names[i], lastModified: f.file.lastModified, input: f.file })));

  const picker = (window as unknown as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;
  if (picker) {
    let writable: WritableStream | null = null;
    try {
      const handle = await picker({
        suggestedName: zipName,
        types: [{ description: 'ZIP archive', accept: { 'application/zip': ['.zip'] } }],
      });
      writable = await handle.createWritable();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      // The dialog is unavailable here (for example, in a frame): fall back to a download.
    }
    if (writable) {
      await make().body!.pipeTo(writable);
      return 'saved';
    }
  }

  if (files.reduce((sum, f) => sum + f.file.size, 0) > MEMORY_LIMIT) return 'too-large';
  const blob = await make().blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return 'saved';
}
