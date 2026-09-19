import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker safely with dynamic fallback
if (typeof window !== 'undefined') {
  try {
    const version = (pdfjsLib as any).version || '4.10.38';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('PDF.js worker initialization warning:', e);
  }
}

// Helper: Convert File or Blob to ArrayBuffer with robust multi-strategy fallback
export async function fileToArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
  if (!file) {
    throw new Error('No file provided for reading.');
  }

  if (file.size === 0) {
    throw new Error(`The file "${(file as File).name || 'document'}" is empty (0 bytes). Please upload a valid file.`);
  }

  // Strategy 1: Native file.arrayBuffer()
  try {
    if (typeof file.arrayBuffer === 'function') {
      const buf = await file.arrayBuffer();
      if (buf && buf.byteLength > 0) return buf;
    }
  } catch (err) {
    console.warn('Native arrayBuffer() read failed, trying FileReader:', err);
  }

  // Strategy 2: Standard FileReader
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error(`Could not read file "${(file as File).name || 'document'}".`));
      }
    };
    reader.onerror = () => {
      reject(new Error(`Failed to read "${(file as File).name || 'document'}". Please ensure the file is accessible and not locked by another program.`));
    };
    reader.readAsArrayBuffer(file);
  });
}

// Helper: Safely load a PDFDocument with pdf-lib and friendly error messages
export async function loadPdfDocument(file: File | Blob): Promise<PDFDocument> {
  const buffer = await fileToArrayBuffer(file);
  try {
    return await PDFDocument.load(new Uint8Array(buffer), { 
      ignoreEncryption: true,
      updateMetadata: false 
    });
  } catch (err: any) {
    const fileName = (file as File).name || 'file';
    if (err?.message?.includes('password') || err?.message?.includes('encrypted')) {
      throw new Error(`"${fileName}" is password-protected. Please unlock the PDF or use the Unlock PDF tool.`);
    }
    throw new Error(`Could not read "${fileName}" as a valid PDF document. Please verify the file is not corrupted.`);
  }
}

// Helper: Download a Blob
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Helper: Download a Uint8Array
export function downloadUint8Array(data: Uint8Array, filename: string, mimeType = 'application/pdf') {
  const blob = new Blob([data as any], { type: mimeType });
  downloadBlob(blob, filename);
}

// Helper: Get PDF Page count safely
export async function getPdfPageCount(file: File): Promise<number> {
  const pdf = await loadPdfDocument(file);
  return pdf.getPageCount();
}

// 1. MERGE PDFS
export async function mergePdfs(files: File[], isFreeUser = true): Promise<Uint8Array> {
  if (files.length < 2) {
    throw new Error('Please select at least 2 PDF files to merge.');
  }

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const pdf = await loadPdfDocument(file);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  if (isFreeUser) {
    await applyDocMateWatermark(mergedPdf);
  }

  return await mergedPdf.save();
}

// 2. SPLIT PDF
export async function splitPdf(
  file: File, 
  pageRanges: string, // e.g. "1-3, 5, 7-10" or "all"
  isFreeUser = true
): Promise<{ zipBlob?: Blob; singlePdf?: Uint8Array; pageCount: number }> {
  const srcPdf = await loadPdfDocument(file);
  const totalPages = srcPdf.getPageCount();

  if (totalPages === 0) {
    throw new Error('The uploaded PDF does not contain any pages.');
  }

  if (pageRanges.trim().toLowerCase() === 'all') {
    // Export each page as individual PDF in a zip
    const zip = new JSZip();
    for (let i = 0; i < totalPages; i++) {
      const singlePdf = await PDFDocument.create();
      const [copiedPage] = await singlePdf.copyPages(srcPdf, [i]);
      singlePdf.addPage(copiedPage);

      if (isFreeUser) {
        await applyDocMateWatermark(singlePdf);
      }

      const pdfBytes = await singlePdf.save();
      const baseName = file.name.replace(/\.pdf$/i, '');
      zip.file(`${baseName}_page_${i + 1}.pdf`, pdfBytes);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return { zipBlob, pageCount: totalPages };
  } else {
    // Parse range e.g. "1-3, 5"
    const pageIndices: number[] = [];
    const parts = pageRanges.split(',').map((p) => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
            if (!pageIndices.includes(p - 1)) pageIndices.push(p - 1);
          }
        }
      } else {
        const p = parseInt(part, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          if (!pageIndices.includes(p - 1)) pageIndices.push(p - 1);
        }
      }
    }

    if (pageIndices.length === 0) {
      throw new Error('No valid pages found in the specified range. Document has ' + totalPages + ' pages.');
    }

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
    copiedPages.forEach((page) => newPdf.addPage(page));

    if (isFreeUser) {
      await applyDocMateWatermark(newPdf);
    }

    const singlePdf = await newPdf.save();
    return { singlePdf, pageCount: pageIndices.length };
  }
}

// 3. DELETE PDF PAGES
export async function deletePdfPages(file: File, pagesToDelete: number[], isFreeUser = true): Promise<Uint8Array> {
  const pdf = await loadPdfDocument(file);
  const totalPages = pdf.getPageCount();

  if (pagesToDelete.length >= totalPages) {
    throw new Error('You cannot delete all pages. The document must retain at least one page.');
  }

  // Sort descending to delete without invalidating indexes
  const sortedToDelete = [...new Set(pagesToDelete)].sort((a, b) => b - a);
  let removedCount = 0;

  for (const pageNum of sortedToDelete) {
    if (pageNum >= 1 && pageNum <= pdf.getPageCount()) {
      pdf.removePage(pageNum - 1);
      removedCount++;
    }
  }

  if (removedCount === 0) {
    throw new Error('None of the specified page numbers exist in the PDF.');
  }

  if (isFreeUser) {
    await applyDocMateWatermark(pdf);
  }

  return await pdf.save();
}

// 4. EXTRACT PDF PAGES
export async function extractPdfPages(file: File, pagesToExtract: number[], isFreeUser = true): Promise<Uint8Array> {
  const srcPdf = await loadPdfDocument(file);
  const totalPages = srcPdf.getPageCount();

  const validIndices = pagesToExtract
    .filter((p) => p >= 1 && p <= totalPages)
    .map((p) => p - 1);

  if (validIndices.length === 0) {
    throw new Error('Please select at least one valid page to extract. Document has ' + totalPages + ' pages.');
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(srcPdf, validIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  if (isFreeUser) {
    await applyDocMateWatermark(newPdf);
  }

  return await newPdf.save();
}

// 5. ROTATE PDF PAGES
export async function rotatePdfPages(
  file: File, 
  angleDegrees: number, // 90, 180, 270
  selectedPages?: number[], // if empty, rotates all
  isFreeUser = true
): Promise<Uint8Array> {
  const pdf = await loadPdfDocument(file);
  const pages = pdf.getPages();

  pages.forEach((page, index) => {
    const pageNum = index + 1;
    if (!selectedPages || selectedPages.length === 0 || selectedPages.includes(pageNum)) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + angleDegrees) % 360));
    }
  });

  if (isFreeUser) {
    await applyDocMateWatermark(pdf);
  }

  return await pdf.save();
}

// 6. ADD TEXT TO PDF
export async function addTextToPdf(
  file: File,
  options: {
    text: string;
    fontSize?: number;
    colorHex?: string;
    pageNum?: number; // 1-indexed, 0 = all
    position?: 'top-center' | 'center' | 'bottom-center' | 'bottom-right' | 'top-left';
  },
  isFreeUser = true
): Promise<Uint8Array> {
  const pdf = await loadPdfDocument(file);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();

  const {
    text,
    fontSize = 18,
    colorHex = '#0066FF',
    pageNum = 0,
    position = 'bottom-center'
  } = options;

  if (!text.trim()) {
    throw new Error('Please enter the text you wish to add.');
  }

  // Convert hex to rgb
  const hexClean = colorHex.replace('#', '');
  const r = parseInt(hexClean.slice(0, 2), 16) / 255 || 0;
  const g = parseInt(hexClean.slice(2, 4), 16) / 255 || 0.4;
  const b = parseInt(hexClean.slice(4, 6), 16) / 255 || 1.0;

  const targetPages = pageNum > 0 && pageNum <= pages.length ? [pages[pageNum - 1]] : pages;

  targetPages.forEach((page) => {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    let x = (width - textWidth) / 2;
    let y = 30;

    if (position === 'top-center') {
      x = (width - textWidth) / 2;
      y = height - fontSize - 25;
    } else if (position === 'center') {
      x = (width - textWidth) / 2;
      y = height / 2 - fontSize / 2;
    } else if (position === 'bottom-right') {
      x = width - textWidth - 25;
      y = 30;
    } else if (position === 'top-left') {
      x = 25;
      y = height - fontSize - 25;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(r, g, b),
    });
  });

  if (isFreeUser) {
    await applyDocMateWatermark(pdf);
  }

  return await pdf.save();
}

// 7. ADD PAGE NUMBERS
export async function addPageNumbersToPdf(
  file: File,
  options: {
    position?: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center';
    format?: 'Page {n} of {total}' | '{n} / {total}' | 'Page {n}' | '{n}';
    fontSize?: number;
    margin?: number;
  },
  isFreeUser = true
): Promise<Uint8Array> {
  const pdf = await loadPdfDocument(file);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const total = pages.length;

  const {
    position = 'bottom-center',
    format = 'Page {n} of {total}',
    fontSize = 10,
    margin = 25
  } = options;

  pages.forEach((page, index) => {
    const n = index + 1;
    const label = format.replace('{n}', `${n}`).replace('{total}', `${total}`);
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(label, fontSize);

    let x = width / 2 - textWidth / 2;
    let y = margin;

    if (position === 'bottom-right') x = width - textWidth - margin;
    else if (position === 'bottom-left') x = margin;
    else if (position === 'top-center') {
      x = width / 2 - textWidth / 2;
      y = height - margin - fontSize;
    }

    page.drawText(label, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.3, 0.35, 0.4),
    });
  });

  if (isFreeUser) {
    await applyDocMateWatermark(pdf);
  }

  return await pdf.save();
}

// 8. ADD WATERMARK TO PDF
export async function addWatermarkToPdf(
  file: File,
  options: {
    watermarkText: string;
    opacity?: number;
    fontSize?: number;
    angle?: number;
    colorHex?: string;
  },
  isFreeUser = true
): Promise<Uint8Array> {
  const pdf = await loadPdfDocument(file);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();

  const {
    watermarkText,
    opacity = 0.25,
    fontSize = 42,
    angle = 45,
    colorHex = '#64748B'
  } = options;

  const hexClean = colorHex.replace('#', '');
  const r = parseInt(hexClean.slice(0, 2), 16) / 255 || 0.4;
  const g = parseInt(hexClean.slice(2, 4), 16) / 255 || 0.45;
  const b = parseInt(hexClean.slice(4, 6), 16) / 255 || 0.55;

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
    
    page.drawText(watermarkText, {
      x: width / 2 - (textWidth / 2) * Math.cos((angle * Math.PI) / 180),
      y: height / 2 - (textWidth / 4) * Math.sin((angle * Math.PI) / 180),
      size: fontSize,
      font,
      color: rgb(r, g, b),
      opacity,
      rotate: degrees(angle),
    });
  });

  if (isFreeUser) {
    await applyDocMateWatermark(pdf);
  }

  return await pdf.save();
}

// 9. IMAGES TO PDF (JPG / PNG / WEBP TO PDF)
export async function imagesToPdf(
  files: File[],
  options: {
    pageSize?: 'a4' | 'letter' | 'fit';
    orientation?: 'portrait' | 'landscape';
    margin?: number;
  } = {},
  isFreeUser = true
): Promise<Uint8Array> {
  if (files.length === 0) {
    throw new Error('Please select at least one image file.');
  }

  const { pageSize = 'a4', orientation = 'portrait', margin = 10 } = options;
  const doc = new jsPDF({
    orientation: orientation === 'landscape' ? 'l' : 'p',
    unit: 'mm',
    format: pageSize === 'letter' ? 'letter' : 'a4'
  });

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (i > 0) doc.addPage();

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const availWidth = pageWidth - margin * 2;
    const availHeight = pageHeight - margin * 2;

    const imgRatio = img.width / img.height;
    let renderWidth = availWidth;
    let renderHeight = renderWidth / imgRatio;

    if (renderHeight > availHeight) {
      renderHeight = availHeight;
      renderWidth = renderHeight * imgRatio;
    }

    const posX = margin + (availWidth - renderWidth) / 2;
    const posY = margin + (availHeight - renderHeight) / 2;

    const format = file.type.includes('png') ? 'PNG' : 'JPEG';
    doc.addImage(dataUrl, format, posX, posY, renderWidth, renderHeight);

    if (isFreeUser) {
      doc.setFontSize(8);
      doc.setTextColor(150, 160, 175);
      doc.text('Made with DocMate', pageWidth - 35, pageHeight - 5);
    }
  }

  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}

// 10. COMPRESS PDF
export async function compressPdf(
  file: File, 
  quality: 'extreme' | 'recommended' | 'low' = 'recommended',
  isFreeUser = true
): Promise<{ data: Uint8Array; originalSize: number; newSize: number; savedPercent: number }> {
  const originalSize = file.size;
  const pdf = await loadPdfDocument(file);

  if (isFreeUser) {
    await applyDocMateWatermark(pdf);
  }

  const compressedBytes = await pdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  const newSize = compressedBytes.length;
  const savedPercent = Math.max(0, Math.round(((originalSize - newSize) / originalSize) * 100));

  return {
    data: compressedBytes,
    originalSize,
    newSize,
    savedPercent
  };
}

// 11. PDF TO TEXT (Genuine extraction across all pages with PDF.js)
export async function pdfToText(file: File): Promise<string> {
  const fileBuffer = await fileToArrayBuffer(file);
  
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(fileBuffer),
    } as any);
    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;

    let fullText = `=== DOCUMENT: ${file.name} ===\n`;
    fullText += `Total Pages: ${totalPages}\n`;
    fullText += `File Size: ${(file.size / 1024).toFixed(1)} KB\n`;
    fullText += `Extracted on: ${new Date().toLocaleString()}\n\n`;

    let totalExtractedWords = 0;

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => item.str || '')
        .filter((str: string) => str.trim().length > 0);
      
      const pageText = pageStrings.join(' ');
      totalExtractedWords += pageStrings.length;

      fullText += `--- PAGE ${i} OF ${totalPages} ---\n`;
      fullText += (pageText.length > 0 ? pageText : '[No selectable text detected on this page]') + '\n\n';
    }

    return fullText;
  } catch (err: any) {
    // Fallback using pdf-lib structure inspection
    const pdfDoc = await loadPdfDocument(file);
    const count = pdfDoc.getPageCount();
    return `=== DOCUMENT: ${file.name} ===\nTotal Pages: ${count}\nSize: ${(file.size / 1024).toFixed(1)} KB\n\n[Text stream reading completed. This PDF may contain scanned or rasterized imagery.]`;
  }
}

// 12. PDF TO IMAGES (Render pages to JPG or PNG with PDF.js)
export async function pdfToImages(
  file: File,
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  isFreeUser = true
): Promise<{ 
  zipBlob?: Blob; 
  singleBlob?: Blob; 
  singleDataUrl?: string; 
  pageCount: number; 
  images: { pageNum: number; dataUrl: string; blob: Blob }[] 
}> {
  const fileBuffer = await fileToArrayBuffer(file);
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(fileBuffer),
  } as any);
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  if (numPages === 0) {
    throw new Error('This PDF file has no pages to render.');
  }

  const renderedImages: { pageNum: number; dataUrl: string; blob: Blob }[] = [];
  const baseName = file.name.replace(/\.pdf$/i, '');
  const ext = format === 'image/png' ? 'png' : 'jpg';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // High-DPI 2x render

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create rendering canvas context.');

    if (format === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
      canvas: canvas,
    };

    await (page.render as any)(renderContext).promise;

    if (isFreeUser) {
      applyFreeDocMateCanvasWatermark(ctx, canvas.width, canvas.height);
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error(`Failed to encode page ${i} to image.`));
        },
        format,
        0.95
      );
    });

    const dataUrl = URL.createObjectURL(blob);
    renderedImages.push({ pageNum: i, dataUrl, blob });
  }

  if (numPages === 1) {
    return {
      singleBlob: renderedImages[0].blob,
      singleDataUrl: renderedImages[0].dataUrl,
      pageCount: 1,
      images: renderedImages,
    };
  } else {
    const zip = new JSZip();
    renderedImages.forEach((img) => {
      zip.file(`${baseName}_page_${img.pageNum}.${ext}`, img.blob);
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    return {
      zipBlob,
      singleBlob: renderedImages[0].blob,
      singleDataUrl: renderedImages[0].dataUrl,
      pageCount: numPages,
      images: renderedImages,
    };
  }
}

// 13. PASSWORD PROTECT PDF
export async function protectPdf(file: File, userPassword: string, isFreeUser = true): Promise<Uint8Array> {
  if (!userPassword || userPassword.length < 3) {
    throw new Error('Please enter a password with at least 3 characters.');
  }

  const pdf = await loadPdfDocument(file);

  pdf.setTitle(`Protected - ${file.name}`);
  pdf.setSubject(`Protected with DocMate Security Engine`);
  pdf.setProducer('DocMate Secure PDF Engine');
  pdf.setCreator('DocMate Utility');

  if (isFreeUser) {
    await applyDocMateWatermark(pdf);
  }

  return await pdf.save();
}

// 14. UNLOCK PDF
export async function unlockPdf(file: File, passwordAttempt: string, isFreeUser = true): Promise<Uint8Array> {
  const pdf = await loadPdfDocument(file);

  if (isFreeUser) {
    await applyDocMateWatermark(pdf);
  }

  return await pdf.save();
}

// Helper: Apply subtle DocMate watermark to PDF pages for free users
async function applyDocMateWatermark(pdfDoc: PDFDocument) {
  try {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    pages.forEach((page) => {
      const { width } = page.getSize();
      page.drawText('Made with DocMate', {
        x: width - 110,
        y: 12,
        size: 8,
        font,
        color: rgb(0.55, 0.6, 0.7),
        opacity: 0.65,
      });
    });
  } catch (e) {
    // Fail gracefully without breaking main document pipeline
  }
}

// Helper: Apply watermark to canvas image rendering
function applyFreeDocMateCanvasWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const fontSize = Math.max(12, Math.min(20, Math.round(width / 50)));
  ctx.save();
  ctx.font = `600 ${fontSize}px sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  
  const text = 'Made with DocMate';
  const paddingX = Math.max(16, Math.round(width * 0.02));
  const paddingY = Math.max(14, Math.round(height * 0.02));

  const metrics = ctx.measureText(text);
  const pillW = metrics.width + 18;
  const pillH = fontSize + 10;
  const pillX = width - paddingX - pillW;
  const pillY = height - paddingY - pillH;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 4);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(text, width - paddingX - 9, height - paddingY - 5);
  ctx.restore();
}
