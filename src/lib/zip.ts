import { downloadZip } from 'client-zip';

export interface ZipInput {
  name: string;
  file: File;
}

export type ZipResult = 'saved' | 'cancelled' | 'too-large';

const MEMORY_LIMIT = 1024 * 1024 * 1024;

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
