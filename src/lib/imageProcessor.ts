export interface ParticleData {
  positions: Float32Array;
  colors: Float32Array;
  originalPositions: Float32Array;
  count: number;
}

const SAMPLE_SIZE = 128;

export function processImage(file: File): Promise<ParticleData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width = SAMPLE_SIZE;
      canvas.height = SAMPLE_SIZE;
      const ctx = canvas.getContext('2d')!;

      // Draw image centered/cropped
      const aspect = img.width / img.height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (aspect > 1) {
        sx = (img.width - img.height) / 2;
        sw = img.height;
      } else {
        sy = (img.height - img.width) / 2;
        sh = img.width;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      const imageData = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      const pixels = imageData.data;

      const count = SAMPLE_SIZE * SAMPLE_SIZE;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const originalPositions = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const px = i % SAMPLE_SIZE;
        const py = Math.floor(i / SAMPLE_SIZE);
        const pi = i * 4;

        const r = pixels[pi] / 255;
        const g = pixels[pi + 1] / 255;
        const b = pixels[pi + 2] / 255;
        const a = pixels[pi + 3] / 255;

        // Skip transparent pixels
        if (a < 0.1) {
          positions[i * 3] = 0;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = -999;
          originalPositions[i * 3] = 0;
          originalPositions[i * 3 + 1] = 0;
          originalPositions[i * 3 + 2] = -999;
          colors[i * 3] = 0;
          colors[i * 3 + 1] = 0;
          colors[i * 3 + 2] = 0;
          continue;
        }

        const brightness = (r + g + b) / 3;

        // Map to -5..5 range, centered
        const x = ((px / SAMPLE_SIZE) - 0.5) * 10;
        const y = ((1 - py / SAMPLE_SIZE) - 0.5) * 10;
        const z = (brightness - 0.5) * 3; // Depth from brightness

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        originalPositions[i * 3] = x;
        originalPositions[i * 3 + 1] = y;
        originalPositions[i * 3 + 2] = z;

        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
      }

      resolve({ positions, colors, originalPositions, count });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
