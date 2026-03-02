import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  supportTicketFormSchema,
  type SupportTicketFormValues,
} from '@/lib/schemas/supportTicketSchema';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { useMachines } from '@/hooks/useMachines';
import { useOperators } from '@/hooks/useOperators';
import { useListOptions } from '@/hooks/useListOptions';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const PRIORITY_OPTIONS = [
  { value: 'CRITICAL', label: 'Critical', color: 'text-red-600' },
  { value: 'HIGH', label: 'High', color: 'text-orange-500' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-600' },
  { value: 'LOW', label: 'Low', color: 'text-green-600' },
] as const;

const STATUS_OPTIONS = [
  'SUBMITTED',
  'APPROVED',
  'ASSIGNED',
  'IN PROGRESS',
  'RESOLVED',
  'CLOSED',
  'CANCELLED',
] as const;

const defaultFormValues: SupportTicketFormValues = {
  machineId: '',
  title: '',
  description: '',
  category: '',
  priority: 'MEDIUM',
  submittedById: '',
};

export default function CreateEditTicket() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  // --- Data hooks ---
  const { useGetTicket, useCreateTicket, useUpdateTicket } = useSupportTickets();
  const { useGetMachines } = useMachines();
  const { useGetOperators } = useOperators();
  const { useGetListOptions } = useListOptions();

  const { data: ticket, isLoading: loadingTicket } = useGetTicket(id ?? '');
  const { data: machines = [] } = useGetMachines();
  const { data: operators = [] } = useGetOperators();
  const { data: categories = [] } = useGetListOptions('TICKET_CATEGORY');

  const createMutation = useCreateTicket();
  const updateMutation = useUpdateTicket();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // --- Form setup ---
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SupportTicketFormValues>({
    resolver: zodResolver(supportTicketFormSchema),
    defaultValues: defaultFormValues,
  });

  // Edit-only fields (not part of the create schema, managed separately)
  const {
    register: registerEdit,
    control: controlEdit,
    reset: resetEdit,
    getValues: getEditValues,
  } = useForm({
    defaultValues: {
      status: 'SUBMITTED' as string,
      assignedToId: '' as string,
      dueDate: '' as string,
      resolutionNotes: '' as string,
    },
  });

  // Populate form when ticket loads in edit mode
  useEffect(() => {
    if (isEditMode && ticket) {
      reset({
        machineId: ticket.machineId ?? '',
        title: ticket.title,
        description: ticket.description ?? '',
        category: ticket.category,
        priority: ticket.priority,
        submittedById: ticket.submittedById ?? '',
      });
      resetEdit({
        status: ticket.status,
        assignedToId: ticket.assignedToId ?? '',
        dueDate: ticket.dueDate ? ticket.dueDate.split('T')[0] : '',
        resolutionNotes: ticket.resolutionNotes ?? '',
      });
    }
  }, [isEditMode, ticket, reset, resetEdit]);

  // --- Submit handler ---
  const onSubmit = async (formData: SupportTicketFormValues) => {
    try {
      if (isEditMode && id) {
        const editFields = getEditValues();
        await updateMutation.mutateAsync({
          id,
          data: {
            ...formData,
            status: editFields.status,
            assignedToId: editFields.assignedToId || null,
            dueDate: editFields.dueDate || null,
            resolutionNotes: editFields.resolutionNotes || null,
          },
        });
        toast.success('Ticket updated successfully');
      } else {
        await createMutation.mutateAsync(formData as unknown as Record<string, unknown>);
      }
      navigate('/support/tickets');
    } catch {
      // Error toast is handled by the mutation hooks
    }
  };

  // Wrap the edit-mode submit through the base form handler
  const handleFormSubmit = handleSubmit(onSubmit);

  // --- Loading state ---
  if (isEditMode && loadingTicket) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading ticket...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEditMode ? 'Edit Ticket' : 'Create Support Ticket'}
        subtitle={
          isEditMode && ticket
            ? `Editing ${ticket.ticketCode}`
            : 'Submit a new support ticket for a machine issue'
        }
      />

      <div className="space-y-6">
        {/* Back button */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => navigate('/support/tickets')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tickets
          </Button>
        </div>

        <form onSubmit={handleFormSubmit}>
          {/* Main ticket fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isEditMode ? 'Ticket Details' : 'New Ticket'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Machine */}
                <div className="space-y-2">
                  <Label htmlFor="machineId">
                    Machine <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="machineId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="machineId" className="h-10">
                          <SelectValue placeholder="Select a machine..." />
                        </SelectTrigger>
                        <SelectContent>
                          {machines.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.finalCode} - {m.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.machineId && (
                    <p className="text-sm text-destructive">{errors.machineId.message}</p>
                  )}
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Brief summary of the issue..."
                    className="h-10"
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="category" className="h-10">
                          <SelectValue placeholder="Select a category..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.value}>
                              {c.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.category && (
                    <p className="text-sm text-destructive">{errors.category.message}</p>
                  )}
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority">
                    Priority <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="priority"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="priority" className="h-10">
                          <SelectValue placeholder="Select priority..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              <span className={`flex items-center gap-2 ${p.color}`}>
                                <span
                                  className={`inline-block h-2 w-2 rounded-full ${
                                    p.value === 'CRITICAL'
                                      ? 'bg-red-600'
                                      : p.value === 'HIGH'
                                        ? 'bg-orange-500'
                                        : p.value === 'MEDIUM'
                                          ? 'bg-yellow-500'
                                          : 'bg-green-500'
                                  }`}
                                />
                                {p.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.priority && (
                    <p className="text-sm text-destructive">{errors.priority.message}</p>
                  )}
                </div>

                {/* Submitted By */}
                <div className="space-y-2">
                  <Label htmlFor="submittedById">
                    Submitted By <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="submittedById"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="submittedById" className="h-10">
                          <SelectValue placeholder="Select submitter..." />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((op) => (
                            <SelectItem key={op.id} value={op.id}>
                              {op.operatorName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.submittedById && (
                    <p className="text-sm text-destructive">{errors.submittedById.message}</p>
                  )}
                </div>

                {/* Description — full width */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the issue in detail..."
                    className="min-h-[120px]"
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">{errors.description.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit-only fields */}
          {isEditMode && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Status & Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Controller
                      name="status"
                      control={controlEdit}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="status" className="h-10">
                            <SelectValue placeholder="Select status..." />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Assigned To */}
                  <div className="space-y-2">
                    <Label htmlFor="assignedToId">Assigned To</Label>
                    <Controller
                      name="assignedToId"
                      control={controlEdit}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="assignedToId" className="h-10">
                            <SelectValue placeholder="Select assignee..." />
                          </SelectTrigger>
                          <SelectContent>
                            {operators.map((op) => (
                              <SelectItem key={op.id} value={op.id}>
                                {op.operatorName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Due Date */}
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      className="h-10"
                      {...registerEdit('dueDate')}
                    />
                  </div>

                  {/* Resolution Notes — full width */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="resolutionNotes">Resolution Notes</Label>
                    <Textarea
                      id="resolutionNotes"
                      placeholder="Document the resolution or next steps..."
                      className="min-h-[120px]"
                      {...registerEdit('resolutionNotes')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/support/tickets')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="gap-2 min-w-[140px]">
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isEditMode ? 'Update Ticket' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
