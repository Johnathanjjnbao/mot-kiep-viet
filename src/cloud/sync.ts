import { AccountCache } from '../persistence/account-cache';
import { RevisionConflict, type SaveRepository, type SyncStatus } from './contracts';
export class SyncCoordinator {
  private stopped = false;
  private running = false;
  constructor(
    private cache: AccountCache,
    private cloud: SaveRepository,
    private status: (s: SyncStatus) => void,
  ) {}
  stop() {
    this.stopped = true;
  }
  async flush(now = Date.now()) {
    if (this.stopped || this.running) return;
    this.running = true;
    try {
      for (let step = 0; step < 64; step++) {
        if (this.stopped) return;
        const [op] = await this.cache.pending();
        if (!op) {
          this.status('synced');
          return;
        }
        if (op.attempts >= 8 || op.retryAt > now) {
          this.status('pending');
          return;
        }
        this.status('syncing');
        if (!(await this.cache.markAttempt(op.id, now))) continue;
        try {
          const revision = await this.cloud.write(op.slot, op.save, op.expectedRevision, op.id);
          // Persist acknowledgement for this account even if logout happened during the request.
          await this.cache.acknowledge(op.id, revision);
          if (this.stopped) return;
        } catch (e) {
          if (!this.stopped) this.status(e instanceof RevisionConflict ? 'conflict' : 'error');
          return;
        }
      }
      if (!this.stopped) this.status('pending');
    } finally {
      this.running = false;
    }
  }
}
