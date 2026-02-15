import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ActionButton } from '@/components/ui/ActionButton';
import { Camera, X } from 'lucide-react';

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: string) => void;
}

export function QRScanner({ open, onOpenChange, onScan }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const containerId = 'qr-reader';

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    const startScanner = async () => {
      try {
        setError(null);
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (!mounted) return;
            onScan(decodedText);
            stopScanner();
            onOpenChange(false);
          },
          () => {
            // Ignore scan failures (no QR code in frame)
          }
        );
        if (mounted) setScanning(true);
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Camera access denied or not available'
          );
        }
      }
    };

    // Small delay to let dialog render the container div
    const timer = setTimeout(startScanner, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [open]);

  const stopScanner = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      scannerRef.current?.clear();
    } catch {
      // Ignore stop errors
    }
    scannerRef.current = null;
    setScanning(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      stopScanner();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan QR Code
          </DialogTitle>
          <DialogDescription>
            Point your camera at a machine QR code label to navigate to it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            id={containerId}
            className="w-full min-h-[300px] rounded-lg overflow-hidden bg-black"
          />

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {scanning && (
            <p className="text-center text-xs text-muted-foreground animate-pulse">
              Scanning...
            </p>
          )}

          <ActionButton
            variant="red"
            className="w-full justify-center"
            onClick={() => handleClose(false)}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </ActionButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
