import { useState, useCallback } from 'react';
import UploadScreen from '@/components/UploadScreen';
import ParticleScene from '@/components/ParticleScene';
import ModeSelector from '@/components/ModeSelector';
import { processImage, ParticleData } from '@/lib/imageProcessor';
import { VisualMode } from '@/components/ParticleScene';

export default function Index() {
  const [particleData, setParticleData] = useState<ParticleData | null>(null);
  const [mode, setMode] = useState<VisualMode>('default');
  const [loading, setLoading] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const data = await processImage(file);
      setParticleData(data);
    } catch (err) {
      console.error('Image processing failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    setParticleData(null);
    setMode('default');
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-mono">Processing particles…</p>
        </div>
      </div>
    );
  }

  if (!particleData) {
    return <UploadScreen onFileSelect={handleFileSelect} />;
  }

  return (
    <div className="relative w-full h-screen">
      <ParticleScene data={particleData} mode={mode} />
      <ModeSelector mode={mode} onModeChange={setMode} onBack={handleBack} />
    </div>
  );
}
