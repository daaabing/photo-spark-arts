export interface ParticleData {
  count: number;
  targetPos: Float32Array;
  colors: Float32Array;
  randomPos: Float32Array;
  scales: Float32Array;
}

export interface GalleryImage {
  id: number;
  src: string;
}

export function processImageToParticles(
  img: HTMLImageElement,
  resolution = 150
): ParticleData {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  let w = img.width;
  let h = img.height;
  const ratio = Math.min(resolution / w, resolution / h);
  w = Math.floor(w * ratio);
  h = Math.floor(h * ratio);

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  const targetPosArr: number[] = [];
  const colorsArr: number[] = [];
  const randomPosArr: number[] = [];
  const scalesArr: number[] = [];
  const threshold = 15;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2],
        a = data[i + 3];
      if (a > 50 && r + g + b > threshold) {
        targetPosArr.push((x - w / 2) * 0.08, -(y - h / 2) * 0.08, 0);
        colorsArr.push(r / 255, g / 255, b / 255);
        randomPosArr.push(
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 20
        );
        scalesArr.push(Math.random() * 0.5 + 0.5);
      }
    }
  }

  return {
    count: scalesArr.length,
    targetPos: new Float32Array(targetPosArr),
    colors: new Float32Array(colorsArr),
    randomPos: new Float32Array(randomPosArr),
    scales: new Float32Array(scalesArr),
  };
}

export function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
