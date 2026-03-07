import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { saveReportSchema, type SaveReportFormValues } from '@/lib/schemas/reportDefinitionSchema';

interface SaveReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: SaveReportFormValues) => void;
  defaultValues?: Partial<SaveReportFormValues>;
  isLoading?: boolean;
  mode?: 'create' | 'update';
}

export function SaveReportDialog({
  open, onOpenChange, onSave, defaultValues, isLoading, mode = 'create',
}: SaveReportDialogProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SaveReportFormValues>({
    resolver: zodResolver(saveReportSchema),
    defaultValues: {
      reportName: defaultValues?.reportName || '',
      description: defaultValues?.description || '',
      isShared: defaultValues?.isShared || false,
    },
  });

  const isShared = watch('isShared');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Save Report' : 'Update Report'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Give your report a name and optionally share it with your team.'
              : 'Update the report name, description, or sharing settings.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reportName">Report Name *</Label>
            <Input
              id="reportName"
              {...register('reportName')}
              placeholder="e.g., Weekly Machine Summary"
              size={32}
            />
            {errors.reportName && (
              <p className="text-xs text-destructive">{errors.reportName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="isShared"
              checked={isShared}
              onCheckedChange={v => setValue('isShared', v)}
            />
            <Label htmlFor="isShared" className="cursor-pointer">
              Share with team
              <span className="block text-xs text-muted-foreground font-normal">
                Others in your entity can view and run this report
              </span>
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : mode === 'create' ? 'Save Report' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
