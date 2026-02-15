import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { Trash2, Expand, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GalleryImage {
  id: string;
  url: string;
  label?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  onDelete?: (id: string) => void;
  disabled?: boolean;
}

export function ImageGallery({ images, onDelete, disabled }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (images.length === 0) {
    return (
      <div className="aspect-video bg-muted/30 rounded-md flex flex-col items-center justify-center border border-dashed border-border">
        <ImageIcon className="h-8 w-8 text-muted-foreground/20 mb-2" />
        <span className="text-muted-foreground text-sm">No images available</span>
      </div>
    );
  }

  return (
    <>
      {/* Main image + thumbnails */}
      <div className="space-y-2">
        {/* Main image */}
        <div
          className="relative aspect-video bg-muted/30 rounded-md flex items-center justify-center border border-border cursor-pointer group overflow-hidden"
          onClick={() => openLightbox(0)}
        >
          <img
            src={images[0].url}
            alt={images[0].label || 'Machine'}
            className="max-w-full max-h-full object-contain rounded-md"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <Expand className="h-6 w-6 text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
          </div>
          {onDelete && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Remove this image?')) onDelete(images[0].id);
              }}
              className="absolute top-1 right-1 bg-destructive/80 hover:bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove image"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => openLightbox(i)}
                className={cn(
                  'relative shrink-0 w-14 h-14 rounded border overflow-hidden group/thumb',
                  i === 0 ? 'border-primary' : 'border-border hover:border-primary/50'
                )}
              >
                <img
                  src={img.url}
                  alt={img.label || `Image ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                {onDelete && !disabled && i > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Remove this image?')) onDelete(img.id);
                    }}
                    className="absolute inset-0 bg-destructive/60 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox dialog with carousel */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-2 bg-black/95 border-none">
          <Carousel
            opts={{ startIndex: lightboxIndex, loop: true }}
            className="mx-12"
          >
            <CarouselContent>
              {images.map((img) => (
                <CarouselItem key={img.id}>
                  <div className="flex items-center justify-center min-h-[60vh]">
                    <img
                      src={img.url}
                      alt={img.label || 'Machine'}
                      className="max-w-full max-h-[80vh] object-contain rounded"
                    />
                  </div>
                  {img.label && (
                    <p className="text-center text-sm text-white/70 mt-2">{img.label}</p>
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 1 && (
              <>
                <CarouselPrevious className="left-0 bg-white/10 border-white/20 text-white hover:bg-white/20" />
                <CarouselNext className="right-0 bg-white/10 border-white/20 text-white hover:bg-white/20" />
              </>
            )}
          </Carousel>
          <p className="text-center text-xs text-white/50 mt-1">
            {images.length} image{images.length !== 1 ? 's' : ''}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
