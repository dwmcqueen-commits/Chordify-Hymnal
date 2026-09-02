export type CropRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load that photo."));
    img.src = src;
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(blob);
  });
}

export async function cropAndCompress(
  dataUrl: string,
  crop: CropRect,
  maxSize = 1600,
  quality = 0.82,
): Promise<Blob> {
  const img = await loadImage(dataUrl);
  const sx = Math.round(crop.x * img.naturalWidth);
  const sy = Math.round(crop.y * img.naturalHeight);
  const sw = Math.max(1, Math.round(crop.w * img.naturalWidth));
  const sh = Math.max(1, Math.round(crop.h * img.naturalHeight));

  const scale = Math.min(1, maxSize / Math.max(sw, sh));
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the photo.");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
  );
  if (!blob) throw new Error("Could not compress the photo.");
  return blob;
}

export function captureVideoFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not capture a frame.");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.92);
}
