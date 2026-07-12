'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary 捕捉到錯誤:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback?.(this.state.error, this.reset) || (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <h1 className="text-3xl font-bold mb-4">出錯了 😕</h1>
              <p className="text-ink-soft mb-6 text-sm">{this.state.error.message}</p>
              <button
                onClick={this.reset}
                className="px-6 py-3 bg-mint text-white font-bold rounded-full hover:opacity-90 transition-opacity"
              >
                重試
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
