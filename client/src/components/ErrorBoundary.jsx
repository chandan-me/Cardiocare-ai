import React, { Component } from 'react';
import { FaHeartbeat, FaSyncAlt } from 'react-icons/fa';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-900">
          <div className="glass-card w-full max-w-md rounded-2xl p-8 text-center glow-red">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-950/50 dark:text-red-400">
              <FaHeartbeat className="h-8 w-8 animate-pulse" />
            </div>
            
            <h1 className="mt-6 font-display text-2xl font-bold text-slate-800 dark:text-slate-100">
              Application Heartbeat Interrupted
            </h1>
            
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              An unexpected layout rendering error occurred in our system interface.
            </p>

            <div className="my-4 rounded-lg bg-slate-100 p-3 text-left dark:bg-slate-800">
              <code className="text-xs text-red-600 dark:text-red-400 break-all">
                {this.state.error?.toString() || 'Unknown Component Exception'}
              </code>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 rounded-xl bg-medical-500 py-3 font-semibold text-white transition hover:bg-medical-600 focus:outline-none focus:ring-2 focus:ring-medical-500/50"
              >
                <FaSyncAlt className="h-4 w-4" />
                Reload Application
              </button>
              
              <a
                href="/"
                className="rounded-xl border border-slate-200 py-3 font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
