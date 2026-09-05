import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Without this, any uncaught error during render (e.g. unexpected data
 * shape from the server) silently unmounts the whole app — the page just
 * goes blank with nothing in the UI to explain why. This catches that and
 * shows a readable message plus a reload button instead.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaced in the browser console so it's visible via remote debugging
    // or desktop DevTools even though the on-page UI is simplified.
    console.error("Jensi Electrical Works app crashed:", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="gate">
          <div className="gate-card">
            <h1>Something went wrong</h1>
            <p>
              The app hit an unexpected error and couldn't continue. Reloading usually fixes it —
              if it keeps happening, note down what you were doing right before this appeared.
            </p>
            <p className="gate-error" style={{ wordBreak: "break-word" }}>
              {this.state.error.message}
            </p>
            <button type="button" className="btn btn-generate" onClick={this.handleReload}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
