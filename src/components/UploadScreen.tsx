import { useRef } from 'react';
import { Camera, Upload, Sparkles } from 'lucide-react';

interface UploadScreenProps {
  onFileSelect: (file: File) => void;
}

export default function UploadScreen({ onFileSelect }: UploadScreenProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-accent/8 blur-[100px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-sm">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-surface mb-8">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
            Particle Engine
          </span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4 leading-tight">
          <span className="text-gradient">Transform</span>{' '}
          <span className="text-foreground">your photos into particles</span>
        </h1>

        <p className="text-muted-foreground text-sm mb-10 leading-relaxed">
          Upload any image and watch it come alive as an interactive 3D particle system.
        </p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => cameraRef.current?.click()}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-primary text-primary-foreground font-display font-semibold text-base glow-primary transition-all active:scale-[0.97]"
          >
            <Camera className="w-5 h-5" />
            Take a Photo
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl glass-surface text-foreground font-display font-medium text-base transition-all active:scale-[0.97] hover:border-primary/30"
          >
            <Upload className="w-5 h-5 text-muted-foreground" />
            Upload Image
          </button>
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}
