import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SelectField, InputField, CheckboxField, ComboboxField } from '@/components/ui/FormField';
import { PeriodicityConfigurator } from './PeriodicityConfigurator';
import { format } from './calendarUtils';
import { useMachines } from '@/hooks/useMachines';
import { useMaintenanceActions } from '@/hooks/useMaintenanceActions';
import { useListOptions } from '@/hooks/useListOptions';
import {
  maintenanceActionFormSchema,
  type MaintenanceActionFormValues,
} from '@/lib/schemas/maintenanceActionSchema';

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

/** Derive smart defaults from a clicked date */
function defaultsFromDate(date: Date): Partial<MaintenanceActionFormValues> {
  const dow = (date.getDay() + 6) % 7; // 0=Mon..6=Sun
  const dayOfMonth = date.getDate();
  const weekOfMonth = Math.min(Math.ceil(dayOfMonth / 7), 4);
  const monthInQuarter = (date.getMonth() % 3) + 1;
  return {
    dayOfWeek: dow,
    weekOfMonth,
    dayOfMonth: Math.min(dayOfMonth, 28),
    quarterMonth: monthInQuarter as 1 | 2 | 3,
    month: MONTH_NAMES[date.getMonth()],
  };
}

const baseDefaults: MaintenanceActionFormValues = {
  action: '',
  periodicity: 'WEEKLY',
  intervalMultiplier: 1,
  dayOfWeek: null,
  weekOfMonth: null,
  quarterMonth: null,
  dayOfMonth: null,
  timeNeeded: '' as unknown as number,
  maintenanceInCharge: false,
  status: '',
  month: '',
};

interface CreateActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select a machine when opening from a specific context */
  initialMachineId?: string;
  /** Target date — pre-configures schedule anchor fields */
  targetDate?: Date | null;
}

export function CreateActionSheet({
  open,
  onOpenChange,
  initialMachineId,
  targetDate,
}: CreateActionSheetProps) {
  const { useGetMachines } = useMachines();
  const { useCreateAction } = useMaintenanceActions();
  const { useGetListOptions } = useListOptions();

  const { data: machines = [] } = useGetMachines();
  const { data: periodicityOptions = [] } = useGetListOptions('PERIODICITY');
  const createMutation = useCreateAction();

  const [machineId, setMachineId] = useState('');
  const [machineError, setMachineError] = useState('');

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MaintenanceActionFormValues>({
    resolver: zodResolver(maintenanceActionFormSchema),
    defaultValues: baseDefaults,
  });

  const formValues = watch();

  // Reset form when sheet opens, pre-fill from targetDate
  useEffect(() => {
    if (open) {
      const dateDefaults = targetDate ? defaultsFromDate(targetDate) : {};
      reset({ ...baseDefaults, ...dateDefaults });
      setMachineId(initialMachineId || '');
      setMachineError('');
    }
  }, [open, initialMachineId, targetDate, reset]);

  const machineOptions = machines.map((m) => ({
    value: m.id,
    label: `${m.finalCode} — ${m.description}`,
  }));

  const onSubmit = async (data: MaintenanceActionFormValues) => {
    if (!machineId) {
      setMachineError('Please select a machine');
      return;
    }
    try {
      await createMutation.mutateAsync({
        id: '',
        machineId,
        ...data,
        status: 'IDEAL' as const,
      });
      onOpenChange(false);
    } catch {
      // Handled by mutation toast
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Maintenance Action
          </SheetTitle>
          <SheetDescription>
            Create a new recurring maintenance action.
            {targetDate && (
              <Badge variant="outline" className="ml-2 gap-1">
                <CalendarDays className="h-3 w-3" />
                {format(targetDate, 'EEE, MMM d')}
              </Badge>
            )}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <form onSubmit={handleSubmit(onSubmit)} className="py-4 space-y-4">
          {/* Machine selector */}
          <ComboboxField
            label="Machine"
            value={machineId}
            onChange={(v) => {
              setMachineId(v);
              setMachineError('');
            }}
            options={machineOptions}
            placeholder="Select a machine..."
            searchPlaceholder="Search machines..."
            required
            error={machineError || undefined}
          />

          {/* Action description */}
          <InputField
            label="Action"
            value={formValues.action}
            onChange={(v) => setValue('action', v, { shouldValidate: true, shouldDirty: true })}
            placeholder="Enter action description..."
            required
            error={errors.action?.message}
          />

          {/* Periodicity */}
          <SelectField
            label="Periodicity"
            value={formValues.periodicity}
            onChange={(v) => setValue('periodicity', v, { shouldDirty: true })}
            options={periodicityOptions.map((p) => ({ value: p.value, label: p.value }))}
            required
            error={errors.periodicity?.message}
          />

          {/* Schedule configuration */}
          <PeriodicityConfigurator
            watch={watch}
            setValue={setValue}
            disabled={createMutation.isPending}
          />

          {/* Time & Maintenance In Charge */}
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Time (min)"
              value={String(formValues.timeNeeded)}
              onChange={(v) =>
                setValue('timeNeeded', parseInt(v) || 0, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              type="number"
              min="1"
              required
              error={errors.timeNeeded?.message}
            />
            <CheckboxField
              label="Maint. In Charge"
              checked={formValues.maintenanceInCharge}
              onChange={(v) => setValue('maintenanceInCharge', v, { shouldDirty: true })}
            />
          </div>

          <Separator />

          {/* Submit */}
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create Action
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
