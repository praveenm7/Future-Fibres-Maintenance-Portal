import { ReactNode } from 'react';

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
                <div className="page-header inline-block mb-2">{title}</div>
                <p className="text-muted-foreground text-sm">{subtitle}</p>
                {filters && (
                    <div className="mt-4">{filters}</div>
                )}
            </div>
            {children}
        </div>
    );
}
