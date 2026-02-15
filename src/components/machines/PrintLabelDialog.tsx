import { useRef } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { ActionButton } from '@/components/ui/ActionButton';
import { Printer, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Machine } from '@/types/maintenance';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';

interface PrintLabelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    machine: Machine;
}

export function PrintLabelDialog({ open, onOpenChange, machine }: PrintLabelDialogProps) {
    const printRef = useRef<HTMLDivElement>(null);

    // QR code points to a standalone HTML label page served by the backend
    const labelUrl = machine.id
        ? `${API_BASE_URL}/machines/${machine.id}/label`
        : '';

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;

        const printWindow = window.open('', '_blank', 'width=500,height=400');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
            <head>
                <title>Machine Label - ${machine.finalCode}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 16px; }
                    .label { border: 2px solid #000; padding: 16px; max-width: 400px; margin: 0 auto; }
                    .label-header { font-size: 20px; font-weight: bold; margin: 0 0 12px; text-align: center; letter-spacing: 1px; }
                    .label-table { width: 100%; font-size: 11px; border-collapse: collapse; }
                    .label-table td { padding: 3px 6px; border-bottom: 1px solid #eee; }
                    .label-table td:first-child { font-weight: bold; white-space: nowrap; width: 40%; color: #555; }
                    .qr-container { text-align: center; margin-top: 12px; padding-top: 12px; border-top: 1px solid #ccc; }
                    .qr-hint { font-size: 8px; color: #999; margin-top: 4px; }
                    @media print { body { margin: 0; padding: 8px; } }
                </style>
            </head>
            <body>${content.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Print Machine Label</DialogTitle>
                    <DialogDescription>Preview the label, then click Print. The QR code links to a details page.</DialogDescription>
                </DialogHeader>

                <div ref={printRef}>
                    <div className="border-2 border-foreground rounded-lg p-4">
                        <h2 className="text-xl font-bold text-center tracking-wide mb-3">
                            {machine.finalCode}
                        </h2>
                        <table className="w-full text-xs">
                            <tbody>
                                <tr>
                                    <td className="font-semibold pr-3 py-1 text-muted-foreground">Description</td>
                                    <td className="py-1">{machine.description}</td>
                                </tr>
                                <tr>
                                    <td className="font-semibold pr-3 py-1 text-muted-foreground">Type</td>
                                    <td className="py-1">{machine.type}</td>
                                </tr>
                                <tr>
                                    <td className="font-semibold pr-3 py-1 text-muted-foreground">Group</td>
                                    <td className="py-1">{machine.group}</td>
                                </tr>
                                <tr>
                                    <td className="font-semibold pr-3 py-1 text-muted-foreground">Area</td>
                                    <td className="py-1">{machine.area}</td>
                                </tr>
                                <tr>
                                    <td className="font-semibold pr-3 py-1 text-muted-foreground">Manufacturer</td>
                                    <td className="py-1">{machine.manufacturer}</td>
                                </tr>
                                <tr>
                                    <td className="font-semibold pr-3 py-1 text-muted-foreground">Model</td>
                                    <td className="py-1">{machine.model}</td>
                                </tr>
                                <tr>
                                    <td className="font-semibold pr-3 py-1 text-muted-foreground">Serial No.</td>
                                    <td className="py-1">{machine.serialNumber}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="text-center mt-3 pt-3 border-t border-border">
                            {labelUrl ? (
                                <>
                                    <QRCodeSVG
                                        value={labelUrl}
                                        size={100}
                                        level="M"
                                    />
                                    <p style={{ fontSize: '8px', color: '#999', marginTop: '4px' }}>
                                        Scan to view full details
                                    </p>
                                </>
                            ) : (
                                <>
                                    <QRCodeSVG
                                        value={JSON.stringify({ code: machine.finalCode, desc: machine.description })}
                                        size={100}
                                        level="M"
                                    />
                                    <p style={{ fontSize: '8px', color: '#999', marginTop: '4px' }}>
                                        Save machine first for scannable link
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-2">
                    {labelUrl && (
                        <ActionButton
                            variant="green"
                            onClick={() => window.open(labelUrl, '_blank')}
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Preview Page
                        </ActionButton>
                    )}
                    <ActionButton variant="blue" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </ActionButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
