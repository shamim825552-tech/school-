// ============================================================
// ছবি ফাইল -> সংকুচিত base64 ডেটা URL
// (ছবি, NID কার্ড, জন্ম নিবন্ধন আপলোডের জন্য ব্যবহৃত হয় — Supabase
// টেবিলে টেক্সট আকারে সংরক্ষণের আগে সাইজ কমিয়ে নেওয়া হয়)
// ============================================================
export function fileToResizedDataUrl(
  file: File,
  maxDimension = 1000,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ফাইল পড়া যায়নি'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('ছবি লোড করা যায়নি'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
