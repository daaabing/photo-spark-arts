import { useState, useCallback } from 'react';
import ParticleScene from '@/components/ParticleScene';
import ModeSelector from '@/components/ModeSelector';
import {
  ParticleData,
  GalleryImage,
  processImageToParticles,
  loadImageFromSrc,
  fileToDataURL,
} from '@/lib/imageProcessor';

export default function Index() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [currentImageId, setCurrentImageId] = useState<number | null>(null);
  const [particleData, setParticleData] = useState<ParticleData | null>(null);
  const [isExploded, setIsExploded] = useState(false);
  const [particleCount, setParticleCount] = useState(0);

  const loadParticlesForImage = useCallback(async (src: string) => {
    const img = await loadImageFromSrc(src);
    // Use lower resolution on mobile for performance
    const isMobile = window.innerWidth < 768;
    const resolution = isMobile ? 120 : 200;
    const data = processImageToParticles(img, resolution);
    setParticleData(data);
    setParticleCount(data.count);
    setIsExploded(false);
  }, []);

  const handleFilesSelect = useCallback(
    async (files: FileList) => {
      const newImages: GalleryImage[] = [];
      for (let i = 0; i < files.length; i++) {
        const src = await fileToDataURL(files[i]);
        newImages.push({ id: Date.now() + Math.random(), src });
      }

      setImages((prev) => {
        const updated = [...prev, ...newImages];
        return updated;
      });

      // Auto-select the first new image if nothing selected yet, or the first uploaded
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

  const handleDeleteImage = useCallback(
    (id: number) => {
      setImages((prev) => {
        const filtered = prev.filter((img) => img.id !== id);
        if (id === currentImageId) {
          if (filtered.length > 0) {
            const next = filtered[filtered.length - 1];
            setCurrentImageId(next.id);
            loadParticlesForImage(next.src);
          } else {
            setCurrentImageId(null);
            setParticleData(null);
            setParticleCount(0);
          }
        }
        return filtered;
      });
    },
    [currentImageId, loadParticlesForImage]
  );

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <ParticleScene data={particleData} isExploded={isExploded} />
      <ModeSelector
        images={images}
        currentImageId={currentImageId}
        isExploded={isExploded}
        particleCount={particleCount}
        onToggleExplode={() => setIsExploded((v) => !v)}
        onSelectImage={handleSelectImage}
        onDeleteImage={handleDeleteImage}
        onFilesSelect={handleFilesSelect}
      />
    </div>
  );
}
