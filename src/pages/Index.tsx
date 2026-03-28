import { useState, useCallback, useRef } from 'react';
import ParticleScene, { VisualMode } from '@/components/ParticleScene';
import {
  ParticleData,
  GalleryImage,
  processImageToParticles,
  loadImageFromSrc,
  fileToDataURL,
} from '@/lib/imageProcessor';
import { ArrowLeft, MoreHorizontal, Orbit, Droplets, Zap, Camera, Upload } from 'lucide-react';

const MODES: { id: VisualMode; label: string; icon: React.ReactNode }[] = [
  { id: 'galaxy', label: 'Galaxy', icon: <Orbit className="w-4 h-4" /> },
  { id: 'liquid', label: 'Liquid', icon: <Droplets className="w-4 h-4" /> },
  { id: 'glitch', label: 'Glitch', icon: <Zap className="w-4 h-4" /> },
];

export default function Index() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [currentImageId, setCurrentImageId] = useState<number | null>(null);
  const [particleData, setParticleData] = useState<ParticleData | null>(null);
  const [mode, setMode] = useState<VisualMode>('galaxy');
  const [gravity, setGravity] = useState(0.5);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const loadParticlesForImage = useCallback(async (src: string) => {
    const img = await loadImageFromSrc(src);
    const isMobile = window.innerWidth < 768;
    const data = processImageToParticles(img, isMobile ? 120 : 200);
    setParticleData(data);
  }, []);

  const handleFilesSelect = useCallback(
    async (files: FileList) => {
      const newImages: GalleryImage[] = [];
      for (let i = 0; i < files.length; i++) {
        const src = await fileToDataURL(files[i]);
        newImages.push({ id: Date.now() + Math.random(), src });
      }
      setImages((prev) => [...prev, ...newImages]);
      const firstNew = newImages[0];
      if (firstNew) {
        setCurrentImageId(firstNew.id);
        loadParticlesForImage(firstNew.src);
      }
    },
    [loadParticlesForImage]
  );

  const handleSelectImage = useCallback(
    (id: number) => {
      if (id === currentImageId) return;
      setCurrentImageId(id);
      const img = images.find((i) => i.id === id);
      if (img) loadParticlesForImage(img.src);
    },
    [currentImageId, images, loadParticlesForImage]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelect(e.target.files);
      e.target.value = '';
    }
  };

  const handleBack = useCallback(() => {
    setParticleData(null);
    setImages([]);
    setCurrentImageId(null);
  }, []);

  const hasImage = particleData !== null;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background flex flex-col items-center">
      {/* Hidden inputs */}
      <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

      {/* Header */}
      <div className="w-full flex items-center justify-between px-5 pt-12 pb-2 z-10">
        {hasImage ? (
          <button onClick={handleBack} className="p-2 -ml-2 active:scale-90 transition-transform">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
        ) : (
          <div className="w-10" />
        )}
        <div className="text-center">
          <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-foreground/50">
            The Zen Pond
          </p>
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground uppercase">
            Particlelife
          </h1>
        </div>
        <button className="p-2 -mr-2 active:scale-90 transition-transform">
          <MoreHorizontal className="w-6 h-6 text-foreground/50" />
        </button>
      </div>

      {/* Circular Lens */}
      <div className="flex-1 flex items-center justify-center w-full px-6 py-4 z-10">
        <div className="lens-container relative" style={{ width: 'min(80vw, 400px)', height: 'min(80vw, 400px)' }}>
          {hasImage ? (
            <ParticleScene data={particleData} mode={mode} gravity={gravity} />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="text-4xl animate-pulse">✦</div>
              <p className="text-card-foreground/50 text-xs font-mono tracking-wider uppercase text-center px-8">
                Upload a photo to begin
              </p>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => cameraRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-display font-semibold active:scale-95 transition-transform"
                >
                  <Camera className="w-4 h-4" /> Capture
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-card-foreground/20 text-card-foreground text-xs font-display font-medium active:scale-95 transition-transform"
                >
                  <Upload className="w-4 h-4" /> Upload
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls area */}
      <div className="w-full px-6 pb-8 z-10 space-y-5 safe-bottom">
        {/* Gravity slider */}
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono tracking-[0.15em] uppercase text-foreground/60 flex-shrink-0">
            Wave Gravity
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(gravity * 100)}
            onChange={(e) => setGravity(Number(e.target.value) / 100)}
            className="flex-1 h-[2px] appearance-none bg-foreground/20 rounded-full outline-none accent-foreground
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <span className="text-[10px] font-mono text-foreground/60 w-8 text-right">
            {Math.round(gravity * 100)}%
          </span>
        </div>

        {/* Mode selector */}
        <div className="flex items-center justify-center gap-1 bg-foreground/5 rounded-full p-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-2 ${
                mode === m.id ? 'mode-pill' : 'mode-pill-inactive'
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        {/* Hint text */}
        <p className="text-center text-[9px] font-mono tracking-[0.2em] uppercase text-foreground/35">
          Multi-touch inside the lens
        </p>

        {/* Thumbnail strip (if multiple images) */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar justify-center">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => handleSelectImage(img.id)}
                className={`flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border-2 transition-all active:scale-90 ${
                  currentImageId === img.id
                    ? 'border-primary scale-110'
                    : 'border-transparent opacity-60'
                }`}
              >
                <img src={img.src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-shrink-0 w-10 h-10 rounded-lg border-2 border-dashed border-foreground/20 flex items-center justify-center text-foreground/30 active:scale-90"
            >
              +
            </button>
          </div>
        )}

        {/* Add more button when only 1 image */}
        {images.length === 1 && (
          <div className="flex justify-center">
            <button
              onClick={() => fileRef.current?.click()}
              className="text-[10px] font-mono tracking-wider uppercase text-foreground/40 active:text-foreground/60 transition-colors"
            >
              + Add more photos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
