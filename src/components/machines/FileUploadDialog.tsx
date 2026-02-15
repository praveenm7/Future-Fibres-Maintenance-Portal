import { useState, useRef } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { ActionButton } from '@/components/ui/ActionButton';
import { Upload, Loader2, FileText } from 'lucide-react';

interface FileUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    accept: string;
    onUpload: (file: File) => void;
    isUploading: boolean;
}

export function FileUploadDialog({
    open, onOpenChange, title, accept, onUpload, isUploading
}: FileUploadDialogProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            if (file.type.startsWith('image/')) {
                setPreview(URL.createObjectURL(file));
            } else {
                setPreview(null);
            }
        }
    };

    const handleUpload = () => {
        if (selectedFile) {
            onUpload(selectedFile);
        }
    };

    const handleClose = (open: boolean) => {
        if (!open) {
            setSelectedFile(null);
            setPreview(null);
            if (inputRef.current) inputRef.current.value = '';
        }
        onOpenChange(open);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>Select a file to upload.</DialogDescription>
                </DialogHeader>

                <div
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    {preview ? (
                        <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded" />
                    ) : selectedFile ? (
                        <div className="flex flex-col items-center gap-2">
                            <FileText className="h-10 w-10 text-muted-foreground" />
                            <p className="text-sm font-medium">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                    ) : (
                        <div className="text-muted-foreground">
                            <Upload className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">Click to select a file</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <ActionButton
                        variant="green"
                        onClick={handleUpload}
                        disabled={!selectedFile || isUploading}
                    >
                        {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                        Upload
                    </ActionButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
