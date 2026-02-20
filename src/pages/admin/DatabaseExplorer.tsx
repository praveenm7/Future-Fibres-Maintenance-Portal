import { useState } from 'react';
import {
    Database,
    Search,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Trash2,
    Table2,
    Key,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdmin } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';

export default function DatabaseExplorer() {
    const { useDbTables, useDbTableSchema, useDbTableData, useUpdateRow, useDeleteRow } = useAdmin();

    const [selectedTable, setSelectedTable] = useState('');
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);
    const [editFormData, setEditFormData] = useState<Record<string, unknown>>({});

    const { data: tables, isLoading: loadingTables } = useDbTables();
    const { data: schema } = useDbTableSchema(selectedTable);
    const { data: tableData, isLoading: loadingData } = useDbTableData(selectedTable, page, 50, search);
    const updateRow = useUpdateRow();
    const deleteRow = useDeleteRow();

    const handleTableSelect = (tableName: string) => {
        setSelectedTable(tableName);
        setPage(1);
        setSearch('');
        setSearchInput('');
    };

    const handleSearch = () => {
        setSearch(searchInput);
        setPage(1);
    };

    const handleEditRow = (row: Record<string, unknown>) => {
        setEditingRow(row);
        setEditFormData({ ...row });
        setEditDialogOpen(true);
    };

    const handleSaveEdit = () => {
        if (!editingRow || !schema) return;
        const pkColumn = schema.columns.find(c => c.isPrimaryKey);
        if (!pkColumn) return;

        const rowId = editingRow[pkColumn.name];
        // Only send changed, non-identity fields
        const changes: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(editFormData)) {
            const col = schema.columns.find(c => c.name === key);
            if (!col || col.isPrimaryKey || col.isIdentity) continue;
            if (value !== editingRow[key]) {
                changes[key] = value;
            }
        }

        if (Object.keys(changes).length === 0) {
            setEditDialogOpen(false);
            return;
        }

        updateRow.mutate(
            { tableName: selectedTable, rowId, data: changes },
            { onSuccess: () => setEditDialogOpen(false) }
        );
    };

    const handleDeleteRow = () => {
        if (!editingRow || !schema) return;
        const pkColumn = schema.columns.find(c => c.isPrimaryKey);
        if (!pkColumn) return;

        const rowId = editingRow[pkColumn.name];
        deleteRow.mutate(
            { tableName: selectedTable, rowId },
            { onSuccess: () => setDeleteDialogOpen(false) }
        );
    };

    const formatCellValue = (value: unknown): string => {
        if (value === null || value === undefined) return 'NULL';
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        if (value instanceof Date) return value.toLocaleString();
        if (typeof value === 'string' && value.length > 100) return value.substring(0, 100) + '...';
        return String(value);
    };

    return (
        <div className="space-y-6">
            <div className="page-header inline-block">
                DATABASE EXPLORER
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Panel — Table List */}
                <div className="lg:col-span-1 bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                    <div className="section-header flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Tables
                    </div>
                    <div>
                        {loadingTables ? (
                            <div className="p-4 space-y-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                                ))}
                            </div>
                        ) : (
                            <nav className="space-y-0.5 p-2">
                                {tables?.map((table) => (
                                    <button
                                        key={table.name}
                                        onClick={() => handleTableSelect(table.name)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors text-left",
                                            selectedTable === table.name
                                                ? "bg-primary text-primary-foreground"
                                                : "hover:bg-muted"
                                        )}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Table2 className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span className="truncate">{table.name}</span>
                                        </span>
                                        <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                                            {table.rowCount}
                                        </Badge>
                                    </button>
                                ))}
                            </nav>
                        )}
                    </div>
                </div>

                {/* Right Panel — Table Data & Schema */}
                <div className="lg:col-span-3 space-y-4">
                    {!selectedTable ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <Database className="h-12 w-12 mb-4 opacity-30" />
                                <p>Select a table from the left panel to explore its data</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Tabs defaultValue="data">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                <TabsList>
                                    <TabsTrigger value="data">Data</TabsTrigger>
                                    <TabsTrigger value="schema">Schema</TabsTrigger>
                                </TabsList>
                                <TabsContent value="data" className="mt-0 flex-1 flex justify-end">
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search records..."
                                                value={searchInput}
                                                onChange={(e) => setSearchInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                className="pl-8 w-64"
                                            />
                                        </div>
                                        <Button size="sm" onClick={handleSearch}>Search</Button>
                                    </div>
                                </TabsContent>
                            </div>

                            {/* Data Tab */}
                            <TabsContent value="data">
                                <Card>
                                    <CardContent className="p-0">
                                        {loadingData ? (
                                            <div className="p-8 text-center text-muted-foreground">Loading data...</div>
                                        ) : !tableData || tableData.data.length === 0 ? (
                                            <div className="p-8 text-center text-muted-foreground">
                                                {search ? 'No records match your search' : 'Table is empty'}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="relative isolate overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead className="w-[80px]">Actions</TableHead>
                                                                {tableData.columns.map((col) => (
                                                                    <TableHead key={col} className="whitespace-nowrap text-xs">
                                                                        {col}
                                                                    </TableHead>
                                                                ))}
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {tableData.data.map((row, idx) => (
                                                                <TableRow key={idx}>
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-1">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-7 w-7"
                                                                                onClick={() => handleEditRow(row)}
                                                                                title="Edit row"
                                                                            >
                                                                                <Edit2 className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-7 w-7 text-destructive"
                                                                                onClick={() => {
                                                                                    setEditingRow(row);
                                                                                    setDeleteDialogOpen(true);
                                                                                }}
                                                                                title="Delete row"
                                                                            >
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    </TableCell>
                                                                    {tableData.columns.map((col) => (
                                                                        <TableCell key={col} className="text-xs whitespace-nowrap max-w-[200px] truncate">
                                                                            {formatCellValue(row[col])}
                                                                        </TableCell>
                                                                    ))}
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>

                                                {/* Pagination */}
                                                {tableData.pagination.totalPages > 1 && (
                                                    <div className="flex items-center justify-between px-4 py-3 border-t">
                                                        <p className="text-sm text-muted-foreground">
                                                            Showing {((page - 1) * 50) + 1}-{Math.min(page * 50, tableData.pagination.totalRows)} of {tableData.pagination.totalRows} rows
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                                disabled={page === 1}
                                                            >
                                                                <ChevronLeft className="h-4 w-4" />
                                                            </Button>
                                                            <span className="text-sm">
                                                                Page {page} of {tableData.pagination.totalPages}
                                                            </span>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setPage(p => Math.min(tableData.pagination.totalPages, p + 1))}
                                                                disabled={page === tableData.pagination.totalPages}
                                                            >
                                                                <ChevronRight className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Schema Tab */}
                            <TabsContent value="schema">
                                {schema && (
                                    <div className="space-y-4">
                                        {/* Columns */}
                                        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                                            <div className="section-header">
                                                Columns ({schema.columns.length})
                                            </div>
                                            <div>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Column</TableHead>
                                                            <TableHead>Type</TableHead>
                                                            <TableHead>Nullable</TableHead>
                                                            <TableHead>Default</TableHead>
                                                            <TableHead>Flags</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {schema.columns.map((col) => (
                                                            <TableRow key={col.name}>
                                                                <TableCell className="font-medium">
                                                                    <span className="flex items-center gap-2">
                                                                        {col.isPrimaryKey && <Key className="h-3.5 w-3.5 text-warning" />}
                                                                        {col.name}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="text-muted-foreground">
                                                                    {col.dataType}{col.maxLength && col.maxLength > 0 ? `(${col.maxLength === -1 ? 'MAX' : col.maxLength})` : ''}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant={col.isNullable ? 'secondary' : 'outline'} className="text-xs">
                                                                        {col.isNullable ? 'YES' : 'NO'}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-xs text-muted-foreground">
                                                                    {col.defaultValue || '-'}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex gap-1">
                                                                        {col.isPrimaryKey && <Badge className="text-xs bg-warning/15 text-warning">PK</Badge>}
                                                                        {col.isIdentity && <Badge className="text-xs bg-primary/15 text-primary">Identity</Badge>}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>

                                        {/* Constraints */}
                                        {schema.constraints.length > 0 && (
                                            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                                                <div className="section-header">
                                                    Constraints ({schema.constraints.length})
                                                </div>
                                                <div>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Name</TableHead>
                                                                <TableHead>Type</TableHead>
                                                                <TableHead>Column</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {schema.constraints.map((c, i) => (
                                                                <TableRow key={i}>
                                                                    <TableCell className="text-xs font-mono">{c.name}</TableCell>
                                                                    <TableCell>
                                                                        <Badge variant="outline" className="text-xs">{c.type}</Badge>
                                                                    </TableCell>
                                                                    <TableCell>{c.column}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Indexes */}
                                        {schema.indexes.length > 0 && (
                                            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                                                <div className="section-header">
                                                    Indexes ({schema.indexes.length})
                                                </div>
                                                <div>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Name</TableHead>
                                                                <TableHead>Type</TableHead>
                                                                <TableHead>Unique</TableHead>
                                                                <TableHead>Columns</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {schema.indexes.map((idx, i) => (
                                                                <TableRow key={i}>
                                                                    <TableCell className="text-xs font-mono">{idx.name}</TableCell>
                                                                    <TableCell className="text-xs">{idx.type}</TableCell>
                                                                    <TableCell>
                                                                        <Badge variant={idx.isUnique ? 'default' : 'secondary'} className="text-xs">
                                                                            {idx.isUnique ? 'YES' : 'NO'}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-xs">{idx.columns}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Row — {selectedTable}</DialogTitle>
                        <DialogDescription>
                            Modify the fields below and save changes. Primary key and identity columns cannot be edited.
                        </DialogDescription>
                    </DialogHeader>
                    {editingRow && schema && (
                        <div className="grid gap-4 py-4">
                            {schema.columns.map((col) => {
                                const isReadOnly = col.isPrimaryKey || col.isIdentity;
                                return (
                                    <div key={col.name} className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right text-sm flex items-center justify-end gap-1">
                                            {col.isPrimaryKey && <Key className="h-3 w-3 text-warning" />}
                                            {col.name}
                                        </Label>
                                        <div className="col-span-3">
                                            <Input
                                                value={editFormData[col.name] === null ? '' : String(editFormData[col.name] ?? '')}
                                                onChange={(e) => setEditFormData(prev => ({
                                                    ...prev,
                                                    [col.name]: e.target.value === '' && col.isNullable ? null : e.target.value
                                                }))}
                                                disabled={isReadOnly}
                                                className={cn(isReadOnly && "bg-muted")}
                                                placeholder={col.isNullable ? 'NULL' : undefined}
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {col.dataType}{col.maxLength ? `(${col.maxLength === -1 ? 'MAX' : col.maxLength})` : ''}
                                                {isReadOnly && ' — read only'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveEdit} disabled={updateRow.isPending}>
                            {updateRow.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Row</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this row? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteRow}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteRow.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
