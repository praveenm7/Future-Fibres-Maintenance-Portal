import { ReactNode } from 'react';
import { Printer } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

interface DashboardShellProps {
    title: string;
    subtitle: string;
    children: ReactNode;
    filters?: ReactNode;
}

export function DashboardShell({ title, subtitle, children, filters }: DashboardShellProps) {
    return (
        <div>
            <PageHeader title={title} subtitle={subtitle} />
            <div className="flex items-center justify-between mb-6">
                <div />
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
                <div className="mb-6 no-print">{filters}</div>
            )}
            {children}
        </div>
    );
}
