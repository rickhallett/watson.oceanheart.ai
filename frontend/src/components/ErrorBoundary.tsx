import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { MonochromeButton } from '@/components/MonochromeButton';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="glass-card p-8 text-center border-red-500/30">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-zinc-50 mb-2">
                Something went wrong
              </h1>
              <p className="text-zinc-400 mb-6">
                An unexpected error occurred. Please try refreshing the page.
              </p>

              {this.state.error && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6 text-left">
                  <p className="text-xs text-zinc-500 mb-1">Error details:</p>
                  <p className="text-sm text-red-300 font-mono break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <MonochromeButton
                  variant="primary"
                  size="md"
                  icon={<RefreshCw className="w-4 h-4" />}
                  onClick={this.handleReload}
                >
                  Refresh Page
                </MonochromeButton>
                <MonochromeButton
                  variant="ghost"
                  size="md"
                  icon={<Home className="w-4 h-4" />}
                  onClick={this.handleGoHome}
                >
                  Go Home
                </MonochromeButton>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
