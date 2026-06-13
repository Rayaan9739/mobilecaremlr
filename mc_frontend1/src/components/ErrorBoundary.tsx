import React, { ReactNode, ReactElement } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactElement;
}

interface ErrorBoundaryState {
  error: Error | null;
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null, hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error("Error Boundary caught error:", error);
    return { error, hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error details:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ error: null, hasError: false });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h1 className="text-xl font-bold text-foreground">
                Something went wrong
              </h1>
            </div>
            <p className="text-muted-foreground mb-6">
              An error occurred while loading this page. Please try again.
            </p>
            <details className="mb-4 p-3 bg-gray-100 rounded text-sm">
              <summary className="cursor-pointer font-semibold text-gray-700">
                Error details
              </summary>
              <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-48">
                {this.state.error.toString()}
              </pre>
            </details>
            <div className="flex gap-2">
              <Button onClick={this.resetError} variant="outline" className="flex-1">
                Try Again
              </Button>
              <Button onClick={() => window.location.href = "/"} className="flex-1">
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
