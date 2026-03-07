import { useEntity } from '@/contexts/EntityContext';
import type { Entity } from '@/types/entity';
import { cn } from '@/lib/utils';

/**
 * Full-screen modal shown on first visit when no home entity is set.
 * User picks FFSL or FFVL to establish their identity.
 */
export function EntityPickerDialog() {
    const { entities, needsSetup, setHomeEntity } = useEntity();

    if (!needsSetup) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-lg space-y-6 text-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Welcome to the Maintenance Portal</h1>
                    <p className="mt-2 text-muted-foreground">
                        Select your factory to get started. You can view the other factory's data in read-only mode.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {entities.map((entity) => (
                        <EntityCard
                            key={entity.id}
                            entity={entity}
                            onClick={() => setHomeEntity(entity)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function EntityCard({ entity, onClick }: { entity: Entity; onClick: () => void }) {
    const colors: Record<string, string> = {
        FFSL: 'border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30',
        FFVL: 'border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30',
    };
    const badges: Record<string, string> = {
        FFSL: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
        FFVL: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };

    return (
        <button
            onClick={onClick}
            className={cn(
                'flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all hover:shadow-lg cursor-pointer',
                colors[entity.code] || 'border-border'
            )}
        >
            <span className={cn('rounded-full px-3 py-1 text-sm font-bold', badges[entity.code])}>
                {entity.code}
            </span>
            <span className="text-lg font-semibold">{entity.name}</span>
            <span className="text-sm text-muted-foreground">{entity.country}</span>
        </button>
    );
}
