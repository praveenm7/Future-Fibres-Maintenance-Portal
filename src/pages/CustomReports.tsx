import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2, Play, FileSearch, Share2 } from 'lucide-react';
import { useCustomReports } from '@/hooks/useCustomReports';
import { useExecuteReport } from '@/hooks/useReportExecution';
import { useOperators } from '@/hooks/useOperators';
import type { CustomReport } from '@/types/reportBuilder';

const OPERATOR_KEY = 'ff-report-operator';

export default function CustomReports() {
  const navigate = useNavigate();
  const [operatorId, setOperatorId] = useState<number>(() =>
    parseInt(localStorage.getItem(OPERATOR_KEY) || '0', 10)
  );
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CustomReport | null>(null);

  const { useGetOperators } = useOperators();
  const { data: operators = [] } = useGetOperators();

  const { useGetReports, useDeleteReport } = useCustomReports();
  const { data: reports = [], isLoading } = useGetReports();
  const deleteMutation = useDeleteReport();
  const executeMutation = useExecuteReport();

  useEffect(() => {
    if (operatorId) {
      localStorage.setItem(OPERATOR_KEY, String(operatorId));
    }
  }, [operatorId]);

  const filtered = reports.filter(r =>
    r.reportName.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const myReports = filtered.filter(r => r.ownerOperatorId === operatorId);
  const sharedReports = filtered.filter(r => r.isShared && r.ownerOperatorId !== operatorId);

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  const handleRun = (report: CustomReport) => {
    executeMutation.mutate({ id: report.id }, {
      onSuccess: () => navigate(`/reports/custom/${report.id}`),
    });
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  const ReportCard = ({ report }: { report: CustomReport }) => (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle className="text-base truncate">{report.reportName}</CardTitle>
            {report.description && (
              <CardDescription className="line-clamp-2">{report.description}</CardDescription>
            )}
          </div>
          {report.isShared && (
            <Badge variant="secondary" className="ml-2 shrink-0">
              <Share2 className="h-3 w-3 mr-1" />
              Shared
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground space-y-0.5">
            <div>{report.definition.dataSources.join(', ')}</div>
            <div>
              {report.ownerName && <span>by {report.ownerName} &middot; </span>}
              Updated {formatDate(report.updatedDate)}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRun(report)} title="Run">
              <Play className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/reports/custom/${report.id}`)} title="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            {report.ownerOperatorId === operatorId && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(report)} title="Delete">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ReportGrid = ({ items }: { items: CustomReport[] }) => {
    if (items.length === 0) {
      return <EmptyState title="No reports found" description="Create a new report to get started." />;
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(r => <ReportCard key={r.id} report={r} />)}
      </div>
    );
  };

  return (
    <>
      <PageHeader title="Custom Reports" subtitle="Create and manage custom reports from your data" />

      <div className="p-4 md:p-6 lg:p-10 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-3 items-center flex-1 w-full sm:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={operatorId ? String(operatorId) : ''}
              onValueChange={v => setOperatorId(parseInt(v, 10))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select operator..." />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op: { id: string; operatorName: string }) => (
                  <SelectItem key={op.id} value={op.id}>{op.operatorName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => navigate('/reports/custom/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>

        {!operatorId ? (
          <EmptyState
            icon={FileSearch}
            title="Select an operator"
            description="Choose your operator profile to view and manage your custom reports."
          />
        ) : isLoading ? (
          <div className="text-center text-muted-foreground py-12">Loading reports...</div>
        ) : (
          <Tabs defaultValue="my">
            <TabsList>
              <TabsTrigger value="my">My Reports ({myReports.length})</TabsTrigger>
              <TabsTrigger value="shared">Shared Reports ({sharedReports.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="my" className="mt-4">
              <ReportGrid items={myReports} />
            </TabsContent>
            <TabsContent value="shared" className="mt-4">
              <ReportGrid items={sharedReports} />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.reportName}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
