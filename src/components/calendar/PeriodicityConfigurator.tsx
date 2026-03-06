import { useEffect } from 'react';
import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { SelectField, InputField } from '@/components/ui/FormField';
import type { MaintenanceActionFormValues } from '@/lib/schemas/maintenanceActionSchema';
import { formatScheduleSummary } from './calendarUtils';
import type { MaintenanceAction } from '@/types/maintenance';

const DAY_OPTIONS = [
  { value: '0', label: 'Monday' },
  { value: '1', label: 'Tuesday' },
  { value: '2', label: 'Wednesday' },
  { value: '3', label: 'Thursday' },
  { value: '4', label: 'Friday' },
  { value: '5', label: 'Saturday' },
  { value: '6', label: 'Sunday' },
];

const WEEK_OF_MONTH_OPTIONS = [
  { value: '1', label: '1st week' },
  { value: '2', label: '2nd week' },
  { value: '3', label: '3rd week' },
  { value: '4', label: '4th week' },
];

const QUARTER_MONTH_OPTIONS = [
  { value: '1', label: '1st month' },
  { value: '2', label: '2nd month' },
  { value: '3', label: '3rd month' },
];

const MONTH_OPTIONS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
].map(m => ({ value: m, label: m.charAt(0) + m.slice(1).toLowerCase() }));

const UNIT_LABELS: Record<string, string> = {
  DAILY: 'day(s)',
  WEEKLY: 'week(s)',
  MONTHLY: 'month(s)',
  QUARTERLY: 'quarter(s)',
  YEARLY: 'year(s)',
};

interface PeriodicityConfiguratorProps {
  watch: UseFormWatch<MaintenanceActionFormValues>;
  setValue: UseFormSetValue<MaintenanceActionFormValues>;
  disabled?: boolean;
}

export function PeriodicityConfigurator({ watch, setValue, disabled }: PeriodicityConfiguratorProps) {
  const periodicity = watch('periodicity');
  const intervalMultiplier = watch('intervalMultiplier') ?? 1;
  const dayOfWeek = watch('dayOfWeek');
  const weekOfMonth = watch('weekOfMonth');
  const quarterMonth = watch('quarterMonth');
  const dayOfMonth = watch('dayOfMonth');
  const month = watch('month');

  // Clear irrelevant anchor fields when periodicity changes
  useEffect(() => {
    if (!periodicity) return;
    const opts = { shouldDirty: true };

    if (periodicity === 'BEFORE EACH USE') {
      setValue('intervalMultiplier', 1, opts);
      setValue('dayOfWeek', null, opts);
      setValue('weekOfMonth', null, opts);
      setValue('quarterMonth', null, opts);
      setValue('dayOfMonth', null, opts);
    }

    if (periodicity !== 'WEEKLY' && periodicity !== 'MONTHLY') {
      setValue('dayOfWeek', null, opts);
    }
    if (periodicity !== 'MONTHLY') {
      setValue('weekOfMonth', null, opts);
    }
    if (periodicity !== 'QUARTERLY') {
      setValue('quarterMonth', null, opts);
    }
    if (periodicity !== 'MONTHLY' && periodicity !== 'QUARTERLY' && periodicity !== 'YEARLY') {
      setValue('dayOfMonth', null, opts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodicity]);

  if (!periodicity || periodicity === 'BEFORE EACH USE') return null;

  const unitLabel = UNIT_LABELS[periodicity] ?? 'period(s)';

  // Build a preview action object for the summary
  const previewAction = {
    periodicity,
    intervalMultiplier,
    dayOfWeek,
    weekOfMonth,
    quarterMonth,
    dayOfMonth,
    month,
  } as MaintenanceAction;

  const summary = formatScheduleSummary(previewAction);

  return (
    <div className="space-y-3">
      {/* Interval row */}
      <div className="flex items-end gap-3">
        <div className="w-20">
          <InputField
            label="Every"
            value={String(intervalMultiplier)}
            onChange={(v) => setValue('intervalMultiplier', parseInt(v) || 1, { shouldDirty: true })}
            type="number"
            min="1"
            max="365"
            disabled={disabled}
          />
        </div>
        <span className="pb-2 text-sm text-muted-foreground font-medium">{unitLabel}</span>
      </div>

      {/* Anchor fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* WEEKLY: Day of Week */}
        {periodicity === 'WEEKLY' && (
          <SelectField
            label="On"
            value={dayOfWeek != null ? String(dayOfWeek) : '0'}
            onChange={(v) => setValue('dayOfWeek', parseInt(v), { shouldDirty: true })}
            options={DAY_OPTIONS}
            disabled={disabled}
          />
        )}

        {/* MONTHLY: Week of Month + Day of Week OR Day of Month */}
        {periodicity === 'MONTHLY' && (
          <>
            <SelectField
              label="Week"
              value={weekOfMonth != null ? String(weekOfMonth) : 'none'}
              onChange={(v) => {
                const val = v === 'none' ? null : parseInt(v);
                setValue('weekOfMonth', val, { shouldDirty: true });
                if (val != null) setValue('dayOfMonth', null, { shouldDirty: true });
              }}
              options={[{ value: 'none', label: 'Not set (use day)' }, ...WEEK_OF_MONTH_OPTIONS]}
              disabled={disabled}
            />
            {weekOfMonth != null ? (
              <SelectField
                label="Day of Week"
                value={dayOfWeek != null ? String(dayOfWeek) : '0'}
                onChange={(v) => setValue('dayOfWeek', parseInt(v), { shouldDirty: true })}
                options={DAY_OPTIONS}
                disabled={disabled}
              />
            ) : (
              <InputField
                label="Day of Month"
                value={dayOfMonth != null ? String(dayOfMonth) : ''}
                onChange={(v) => {
                  const num = parseInt(v);
                  setValue('dayOfMonth', num && num >= 1 && num <= 28 ? num : null, { shouldDirty: true });
                }}
                type="number"
                min="1"
                max="28"
                placeholder="1-28"
                disabled={disabled}
              />
            )}
          </>
        )}

        {/* QUARTERLY: Month in Quarter + Day of Month */}
        {periodicity === 'QUARTERLY' && (
          <>
            <SelectField
              label="Month in Quarter"
              value={quarterMonth != null ? String(quarterMonth) : '1'}
              onChange={(v) => setValue('quarterMonth', parseInt(v), { shouldDirty: true })}
              options={QUARTER_MONTH_OPTIONS}
              disabled={disabled}
            />
            <InputField
              label="Day of Month"
              value={dayOfMonth != null ? String(dayOfMonth) : '1'}
              onChange={(v) => {
                const num = parseInt(v);
                setValue('dayOfMonth', num && num >= 1 && num <= 28 ? num : 1, { shouldDirty: true });
              }}
              type="number"
              min="1"
              max="28"
              disabled={disabled}
            />
          </>
        )}

        {/* YEARLY: Month + Day of Month */}
        {periodicity === 'YEARLY' && (
          <>
            <SelectField
              label="Month"
              value={month || 'JANUARY'}
              onChange={(v) => setValue('month', v, { shouldDirty: true })}
              options={MONTH_OPTIONS}
              disabled={disabled}
            />
            <InputField
              label="Day of Month"
              value={dayOfMonth != null ? String(dayOfMonth) : '1'}
              onChange={(v) => {
                const num = parseInt(v);
                setValue('dayOfMonth', num && num >= 1 && num <= 28 ? num : 1, { shouldDirty: true });
              }}
              type="number"
              min="1"
              max="28"
              disabled={disabled}
            />
          </>
        )}
      </div>

      {/* Schedule preview */}
      <p className="text-xs text-muted-foreground italic">
        Scheduled: {summary}
      </p>
    </div>
  );
}
