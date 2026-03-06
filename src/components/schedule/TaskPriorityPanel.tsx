import { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, RotateCcw, Save, Loader2, Shield, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PERIODICITY_COLORS, formatTimeMinutes, type Periodicity } from '@/components/calendar/calendarUtils';
import type { ScheduledTask, UnscheduledTask } from '@/types/schedule';

interface TaskItem {
  id: string;
  actionId: string;
  machineFinalCode: string;
  actionText: string;
  periodicity: string;
  status: 'IDEAL' | 'MANDATORY';
  timeNeeded: number;
}

interface TaskPriorityPanelProps {
  scheduledTasks: ScheduledTask[];
  unscheduledTasks: UnscheduledTask[];
  hasOverrides: boolean;
  onSave: (overrides: { actionId: number; sortPosition: number }[]) => void;
  onReset: () => void;
  isSaving: boolean;
}

function SortableTask({ task }: { task: TaskItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const colors = PERIODICITY_COLORS[task.periodicity as Periodicity];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-md border border-border bg-card text-xs transition-shadow',
        isDragging && 'shadow-lg opacity-80 z-50'
      )}
    >
      <button type="button" className="cursor-grab touch-none text-muted-foreground hover:text-foreground" {...attributes} {...listeners}>
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <div className={cn('w-1 h-6 rounded-full shrink-0', colors?.dot || 'bg-gray-400')} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold truncate">{task.machineFinalCode}</span>
          {task.status === 'MANDATORY' ? (
            <Shield className="h-3 w-3 text-red-500 shrink-0" />
          ) : (
            <Lightbulb className="h-3 w-3 text-blue-500 shrink-0" />
          )}
        </div>
        <p className="text-muted-foreground truncate">{task.actionText}</p>
      </div>

      <span className="text-muted-foreground shrink-0">{formatTimeMinutes(task.timeNeeded)}</span>
    </div>
  );
}

export function TaskPriorityPanel({
  scheduledTasks,
  unscheduledTasks,
  hasOverrides,
  onSave,
  onReset,
  isSaving,
}: TaskPriorityPanelProps) {
  const initialItems = useMemo<TaskItem[]>(() => {
    const all: TaskItem[] = [
      ...scheduledTasks.map(t => ({
        id: t.id,
        actionId: t.actionId,
        machineFinalCode: t.machineFinalCode,
        actionText: t.actionText,
        periodicity: t.periodicity,
        status: t.status,
        timeNeeded: t.timeNeeded,
      })),
      ...unscheduledTasks.map(t => ({
        id: `${t.actionId}-unscheduled`,
        actionId: t.actionId,
        machineFinalCode: t.machineFinalCode,
        actionText: t.actionText,
        periodicity: t.periodicity,
        status: t.status,
        timeNeeded: t.timeNeeded,
      })),
    ];
    return all;
  }, [scheduledTasks, unscheduledTasks]);

  const [items, setItems] = useState<TaskItem[]>(initialItems);
  const [isDirty, setIsDirty] = useState(false);

  // Sync items when async data loads or changes (initialItems updates)
  useEffect(() => {
    if (initialItems.length > 0) {
      setItems(initialItems);
      setIsDirty(false);
    }
  }, [initialItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems(prev => {
      const oldIndex = prev.findIndex(i => i.id === active.id);
      const newIndex = prev.findIndex(i => i.id === over.id);
      setIsDirty(true);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSave = () => {
    const overrides = items.map((item, idx) => ({
      actionId: parseInt(item.actionId),
      sortPosition: idx,
    }));
    onSave(overrides);
    setIsDirty(false);
  };

  const handleReset = () => {
    onReset();
    setItems(initialItems);
    setIsDirty(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground">Task Priority Order</h3>
        <div className="flex items-center gap-1.5">
          {hasOverrides && (
            <Badge variant="outline" className="text-[10px] py-0">Custom</Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save
          </Button>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Drag tasks to reorder scheduling priority. Tasks at the top are scheduled first.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
            {items.map(item => (
              <SortableTask key={item.id} task={item} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
