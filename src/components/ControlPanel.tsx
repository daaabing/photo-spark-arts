import { Sliders } from 'lucide-react';
import { SceneParams } from './ParticleScene';

interface ControlPanelProps {
  params: SceneParams;
  onChange: (params: SceneParams) => void;
  open: boolean;
  onToggle: () => void;
}

const CONTROLS: { key: keyof SceneParams; label: string; min: number; max: number; step: number }[] = [
  { key: 'size', label: 'Particle Size', min: 0.05, max: 3, step: 0.05 },
  { key: 'brightness', label: 'Glow', min: 0, max: 3, step: 0.1 },
  { key: 'activity', label: 'Activity', min: 0, max: 5, step: 0.1 },
  { key: 'repX', label: 'Repel X', min: 0, max: 10, step: 0.5 },
  { key: 'repY', label: 'Repel Y', min: 0, max: 10, step: 0.5 },
  { key: 'repZ', label: 'Repel Z', min: 0, max: 20, step: 0.5 },
];

export default function ControlPanel({ params, onChange, open, onToggle }: ControlPanelProps) {
  const update = (key: keyof SceneParams, value: number) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <>
      <button
        onClick={onToggle}
        className="fixed top-6 right-6 z-30 p-2.5 rounded-full transition-all active:scale-90"
        style={{
          background: open ? 'hsl(var(--foreground) / 0.8)' : 'hsl(var(--foreground) / 0.3)',
          color: open ? 'hsl(var(--background))' : 'hsl(var(--background) / 0.8)',
        }}
      >
        <Sliders className="w-5 h-5" />
      </button>

      {open && (
        <div
          className="fixed top-16 right-6 z-30 w-72 rounded-2xl p-5 space-y-3"
          style={{
            background: 'hsl(var(--foreground) / 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid hsl(0 0% 100% / 0.1)',
          }}
        >
          <p className="text-[10px] font-mono tracking-[0.15em] uppercase" style={{ color: 'hsl(0 0% 100% / 0.4)' }}>
            Control Panel
          </p>
          {CONTROLS.map((c) => (
            <div key={c.key} className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[11px] font-mono" style={{ color: 'hsl(0 0% 100% / 0.6)' }}>
                  {c.label}
                </span>
                <span className="text-[11px] font-mono" style={{ color: 'hsl(var(--primary))' }}>
                  {params[c.key].toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={c.min}
                max={c.max}
                step={c.step}
                value={params[c.key]}
                onChange={(e) => update(c.key, Number(e.target.value))}
                className="w-full h-[2px] appearance-none rounded-full outline-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                style={{
                  background: 'hsl(0 0% 100% / 0.15)',
                  accentColor: 'hsl(35 84% 62%)',
                }}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
