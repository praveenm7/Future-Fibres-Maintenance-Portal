import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/ui/ActionButton';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColumnMapping {
  fileColumn: string;
  targetField: string;
}

interface TargetField {
  key: string;
  label: string;
  required?: boolean;
}

interface DataImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  targetFields: TargetField[];
  onImport: (data: Record<string, string>[]) => Promise<void>;
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'done';

export function DataImportDialog({
  open,
  onOpenChange,
  title,
  targetFields,
  onImport,
}: DataImportDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');

  const resetState = () => {
    setStep('upload');
    setFileColumns([]);
    setRawData([]);
    setMappings([]);
    setErrors([]);
    setFileName('');
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });

        if (jsonData.length === 0) {
          setErrors(['The file appears to be empty']);
          return;
        }

        const columns = Object.keys(jsonData[0]);
        setFileColumns(columns);
        setRawData(jsonData.map(row => {
          const clean: Record<string, string> = {};
          for (const key of columns) {
            clean[key] = String(row[key] ?? '');
          }
          return clean;
        }));

        // Auto-map columns by fuzzy name matching
        const autoMappings: ColumnMapping[] = targetFields.map(field => {
          const match = columns.find(col =>
            col.toLowerCase().replace(/[_\s-]/g, '') ===
            field.label.toLowerCase().replace(/[_\s-]/g, '')
          ) || columns.find(col =>
            col.toLowerCase().includes(field.key.toLowerCase()) ||
            field.key.toLowerCase().includes(col.toLowerCase())
          );
          return { fileColumn: match || '', targetField: field.key };
        });

        setMappings(autoMappings);
        setErrors([]);
        setStep('mapping');
      } catch {
        setErrors(['Failed to parse file. Ensure it is a valid Excel or CSV file.']);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [targetFields]);

  const handleMappingChange = (targetField: string, fileColumn: string) => {
    setMappings(prev =>
      prev.map(m => m.targetField === targetField ? { ...m, fileColumn } : m)
    );
  };

  const getMappedData = (): Record<string, string>[] => {
    return rawData.map(row => {
      const mapped: Record<string, string> = {};
      for (const mapping of mappings) {
        if (mapping.fileColumn) {
          mapped[mapping.targetField] = row[mapping.fileColumn] || '';
        } else {
          mapped[mapping.targetField] = '';
        }
      }
      return mapped;
    });
  };

  const validateAndPreview = () => {
    const validationErrors: string[] = [];
    const requiredFields = targetFields.filter(f => f.required);
    const mapped = getMappedData();

    for (const field of requiredFields) {
      const mapping = mappings.find(m => m.targetField === field.key);
      if (!mapping?.fileColumn) {
        validationErrors.push(`Required field "${field.label}" is not mapped`);
      } else {
        const emptyRows = mapped.filter((row, i) => !row[field.key]).length;
        if (emptyRows > 0) {
          validationErrors.push(`${emptyRows} row(s) have empty "${field.label}"`);
        }
      }
    }

    setErrors(validationErrors);
    setStep('preview');
  };

  const handleImport = async () => {
    setStep('importing');
    try {
      const mapped = getMappedData();
      await onImport(mapped);
      setStep('done');
    } catch {
      setErrors(['Import failed. Please try again.']);
      setStep('preview');
    }
  };

  const previewData = step === 'preview' || step === 'done' ? getMappedData().slice(0, 10) : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-full max-h-[85vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button onClick={handleClose} className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload an Excel (.xlsx) or CSV (.csv) file to import data.
              </p>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                <span className="text-sm font-medium">Click to select a file</span>
                <span className="text-xs text-muted-foreground mt-1">.xlsx, .csv</span>
                <input
                  type="file"
                  accept=".xlsx,.csv,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Map columns from your file</p>
                  <p className="text-xs text-muted-foreground">File: {fileName} ({rawData.length} rows)</p>
                </div>
              </div>

              <div className="space-y-2">
                {targetFields.map(field => {
                  const mapping = mappings.find(m => m.targetField === field.key);
                  return (
                    <div key={field.key} className="flex items-center gap-3 bg-muted/20 rounded-md px-3 py-2">
                      <span className="text-sm font-medium w-40 flex-shrink-0">
                        {field.label}
                        {field.required && <span className="text-destructive ml-0.5">*</span>}
                      </span>
                      <span className="text-muted-foreground text-sm">&larr;</span>
                      <select
                        value={mapping?.fileColumn || ''}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        className="flex-1 h-8 rounded border border-input bg-background text-sm px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">— Skip —</option>
                        {fileColumns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={resetState}>Back</Button>
                <Button size="sm" onClick={validateAndPreview}>Preview &amp; Validate</Button>
              </div>
            </div>
          )}

          {/* Step 3: Preview & Import */}
          {(step === 'preview' || step === 'importing' || step === 'done') && (
            <div className="space-y-4">
              {/* Errors / Warnings */}
              {errors.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 space-y-1">
                  {errors.map((err, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                      {err}
                    </div>
                  ))}
                </div>
              )}

              {step === 'done' ? (
                <div className="flex flex-col items-center py-6">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
                  <p className="text-lg font-medium">Import complete!</p>
                  <p className="text-sm text-muted-foreground">{rawData.length} rows imported successfully.</p>
                  <Button className="mt-4" onClick={handleClose}>Close</Button>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Preview (first {Math.min(10, previewData.length)} of {rawData.length} rows)
                    </p>
                    <div className="border border-border rounded-md overflow-x-auto max-h-[300px]">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted border-b border-border">
                            {targetFields.map(f => (
                              <th key={f.key} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                                {f.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, i) => (
                            <tr key={i} className={cn("border-b border-border", i % 2 === 1 && "bg-muted/20")}>
                              {targetFields.map(f => {
                                const val = row[f.key] || '';
                                const isEmpty = f.required && !val;
                                return (
                                  <td key={f.key} className={cn(
                                    "px-3 py-1.5 whitespace-nowrap",
                                    isEmpty && "bg-destructive/10 text-destructive"
                                  )}>
                                    {val || (isEmpty ? '(empty)' : '')}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setStep('mapping')}>
                      Back to Mapping
                    </Button>
                    <ActionButton
                      variant="green"
                      onClick={handleImport}
                      disabled={step === 'importing'}
                    >
                      {step === 'importing' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Import {rawData.length} Rows
                    </ActionButton>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
