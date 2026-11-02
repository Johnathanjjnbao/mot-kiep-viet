import { Component, Suspense, type ReactNode } from 'react';
/** Local loading/failure state leaves the surrounding navigation and current run available. */
export class Deferred extends Component<
  { children: ReactNode; onBack: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div role="alert" className="empty-state">
          <p>Chưa mở được phần này. Bạn có thể quay lại hoặc tải lại giao diện.</p>
          <button className="button secondary" onClick={this.props.onBack}>
            Quay lại
          </button>
          <button className="text-button" onClick={() => window.location.reload()}>
            Tải lại giao diện
          </button>
        </div>
      );
    return (
      <Suspense fallback={<p role="status">Đang mở trang…</p>}>{this.props.children}</Suspense>
    );
  }
}
