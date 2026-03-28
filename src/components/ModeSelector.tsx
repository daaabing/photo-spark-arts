import { VisualMode } from './ParticleScene';
import { Waves, Orbit, Droplets, Zap, ArrowLeft } from 'lucide-react';

const MODES: { id: VisualMode; label: string; icon: React.ReactNode }[] = [
  { id: 'default', label: 'Wave', icon: <Waves className="w-4 h-4" /> },
  { id: 'galaxy', label: 'Galaxy', icon: <Orbit className="w-4 h-4" /> },
  { id: 'liquid', label: 'Liquid', icon: <Droplets className="w-4 h-4" /> },
  { id: 'glitch', label: 'Glitch', icon: <Zap className="w-4 h-4" /> },
];

interface ModeSelectorProps {
  mode: VisualMode;
  onModeChange: (mode: VisualMode) => void;
  onBack: () => void;
}

export default function ModeSelector({ mode, onModeChange, onBack }: ModeSelectorProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-8 safe-bottom">
      <div className="flex items-center gap-2 max-w-md mx-auto">
        <button
          onClick={onBack}
          className="glass-surface rounded-xl p-3 transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        <div className="flex-1 flex gap-1.5 glass-surface rounded-xl p-1.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-display font-medium transition-all ${
                mode === m.id
                  ? 'bg-primary text-primary-foreground glow-primary'
                  : 'text-muted-foreground active:scale-95'
              }`}
            >
              {m.icon}
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
