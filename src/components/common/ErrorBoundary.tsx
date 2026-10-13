import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Shield, RotateCcw, Home, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('NyaySaathi ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = './#/';
    window.location.reload();
  };

  private handleClearCaches = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
    } catch {
      // Ignored
    }
    window.location.href = './#/';
    window.location.reload();
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-navy-900 text-white flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-navy-800 border-2 border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Something Went Wrong / काहीतरी तांत्रिक त्रुटी आली
                </h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  Your investigation data and evidence are safely stored in IndexedDB on this device.
                </p>
                <p className="text-xs text-muted">
                  तुमचा तपास डेटा आणि पुरावे या उपकरणावर सुरक्षित आहेत.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="py-3 px-4 rounded-xl bg-saffron text-navy-900 font-bold text-xs sm:text-sm hover:bg-amber-400 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload App / पुन्हा उघडा</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="py-3 px-4 rounded-xl bg-navy-700 hover:bg-navy-600 border border-navy-600 text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Go to Home / मुख्यपृष्ठ</span>
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={this.handleClearCaches}
                className="text-xs text-muted hover:text-slate-300 underline cursor-pointer"
              >
                Clear Cache and Reset / कॅश साफ करून पुन्हा सुरू करा
              </button>
            </div>

            {/* Expandable Technical Details */}
            {this.state.error && (
              <div className="pt-3 border-t border-navy-700">
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  className="w-full flex items-center justify-between text-[11px] text-muted hover:text-slate-300 cursor-pointer"
                >
                  <span>Technical details (for logs)</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {this.state.showDetails && (
                  <div className="mt-2 p-3 rounded-xl bg-navy-950 border border-navy-700 text-[10px] font-mono text-rose-300 overflow-x-auto max-h-40 space-y-1">
                    <p className="font-bold">{this.state.error.name}: {this.state.error.message}</p>
                    {this.state.error.stack && (
                      <pre className="text-slate-400 text-[9px] whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
