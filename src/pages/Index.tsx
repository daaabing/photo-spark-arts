import { useState, useCallback, useRef, useEffect } from 'react';
import ParticleScene, { SceneParams } from '@/components/ParticleScene';
import ControlPanel from '@/components/ControlPanel';
import {
  ParticleData,
  GalleryImage,
  processImageToParticles,
  loadImageFromSrc,
  fileToDataURL,
} from '@/lib/imageProcessor';
import { Upload, Plus, X } from 'lucide-react';

const DEFAULT_PARAMS: SceneParams = {
  size: 0.2,
  brightness: 1.6,
  repX: 3.0,
  repY: 3.0,
  repZ: 8.0,
  activity: 1.0,
};

export default function Index() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [currentImageId, setCurrentImageId] = useState<number | null>(null);
  const [particleData, setParticleData] = useState<ParticleData | null>(null);
  const [particleCount, setParticleCount] = useState(0);
  const [isExploded, setIsExploded] = useState(false);
  const [params, setParams] = useState<SceneParams>(DEFAULT_PARAMS);
  const [panelOpen, setPanelOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadParticlesForImage = useCallback(async (src: string) => {
    try {
      const img = await loadImageFromSrc(src);
      const data = processImageToParticles(img, 200);
      setParticleData(data);
      setParticleCount(data.count);
      setIsExploded(false);
    } catch (err) {
      console.error('Failed to process image:', err);
    }
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

  // When currentImageId changes, load that image
  useEffect(() => {
    if (!currentImageId || images.length === 0) return;
    const imgData = images.find((i) => i.id === currentImageId);
    if (imgData) loadParticlesForImage(imgData.src);
  }, [currentImageId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelect(e.target.files);
      e.target.value = '';
    }
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      if (id === currentImageId) {
        if (filtered.length > 0) {
          setCurrentImageId(filtered[filtered.length - 1].id);
        } else {
          setCurrentImageId(null);
          setParticleData(null);
          setParticleCount(0);
        }
      }
      return filtered;
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: '#050505' }}>
      <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Full-screen particle canvas */}
      <ParticleScene data={particleData} params={params} isExploded={isExploded} />

      {/* Control panel */}
      <ControlPanel params={params} onChange={setParams} open={panelOpen} onToggle={() => setPanelOpen((v) => !v)} />

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
        {/* Top bar */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div>
            <h1
              className="text-3xl md:text-4xl font-display font-black italic tracking-tighter drop-shadow-lg"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--background)), hsl(90 30% 78%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              PIXEL BLOOM
            </h1>
            {particleCount > 0 && (
              <p className="text-sm mt-1" style={{ color: 'hsl(0 0% 100% / 0.4)' }}>
                Count: <span className="font-mono" style={{ color: 'hsl(var(--background))' }}>{particleCount.toLocaleString()}</span>
              </p>
            )}
          </div>

          <div className="flex gap-3">
            {particleData && (
              <button
                onClick={() => setIsExploded(!isExploded)}
                className="px-5 py-2 rounded-full font-display font-bold text-sm transition-all shadow-lg border"
                style={{
                  background: isExploded ? 'hsl(0 70% 50% / 0.2)' : 'hsl(var(--background) / 0.15)',
                  borderColor: isExploded ? 'hsl(0 70% 50%)' : 'hsl(var(--background) / 0.5)',
                  color: isExploded ? 'hsl(0 70% 70%)' : 'hsl(var(--background))',
                }}
              >
                {isExploded ? '⚡ Assemble' : '💥 Explode'}
              </button>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2 rounded-full font-display font-bold text-sm transition-all shadow-lg"
              style={{
                background: 'hsl(var(--background) / 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid hsl(var(--background) / 0.3)',
                color: 'hsl(var(--background))',
              }}
            >
              <Upload className="w-4 h-4" />
              Upload Photo
            </button>
          </div>
        </div>

        {/* Empty state */}
        {images.length === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" style={{ opacity: 0.5 }}>
            <div className="text-6xl mb-4 animate-bounce">✦</div>
            <p className="text-lg font-display" style={{ color: 'hsl(0 0% 100% / 0.6)' }}>Upload a photo to begin</p>
          </div>
        )}

        {/* Bottom thumbnails */}
        {images.length > 0 && (
          <div
            className="pointer-events-auto w-full rounded-2xl p-4"
            style={{
              background: 'hsl(var(--foreground) / 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid hsl(0 0% 100% / 0.1)',
            }}
          >
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {images.map((img) => (
                <div
                  key={img.id}
                  onClick={() => setCurrentImageId(img.id)}
                  className="thumb-container relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer hover:scale-105"
                  style={{
                    borderColor: currentImageId === img.id ? 'hsl(var(--background))' : 'transparent',
                    opacity: currentImageId === img.id ? 1 : 0.7,
                    boxShadow: currentImageId === img.id ? '0 0 12px hsl(var(--background) / 0.4)' : 'none',
                  }}
                >
                  <img src={img.src} alt="" className="w-full h-full object-cover" />
                  {currentImageId === img.id && (
                    <div className="absolute inset-0 animate-pulse pointer-events-none" style={{ background: 'hsl(var(--background) / 0.15)' }} />
                  )}
                  <button
                    onClick={(e) => handleDelete(e, img.id)}
                    className="absolute top-0.5 right-0.5 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md opacity-0 hover:opacity-100 transition-opacity"
                    style={{
                      background: 'hsl(0 70% 50%)',
                      color: 'white',
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1'; }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors hover:border-white/40"
                style={{
                  borderColor: 'hsl(0 0% 100% / 0.2)',
                  color: 'hsl(0 0% 100% / 0.4)',
                }}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .thumb-container:hover button { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
