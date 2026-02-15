import type { MachineDocument } from '@/types/maintenance';
import { FileText, BookOpen, Trash2, ExternalLink } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';
const SERVER_BASE = API_BASE_URL.replace('/api', '');

interface DocumentsListProps {
    documents: MachineDocument[];
    onDelete: (id: string) => void;
}

export function DocumentsList({ documents, onDelete }: DocumentsListProps) {
    if (documents.length === 0) return null;

    return (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="section-header">Documents & Manuals</div>
            <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                {documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 text-sm p-1.5 rounded hover:bg-muted/50 group">
                        {doc.category === 'MANUAL'
                            ? <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                            : <FileText className="h-4 w-4 text-muted-foreground shrink-0" />}
                        <span className="truncate flex-1" title={doc.fileName}>{doc.fileName}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0 uppercase">
                            {doc.category === 'MANUAL' ? 'Manual' : 'Doc'}
                        </span>
                        <a
                            href={`${SERVER_BASE}${doc.filePath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 shrink-0"
                            title="Open file"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button
                            onClick={() => {
                                if (confirm(`Delete "${doc.fileName}"?`)) {
                                    onDelete(doc.id);
                                }
                            }}
                            className="text-destructive/60 hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete file"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
