import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { Maximize2, Minimize2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface ChartCardProps {
    title: string;
    children: ReactNode;
    className?: string;
    height?: number;
}

export function ChartCard({ title, children, className, height = 300 }: ChartCardProps) {
    const [isFullscreen, setIsFullscreen] = useState(false);

    return (
        <>
            <div className={cn("bg-card border border-border rounded-lg shadow-sm overflow-hidden", className)}>
                <div className="section-header flex items-center justify-between">
                    <span>{title}</span>
                    <button
                        onClick={() => setIsFullscreen(true)}
                        className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                        title="View fullscreen"
                    >
                        <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                </div>
                <div className="p-4" style={{ height }}>
                    {children}
                </div>
            </div>

            {/* Fullscreen Dialog */}
            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
                <DialogContent className="max-w-[90vw] w-[90vw] h-[80vh] p-0">
                    <div className="flex items-center justify-between px-6 py-3 border-b border-border">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <button
                            onClick={() => setIsFullscreen(false)}
                            className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Minimize2 className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex-1 p-6" style={{ height: 'calc(80vh - 60px)' }}>
                        {children}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
