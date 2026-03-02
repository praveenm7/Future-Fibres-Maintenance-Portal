import { useState, useMemo, useRef } from 'react';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { useOperators } from '@/hooks/useOperators';
import type {
  SupportTicket,
  TicketComment,
  TicketAttachment,
  TicketPriority,
  TicketStatus,
} from '@/types/support';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Loader2,
  Search,
  MessageSquare,
  Paperclip,
  Clock,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Upload,
  Trash2,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ||
  'http://localhost:3002';

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; className: string }> = {
  CRITICAL: { label: 'Critical', className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
  HIGH:     { label: 'High',     className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' },
  MEDIUM:   { label: 'Medium',   className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' },
  LOW:      { label: 'Low',      className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' },
};

const STATUS_CONFIG: Record<TicketStatus, { label: string; className: string }> = {
  SUBMITTED:     { label: 'Submitted',   className: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700' },
  APPROVED:      { label: 'Approved',    className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
  ASSIGNED:      { label: 'Assigned',    className: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800' },
  'IN PROGRESS': { label: 'In Progress', className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
  RESOLVED:      { label: 'Resolved',    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' },
  CLOSED:        { label: 'Closed',      className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700' },
  CANCELLED:     { label: 'Cancelled',   className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
};

type StatusTab = 'ALL' | TicketStatus;

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <Badge variant="outline" className={cn('text-[11px] font-semibold', config.className)}>
      {config.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={cn('text-[11px] font-semibold', config.className)}>
      {config.label}
    </Badge>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function SupportTickets() {
  // --- Hooks (factory pattern) ---
  const {
    useGetTickets,
    useUpdateTicketStatus,
    useDeleteTicket,
    useGetTicketComments,
    useAddTicketComment,
    useGetTicketAttachments,
    useUploadTicketAttachment,
    useDeleteTicketAttachment,
  } = useSupportTickets();
  const { useGetOperators } = useOperators();

  const { data: tickets = [], isLoading } = useGetTickets();
  const { data: operators = [] } = useGetOperators();
  const updateStatus = useUpdateTicketStatus();
  const deleteTicket = useDeleteTicket();
  const addComment = useAddTicketComment();
  const uploadAttachment = useUploadTicketAttachment();
  const deleteAttachment = useDeleteTicketAttachment();

  // --- Local state ---
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [statusTab, setStatusTab] = useState<StatusTab>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Workflow form state
  const [assignOperatorId, setAssignOperatorId] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Comment form
  const [commentText, setCommentText] = useState('');
  const [commentOperatorId, setCommentOperatorId] = useState('');

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Derived data for the selected ticket ---
  const { data: comments = [], isLoading: loadingComments } = useGetTicketComments(
    selectedTicket?.id ?? '',
  );
  const { data: attachments = [], isLoading: loadingAttachments } = useGetTicketAttachments(
    selectedTicket?.id ?? '',
  );

  // --- Filtering ---
  const filteredTickets = useMemo(() => {
    let result = tickets;

    if (statusTab !== 'ALL') {
      result = result.filter((t) => t.status === statusTab);
    }
    if (priorityFilter !== 'ALL') {
      result = result.filter((t) => t.priority === priorityFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.ticketCode.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.machineCode?.toLowerCase().includes(q) ||
          t.submittedByName?.toLowerCase().includes(q) ||
          t.assignedToName?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [tickets, statusTab, priorityFilter, searchQuery]);

  // --- Columns ---
  const columns: Column<SupportTicket>[] = useMemo(
    () => [
      {
        key: 'ticketCode',
        header: 'Code',
        sortable: true,
        className: 'w-[100px] font-mono text-xs',
      },
      {
        key: 'title',
        header: 'Title',
        sortable: true,
        render: (t) => (
          <div className="min-w-0">
            <span className="font-medium line-clamp-1">{t.title}</span>
            {t.machineCode && (
              <span className="block text-xs text-muted-foreground mt-0.5 truncate">
                {t.machineCode} {t.machineDescription ? `- ${t.machineDescription}` : ''}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'priority',
        header: 'Priority',
        sortable: true,
        className: 'w-[100px]',
        render: (t) => <PriorityBadge priority={t.priority} />,
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        className: 'w-[120px]',
        render: (t) => <StatusBadge status={t.status} />,
      },
      {
        key: 'assignedToName',
        header: 'Assigned To',
        sortable: true,
        className: 'w-[140px]',
        render: (t) => (
          <span className="text-sm">{t.assignedToName ?? '-'}</span>
        ),
      },
      {
        key: 'dueDate',
        header: 'Due',
        sortable: true,
        className: 'w-[100px]',
        render: (t) => (
          <span className={cn('text-sm', t.isOverdue && 'text-red-600 font-semibold dark:text-red-400')}>
            {formatDate(t.dueDate)}
          </span>
        ),
      },
      {
        key: 'createdDate',
        header: 'Created',
        sortable: true,
        className: 'w-[100px]',
        render: (t) => <span className="text-sm text-muted-foreground">{formatDate(t.createdDate)}</span>,
      },
      {
        key: '_meta',
        header: '',
        className: 'w-[70px]',
        sortable: false,
        filterable: false,
        render: (t) => (
          <div className="flex items-center gap-2 text-muted-foreground">
            {t.commentCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs" title={`${t.commentCount} comments`}>
                <MessageSquare className="h-3.5 w-3.5" />
                {t.commentCount}
              </span>
            )}
            {t.attachmentCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs" title={`${t.attachmentCount} attachments`}>
                <Paperclip className="h-3.5 w-3.5" />
                {t.attachmentCount}
              </span>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  // --- Workflow actions ---
  const handleStatusUpdate = async (
    newStatus: TicketStatus,
    extraData?: Record<string, unknown>,
  ) => {
    if (!selectedTicket) return;
    try {
      await updateStatus.mutateAsync({
        id: selectedTicket.id,
        data: { status: newStatus, ...extraData },
      });
      // Refresh selected ticket with new status
      setSelectedTicket((prev) =>
        prev ? { ...prev, status: newStatus } : null,
      );
    } catch {
      // Error handled by mutation toast
    }
  };

  const handleAssign = async () => {
    if (!assignOperatorId) {
      toast.error('Please select an operator');
      return;
    }
    await handleStatusUpdate('ASSIGNED', {
      assignedToId: assignOperatorId,
      dueDate: assignDueDate || null,
    });
    setAssignOperatorId('');
    setAssignDueDate('');
  };

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) {
      toast.error('Please enter resolution notes');
      return;
    }
    await handleStatusUpdate('RESOLVED', { resolutionNotes });
    setResolutionNotes('');
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicket) return;
    try {
      await deleteTicket.mutateAsync(selectedTicket.id);
      setSelectedTicket(null);
    } catch {
      // Error handled by mutation toast
    }
  };

  // --- Comments ---
  const handleAddComment = async () => {
    if (!selectedTicket || !commentText.trim() || !commentOperatorId) return;
    try {
      await addComment.mutateAsync({
        ticketId: Number(selectedTicket.id),
        comment: commentText.trim(),
        operatorId: Number(commentOperatorId),
      });
      setCommentText('');
    } catch {
      // Error handled by mutation toast
    }
  };

  // --- Attachments ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTicket || !e.target.files?.length) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ticketId', selectedTicket.id);
    formData.append('uploadedById', commentOperatorId || '');
    try {
      await uploadAttachment.mutateAsync(formData);
    } catch {
      // Error handled by mutation toast
    }
    // Reset input so the same file can be uploaded again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment.mutateAsync(attachmentId);
    } catch {
      // Error handled by mutation toast
    }
  };

  // Reset workflow form state when a new ticket is selected
  const openTicketSheet = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setAssignOperatorId('');
    setAssignDueDate('');
    setResolutionNotes('');
    setCommentText('');
  };

  // --- Active ticket counts per status for tab badges ---
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: tickets.length };
    for (const t of tickets) {
      counts[t.status] = (counts[t.status] || 0) + 1;
    }
    return counts;
  }, [tickets]);

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading support tickets...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      <PageHeader title="Support Tickets" subtitle="Track and manage support requests" />

      {/* ---- Toolbar ---- */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1 bg-muted/40 p-1 rounded-lg border border-border">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusTab(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                statusTab === tab.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
              )}
            >
              {tab.label}
              {(statusCounts[tab.value] ?? 0) > 0 && (
                <span className="ml-1.5 text-[10px] tabular-nums opacity-70">
                  ({statusCounts[tab.value]})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search + priority filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground ml-auto">
            {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ---- Data Table ---- */}
      <DataTable<SupportTicket>
        columns={columns}
        data={filteredTickets}
        keyExtractor={(item) => item.id}
        onRowClick={openTicketSheet}
        selectedId={selectedTicket?.id}
        sortable
        filterable
        paginated
        pageSize={20}
        stickyHeader
        emptyTitle="No support tickets"
        emptyDescription="No tickets match the current filters."
      />

      {/* ---- Detail Sheet ---- */}
      <Sheet
        open={!!selectedTicket}
        onOpenChange={(open) => {
          if (!open) setSelectedTicket(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl overflow-y-auto p-0"
        >
          {selectedTicket && (
            <div className="flex flex-col h-full">
              {/* Sheet header */}
              <SheetHeader className="px-6 pt-6 pb-4 border-b border-border space-y-3">
                <div className="flex items-start justify-between gap-3 pr-8">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-muted-foreground mb-1">
                      {selectedTicket.ticketCode}
                    </p>
                    <SheetTitle className="text-lg leading-snug">
                      {selectedTicket.title}
                    </SheetTitle>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selectedTicket.status} />
                  <PriorityBadge priority={selectedTicket.priority} />
                  {selectedTicket.isOverdue && (
                    <Badge variant="destructive" className="text-[11px]">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                </div>
              </SheetHeader>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* Ticket details grid */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Details</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Submitted by</span>
                    </div>
                    <span className="font-medium">{selectedTicket.submittedByName ?? '-'}</span>

                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Assigned to</span>
                    </div>
                    <span className="font-medium">{selectedTicket.assignedToName ?? '-'}</span>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Created</span>
                    </div>
                    <span>{formatDateTime(selectedTicket.createdDate)}</span>

                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Due date</span>
                    </div>
                    <span className={cn(selectedTicket.isOverdue && 'text-red-600 font-semibold dark:text-red-400')}>
                      {formatDate(selectedTicket.dueDate)}
                    </span>

                    {selectedTicket.machineCode && (
                      <>
                        <span className="text-muted-foreground">Machine</span>
                        <span className="font-medium">
                          {selectedTicket.machineCode}
                          {selectedTicket.machineDescription ? ` - ${selectedTicket.machineDescription}` : ''}
                        </span>
                      </>
                    )}

                    <span className="text-muted-foreground">Category</span>
                    <span>{selectedTicket.category}</span>

                    {selectedTicket.approvedByName && (
                      <>
                        <span className="text-muted-foreground">Approved by</span>
                        <span>{selectedTicket.approvedByName}</span>
                      </>
                    )}

                    {selectedTicket.resolvedDate && (
                      <>
                        <span className="text-muted-foreground">Resolved</span>
                        <span>{formatDateTime(selectedTicket.resolvedDate)}</span>
                      </>
                    )}

                    {selectedTicket.closedDate && (
                      <>
                        <span className="text-muted-foreground">Closed</span>
                        <span>{formatDateTime(selectedTicket.closedDate)}</span>
                      </>
                    )}
                  </div>

                  {selectedTicket.description && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                      <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded-md p-3 border border-border">
                        {selectedTicket.description}
                      </p>
                    </div>
                  )}

                  {selectedTicket.resolutionNotes && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Resolution Notes</p>
                      <p className="text-sm whitespace-pre-wrap bg-green-50 dark:bg-green-900/20 rounded-md p-3 border border-green-200 dark:border-green-800">
                        {selectedTicket.resolutionNotes}
                      </p>
                    </div>
                  )}
                </section>

                <Separator />

                {/* ---- Workflow actions ---- */}
                <WorkflowActions
                  ticket={selectedTicket}
                  operators={operators}
                  isPending={updateStatus.isPending}
                  assignOperatorId={assignOperatorId}
                  setAssignOperatorId={setAssignOperatorId}
                  assignDueDate={assignDueDate}
                  setAssignDueDate={setAssignDueDate}
                  resolutionNotes={resolutionNotes}
                  setResolutionNotes={setResolutionNotes}
                  onApprove={() => handleStatusUpdate('APPROVED')}
                  onAssign={handleAssign}
                  onStartWork={() => handleStatusUpdate('IN PROGRESS')}
                  onResolve={handleResolve}
                  onClose={() => handleStatusUpdate('CLOSED')}
                  onReopen={() => handleStatusUpdate('IN PROGRESS')}
                  onCancel={() => handleStatusUpdate('CANCELLED')}
                />

                <Separator />

                {/* ---- Comments ---- */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Comments
                    {comments.length > 0 && (
                      <span className="text-xs text-muted-foreground font-normal">({comments.length})</span>
                    )}
                  </h3>

                  {loadingComments ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading comments...
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No comments yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                      {comments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} />
                      ))}
                    </div>
                  )}

                  {/* Add comment form */}
                  <div className="space-y-2 pt-2">
                    <Select value={commentOperatorId} onValueChange={setCommentOperatorId}>
                      <SelectTrigger className="h-8 text-xs w-[200px]">
                        <SelectValue placeholder="Comment as..." />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map((op) => (
                          <SelectItem key={op.id} value={op.id}>
                            {op.operatorName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="min-h-[60px] text-sm resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleAddComment}
                        disabled={!commentText.trim() || !commentOperatorId || addComment.isPending}
                        className="self-end shrink-0"
                      >
                        {addComment.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Send'
                        )}
                      </Button>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* ---- Attachments ---- */}
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments
                    {attachments.length > 0 && (
                      <span className="text-xs text-muted-foreground font-normal">({attachments.length})</span>
                    )}
                  </h3>

                  {loadingAttachments ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading attachments...
                    </div>
                  ) : attachments.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No attachments.</p>
                  ) : (
                    <div className="space-y-2">
                      {attachments.map((att) => (
                        <AttachmentItem
                          key={att.id}
                          attachment={att}
                          onDelete={() => handleDeleteAttachment(att.id)}
                          isDeleting={deleteAttachment.isPending}
                        />
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadAttachment.isPending}
                    >
                      {uploadAttachment.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Upload Attachment
                    </Button>
                  </div>
                </section>

                <Separator />

                {/* ---- Danger zone ---- */}
                <section className="space-y-3 pb-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Ticket
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete ticket {selectedTicket.ticketCode}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The ticket, its comments, and attachments will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteTicket}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleteTicket.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </section>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WorkflowActions sub-component
// ---------------------------------------------------------------------------

interface WorkflowActionsProps {
  ticket: SupportTicket;
  operators: Array<{ id: string; operatorName: string }>;
  isPending: boolean;
  assignOperatorId: string;
  setAssignOperatorId: (v: string) => void;
  assignDueDate: string;
  setAssignDueDate: (v: string) => void;
  resolutionNotes: string;
  setResolutionNotes: (v: string) => void;
  onApprove: () => void;
  onAssign: () => void;
  onStartWork: () => void;
  onResolve: () => void;
  onClose: () => void;
  onReopen: () => void;
  onCancel: () => void;
}

function WorkflowActions({
  ticket,
  operators,
  isPending,
  assignOperatorId,
  setAssignOperatorId,
  assignDueDate,
  setAssignDueDate,
  resolutionNotes,
  setResolutionNotes,
  onApprove,
  onAssign,
  onStartWork,
  onResolve,
  onClose,
  onReopen,
  onCancel,
}: WorkflowActionsProps) {
  const status = ticket.status;

  if (status === 'CLOSED' || status === 'CANCELLED') {
    return (
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Actions</h3>
        <p className="text-sm text-muted-foreground">
          This ticket is {status.toLowerCase()}. No further actions available.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Actions</h3>

      <div className="space-y-3">
        {/* SUBMITTED -> Approve / Cancel */}
        {status === 'SUBMITTED' && (
          <div className="flex gap-2">
            <Button size="sm" onClick={onApprove} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel} disabled={isPending} className="text-destructive">
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        )}

        {/* APPROVED -> Assign (with operator + due date) / Cancel */}
        {status === 'APPROVED' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Assign to</label>
                <Select value={assignOperatorId} onValueChange={setAssignOperatorId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select operator..." />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.id} value={op.id}>
                        {op.operatorName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Due date</label>
                <Input
                  type="date"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={onAssign} disabled={isPending || !assignOperatorId}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <User className="h-4 w-4 mr-1" />}
                Assign
              </Button>
              <Button size="sm" variant="outline" onClick={onCancel} disabled={isPending} className="text-destructive">
                <XCircle className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ASSIGNED -> Start Work / Cancel */}
        {status === 'ASSIGNED' && (
          <div className="flex gap-2">
            <Button size="sm" onClick={onStartWork} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
              Start Work
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel} disabled={isPending} className="text-destructive">
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        )}

        {/* IN PROGRESS -> Resolve (with notes) / Cancel */}
        {status === 'IN PROGRESS' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Resolution notes</label>
              <Textarea
                placeholder="Describe how the issue was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="min-h-[80px] text-sm resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={onResolve} disabled={isPending || !resolutionNotes.trim()}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Resolve
              </Button>
              <Button size="sm" variant="outline" onClick={onCancel} disabled={isPending} className="text-destructive">
                <XCircle className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* RESOLVED -> Close / Reopen */}
        {status === 'RESOLVED' && (
          <div className="flex gap-2">
            <Button size="sm" onClick={onClose} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Close
            </Button>
            <Button size="sm" variant="outline" onClick={onReopen} disabled={isPending}>
              <Play className="h-4 w-4 mr-1" />
              Reopen
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CommentItem sub-component
// ---------------------------------------------------------------------------

function CommentItem({ comment }: { comment: TicketComment }) {
  return (
    <div
      className={cn(
        'rounded-md border p-3 text-sm',
        comment.isStatusChange
          ? 'bg-muted/40 border-border/50'
          : 'bg-background border-border',
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className={cn('font-medium text-xs', comment.isStatusChange && 'italic text-muted-foreground')}>
          {comment.operatorName ?? 'System'}
        </span>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {formatDateTime(comment.commentDate)}
        </span>
      </div>
      <p className={cn('whitespace-pre-wrap', comment.isStatusChange && 'italic text-muted-foreground text-xs')}>
        {comment.comment}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AttachmentItem sub-component
// ---------------------------------------------------------------------------

function AttachmentItem({
  attachment,
  onDelete,
  isDeleting,
}: {
  attachment: TicketAttachment;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const fileUrl = `${API_BASE}/uploads/${attachment.storedName}`;

  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline truncate block"
          title={attachment.fileName}
        >
          {attachment.fileName}
        </a>
        <p className="text-[11px] text-muted-foreground">
          {formatFileSize(attachment.fileSize)} &middot; {attachment.uploadedByName ?? 'Unknown'} &middot;{' '}
          {formatDate(attachment.uploadedDate)}
        </p>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{attachment.fileName}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
