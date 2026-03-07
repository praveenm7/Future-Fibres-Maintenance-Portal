import { ReactNode, useRef } from 'react';
import { Download } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { downloadDashboard } from '@/lib/downloadDashboard';

interface DashboardShellProps {
    title: string;
    subtitle: string;
    children: ReactNode;
    filters?: ReactNode;
}

export function DashboardShell({ title, subtitle, children, filters }: DashboardShellProps) {
    const contentRef = useRef<HTMLDivElement>(null);

    const handleDownload = () => {
        if (!contentRef.current) return;
        downloadDashboard({ title, subtitle, contentEl: contentRef.current });
    };

    return (
        <div>
            <PageHeader title={title} subtitle={subtitle} />
            <div className="flex items-center justify-between mb-6">
                <div />
                <button
                    onClick={handleDownload}
                    className="no-print flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    title="Download dashboard as HTML"
                >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                </button>
            </div>
            {filters && (
                <div className="mb-6 no-print">{filters}</div>
            )}
            <div ref={contentRef}>
                {children}
            </div>
        </div>
    );
}
