async function resize(file, max, quality = 0.82) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  if (bitmap.close) bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('图片处理失败，换个格式试试'))),
      'image/webp',
      quality
    );
  });
}

export const compressPhoto = (file) => resize(file, 1600, 0.82);
export const compressThumb = (file) => resize(file, 480, 0.78);
export const compressAvatar = (file) => resize(file, 256, 0.85);
