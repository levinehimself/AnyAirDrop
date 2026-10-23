import { Emitter } from './emitter';
import { randomHex } from './identity';
import type { PeerLink } from './link';
import type { RemotePeer } from './signaling';
import { createSink, type Sink } from './sinks';

export interface FileMeta {
  name: string;
  size: number;
  type: string;
}

export interface ReceivedFile extends FileMeta {
  file: File;
}

// Control messages travel as JSON on the same ordered channel as the binary chunks,
// so "file", the chunks and "eof" always arrive in the order they were sent.
export type Control =
  | { t: 'offer'; xid: string; files: FileMeta[]; total: number }
  | { t: 'accept' | 'decline' | 'busy' | 'cancel' | 'done' | 'ack'; xid: string }
  | { t: 'file' | 'eof'; xid: string; i: number }
  // Trusted devices: one side proposes a secret room token, the other accepts or declines.
  // Either side can later revoke it.
  | { t: 'trust-offer'; xid: string; token: string; auto?: boolean }
  | { t: 'trust-accept' | 'trust-decline' | 'trust-cancel'; xid: string }
  | { t: 'trust-revoke'; xid: string; token: string };

export function parseControl(text: string): Control | null {
  try {
    const msg = JSON.parse(text);
    return msg && typeof msg.t === 'string' && typeof msg.xid === 'string' ? (msg as Control) : null;
  } catch {
    return null;
  }
}

/** Checks an incoming offer and makes its file names safe to save. */
export function validateOffer(msg: { files?: unknown }): { files: FileMeta[]; total: number } | null {
  if (!Array.isArray(msg.files) || msg.files.length === 0 || msg.files.length > 1000) return null;
  const files: FileMeta[] = [];
  let total = 0;
  for (const f of msg.files as Partial<FileMeta>[]) {
    if (typeof f?.name !== 'string' || typeof f.size !== 'number' || !Number.isFinite(f.size) || f.size < 0) {
      return null;
    }
    const name = f.name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 200) || 'file';
    files.push({ name, size: f.size, type: typeof f.type === 'string' ? f.type.slice(0, 100) : '' });
    total += f.size;
  }
  return { files, total };
}

const READ_BLOCK = 1024 * 1024;

export class OutgoingTransfer extends Emitter<{ progress: [done: number, total: number] }> {
  readonly xid = randomHex(8);
  readonly total: number;
  onSettled: (() => void) | null = null;
  private waiter: ((msg: Control) => void) | null = null;
  private stopped: string | null = null;
  // Wakes a send that is waiting for the buffer to drain, so a cancel takes effect at once.
  private readonly abort = new AbortController();

  constructor(
    readonly link: PeerLink,
    readonly peer: RemotePeer,
    readonly files: File[],
  ) {
    super();
    this.total = files.reduce((sum, f) => sum + f.size, 0);
  }

  handle(msg: Control): void {
    if (msg.t === 'cancel') {
      this.stopped ??= 'cancelled';
      this.abort.abort();
    }
    this.waiter?.(msg);
  }

  /** Resolves when the receiver confirms every file, or with their refusal. */
  async run(onAccepted: () => void): Promise<'done' | 'declined' | 'busy'> {
    try {
      await this.link.ready();
      const meta: FileMeta[] = this.files.map((f) => ({ name: f.name, size: f.size, type: f.type }));
      const reply = this.waitFor(['accept', 'decline', 'busy', 'cancel']);
      this.link.sendJSON({ t: 'offer', xid: this.xid, files: meta, total: this.total });
      const answer = await reply;
      if (answer.t === 'decline') return 'declined';
      if (answer.t === 'busy') return 'busy';
      if (answer.t === 'cancel') throw new Error(this.stopped ?? 'cancelled');
      onAccepted();

      const chunk = this.link.chunkSize;
      let sent = 0;
      for (let i = 0; i < this.files.length; i++) {
        const file = this.files[i];
        this.link.sendJSON({ t: 'file', xid: this.xid, i });
        // The next block is read while the current one is sent, so a slow disk or photo
        // library never leaves the network waiting.
        const read = (from: number): Promise<ArrayBuffer> => {
          const block = file.slice(from, from + READ_BLOCK).arrayBuffer();
          block.catch(() => {}); // A cancelled transfer never awaits it.
          return block;
        };
        let upcoming = file.size > 0 ? read(0) : null;
        for (let offset = 0; offset < file.size; offset += READ_BLOCK) {
          const block = await upcoming!;
          upcoming = offset + READ_BLOCK < file.size ? read(offset + READ_BLOCK) : null;
          for (let start = 0; start < block.byteLength; start += chunk) {
            if (this.stopped) throw new Error(this.stopped);
            // A view onto the block: no copy per message.
            const piece = new Uint8Array(block, start, Math.min(chunk, block.byteLength - start));
            await this.link.sendBinary(piece, this.abort.signal);
            if (this.stopped) throw new Error(this.stopped);
            sent += piece.byteLength;
            // Report what has left the buffer, not what is merely queued.
            this.emit('progress', Math.max(0, sent - this.link.dc.bufferedAmount), this.total);
          }
        }
        this.link.sendJSON({ t: 'eof', xid: this.xid, i });
      }

      const ack = this.waitFor(['ack', 'cancel']);
      this.link.sendJSON({ t: 'done', xid: this.xid });
      const final = await ack;
      if (final.t === 'cancel') throw new Error(this.stopped ?? 'cancelled');
      this.emit('progress', this.total, this.total);
      return 'done';
    } finally {
      this.waiter = null;
      this.onSettled?.();
    }
  }

  cancel(reason = 'cancelled'): void {
    if (this.stopped) return;
    this.stopped = reason;
    this.abort.abort();
    try {
      if (reason === 'cancelled') this.link.sendJSON({ t: 'cancel', xid: this.xid });
    } catch {
      // Channel already gone.
    }
    this.waiter?.({ t: 'cancel', xid: this.xid });
  }

  private waitFor(types: Control['t'][]): Promise<Control> {
    return new Promise((resolve) => {
      if (this.stopped) {
        resolve({ t: 'cancel', xid: this.xid });
        return;
      }
      this.waiter = (msg) => {
        if (!types.includes(msg.t)) return;
        this.waiter = null;
        resolve(msg);
      };
    });
  }
}

type IncomingEvents = {
  progress: [done: number, total: number];
  done: [ReceivedFile[]];
  failed: [reason: string];
};

export class IncomingTransfer extends Emitter<IncomingEvents> {
  state: 'pending' | 'receiving' | 'done' | 'closed' = 'pending';
  onSettled: (() => void) | null = null;
  private received = 0;
  private sink: Sink | null = null;
  private results: ReceivedFile[] = [];
  private queue: Promise<void> = Promise.resolve();

  constructor(
    readonly link: PeerLink,
    readonly peer: RemotePeer,
    readonly xid: string,
    readonly files: FileMeta[],
    readonly total: number,
    private readonly ownerId: string,
  ) {
    super();
  }

  accept(): void {
    if (this.state !== 'pending') return;
    this.state = 'receiving';
    this.link.sendJSON({ t: 'accept', xid: this.xid });
  }

  decline(): void {
    if (this.state !== 'pending') return;
    this.close();
    this.safeSend({ t: 'decline', xid: this.xid });
  }

  cancel(): void {
    if (this.state === 'pending') return this.decline();
    if (this.state !== 'receiving') return;
    this.close();
    this.safeSend({ t: 'cancel', xid: this.xid });
  }

  fail(reason: string): void {
    if (this.state === 'done' || this.state === 'closed') return;
    this.close();
    this.emit('failed', reason);
  }

  handle(data: Control | ArrayBuffer): void {
    if (!(data instanceof ArrayBuffer) && data.t === 'cancel') {
      this.fail('cancelled');
      return;
    }
    this.queue = this.queue
      .then(() => this.process(data))
      .catch((err: unknown) => {
        this.safeSend({ t: 'cancel', xid: this.xid });
        this.fail(err instanceof Error ? err.message : 'receive-error');
      });
  }

  private async process(data: Control | ArrayBuffer): Promise<void> {
    if (this.state !== 'receiving') return;
    if (data instanceof ArrayBuffer) {
      if (!this.sink) return;
      await this.sink.write(data);
      this.received += data.byteLength;
      this.emit('progress', this.received, this.total);
      return;
    }
    if (data.t === 'file') {
      const meta = this.files[data.i];
      if (!meta) throw new Error('bad-file-index');
      this.sink = await createSink(meta, `${this.xid}-${data.i}`, this.ownerId);
    } else if (data.t === 'eof') {
      const meta = this.files[data.i];
      if (!this.sink || !meta) return;
      const file = await this.sink.finish();
      this.sink = null;
      this.results.push({ ...meta, file });
    } else if (data.t === 'done') {
      this.state = 'done';
      this.safeSend({ t: 'ack', xid: this.xid });
      this.emit('done', this.results);
      this.onSettled?.();
    }
  }

  private close(): void {
    this.state = 'closed';
    void this.sink?.abort();
    this.sink = null;
    this.onSettled?.();
  }

  private safeSend(msg: Control): void {
    try {
      this.link.sendJSON(msg);
    } catch {
      // Channel already gone.
    }
  }
}
