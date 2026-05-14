import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
  resetKey?: string;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: Props) {
    // Auto-reset when the resetKey (e.g. route) changes
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] bg-[#F5F2ED] flex flex-col items-center justify-center gap-6 p-8 text-center">
          <p className="text-2xl serif font-light">Something went wrong</p>
          <p className="text-xs text-muted-foreground font-mono max-w-md break-all">
            {this.state.error?.message}
          </p>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="text-[10px] uppercase tracking-widest border border-primary px-6 py-3 hover:bg-primary hover:text-white transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => { window.location.href = '/archive'; }}
              className="text-[10px] uppercase tracking-widest border border-primary/20 px-6 py-3 hover:bg-primary/5 transition-colors"
            >
              Return to Archive
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
