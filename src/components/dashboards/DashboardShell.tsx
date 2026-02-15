import { ReactNode } from 'react';
import { Printer } from 'lucide-react';

interface DashboardShellProps {
    title: string;
    subtitle: string;
    children: ReactNode;
    filters?: ReactNode;
}

export function DashboardShell({ title, subtitle, children, filters }: DashboardShellProps) {
    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="page-header inline-block mb-2">{title}</div>
                        <p className="text-muted-foreground text-sm">{subtitle}</p>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="no-print flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                        title="Print dashboard"
                    >
                        <Printer className="h-4 w-4" />
                        <span className="hidden sm:inline">Print</span>
                    </button>
                </div>
                {filters && (
                    <div className="mt-4 no-print">{filters}</div>
                )}
            </div>
            {children}
        </div>
    );
}
