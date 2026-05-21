import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Root-level error boundary. Catches render errors in any child page
 * and displays a graceful fallback instead of a blank white screen.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
          <p className="text-5xl">🕊️</p>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="opacity-60 max-w-sm text-sm">{this.state.message || 'An unexpected error occurred. Please try refreshing the page.'}</p>
          <button
            onClick={() => window.location.replace('/')}
            className="mt-4 px-6 py-3 rounded-xl text-white font-bold"
            style={{ background: 'var(--accent)' }}
          >
            Return Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
