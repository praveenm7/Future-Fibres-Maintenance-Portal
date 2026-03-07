import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Entity, EntityCode } from '@/types/entity';

// Hardcoded entities — matches database seed data
const ENTITIES: Entity[] = [
    { id: 1, code: 'FFSL', name: 'Future Fibres Sri Lanka', country: 'Sri Lanka' },
    { id: 2, code: 'FFVL', name: 'Future Fibres Valencia', country: 'Spain' },
];

const STORAGE_HOME = 'ff-home-entity';
const STORAGE_ACTIVE = 'ff-active-entity';

interface EntityContextValue {
    entities: Entity[];
    homeEntity: Entity;
    activeEntity: Entity;
    isReadOnly: boolean;
    needsSetup: boolean;
    setHomeEntity: (entity: Entity) => void;
    setActiveEntity: (entity: Entity) => void;
}

const EntityContext = createContext<EntityContextValue | null>(null);

function loadEntity(key: string): Entity | null {
    try {
        const id = parseInt(localStorage.getItem(key) || '', 10);
        return ENTITIES.find(e => e.id === id) || null;
    } catch {
        return null;
    }
}

function saveEntity(key: string, entity: Entity) {
    localStorage.setItem(key, String(entity.id));
}

export function EntityProvider({ children }: { children: ReactNode }) {
    const [homeEntity, setHomeEntityState] = useState<Entity | null>(() => loadEntity(STORAGE_HOME));
    const [activeEntity, setActiveEntityState] = useState<Entity>(() =>
        loadEntity(STORAGE_ACTIVE) || loadEntity(STORAGE_HOME) || ENTITIES[0]
    );

    const needsSetup = homeEntity === null;
    const resolvedHome = homeEntity || ENTITIES[0];
    const isReadOnly = activeEntity.id !== resolvedHome.id;

    const setHomeEntity = useCallback((entity: Entity) => {
        saveEntity(STORAGE_HOME, entity);
        saveEntity(STORAGE_ACTIVE, entity);
        setHomeEntityState(entity);
        setActiveEntityState(entity);
    }, []);

    const setActiveEntity = useCallback((entity: Entity) => {
        saveEntity(STORAGE_ACTIVE, entity);
        setActiveEntityState(entity);
    }, []);

    // Sync if localStorage changes in another tab
    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key === STORAGE_HOME) {
                const ent = loadEntity(STORAGE_HOME);
                if (ent) setHomeEntityState(ent);
            }
            if (e.key === STORAGE_ACTIVE) {
                const ent = loadEntity(STORAGE_ACTIVE);
                if (ent) setActiveEntityState(ent);
            }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    return (
        <EntityContext.Provider value={{
            entities: ENTITIES,
            homeEntity: resolvedHome,
            activeEntity,
            isReadOnly,
            needsSetup,
            setHomeEntity,
            setActiveEntity,
        }}>
            {children}
        </EntityContext.Provider>
    );
}

export function useEntity() {
    const ctx = useContext(EntityContext);
    if (!ctx) throw new Error('useEntity must be used within EntityProvider');
    return ctx;
}

/** Convenience: just the active entity ID (for query keys) */
export function useEntityId(): number {
    return useEntity().activeEntity.id;
}
