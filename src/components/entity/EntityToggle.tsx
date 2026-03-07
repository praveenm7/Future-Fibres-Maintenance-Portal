import { useEntity } from '@/contexts/EntityContext';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EntityToggleProps {
    collapsed?: boolean;
}

/**
 * Segmented control to switch between FFSL and FFVL.
 * Shows "View Only" indicator when viewing non-home entity.
 */
export function EntityToggle({ collapsed }: EntityToggleProps) {
    const { entities, activeEntity, homeEntity, setActiveEntity } = useEntity();

    if (collapsed) {
        return (
            <div className="flex flex-col items-center gap-1 py-2">
                <span className={cn(
                    'rounded px-1.5 py-0.5 text-[10px] font-bold leading-tight',
                    activeEntity.code === 'FFSL'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                )}>
                    {activeEntity.code}
                </span>
                {activeEntity.id !== homeEntity.id && (
                    <Eye className="h-3 w-3 text-muted-foreground" />
                )}
            </div>
        );
    }

    return (
        <div className="px-3 py-2">
            <div className="flex rounded-lg bg-sidebar-accent/50 p-0.5">
                {entities.map((entity) => {
                    const isActive = entity.id === activeEntity.id;
                    const isHome = entity.id === homeEntity.id;
                    return (
                        <button
                            key={entity.id}
                            onClick={() => setActiveEntity(entity)}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-all',
                                isActive
                                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                            )}
                        >
                            <span>{entity.code}</span>
                            {isActive && !isHome && (
                                <Eye className="h-3 w-3 opacity-70" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
