import { useRef } from 'react';
import { Camera, Upload, Zap, Magnet, Plus, X } from 'lucide-react';
import { GalleryImage } from '@/lib/imageProcessor';

interface ModeSelectorProps {
  images: GalleryImage[];
  currentImageId: number | null;
  isExploded: boolean;
  particleCount: number;
  onToggleExplode: () => void;
  onSelectImage: (id: number) => void;
  onDeleteImage: (id: number) => void;
  onFilesSelect: (files: FileList) => void;
}

export default function ModeSelector({
  images,
  currentImageId,
  isExploded,
  particleCount,
  onToggleExplode,
  onSelectImage,
  onDeleteImage,
  onFilesSelect,
}: ModeSelectorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelect(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 z-10">
      {/* Top bar */}
      <div className="pointer-events-auto flex justify-between items-start gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-4xl font-display font-black italic tracking-tighter text-gradient drop-shadow-lg">
            PARTICLE GALLERY
          </h1>
          {particleCount > 0 && (
            <p className="text-muted-foreground text-xs sm:text-sm mt-1 font-mono">
              {particleCount.toLocaleString()} particles
            </p>
          )}
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {images.length > 0 && (
            <button
              onClick={onToggleExplode}
              className={`px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-display font-bold transition-all border ${
                isExploded
                  ? 'bg-destructive/20 border-destructive text-destructive-foreground'
                  : 'bg-accent/20 border-accent text-accent-foreground'
              }`}
            >
              {isExploded ? (
                <span className="flex items-center gap-1.5"><Magnet className="w-4 h-4" /> Assemble</span>
              ) : (
                <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" /> Explode</span>
              )}
            </button>
          )}

          <button
            onClick={() => cameraRef.current?.click()}
            className="glass-surface p-2.5 rounded-full transition-all active:scale-95 sm:hidden"
          >
            <Camera className="w-5 h-5 text-primary" />
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            className="glass-surface px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-display font-bold text-primary transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Empty state */}
      {images.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center pointer-events-auto">
            <div className="text-5xl sm:text-6xl mb-4 animate-bounce">🖼️</div>
            <p className="text-muted-foreground text-base sm:text-lg mb-6">Upload photos to create particles</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => cameraRef.current?.click()}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-display font-semibold glow-primary transition-all active:scale-[0.97]"
              >
                <Camera className="w-5 h-5" /> Take Photo
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl glass-surface text-foreground font-display font-medium transition-all active:scale-[0.97]"
              >
                <Upload className="w-5 h-5 text-muted-foreground" /> Upload Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom thumbnails */}
      {images.length > 0 && (
        <div className="pointer-events-auto glass-surface rounded-2xl p-3 sm:p-4 safe-bottom">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {images.map((img) => (
              <div
                key={img.id}
                onClick={() => onSelectImage(img.id)}
                className={`thumb-container relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer active:scale-95 ${
                  currentImageId === img.id
                    ? 'border-primary ring-2 ring-primary/50 scale-105'
                    : 'border-transparent opacity-70'
                }`}
              >
                <img src={img.src} alt="thumb" className="w-full h-full object-cover" />
                {currentImageId === img.id && (
                  <div className="absolute inset-0 bg-primary/20 animate-pulse pointer-events-none" />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteImage(img.id);
                  }}
                  className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 sm:opacity-0 hover:opacity-100 transition-opacity"
                  style={{ opacity: currentImageId === img.id ? 0.8 : undefined }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground active:scale-95 transition-all"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
