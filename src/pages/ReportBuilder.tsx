import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown, Play, Save, FileSpreadsheet, Printer,
  RotateCcw, Database, Columns3, Filter, ArrowUpDown, Settings2,
} from 'lucide-react';
import { toast } from 'sonner';

import { DataSourcePicker } from '@/components/reportBuilder/DataSourcePicker';
import { ColumnPicker } from '@/components/reportBuilder/ColumnPicker';
import { FilterBuilder } from '@/components/reportBuilder/FilterBuilder';
import { SortingConfig } from '@/components/reportBuilder/SortingConfig';
import { GroupingConfig } from '@/components/reportBuilder/GroupingConfig';
import { ComputedFieldPicker } from '@/components/reportBuilder/ComputedFieldPicker';
import { ReportPreview } from '@/components/reportBuilder/ReportPreview';
import { SaveReportDialog } from '@/components/reportBuilder/SaveReportDialog';

import { useCustomReports } from '@/hooks/useCustomReports';
import { usePreviewReport } from '@/hooks/useReportExecution';
import { describeJoinPath } from '@/lib/reportBuilder/joinResolver';
import { COMPUTED_FIELDS } from '@/lib/reportBuilder/metadataRegistry';
import { exportToExcel } from '@/lib/exportExcel';
import { printReport } from '@/lib/printReport';
import type { ReportDefinition, ReportExecutionResult } from '@/types/reportBuilder';
import type { SaveReportFormValues } from '@/lib/schemas/reportDefinitionSchema';

const computedFieldsMap = new Map(COMPUTED_FIELDS.map(cf => [cf.key, cf]));

const DRAFT_KEY = 'ff-report-builder-draft';
const OPERATOR_KEY = 'ff-report-operator';

function emptyDefinition(): ReportDefinition {
  return {
    version: 1,
    dataSources: [],
    columns: [],
    filters: [],
    sorting: [],
    groupBy: [],
    aggregations: [],
    computedFields: [],
  };
}

export default function ReportBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'new';

  const { useGetReport, useCreateReport, useUpdateReport } = useCustomReports();
  const { data: existingReport } = useGetReport(isEdit ? parseInt(id, 10) : 0);
  const createMutation = useCreateReport();
  const updateMutation = useUpdateReport();
  const previewMutation = usePreviewReport();

  const [definition, setDefinition] = useState<ReportDefinition>(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft && !isEdit) return JSON.parse(draft);
    } catch { /* ignore */ }
    return emptyDefinition();
  });

  const [result, setResult] = useState<ReportExecutionResult | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load existing report definition when editing
  useEffect(() => {
    if (existingReport?.definition) {
      setDefinition(existingReport.definition);
      // Auto-open advanced if the report uses advanced features
      const def = existingReport.definition;
      if (def.groupBy.length > 0 || def.aggregations.length > 0 || def.computedFields.length > 0) {
        setShowAdvanced(true);
      }
    }
  }, [existingReport]);

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!isEdit) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(definition));
    }
  }, [definition, isEdit]);

  const updateDef = useCallback(<K extends keyof ReportDefinition>(key: K, value: ReportDefinition[K]) => {
    setDefinition(prev => {
      const next = { ...prev, [key]: value };

      // When data sources change, purge references to removed tables
      if (key === 'dataSources') {
        const ds = new Set(value as string[]);
        const belongsToDS = (fieldKey: string) => ds.has(fieldKey.split('.')[0]);
        next.columns = prev.columns.filter(c => belongsToDS(c.fieldKey));
        next.filters = prev.filters.filter(f => belongsToDS(f.fieldKey));
        next.sorting = prev.sorting.filter(s => belongsToDS(s.fieldKey));
        next.groupBy = prev.groupBy.filter(g => belongsToDS(g));
        next.aggregations = prev.aggregations.filter(a => belongsToDS(a.fieldKey));
        next.computedFields = prev.computedFields.filter(cfKey => {
          const cf = computedFieldsMap.get(cfKey);
          return cf ? cf.requiredTables.every(t => ds.has(t)) : false;
        });
      }

      return next;
    });
    setResult(null);
  }, []);

  // Derived state for UI hints
  const selectedColCount = definition.columns.filter(c => c.visible).length;
  const hasConfig = definition.dataSources.length > 0 && (
    selectedColCount > 0 || definition.aggregations.length > 0 || definition.computedFields.length > 0
  );

  const handlePreview = () => {
    if (definition.dataSources.length === 0) {
      toast.error('Choose at least one data source');
      return;
    }
    if (!hasConfig) {
      toast.error('Pick at least one column to show in your report');
      return;
    }
    previewMutation.mutate({ definition, limit: 1000 }, {
      onSuccess: (data) => setResult(data),
      onError: (err) => toast.error(`Preview failed: ${err.message}`),
    });
  };

  const handleSave = (formValues: SaveReportFormValues) => {
    const operatorId = parseInt(localStorage.getItem(OPERATOR_KEY) || '0', 10);
    if (!operatorId) {
      toast.error('Select an operator first on the Custom Reports page');
      return;
    }

    if (isEdit && existingReport) {
      updateMutation.mutate({
        id: existingReport.id,
        data: {
          reportName: formValues.reportName,
          description: formValues.description,
          definition,
          isShared: formValues.isShared,
        },
      }, {
        onSuccess: () => {
          setSaveDialogOpen(false);
          toast.success('Report updated');
        },
      });
    } else {
      createMutation.mutate({
        reportName: formValues.reportName,
        description: formValues.description,
        definition,
        ownerOperatorId: operatorId,
        isShared: formValues.isShared,
      }, {
        onSuccess: (created) => {
          setSaveDialogOpen(false);
          localStorage.removeItem(DRAFT_KEY);
          navigate(`/reports/custom/${created.id}`, { replace: true });
        },
      });
    }
  };

  const handleExport = () => {
    if (!result || result.rows.length === 0) {
      toast.error('Run the report first');
      return;
    }
    const headers = Object.keys(result.rows[0]);
    const rows = result.rows.map(row =>
      headers.map(h => {
        const v = row[h];
        if (v === null || v === undefined) return '';
        return v as string | number | boolean;
      })
    );
    exportToExcel({
      filename: existingReport?.reportName || 'custom-report',
      sheets: [{ name: 'Report', headers, rows }],
    });
  };

  const handlePrint = () => {
    if (!result || result.rows.length === 0) {
      toast.error('Run the report first');
      return;
    }
    const columns = Object.keys(result.rows[0]);
    const tableHtml = `
      <table>
        <thead><tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${result.rows.map(row =>
          `<tr>${columns.map(c => `<td>${row[c] ?? ''}</td>`).join('')}</tr>`
        ).join('')}</tbody>
      </table>
    `;
    printReport({
      title: existingReport?.reportName || 'Custom Report',
      htmlContent: tableHtml,
    });
  };

  const handleClear = () => {
    setDefinition(emptyDefinition());
    setResult(null);
    setShowAdvanced(false);
    if (!isEdit) localStorage.removeItem(DRAFT_KEY);
  };

  const joinDesc = describeJoinPath(definition.dataSources);

  return (
    <>
      <PageHeader
        title={isEdit ? `Edit: ${existingReport?.reportName || 'Report'}` : 'New Report'}
        subtitle="Build custom reports from your data"
      />

      <div className="p-4 md:p-6 lg:p-10">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Config panel */}
          <div className="w-full lg:w-[360px] shrink-0 space-y-3">

            {/* Step 1: Choose Data */}
            <StepSection
              step={1}
              title="Choose Your Data"
              description="What information do you want in your report?"
              icon={Database}
              defaultOpen
              badge={definition.dataSources.length > 0 ? `${definition.dataSources.length} selected` : undefined}
            >
              <DataSourcePicker
                selected={definition.dataSources}
                onChange={v => updateDef('dataSources', v)}
              />
              {joinDesc && (
                <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded px-2 py-1">{joinDesc}</p>
              )}
            </StepSection>

            {/* Step 2: Pick Columns */}
            <StepSection
              step={2}
              title="Pick Columns"
              description="Choose which fields appear in your report"
              icon={Columns3}
              defaultOpen={definition.dataSources.length > 0}
              badge={selectedColCount > 0 ? `${selectedColCount} column${selectedColCount !== 1 ? 's' : ''}` : undefined}
            >
              <ColumnPicker
                dataSources={definition.dataSources}
                columns={definition.columns}
                onChange={v => updateDef('columns', v)}
              />
            </StepSection>

            {/* Step 3: Filter Results */}
            <StepSection
              step={3}
              title="Filter Results"
              description="Narrow down your data (optional)"
              icon={Filter}
              badge={definition.filters.length > 0 ? `${definition.filters.length} filter${definition.filters.length !== 1 ? 's' : ''}` : undefined}
            >
              <FilterBuilder
                dataSources={definition.dataSources}
                filters={definition.filters}
                onChange={v => updateDef('filters', v)}
              />
            </StepSection>

            {/* Step 4: Sort Results */}
            <StepSection
              step={4}
              title="Sort Results"
              description="Control the order of rows (optional)"
              icon={ArrowUpDown}
              badge={definition.sorting.length > 0 ? `${definition.sorting.length} rule${definition.sorting.length !== 1 ? 's' : ''}` : undefined}
            >
              <SortingConfig
                dataSources={definition.dataSources}
                sorting={definition.sorting}
                onChange={v => updateDef('sorting', v)}
              />
            </StepSection>

            {/* Advanced Options */}
            <div className="pt-1">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>Advanced Options</span>
                {(definition.groupBy.length > 0 || definition.aggregations.length > 0 || definition.computedFields.length > 0) && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">active</Badge>
                )}
                <ChevronDown className={`h-3.5 w-3.5 ml-auto transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showAdvanced && (
              <>
                <StepSection
                  title="Grouping & Summaries"
                  description="Group rows and calculate totals"
                  icon={Settings2}
                >
                  <GroupingConfig
                    dataSources={definition.dataSources}
                    groupBy={definition.groupBy}
                    aggregations={definition.aggregations}
                    onGroupByChange={v => updateDef('groupBy', v)}
                    onAggregationsChange={v => updateDef('aggregations', v)}
                  />
                </StepSection>

                <StepSection
                  title="Calculated Fields"
                  description="Add pre-built calculations"
                  icon={Settings2}
                >
                  <ComputedFieldPicker
                    dataSources={definition.dataSources}
                    selected={definition.computedFields}
                    onChange={v => updateDef('computedFields', v)}
                  />
                </StepSection>
              </>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={handlePreview}
                className="w-full h-10"
                disabled={previewMutation.isPending || !hasConfig}
              >
                <Play className="h-4 w-4 mr-2" />
                {previewMutation.isPending ? 'Running...' : 'Run Report'}
              </Button>
              <div className="flex gap-2">
                <Button onClick={handleClear} variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Clear All
                </Button>
                <div className="flex-1" />
                <Button onClick={() => setSaveDialogOpen(true)} variant="outline" size="sm" className="text-xs">
                  <Save className="h-3.5 w-3.5 mr-1.5" /> Save Report
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Results panel */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Results</h2>
              {result && result.rows.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-1" /> Print
                  </Button>
                </div>
              )}
            </div>

            <ReportPreview
              result={result}
              isLoading={previewMutation.isPending}
              error={previewMutation.error}
              hasConfig={hasConfig}
            />
          </div>
        </div>
      </div>

      <SaveReportDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSave}
        defaultValues={existingReport ? {
          reportName: existingReport.reportName,
          description: existingReport.description || '',
          isShared: existingReport.isShared,
        } : undefined}
        isLoading={createMutation.isPending || updateMutation.isPending}
        mode={isEdit ? 'update' : 'create'}
      />
    </>
  );
}

// ─── Step Section ───

interface StepSectionProps {
  step?: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}

function StepSection({ step, title, description, icon: Icon, children, defaultOpen = false, badge }: StepSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border rounded-lg">
      <CollapsibleTrigger className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary shrink-0">
          {step ? (
            <span className="text-xs font-semibold">{step}</span>
          ) : (
            <Icon className="h-3.5 w-3.5" />
          )}
        </div>
        <div className="text-left min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{title}</span>
            {badge && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{badge}</Badge>}
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight">{description}</p>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 pt-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
