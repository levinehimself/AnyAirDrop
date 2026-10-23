/** Where incoming file bytes are written while they arrive. */
export interface Sink {
  write(chunk: ArrayBuffer): Promise<void>;
  finish(): Promise<File>;
  abort(): Promise<void>;
}

// Below this size, holding the file in memory is simplest and fast everywhere.
const DISK_THRESHOLD = 32 * 1024 * 1024;

class MemorySink implements Sink {
  private parts: ArrayBuffer[] = [];
  constructor(
    private readonly name: string,
    private readonly type: string,
  ) {}
  async write(chunk: ArrayBuffer): Promise<void> {
    this.parts.push(chunk);
  }
  async finish(): Promise<File> {
    const file = new File(this.parts, this.name, { type: this.type });
    this.parts = [];
    return file;
  }
  async abort(): Promise<void> {
    this.parts = [];
  }
}

interface WritableLike {
  write(data: ArrayBuffer | Uint8Array<ArrayBuffer>): Promise<void>;
  close(): Promise<void>;
  abort(): Promise<void>;
}

// Network messages are 64 KB, but the file system is much faster (often 2 to 3 times) when
// it is given a megabyte at a time, and phones are slowest at small writes.
const DISK_BLOCK = 1024 * 1024;

// Large files stream into the browser's private file system (OPFS) instead of memory,
// so multi-gigabyte videos don't exhaust a phone's RAM.
class DiskSink implements Sink {
  private pending: ArrayBuffer[] = [];
  private pendingBytes = 0;

  constructor(
    private readonly dir: FileSystemDirectoryHandle,
    private readonly entry: string,
    private readonly handle: FileSystemFileHandle,
    private readonly writable: WritableLike,
    private readonly name: string,
    private readonly type: string,
  ) {}
  async write(chunk: ArrayBuffer): Promise<void> {
    this.pending.push(chunk);
    this.pendingBytes += chunk.byteLength;
    if (this.pendingBytes >= DISK_BLOCK) await this.flush();
  }
  private async flush(): Promise<void> {
    if (this.pendingBytes === 0) return;
    const joined = new Uint8Array(this.pendingBytes);
    let offset = 0;
    for (const part of this.pending) {
      joined.set(new Uint8Array(part), offset);
      offset += part.byteLength;
    }
    this.pending = [];
    this.pendingBytes = 0;
    await this.writable.write(joined);
  }
  async finish(): Promise<File> {
    await this.flush();
    await this.writable.close();
    const stored = await this.handle.getFile();
    return new File([stored], this.name, { type: this.type });
  }
  async abort(): Promise<void> {
    this.pending = [];
    this.pendingBytes = 0;
    await this.writable.abort().catch(() => {});
    await this.dir.removeEntry(this.entry).catch(() => {});
  }
}

let diskDir: Promise<FileSystemDirectoryHandle | null> | null = null;

function incomingDir(ownerId: string): Promise<FileSystemDirectoryHandle | null> {
  diskDir ??= (async () => {
    try {
      if (!navigator.storage?.getDirectory) return null;
      if (typeof FileSystemFileHandle === 'undefined' || !('createWritable' in FileSystemFileHandle.prototype)) {
        return null;
      }
      const root = await navigator.storage.getDirectory();
      const dir = await root.getDirectoryHandle('incoming', { create: true });
      // Remove files left behind by earlier visits (other tabs' entries start with their id).
      const keys = (dir as unknown as { keys(): AsyncIterable<string> }).keys();
      for await (const key of keys) {
        if (!key.startsWith(ownerId)) await dir.removeEntry(key).catch(() => {});
      }
      return dir;
    } catch {
      return null;
    }
  })();
  return diskDir;
}

export async function createSink(
  meta: { name: string; size: number; type: string },
  entryKey: string,
  ownerId: string,
): Promise<Sink> {
  if (meta.size >= DISK_THRESHOLD) {
    const dir = await incomingDir(ownerId);
    if (dir) {
      try {
        const entry = `${ownerId}-${entryKey}`;
        const handle = await dir.getFileHandle(entry, { create: true });
        const writable = (await (handle as unknown as { createWritable(): Promise<WritableLike> }).createWritable());
        return new DiskSink(dir, entry, handle, writable, meta.name, meta.type);
      } catch {
        // Fall through to memory, e.g. when storage quota is exceeded.
      }
    }
  }
  return new MemorySink(meta.name, meta.type);
}
