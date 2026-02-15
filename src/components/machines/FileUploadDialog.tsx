import { useState, useRef } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { ActionButton } from '@/components/ui/ActionButton';
import { Upload, Loader2, FileText, X } from 'lucide-react';

interface FileUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    accept: string;
    onUpload: (file: File) => void;
    onUploadMultiple?: (files: File[]) => void;
    isUploading: boolean;
    multiple?: boolean;
}

export function FileUploadDialog({
    open, onOpenChange, title, accept, onUpload, onUploadMultiple, isUploading, multiple = false
}: FileUploadDialogProps) {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (multiple) {
            setSelectedFiles(prev => [...prev, ...files]);
            const newPreviews = files
                .filter(f => f.type.startsWith('image/'))
                .map(f => URL.createObjectURL(f));
            setPreviews(prev => [...prev, ...newPreviews]);
        } else {
            setSelectedFiles([files[0]]);
            if (files[0].type.startsWith('image/')) {
                setPreviews([URL.createObjectURL(files[0])]);
            } else {
                setPreviews([]);
            }
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            const newPreviews = [...prev];
            if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index]);
            return newPreviews.filter((_, i) => i !== index);
        });
    };

    const handleUpload = () => {
        if (selectedFiles.length === 0) return;
        if (multiple && onUploadMultiple) {
            onUploadMultiple(selectedFiles);
        } else {
            onUpload(selectedFiles[0]);
        }
    };

    const handleClose = (open: boolean) => {
        if (!open) {
            previews.forEach(p => URL.revokeObjectURL(p));
            setSelectedFiles([]);
            setPreviews([]);
            if (inputRef.current) inputRef.current.value = '';
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {multiple ? 'Select one or more files to upload.' : 'Select a file to upload.'}
                    </DialogDescription>
                </DialogHeader>

                <div
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        multiple={multiple}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    {selectedFiles.length === 0 ? (
                        <div className="text-muted-foreground">
                            <Upload className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">Click to select {multiple ? 'files' : 'a file'}</p>
                        </div>
                    ) : !multiple && previews[0] ? (
                        <img src={previews[0]} alt="Preview" className="max-h-48 mx-auto rounded" />
                    ) : !multiple ? (
                        <div className="flex flex-col items-center gap-2">
                            <FileText className="h-10 w-10 text-muted-foreground" />
                            <p className="text-sm font-medium">{selectedFiles[0].name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(selectedFiles[0].size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                    ) : (
                        <div className="text-muted-foreground">
                            <Upload className="h-6 w-6 mx-auto mb-1" />
                            <p className="text-xs">Click to add more files</p>
                        </div>
                    )}
                </div>

                {/* Multi-file list */}
                {multiple && selectedFiles.length > 0 && (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                        {selectedFiles.map((file, i) => (
                            <div key={`${file.name}-${i}`} className="flex items-center gap-2 p-1.5 rounded bg-muted/30 text-sm">
                                {file.type.startsWith('image/') && previews[i] ? (
                                    <img src={previews[i]} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                                ) : (
                                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                )}
                                <span className="truncate flex-1">{file.name}</span>
                                <span className="text-xs text-muted-foreground shrink-0">
                                    {(file.size / 1024).toFixed(0)} KB
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                    className="text-muted-foreground hover:text-destructive shrink-0"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                        <p className="text-xs text-muted-foreground">
                            {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                        </p>
                    </div>
                )}

                <DialogFooter>
                    <ActionButton
                        variant="green"
                        onClick={handleUpload}
                        disabled={selectedFiles.length === 0 || isUploading}
                    >
                        {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                        Upload{multiple && selectedFiles.length > 1 ? ` (${selectedFiles.length})` : ''}
                    </ActionButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
