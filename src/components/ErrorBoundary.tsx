import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                    <h2 className="text-xl font-semibold">Something went wrong</h2>
                    <p className="text-muted-foreground max-w-md">
                        An unexpected error occurred. Please try refreshing the page.
                    </p>
                    {this.state.error && (
                        <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded max-w-lg truncate">
                            {this.state.error.message}
                        </p>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={this.handleReset}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            Reload Page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
