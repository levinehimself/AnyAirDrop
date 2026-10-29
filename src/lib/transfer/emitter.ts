type Handler = (...args: unknown[]) => void;

export class Emitter<Events extends Record<string, unknown[]>> {
  private handlers = new Map<keyof Events, Set<Handler>>();

  on<K extends keyof Events>(event: K, fn: (...args: Events[K]) => void): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    const handler = fn as unknown as Handler;
    set.add(handler);
    return () => set.delete(handler);
  }

  protected emit<K extends keyof Events>(event: K, ...args: Events[K]): void {
    for (const fn of this.handlers.get(event) ?? []) fn(...args);
  }
}
