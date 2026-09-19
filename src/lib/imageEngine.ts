// Helper: Load File into HTMLImageElement
export async function loadImageFromFile(file: File | Blob): Promise<HTMLImageElement> {
  if (!file) {
    throw new Error('No image file was provided.');
  }
  if (file.size === 0) {
    throw new Error(`Image file "${(file as File).name || 'file'}" is empty (0 bytes). Please upload a valid image.`);
  }

  return new Promise((resolve, reject) => {
    // Strategy 1: Data URL via FileReader (Bulletproof across sandboxes & browsers)
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        tryObjectURLFallback();
        return;
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => tryObjectURLFallback();
      img.src = dataUrl;
    };
    reader.onerror = () => tryObjectURLFallback();

    function tryObjectURLFallback() {
      let objectUrl: string | null = null;
      try {
        objectUrl = URL.createObjectURL(file);
      } catch {
        reject(new Error(`Could not read image "${(file as File).name || 'file'}". Please check file format (JPG, PNG, WebP, GIF, SVG).`));
        return;
      }

      const img = new Image();
      img.onload = () => {
        resolve(img);
        setTimeout(() => {
          try {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
          } catch {}
        }, 10000);
      };
      img.onerror = () => {
        try {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        } catch {}
        reject(new Error(`Failed to decode image "${(file as File).name || 'file'}". Please ensure it is a supported JPG, PNG, WebP, BMP, or GIF file.`));
      };
      img.src = objectUrl;
    }

    try {
      reader.readAsDataURL(file);
    } catch {
      tryObjectURLFallback();
    }
  });
}

// Helper: Canvas to Blob
export function canvasToBlob(
  canvas: HTMLCanvasElement, 
  mimeType: string = 'image/jpeg', 
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas rendering failed.'));
      },
      mimeType,
      quality
    );
  });
}

// 1. IMAGE COMPRESSOR
export async function compressImage(
  file: File,
  qualityPercent: number = 75, // 1 to 100
  targetFormat?: 'image/jpeg' | 'image/webp' | 'image/png',
  isFreeUser = true
): Promise<{
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  newSize: number;
  savedPercent: number;
  width: number;
  height: number;
}> {
  const img = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain canvas 2D context.');

  const mime = targetFormat || (file.type === 'image/png' ? 'image/png' : 'image/jpeg');
  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  if (isFreeUser) {
    applyFreeDocMateWatermark(ctx, canvas.width, canvas.height);
  }

  const quality = Math.max(0.05, Math.min(1.0, qualityPercent / 100));
  const blob = await canvasToBlob(canvas, mime, quality);
  const dataUrl = URL.createObjectURL(blob);
  const originalSize = file.size;
  const newSize = blob.size;
  const savedPercent = Math.max(0, Math.round(((originalSize - newSize) / originalSize) * 100));

  return {
    blob,
    dataUrl,
    originalSize,
    newSize,
    savedPercent,
    width: img.width,
    height: img.height,
  };
}

// 1.5 RESIZE IMAGE TO EXACT KB TARGET
export async function resizeImageToKB(
  file: File,
  targetKB: number,
  options: {
    mode?: 'strict_under' | 'closest';
    format?: 'image/jpeg' | 'image/webp' | 'image/png';
    customWidth?: number;
    customHeight?: number;
  } = {},
  isFreeUser = false
): Promise<{
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  newSize: number;
  newSizeKB: number;
  targetKB: number;
  width: number;
  height: number;
  qualityUsed: number;
  savedPercent: number;
}> {
  const img = await loadImageFromFile(file);
  const targetBytes = Math.max(1024, targetKB * 1024);
  const mime = options.format || 'image/jpeg';
  const mode = options.mode || 'strict_under';

  let currentScale = 1.0;
  if (options.customWidth && options.customHeight) {
    currentScale = Math.min(options.customWidth / img.width, options.customHeight / img.height);
  }

  let bestBlob: Blob | null = null;
  let bestQuality = 0.85;
  let finalWidth = img.width;
  let finalHeight = img.height;

  // Multi-pass iterative search: scale dimensions if needed, then binary search on quality
  let scalePass = 0;
  const maxScalePasses = 15;

  while (scalePass < maxScalePasses) {
    const curW = Math.max(16, Math.round((options.customWidth || img.width) * currentScale));
    const curH = Math.max(16, Math.round((options.customHeight || img.height) * currentScale));

    const canvas = document.createElement('canvas');
    canvas.width = curW;
    canvas.height = curH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create 2D canvas context.');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (mime === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, curW, curH);
    }
    ctx.drawImage(img, 0, 0, curW, curH);

    if (isFreeUser) {
      applyFreeDocMateWatermark(ctx, curW, curH);
    }

    if (mime === 'image/png') {
      // PNG is lossless and does not support variable quality in toBlob; scale resolution directly
      const candidateBlob = await canvasToBlob(canvas, mime);
      if (candidateBlob.size <= targetBytes || mode === 'closest' || currentScale <= 0.08) {
        bestBlob = candidateBlob;
        finalWidth = curW;
        finalHeight = curH;
        bestQuality = 1.0;
        break;
      }
      currentScale *= 0.82;
      scalePass++;
      continue;
    }

    // Binary search on quality for JPEG / WebP
    let lowQ = 0.04;
    let highQ = 0.98;
    let localBestBlob: Blob | null = null;
    let localBestQ = 0.85;

    for (let i = 0; i < 9; i++) {
      const midQ = (lowQ + highQ) / 2;
      const testBlob = await canvasToBlob(canvas, mime, midQ);

      if (testBlob.size <= targetBytes) {
        localBestBlob = testBlob;
        localBestQ = midQ;
        lowQ = midQ; // Try higher quality
      } else {
        highQ = midQ; // Reduce quality
      }
    }

    if (localBestBlob) {
      bestBlob = localBestBlob;
      bestQuality = localBestQ;
      finalWidth = curW;
      finalHeight = curH;
      break;
    } else {
      // Even at minimum quality (0.04), size exceeds target -> downscale image resolution
      currentScale *= 0.80;
      scalePass++;
    }
  }

  // Fallback if target was extremely small
  if (!bestBlob) {
    const minW = Math.max(16, Math.round(img.width * currentScale));
    const minH = Math.max(16, Math.round(img.height * currentScale));
    const canvas = document.createElement('canvas');
    canvas.width = minW;
    canvas.height = minH;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (mime === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, minW, minH);
      }
      ctx.drawImage(img, 0, 0, minW, minH);
      bestBlob = await canvasToBlob(canvas, mime, 0.05);
      finalWidth = minW;
      finalHeight = minH;
      bestQuality = 0.05;
    } else {
      bestBlob = await canvasToBlob(document.createElement('canvas'), mime, 0.5);
    }
  }

  const dataUrl = URL.createObjectURL(bestBlob);
  const originalSize = file.size;
  const newSize = bestBlob.size;
  const savedPercent = Math.max(0, Math.round(((originalSize - newSize) / originalSize) * 100));

  return {
    blob: bestBlob,
    dataUrl,
    originalSize,
    newSize,
    newSizeKB: Number((newSize / 1024).toFixed(1)),
    targetKB,
    width: finalWidth,
    height: finalHeight,
    qualityUsed: Math.round(bestQuality * 100),
    savedPercent,
  };
}

// 2. RESIZE IMAGE
export async function resizeImage(
  file: File,
  options: {
    width?: number;
    height?: number;
    percentage?: number;
    maintainAspectRatio?: boolean;
    format?: string;
    quality?: number;
  },
  isFreeUser = true
): Promise<{
  blob: Blob;
  dataUrl: string;
  originalWidth: number;
  originalHeight: number;
  newWidth: number;
  newHeight: number;
  newSize: number;
}> {
  const img = await loadImageFromFile(file);
  const originalWidth = img.width;
  const originalHeight = img.height;

  let targetWidth = options.width || originalWidth;
  let targetHeight = options.height || originalHeight;

  if (options.percentage) {
    const scale = options.percentage / 100;
    targetWidth = Math.round(originalWidth * scale);
    targetHeight = Math.round(originalHeight * scale);
  } else if (options.maintainAspectRatio && options.width && !options.height) {
    const ratio = originalHeight / originalWidth;
    targetHeight = Math.round(options.width * ratio);
  } else if (options.maintainAspectRatio && options.height && !options.width) {
    const ratio = originalWidth / originalHeight;
    targetWidth = Math.round(options.height * ratio);
  }

  targetWidth = Math.max(1, targetWidth);
  targetHeight = Math.max(1, targetHeight);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain canvas 2D context.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const mime = options.format || file.type || 'image/jpeg';
  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  if (isFreeUser) {
    applyFreeDocMateWatermark(ctx, targetWidth, targetHeight);
  }

  const blob = await canvasToBlob(canvas, mime, (options.quality || 90) / 100);
  const dataUrl = URL.createObjectURL(blob);

  return {
    blob,
    dataUrl,
    originalWidth,
    originalHeight,
    newWidth: targetWidth,
    newHeight: targetHeight,
    newSize: blob.size,
  };
}

// 3. CROP IMAGE
export async function cropImage(
  file: File,
  cropArea: { x: number; y: number; width: number; height: number },
  isFreeUser = true
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  const img = await loadImageFromFile(file);
  
  const safeWidth = Math.max(1, Math.min(img.width - cropArea.x, cropArea.width));
  const safeHeight = Math.max(1, Math.min(img.height - cropArea.y, cropArea.height));
  const safeX = Math.max(0, Math.min(img.width - 1, cropArea.x));
  const safeY = Math.max(0, Math.min(img.height - 1, cropArea.y));

  const canvas = document.createElement('canvas');
  canvas.width = safeWidth;
  canvas.height = safeHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain canvas 2D context.');

  ctx.drawImage(
    img,
    safeX,
    safeY,
    safeWidth,
    safeHeight,
    0,
    0,
    safeWidth,
    safeHeight
  );

  if (isFreeUser) {
    applyFreeDocMateWatermark(ctx, canvas.width, canvas.height);
  }

  const mime = file.type || 'image/jpeg';
  const blob = await canvasToBlob(canvas, mime, 0.92);
  const dataUrl = URL.createObjectURL(blob);

  return {
    blob,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
  };
}

// 4. ROTATE AND FLIP IMAGE
export async function rotateAndFlipImage(
  file: File,
  options: {
    degrees?: number; // 90, 180, 270
    flipHorizontal?: boolean;
    flipVertical?: boolean;
  },
  isFreeUser = true
): Promise<{ blob: Blob; dataUrl: string }> {
  const img = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  const deg = (options.degrees || 0) % 360;

  const isPerpendicular = deg === 90 || deg === 270;
  canvas.width = isPerpendicular ? img.height : img.width;
  canvas.height = isPerpendicular ? img.width : img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain canvas 2D context.');

  ctx.translate(canvas.width / 2, canvas.height / 2);

  if (deg !== 0) {
    ctx.rotate((deg * Math.PI) / 180);
  }

  const scaleX = options.flipHorizontal ? -1 : 1;
  const scaleY = options.flipVertical ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  // Reset transform for watermark
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  if (isFreeUser) {
    applyFreeDocMateWatermark(ctx, canvas.width, canvas.height);
  }

  const mime = file.type || 'image/jpeg';
  const blob = await canvasToBlob(canvas, mime, 0.95);
  const dataUrl = URL.createObjectURL(blob);

  return { blob, dataUrl };
}

// 5. FORMAT CONVERTER (JPG to PNG, PNG to JPG, WebP, etc.)
export async function convertImageFormat(
  file: File,
  targetMime: 'image/jpeg' | 'image/png' | 'image/webp',
  quality: number = 0.92,
  isFreeUser = true
): Promise<{ blob: Blob; dataUrl: string; newFileName: string; newSize: number }> {
  const img = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain canvas 2D context.');

  if (targetMime === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  if (isFreeUser) {
    applyFreeDocMateWatermark(ctx, canvas.width, canvas.height);
  }

  const blob = await canvasToBlob(canvas, targetMime, quality);
  const dataUrl = URL.createObjectURL(blob);

  const extMap = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  };

  const base = file.name.replace(/\.[^/.]+$/, '');
  const newFileName = `${base}${extMap[targetMime] || '.jpg'}`;

  return {
    blob,
    dataUrl,
    newFileName,
    newSize: blob.size,
  };
}

// 6. ADD TEXT TO IMAGE
export async function addTextToImage(
  file: File,
  options: {
    text: string;
    fontSize?: number;
    fontFamily?: string;
    colorHex?: string;
    xRatio?: number; // 0 to 1
    yRatio?: number; // 0 to 1
    hasBackgroundBox?: boolean;
  },
  isFreeUser = true
): Promise<{ blob: Blob; dataUrl: string }> {
  const img = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain canvas 2D context.');

  ctx.drawImage(img, 0, 0);

  const {
    text,
    fontSize = Math.max(18, Math.round(canvas.width / 24)),
    fontFamily = 'Outfit, sans-serif',
    colorHex = '#FFFFFF',
    xRatio = 0.5,
    yRatio = 0.85,
    hasBackgroundBox = true,
  } = options;

  if (!text.trim()) {
    throw new Error('Please enter text to add to the image.');
  }

  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const posX = canvas.width * xRatio;
  const posY = canvas.height * yRatio;

  if (hasBackgroundBox) {
    const metrics = ctx.measureText(text);
    const boxPadding = fontSize * 0.4;
    const boxWidth = metrics.width + boxPadding * 2;
    const boxHeight = fontSize * 1.4;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(
      posX - boxWidth / 2,
      posY - boxHeight / 2,
      boxWidth,
      boxHeight,
      boxHeight / 4
    );
    ctx.fill();
  }

  ctx.fillStyle = colorHex;
  ctx.fillText(text, posX, posY);

  if (isFreeUser) {
    applyFreeDocMateWatermark(ctx, canvas.width, canvas.height);
  }

  const mime = file.type || 'image/jpeg';
  const blob = await canvasToBlob(canvas, mime, 0.95);
  const dataUrl = URL.createObjectURL(blob);

  return { blob, dataUrl };
}

// 7. IMAGE WATERMARK
export async function addWatermarkToImage(
  file: File,
  options: {
    watermarkText: string;
    opacity?: number;
    fontSize?: number;
    position?: 'center' | 'bottom-right' | 'tile';
    colorHex?: string;
  },
  isFreeUser = true
): Promise<{ blob: Blob; dataUrl: string }> {
  const img = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain canvas 2D context.');

  ctx.drawImage(img, 0, 0);

  const {
    watermarkText,
    opacity = 0.35,
    fontSize = Math.max(20, Math.round(canvas.width / 20)),
    position = 'center',
    colorHex = '#FFFFFF',
  } = options;

  if (!watermarkText.trim()) {
    throw new Error('Please enter watermark text.');
  }

  ctx.font = `bold ${fontSize}px Outfit, sans-serif`;
  ctx.globalAlpha = opacity;
  ctx.fillStyle = colorHex;

  if (position === 'center') {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((-30 * Math.PI) / 180);
    ctx.fillText(watermarkText, 0, 0);
    ctx.restore();
  } else if (position === 'bottom-right') {
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(watermarkText, canvas.width - 20, canvas.height - 20);
  } else if (position === 'tile') {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const stepX = canvas.width / 3;
    const stepY = canvas.height / 3;
    for (let x = stepX / 2; x < canvas.width; x += stepX) {
      for (let y = stepY / 2; y < canvas.height; y += stepY) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((-25 * Math.PI) / 180);
        ctx.fillText(watermarkText, 0, 0);
        ctx.restore();
      }
    }
  }

  ctx.globalAlpha = 1.0;

  if (isFreeUser) {
    applyFreeDocMateWatermark(ctx, canvas.width, canvas.height);
  }

  const mime = file.type || 'image/jpeg';
  const blob = await canvasToBlob(canvas, mime, 0.95);
  const dataUrl = URL.createObjectURL(blob);

  return { blob, dataUrl };
}

// 8. BLUR / CENSOR SELECTED IMAGE AREA
export async function blurImageArea(
  file: File,
  blurAreas: { 
    x: number; 
    y: number; 
    width: number; 
    height: number; 
    blurRadius?: number;
    style?: 'pixelate' | 'blur' | 'blackout';
  }[],
  isFreeUser = true
): Promise<{ blob: Blob; dataUrl: string }> {
  const img = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain canvas 2D context.');

  ctx.drawImage(img, 0, 0);

  // Apply sensor censorship (Pixelate, Blur, or Blackout) to each designated area
  blurAreas.forEach((area) => {
    const x = Math.max(0, Math.min(img.width - 1, area.x));
    const y = Math.max(0, Math.min(img.height - 1, area.y));
    const width = Math.max(1, Math.min(img.width - x, area.width));
    const height = Math.max(1, Math.min(img.height - y, area.height));
    const style = area.style || 'pixelate';
    const radius = area.blurRadius || 16;

    if (style === 'blackout') {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(x, y, width, height);
    } else if (style === 'blur') {
      // Gaussian blur with canvas filter or multi-pass resampling
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();
      try {
        ctx.filter = `blur(${Math.max(4, radius)}px)`;
        ctx.drawImage(img, 0, 0);
      } catch {
        // Fallback multi-pass box blur if filter unsupported
        const tempCanvas = document.createElement('canvas');
        const s = 12;
        tempCanvas.width = Math.max(1, Math.floor(width / s));
        tempCanvas.height = Math.max(1, Math.floor(height / s));
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(img, x, y, width, height, 0, 0, tempCanvas.width, tempCanvas.height);
          ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, x, y, width, height);
        }
      }
      ctx.restore();
    } else {
      // Pixelate mode (Mosaic Sensor)
      const pixelSize = Math.max(6, Math.min(48, Math.round(radius * 1.2)));
      const tempCanvas = document.createElement('canvas');
      const tempWidth = Math.max(1, Math.floor(width / pixelSize));
      const tempHeight = Math.max(1, Math.floor(height / pixelSize));
      tempCanvas.width = tempWidth;
      tempCanvas.height = tempHeight;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        tempCtx.drawImage(img, x, y, width, height, 0, 0, tempWidth, tempHeight);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, 0, 0, tempWidth, tempHeight, x, y, width, height);
        ctx.imageSmoothingEnabled = true;
      }
    }
  });

  if (isFreeUser) {
    applyFreeDocMateWatermark(ctx, canvas.width, canvas.height);
  }

  const mime = file.type || 'image/jpeg';
  const blob = await canvasToBlob(canvas, mime, 0.95);
  const dataUrl = URL.createObjectURL(blob);

  return { blob, dataUrl };
}

// 9. PASSPORT PHOTO LAYOUT (2x2" or 35x45mm on 4x6" Sheet)
export async function generatePassportPhotoLayout(
  file: File,
  options: {
    photoSize: '2x2' | '35x45'; // 2x2 inch (US/IN) or 35x45mm (EU/UK)
    sheetSize: '4x6' | 'a4';
    copies?: number;
  },
  isFreeUser = true
): Promise<{ blob: Blob; dataUrl: string; sheetDimensions: string }> {
  const img = await loadImageFromFile(file);

  // 4x6 inch sheet at 300 DPI = 1800 x 1200 px landscape
  const sheetW = 1800;
  const sheetH = 1200;

  const canvas = document.createElement('canvas');
  canvas.width = sheetW;
  canvas.height = sheetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain canvas 2D context.');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, sheetW, sheetH);

  let photoW = 600;
  let photoH = 600;

  if (options.photoSize === '35x45') {
    photoW = 413;
    photoH = 531;
  }

  const cols = Math.floor((sheetW - 80) / (photoW + 40));
  const rows = Math.floor((sheetH - 80) / (photoH + 40));
  const maxCopies = cols * rows;
  const totalCopies = Math.min(options.copies || maxCopies, maxCopies);

  const startX = (sheetW - (cols * photoW + (cols - 1) * 40)) / 2;
  const startY = (sheetH - (rows * photoH + (rows - 1) * 40)) / 2;

  let drawn = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (drawn >= totalCopies) break;

      const px = startX + c * (photoW + 40);
      const py = startY + r * (photoH + 40);

      const imgAspect = img.width / img.height;
      const targetAspect = photoW / photoH;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;

      if (imgAspect > targetAspect) {
        sw = img.height * targetAspect;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetAspect;
        sy = (img.height - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, px, py, photoW, photoH);

      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.strokeRect(px, py, photoW, photoH);

      drawn++;
    }
  }

  if (isFreeUser) {
    ctx.font = '14px Outfit, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'right';
    ctx.fillText('DocMate Passport Sheet (300 DPI)', sheetW - 40, sheetH - 20);
  }

  const blob = await canvasToBlob(canvas, 'image/jpeg', 0.98);
  const dataUrl = URL.createObjectURL(blob);

  return {
    blob,
    dataUrl,
    sheetDimensions: `4x6" Sheet (1800x1200 px @ 300 DPI) - ${drawn} Photos`,
  };
}

// 10. SMART BACKGROUND REMOVAL (Genuine local canvas color & contrast isolation)
export async function smartRemoveBackground(
  file: File,
  tolerance: number = 30, // 5 to 70
  bgColor: 'transparent' | 'white' | 'blue' | 'black' | 'green' = 'transparent',
  isFreeUser = true
): Promise<{ blob: Blob; dataUrl: string }> {
  const img = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain canvas 2D context.');

  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Sample corner pixels to detect background color
  const sampleR = (data[0] + data[(canvas.width - 1) * 4] + data[(canvas.width * (canvas.height - 1)) * 4]) / 3;
  const sampleG = (data[1] + data[(canvas.width - 1) * 4 + 1] + data[(canvas.width * (canvas.height - 1)) * 4 + 1]) / 3;
  const sampleB = (data[2] + data[(canvas.width - 1) * 4 + 2] + data[(canvas.width * (canvas.height - 1)) * 4 + 2]) / 3;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt(
      Math.pow(r - sampleR, 2) + 
      Math.pow(g - sampleG, 2) + 
      Math.pow(b - sampleB, 2)
    );

    if (dist < tolerance * 3) {
      if (bgColor === 'transparent') {
        data[i + 3] = 0; // Transparent
      } else if (bgColor === 'white') {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
      } else if (bgColor === 'blue') {
        data[i] = 0;
        data[i + 1] = 102;
        data[i + 2] = 255;
      } else if (bgColor === 'black') {
        data[i] = 15;
        data[i + 1] = 15;
        data[i + 2] = 15;
      } else if (bgColor === 'green') {
        data[i] = 0;
        data[i + 1] = 200;
        data[i + 2] = 80;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  if (isFreeUser) {
    applyFreeDocMateWatermark(ctx, canvas.width, canvas.height);
  }

  const mime = bgColor === 'transparent' ? 'image/png' : 'image/jpeg';
  const blob = await canvasToBlob(canvas, mime, 0.95);
  const dataUrl = URL.createObjectURL(blob);

  return { blob, dataUrl };
}

// 11. READ IMAGE METADATA
export async function readImageMetadata(file: File): Promise<Record<string, string>> {
  const img = await loadImageFromFile(file);
  const bytes = file.size;
  const sizeFormatted =
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  const mp = ((img.width * img.height) / 1000000).toFixed(2);
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(img.width, img.height);
  const aspect = `${Math.round(img.width / divisor)}:${Math.round(img.height / divisor)}`;

  return {
    'File Name': file.name,
    'File Size': sizeFormatted,
    'Dimensions': `${img.width} × ${img.height} px`,
    'MIME Type': file.type || 'image/jpeg',
    'Resolution': `${mp} Megapixels`,
    'Aspect Ratio': aspect,
    'Last Modified': new Date(file.lastModified).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
  };
}

// Helper: Apply subtle, non-intrusive DocMate watermark in bottom right corner for free users
function applyFreeDocMateWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const fontSize = Math.max(11, Math.min(18, Math.round(width / 60)));
  ctx.save();
  ctx.font = `600 ${fontSize}px Outfit, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  
  const text = 'Made with DocMate';
  const paddingX = Math.max(12, Math.round(width * 0.02));
  const paddingY = Math.max(10, Math.round(height * 0.02));

  const metrics = ctx.measureText(text);
  const pillW = metrics.width + 16;
  const pillH = fontSize + 8;
  const pillX = width - paddingX - pillW;
  const pillY = height - paddingY - pillH;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 4);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText(text, width - paddingX - 8, height - paddingY - 4);
  ctx.restore();
}
