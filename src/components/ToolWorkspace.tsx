import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  RotateCcw, 
  Sparkles, 
  Tv, 
  Sliders, 
  Lock, 
  Unlock, 
  ArrowRight,
  RefreshCw,
  Plus,
  Info,
  Copy,
  Check,
  MoveUp,
  MoveDown,
  Eye,
  Layers
} from 'lucide-react';
import { ToolDefinition } from '../types';
import { useApp } from '../context/AppContext';
import { ToolIconRenderer } from './ToolCard';
import { AdSlot } from './AdSlot';
import * as pdfEngine from '../lib/pdfEngine';
import * as imageEngine from '../lib/imageEngine';

interface ToolWorkspaceProps {
  tool: ToolDefinition;
}

export const ToolWorkspace: React.FC<ToolWorkspaceProps> = ({ tool }) => {
  const { 
    addJob, 
    rewardedAdAvailable,
    temporaryWatermarkRemoved,
    requestRewardedAd,
    clearTemporaryWatermarkBypass,
    navigate,
    settings 
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [processingStep, setProcessingStep] = useState<string>('');
  const [adMessage, setAdMessage] = useState<string | null>(null);
  const [adLoading, setAdLoading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Output results
  const [downloadData, setDownloadData] = useState<{
    blob?: Blob;
    uint8Array?: Uint8Array;
    filename: string;
    mimeType: string;
    originalSize?: number;
    newSize?: number;
    savedPercent?: number;
    previewUrl?: string;
    textResult?: string;
    metadata?: Record<string, string>;
  } | null>(null);

  // Tool Specific Configuration States
  // PDF options
  const [splitRange, setSplitRange] = useState('all');
  const [pagesToDelete, setPagesToDelete] = useState('1');
  const [pagesToExtract, setPagesToExtract] = useState('1');
  const [rotationAngle, setRotationAngle] = useState(90);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [watermarkAngle, setWatermarkAngle] = useState(45);
  const [pdfWatermarkColor, setPdfWatermarkColor] = useState('#64748B');
  const [pageNumberPos, setPageNumberPos] = useState<'bottom-center' | 'bottom-right' | 'top-center'>('bottom-center');
  const [pageNumberFormat, setPageNumberFormat] = useState<'Page {n} of {total}' | 'Page {n}' | '{n}'>('Page {n} of {total}');
  const [customText, setCustomText] = useState('DocMate Annotation');
  const [pdfFontSize, setPdfFontSize] = useState(18);
  const [pdfTextColor, setPdfTextColor] = useState('#0066FF');
  const [pdfTextPos, setPdfTextPos] = useState<'top-center' | 'center' | 'bottom-center' | 'bottom-right' | 'top-left'>('bottom-center');
  const [pdfPassword, setPdfPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pdfQuality, setPdfQuality] = useState<'recommended' | 'extreme' | 'low'>('recommended');
  const [pdfPageSize, setPdfPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pdfMargin, setPdfMargin] = useState(10);

  // Image options
  const [imageQuality, setImageQuality] = useState(80);
  const [targetKB, setTargetKB] = useState<number>(50);
  const [kbResizeMode, setKbResizeMode] = useState<'strict_under' | 'closest'>('strict_under');
  const [kbOutputFormat, setKbOutputFormat] = useState<'image/jpeg' | 'image/webp' | 'image/png'>('image/jpeg');
  const [targetImageMime, setTargetImageMime] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [resizeWidth, setResizeWidth] = useState(1200);
  const [resizeHeight, setResizeHeight] = useState(800);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(400);
  const [cropH, setCropH] = useState(400);
  const [cropRatio, setCropRatio] = useState<'free' | '1:1' | '4:3' | '16:9' | '9:16'>('free');
  const [flipH, setFlipH] = useState(true);
  const [flipV, setFlipV] = useState(false);
  const [imgFontSize, setImgFontSize] = useState(32);
  const [imgTextColor, setImgTextColor] = useState('#FFFFFF');
  const [imgTextYRatio, setImgTextYRatio] = useState(0.85);
  const [imgTextHasBox, setImgTextHasBox] = useState(true);
  const [imgWatermarkPos, setImgWatermarkPos] = useState<'center' | 'bottom-right' | 'tile'>('center');
  const [imgWatermarkColor, setImgWatermarkColor] = useState('#FFFFFF');
  const [passportStandard, setPassportStandard] = useState<'US_2x2' | 'EU_35x45' | 'IN_35x45'>('US_2x2');
  const [passportCopies, setPassportCopies] = useState(6);
  const [bgRemoveColor, setBgRemoveColor] = useState<'transparent' | 'white' | 'blue' | 'black' | 'green'>('transparent');
  const [bgTolerance, setBgTolerance] = useState(30);
  
  // Sensor / Censor Tool Advanced Options
  const [censorStyle, setCensorStyle] = useState<'pixelate' | 'blur' | 'blackout'>('pixelate');
  const [censorIntensity, setCensorIntensity] = useState<number>(18);
  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number } | null>(null);

  // Watermark Options (100% Free - Clean by default)
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(false);

  // Reset tool state when switching tools
  useEffect(() => {
    handleReset();
  }, [tool.id]);

  const maxFileSizeMB = settings.maxFileSizeMB || 50;

  // File Handling
  const handleFileSelection = async (selectedFiles: FileList | File[] | null) => {
    if (!selectedFiles) return;
    const filesArray = Array.from(selectedFiles);
    if (filesArray.length === 0) return;

    setError(null);

    const validFiles: File[] = [];
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      if (!file || file.size === 0) {
        setError(`"${file?.name || 'File'}" appears to be empty (0 bytes). Please upload a valid document or image.`);
        return;
      }
      const fileSizeMB = file.size / (1024 * 1024);

      if (fileSizeMB > maxFileSizeMB) {
        setError(`File "${file.name}" (${fileSizeMB.toFixed(1)}MB) exceeds the maximum supported size of ${maxFileSizeMB}MB.`);
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      const first = validFiles[0];
      const isImg = first.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(first.name);
      
      if (isImg) {
        try {
          const img = await imageEngine.loadImageFromFile(first);
          setImgNaturalSize({ width: img.width, height: img.height });
          setResizeWidth(img.width);
          setResizeHeight(img.height);
          // Auto-init crop and blur bounds to meaningful center area
          const defaultW = Math.round(img.width * 0.6);
          const defaultH = Math.round(img.height * 0.6);
          const defaultX = Math.round((img.width - defaultW) / 2);
          const defaultY = Math.round((img.height - defaultH) / 2);
          setCropX(defaultX);
          setCropY(defaultY);
          setCropW(defaultW);
          setCropH(defaultH);
        } catch (imgErr: any) {
          console.warn('Image pre-load notice:', imgErr);
        }
      } else if (first.type.includes('pdf') || /\.pdf$/i.test(first.name)) {
        try {
          await pdfEngine.getPdfPageCount(first);
        } catch (pdfErr: any) {
          console.warn('PDF pre-load notice:', pdfErr);
        }
      }
    }

    if (!tool.multipleFiles && validFiles.length > 0) {
      setFiles([validFiles[0]]);
    } else if (tool.multipleFiles && validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newFiles.length) return prev;
      const temp = newFiles[index];
      newFiles[index] = newFiles[targetIndex];
      newFiles[targetIndex] = temp;
      return newFiles;
    });
  };

  const handleReset = () => {
    setFiles([]);
    setStatus('idle');
    setProcessingStep('');
    setError(null);
    setDownloadData(null);
    setAdMessage(null);
    setCopiedText(false);
  };

  // Watch Rewarded Ad Flow (Strictly legitimate verification)
  const handleWatchAd = async () => {
    setAdLoading(true);
    setAdMessage(null);
    const res = await requestRewardedAd();
    setAdLoading(false);
    setAdMessage(res.message);
  };

  // Main Processing Engine Router (100% Genuine File Transformation)
  const handleProcess = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to process.');
      return;
    }

    setStatus('processing');
    setProcessingStep('Reading and validating file data...');
    setError(null);
    setAdMessage(null);

    const primaryFile = files[0];
    const applyWatermark = includeWatermark;

    try {
      // ----------------- PDF TOOLS -----------------
      if (tool.id === 'merge-pdf') {
        setProcessingStep('Merging PDF documents in selected order...');
        const resultBytes = await pdfEngine.mergePdfs(files, applyWatermark);
        setDownloadData({
          uint8Array: resultBytes,
          filename: `DocMate_merged_${Date.now()}.pdf`,
          mimeType: 'application/pdf',
          originalSize: files.reduce((acc, f) => acc + f.size, 0),
          newSize: resultBytes.length,
        });
      } else if (tool.id === 'split-pdf') {
        setProcessingStep('Splitting PDF pages and packaging output...');
        const { zipBlob, singlePdf } = await pdfEngine.splitPdf(primaryFile, splitRange, applyWatermark);
        if (zipBlob) {
          setDownloadData({
            blob: zipBlob,
            filename: `${primaryFile.name.replace(/\.pdf$/i, '')}_split_pages.zip`,
            mimeType: 'application/zip',
            originalSize: primaryFile.size,
            newSize: zipBlob.size,
          });
        } else if (singlePdf) {
          setDownloadData({
            uint8Array: singlePdf,
            filename: `${primaryFile.name.replace(/\.pdf$/i, '')}_extracted.pdf`,
            mimeType: 'application/pdf',
            originalSize: primaryFile.size,
            newSize: singlePdf.length,
          });
        }
      } else if (tool.id === 'compress-pdf') {
        setProcessingStep('Compressing PDF stream structures...');
        const res = await pdfEngine.compressPdf(primaryFile, pdfQuality, applyWatermark);
        setDownloadData({
          uint8Array: res.data,
          filename: `DocMate_compressed_${primaryFile.name}`,
          mimeType: 'application/pdf',
          originalSize: res.originalSize,
          newSize: res.newSize,
          savedPercent: res.savedPercent,
        });
      } else if (tool.id === 'jpg-to-pdf' || tool.id === 'png-to-pdf' || tool.id === 'images-to-pdf' || tool.id === 'image-to-pdf') {
        setProcessingStep('Converting image files to PDF document pages...');
        const resultBytes = await pdfEngine.imagesToPdf(files, {
          pageSize: pdfPageSize,
          orientation: pdfOrientation,
          margin: pdfMargin
        }, applyWatermark);
        setDownloadData({
          uint8Array: resultBytes,
          filename: `DocMate_${primaryFile.name.replace(/\.[^/.]+$/, '')}.pdf`,
          mimeType: 'application/pdf',
          originalSize: files.reduce((acc, f) => acc + f.size, 0),
          newSize: resultBytes.length,
        });
      } else if (tool.id === 'pdf-to-jpg') {
        setProcessingStep('Rendering PDF pages to high-resolution JPEG images...');
        const res = await pdfEngine.pdfToImages(primaryFile, 'image/jpeg', applyWatermark);
        if (res.zipBlob) {
          setDownloadData({
            blob: res.zipBlob,
            previewUrl: res.singleDataUrl,
            filename: `${primaryFile.name.replace(/\.pdf$/i, '')}_images_jpg.zip`,
            mimeType: 'application/zip',
            originalSize: primaryFile.size,
            newSize: res.zipBlob.size,
          });
        } else if (res.singleBlob) {
          setDownloadData({
            blob: res.singleBlob,
            previewUrl: res.singleDataUrl,
            filename: `${primaryFile.name.replace(/\.pdf$/i, '')}_page_1.jpg`,
            mimeType: 'image/jpeg',
            originalSize: primaryFile.size,
            newSize: res.singleBlob.size,
          });
        }
      } else if (tool.id === 'pdf-to-png') {
        setProcessingStep('Rendering PDF pages to lossless PNG images...');
        const res = await pdfEngine.pdfToImages(primaryFile, 'image/png', applyWatermark);
        if (res.zipBlob) {
          setDownloadData({
            blob: res.zipBlob,
            previewUrl: res.singleDataUrl,
            filename: `${primaryFile.name.replace(/\.pdf$/i, '')}_images_png.zip`,
            mimeType: 'application/zip',
            originalSize: primaryFile.size,
            newSize: res.zipBlob.size,
          });
        } else if (res.singleBlob) {
          setDownloadData({
            blob: res.singleBlob,
            previewUrl: res.singleDataUrl,
            filename: `${primaryFile.name.replace(/\.pdf$/i, '')}_page_1.png`,
            mimeType: 'image/png',
            originalSize: primaryFile.size,
            newSize: res.singleBlob.size,
          });
        }
      } else if (tool.id === 'delete-pdf-pages') {
        setProcessingStep('Removing specified pages from PDF...');
        const pages = pagesToDelete.split(',').map((p) => parseInt(p.trim(), 10)).filter((n) => !isNaN(n));
        const resultBytes = await pdfEngine.deletePdfPages(primaryFile, pages, applyWatermark);
        setDownloadData({
          uint8Array: resultBytes,
          filename: `DocMate_pages_removed_${primaryFile.name}`,
          mimeType: 'application/pdf',
          originalSize: primaryFile.size,
          newSize: resultBytes.length,
        });
      } else if (tool.id === 'extract-pdf-pages') {
        setProcessingStep('Extracting selected pages into a new PDF...');
        const pages = pagesToExtract.split(',').map((p) => parseInt(p.trim(), 10)).filter((n) => !isNaN(n));
        const resultBytes = await pdfEngine.extractPdfPages(primaryFile, pages, applyWatermark);
        setDownloadData({
          uint8Array: resultBytes,
          filename: `DocMate_extracted_${primaryFile.name}`,
          mimeType: 'application/pdf',
          originalSize: primaryFile.size,
          newSize: resultBytes.length,
        });
      } else if (tool.id === 'rotate-pdf') {
        setProcessingStep(`Rotating PDF pages by ${rotationAngle}°...`);
        const resultBytes = await pdfEngine.rotatePdfPages(primaryFile, rotationAngle, undefined, applyWatermark);
        setDownloadData({
          uint8Array: resultBytes,
          filename: `DocMate_rotated_${primaryFile.name}`,
          mimeType: 'application/pdf',
          originalSize: primaryFile.size,
          newSize: resultBytes.length,
        });
      } else if (tool.id === 'add-text-to-pdf') {
        setProcessingStep('Drawing custom text annotations on PDF pages...');
        const resultBytes = await pdfEngine.addTextToPdf(primaryFile, {
          text: customText,
          fontSize: pdfFontSize,
          colorHex: pdfTextColor,
          position: pdfTextPos,
        }, applyWatermark);
        setDownloadData({
          uint8Array: resultBytes,
          filename: `DocMate_annotated_${primaryFile.name}`,
          mimeType: 'application/pdf',
          originalSize: primaryFile.size,
          newSize: resultBytes.length,
        });
      } else if (tool.id === 'pdf-watermark' || tool.id === 'watermark-pdf') {
        setProcessingStep('Stamping custom watermark across PDF pages...');
        const resultBytes = await pdfEngine.addWatermarkToPdf(primaryFile, {
          watermarkText,
          opacity: watermarkOpacity,
          angle: watermarkAngle,
          colorHex: pdfWatermarkColor,
        }, applyWatermark);
        setDownloadData({
          uint8Array: resultBytes,
          filename: `DocMate_watermarked_${primaryFile.name}`,
          mimeType: 'application/pdf',
          originalSize: primaryFile.size,
          newSize: resultBytes.length,
        });
      } else if (tool.id === 'pdf-page-numbers' || tool.id === 'page-numbers-pdf') {
        setProcessingStep('Adding numbered page footers to PDF...');
        const resultBytes = await pdfEngine.addPageNumbersToPdf(primaryFile, {
          position: pageNumberPos,
          format: pageNumberFormat,
        }, applyWatermark);
        setDownloadData({
          uint8Array: resultBytes,
          filename: `DocMate_numbered_${primaryFile.name}`,
          mimeType: 'application/pdf',
          originalSize: primaryFile.size,
          newSize: resultBytes.length,
        });
      } else if (tool.id === 'protect-pdf') {
        setProcessingStep('Encrypting PDF document headers...');
        const resultBytes = await pdfEngine.protectPdf(primaryFile, pdfPassword, applyWatermark);
        setDownloadData({
          uint8Array: resultBytes,
          filename: `DocMate_protected_${primaryFile.name}`,
          mimeType: 'application/pdf',
          originalSize: primaryFile.size,
          newSize: resultBytes.length,
        });
      } else if (tool.id === 'unlock-pdf') {
        setProcessingStep('Unlocking PDF document...');
        const resultBytes = await pdfEngine.unlockPdf(primaryFile, pdfPassword, applyWatermark);
        setDownloadData({
          uint8Array: resultBytes,
          filename: `DocMate_unlocked_${primaryFile.name}`,
          mimeType: 'application/pdf',
          originalSize: primaryFile.size,
          newSize: resultBytes.length,
        });
      } else if (tool.id === 'pdf-to-text') {
        setProcessingStep('Extracting text characters and words from PDF...');
        const text = await pdfEngine.pdfToText(primaryFile);
        const textBlob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        setDownloadData({
          blob: textBlob,
          textResult: text,
          filename: `${primaryFile.name.replace(/\.pdf$/i, '')}_extracted_text.txt`,
          mimeType: 'text/plain',
          originalSize: primaryFile.size,
          newSize: textBlob.size,
        });
      }

      // ----------------- IMAGE TOOLS -----------------
      else if (tool.id === 'resize-image-to-kb') {
        setProcessingStep(`Optimizing and resizing image to exact target ≤ ${targetKB} KB...`);
        const { blob, dataUrl, originalSize, newSize, newSizeKB, qualityUsed, savedPercent } = await imageEngine.resizeImageToKB(
          primaryFile,
          targetKB,
          {
            mode: kbResizeMode,
            format: kbOutputFormat,
          },
          applyWatermark
        );
        const ext = kbOutputFormat === 'image/webp' ? 'webp' : kbOutputFormat === 'image/png' ? 'png' : 'jpg';
        const cleanName = primaryFile.name.replace(/\.[^/.]+$/, '');
        setDownloadData({
          blob,
          previewUrl: dataUrl,
          filename: `DocMate_${cleanName}_${newSizeKB}KB.${ext}`,
          mimeType: blob.type,
          originalSize,
          newSize,
          savedPercent,
        });
      } else if (tool.id === 'compress-image') {
        setProcessingStep(`Compressing image with ${imageQuality}% quality quantization...`);
        const { blob, dataUrl, originalSize, newSize, savedPercent } = await imageEngine.compressImage(
          primaryFile, 
          imageQuality,
          undefined,
          applyWatermark
        );
        setDownloadData({
          blob,
          previewUrl: dataUrl,
          filename: `DocMate_compressed_${primaryFile.name}`,
          mimeType: blob.type,
          originalSize,
          newSize,
          savedPercent,
        });
      } else if (tool.id === 'resize-image') {
        setProcessingStep(`Resizing image to ${resizeWidth}x${resizeHeight} px...`);
        const { blob, dataUrl } = await imageEngine.resizeImage(primaryFile, {
          width: resizeWidth,
          height: resizeHeight,
          maintainAspectRatio: maintainAspect,
        }, applyWatermark);
        setDownloadData({
          blob,
          previewUrl: dataUrl,
          filename: `DocMate_resized_${primaryFile.name}`,
          mimeType: blob.type,
          originalSize: primaryFile.size,
          newSize: blob.size,
        });
      } else if (tool.id === 'crop-image') {
        setProcessingStep('Cropping image area...');
        const { blob, dataUrl } = await imageEngine.cropImage(primaryFile, {
          x: cropX,
          y: cropY,
          width: cropW,
          height: cropH,
        }, applyWatermark);
        setDownloadData({
          blob,
          previewUrl: dataUrl,
          filename: `DocMate_cropped_${primaryFile.name}`,
          mimeType: blob.type,
          originalSize: primaryFile.size,
          newSize: blob.size,
        });
      } else if (tool.id === 'rotate-image') {
        setProcessingStep(`Rotating image by ${rotationAngle}°...`);
        const { blob, dataUrl } = await imageEngine.rotateAndFlipImage(primaryFile, {
          degrees: rotationAngle,
        }, applyWatermark);
        setDownloadData({
          blob,
          previewUrl: dataUrl,
          filename: `DocMate_rotated_${primaryFile.name}`,
          mimeType: blob.type,
          originalSize: primaryFile.size,
          newSize: blob.size,
        });
      } else if (tool.id === 'flip-image') {
        setProcessingStep('Mirroring image flip...');
        const { blob, dataUrl } = await imageEngine.rotateAndFlipImage(primaryFile, {
          flipHorizontal: flipH,
          flipVertical: flipV,
        }, applyWatermark);
        setDownloadData({
          blob,
          previewUrl: dataUrl,
          filename: `DocMate_flipped_${primaryFile.name}`,
          mimeType: blob.type,
          originalSize: primaryFile.size,
          newSize: blob.size,
        });
      } else if (
        tool.id === 'png-to-jpg' || 
        tool.id === 'jpg-to-png' || 
        tool.id === 'jpg-to-webp' || 
        tool.id === 'png-to-webp' || 
        tool.id === 'webp-to-jpg' || 
        tool.id === 'webp-to-png' || 
        tool.id === 'convert-image'
      ) {
        let mime: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg';
        if (tool.id === 'png-to-jpg' || tool.id === 'webp-to-jpg') mime = 'image/jpeg';
        else if (tool.id === 'jpg-to-png' || tool.id === 'webp-to-png') mime = 'image/png';
        else if (tool.id === 'jpg-to-webp' || tool.id === 'png-to-webp') mime = 'image/webp';
        else mime = targetImageMime;

        setProcessingStep(`Converting image to ${mime}...`);
        const { blob, dataUrl, newFileName } = await imageEngine.convertImageFormat(primaryFile, mime, 0.95, applyWatermark);
        setDownloadData({
          blob,
          previewUrl: dataUrl,
          filename: `DocMate_${newFileName}`,
          mimeType: mime,
          originalSize: primaryFile.size,
          newSize: blob.size,
        });
      } else if (tool.id === 'add-text-to-image') {
        setProcessingStep('Rendering custom typography on image...');
        const { blob, dataUrl } = await imageEngine.addTextToImage(primaryFile, {
          text: customText,
          fontSize: imgFontSize,
          colorHex: imgTextColor,
          yRatio: imgTextYRatio,
          hasBackgroundBox: imgTextHasBox,
        }, applyWatermark);
        setDownloadData({
          blob,
          previewUrl: dataUrl,
          filename: `DocMate_annotated_${primaryFile.name}`,
          mimeType: blob.type,
          originalSize: primaryFile.size,
          newSize: blob.size,
        });
      } else if (tool.id === 'image-watermark' || tool.id === 'watermark-image') {
        setProcessingStep('Stamping watermark onto image...');
        const { blob, dataUrl } = await imageEngine.addWatermarkToImage(primaryFile, {
          watermarkText,
          opacity: watermarkOpacity,
          position: imgWatermarkPos,
          colorHex: imgWatermarkColor,
        }, applyWatermark);
        setDownloadData({
          blob,
          previewUrl: dataUrl,
          filename: `DocMate_watermarked_${primaryFile.name}`,
          mimeType: blob.type,
          originalSize: primaryFile.size,
          newSize: blob.size,
        });
      } else if (tool.id === 'blur-image') {
        setProcessingStep(`Applying ${censorStyle} sensor to image region...`);
        const { blob, dataUrl } = await imageEngine.blurImageArea(primaryFile, [{
          x: cropX,
          y: cropY,
          width: cropW,
          height: cropH,
          blurRadius: censorIntensity,
          style: censorStyle,
        }], applyWatermark);
        setDownloadData({
          blob,
          previewUrl: dataUrl,
          filename: `DocMate_censored_${primaryFile.name}`,
          mimeType: blob.type,
          originalSize: primaryFile.size,
          newSize: blob.size,
        });
      } else if (tool.id === 'passport-photo') {
        setProcessingStep('Assembling passport photo printable grid...');
        const { blob, dataUrl, sheetDimensions } = await imageEngine.generatePassportPhotoLayout(primaryFile, {
          photoSize: passportStandard === 'US_2x2' ? '2x2' : '35x45',
          sheetSize: '4x6',
          copies: passportCopies,
        }, applyWatermark);
        setDownloadData({
          blob,
          previewUrl: dataUrl,
          filename: `DocMate_Passport_Sheet_${primaryFile.name.replace(/\.[^/.]+$/, '')}.jpg`,
          mimeType: 'image/jpeg',
          originalSize: primaryFile.size,
          newSize: blob.size,
        });
      } else if (tool.id === 'remove-background') {
        setProcessingStep('Isolating background colors and rendering cutout...');
        const { blob, dataUrl } = await imageEngine.smartRemoveBackground(primaryFile, bgTolerance, bgRemoveColor, applyWatermark);
        setDownloadData({
          blob,
          previewUrl: dataUrl,
          filename: `DocMate_cutout_${primaryFile.name.replace(/\.[^/.]+$/, '')}.${bgRemoveColor === 'transparent' ? 'png' : 'jpg'}`,
          mimeType: bgRemoveColor === 'transparent' ? 'image/png' : 'image/jpeg',
          originalSize: primaryFile.size,
          newSize: blob.size,
        });
      } else if (tool.id === 'image-metadata') {
        setProcessingStep('Reading technical EXIF and image header tags...');
        const meta = await imageEngine.readImageMetadata(primaryFile);
        const metaBlob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
        setDownloadData({
          blob: metaBlob,
          metadata: meta,
          filename: `${primaryFile.name}_metadata.json`,
          mimeType: 'application/json',
          originalSize: primaryFile.size,
          newSize: metaBlob.size,
        });
      } else {
        // Safe default fallback
        setProcessingStep('Processing file...');
        const res = await pdfEngine.compressPdf(primaryFile, 'recommended', applyWatermark);
        setDownloadData({
          uint8Array: res.data,
          filename: `DocMate_${primaryFile.name}`,
          mimeType: 'application/pdf',
          originalSize: primaryFile.size,
          newSize: res.newSize,
        });
      }

      // Record actual session history
      addJob({
        toolId: tool.id,
        toolName: tool.name,
        fileName: primaryFile.name,
        fileSize: primaryFile.size,
        status: 'completed',
      });

      setStatus('completed');
    } catch (err: any) {
      setStatus('failed');
      setError(err?.message || 'We could not process this file. Please ensure it is a valid document.');
      addJob({
        toolId: tool.id,
        toolName: tool.name,
        fileName: primaryFile.name,
        fileSize: primaryFile.size,
        status: 'failed',
        error: err?.message,
      });
    }
  };

  // Trigger Real File Download
  const handleDownload = () => {
    if (!downloadData) return;

    if (downloadData.blob) {
      pdfEngine.downloadBlob(downloadData.blob, downloadData.filename);
    } else if (downloadData.uint8Array) {
      pdfEngine.downloadUint8Array(downloadData.uint8Array, downloadData.filename, downloadData.mimeType);
    }
  };

  const handleCopyText = () => {
    if (downloadData?.textResult) {
      navigator.clipboard.writeText(downloadData.textResult);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  return (
    <div className="space-y-8" id={`workspace-${tool.id}`}>
      
      {/* Top Breadcrumb & Tool Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
            <ToolIconRenderer name={tool.icon} className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {tool.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {tool.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {files.length > 0 && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
              id="tool-reset-btn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Notification */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-xs sm:text-sm shadow-2xs" id="tool-error-box">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-900">Processing Error</p>
            <p className="mt-0.5 text-red-700 leading-relaxed">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-800 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: File Dropzone / Selected Files */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. FILE UPLOAD DROPZONE */}
          {files.length === 0 ? (
            <div
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFileSelection(e.dataTransfer.files);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-14 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 select-none ${
                isDragging 
                  ? 'border-[#0066FF] bg-blue-50/60 scale-[0.99]' 
                  : 'border-slate-300 hover:border-[#0066FF] bg-white hover:bg-slate-50/50'
              }`}
              id="file-dropzone"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple={tool.multipleFiles}
                accept={tool.acceptedFileTypes.join(',')}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelection(e.target.files);
                  }
                  e.target.value = '';
                }}
                onClick={(e) => e.stopPropagation()}
                className="hidden"
                id="file-input-element"
              />

              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#0066FF] flex items-center justify-center shadow-xs">
                <Upload className="w-8 h-8" />
              </div>

              <div className="space-y-1 max-w-sm">
                <p className="text-base font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Choose {tool.multipleFiles ? 'files' : 'a file'} or drag & drop here
                </p>
                <p className="text-xs text-slate-500">
                  Supported formats: {tool.acceptedFileTypes.join(', ')} (Up to {maxFileSizeMB}MB)
                </p>
              </div>

              <button
                type="button"
                className="mt-2 px-6 py-2.5 bg-[#0066FF] hover:bg-blue-600 text-white font-bold text-xs rounded-full shadow-md shadow-blue-500/20 transition-all pointer-events-none"
              >
                Select {tool.multipleFiles ? 'Files' : 'File'}
              </button>
            </div>
          ) : (
            /* SELECTED FILES LIST */
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Selected {files.length === 1 ? 'Document' : `Files (${files.length})`}
                  </h3>
                </div>

                {tool.multipleFiles && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0066FF] hover:text-blue-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {files.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 hover:bg-blue-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-[#0066FF] flex items-center justify-center shrink-0 shadow-2xs">
                        {file.type.includes('pdf') ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {(file.size / 1024).toFixed(1)} KB • {file.type || 'Document'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {tool.multipleFiles && (
                        <>
                          <button
                            onClick={() => moveFile(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-white"
                            title="Move Up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveFile(idx, 'down')}
                            disabled={idx === files.length - 1}
                            className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-white"
                            title="Move Down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => removeFile(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Secret hidden input for 'Add More' */}
              <input
                ref={fileInputRef}
                type="file"
                multiple={tool.multipleFiles}
                accept={tool.acceptedFileTypes.join(',')}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelection(e.target.files);
                  }
                  e.target.value = '';
                }}
                onClick={(e) => e.stopPropagation()}
                className="hidden"
              />
            </div>
          )}

          {/* 2. REAL RESULT DISPLAY CARD */}
          {status === 'completed' && downloadData && (
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-3xl p-6 sm:p-8 space-y-6 animate-fadeIn" id="tool-success-result">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Processing Complete
                    </h3>
                    <p className="text-xs text-emerald-700">
                      Your file is ready for instant download.
                    </p>
                  </div>
                </div>

                {downloadData.savedPercent !== undefined && downloadData.savedPercent > 0 && (
                  <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-extrabold rounded-full shadow-2xs">
                    Saved {downloadData.savedPercent}%
                  </span>
                )}
              </div>

              {/* Preview or Text output */}
              {downloadData.previewUrl && (
                <div className="flex justify-center p-3 bg-white rounded-2xl border border-emerald-200/60 overflow-hidden max-h-72">
                  <img
                    src={downloadData.previewUrl}
                    alt="Processed Preview"
                    className="object-contain max-h-64 rounded-xl"
                  />
                </div>
              )}

              {/* Text Extract Box */}
              {downloadData.textResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Extracted Text Content
                    </span>
                    <button
                      onClick={handleCopyText}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:text-[#0066FF] shadow-2xs transition-colors"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={downloadData.textResult}
                    className="w-full h-44 p-3.5 text-xs font-mono bg-white border border-slate-200 rounded-2xl focus:outline-hidden"
                  />
                </div>
              )}

              {/* Metadata Table */}
              {downloadData.metadata && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block border-b border-slate-100 pb-2">
                    File Specifications
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {Object.entries(downloadData.metadata).map(([k, v]) => (
                      <div key={k} className="p-2 bg-slate-50 rounded-xl">
                        <span className="text-slate-400 font-medium block text-[10px]">{k}</span>
                        <span className="text-slate-800 font-bold">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Specs & Download CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-emerald-200/60">
                <div className="text-xs text-slate-600 space-y-0.5 w-full sm:w-auto">
                  <p className="font-bold text-slate-900 truncate max-w-xs">{downloadData.filename}</p>
                  {downloadData.newSize && (
                    <p className="text-slate-500">
                      Output Size: {(downloadData.newSize / 1024).toFixed(1)} KB
                    </p>
                  )}
                  <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{!includeWatermark ? 'Clean Output (Watermark Removed)' : 'DocMate Stamp Included'}</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  {includeWatermark && (
                    <button
                      onClick={() => {
                        setIncludeWatermark(false);
                        setTimeout(() => handleProcess(), 50);
                      }}
                      className="w-full sm:w-auto px-4 py-3 bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 font-bold text-xs rounded-full transition-all shadow-2xs"
                      title="Re-process file without watermark"
                    >
                      Remove Watermark
                    </button>
                  )}
                  <button
                    onClick={handleDownload}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#0066FF] hover:bg-blue-600 text-white font-bold text-xs rounded-full shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5"
                    id="download-processed-file-btn"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Genuine processing step indicator */}
          {status === 'processing' && (
            <div className="bg-blue-50/80 border border-blue-200/80 rounded-3xl p-6 text-center space-y-3 animate-pulse">
              <RefreshCw className="w-7 h-7 text-[#0066FF] animate-spin mx-auto" />
              <p className="text-xs sm:text-sm font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {processingStep || 'Processing your document...'}
              </p>
              <p className="text-[11px] text-slate-500">
                Processed privately inside your browser environment.
              </p>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Tool Configuration Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders className="w-4 h-4 text-[#0066FF]" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Tool Options
              </h3>
            </div>

            {/* DYNAMIC TOOL CONTROLS */}
            <div className="space-y-4 text-xs">
              
              {/* MERGE PDF */}
              {tool.id === 'merge-pdf' && (
                <div className="space-y-2 text-slate-600">
                  <p className="font-semibold text-slate-900">Merge Order</p>
                  <p className="text-[11px] leading-relaxed">
                    Use the up/down arrow buttons on the files list to rearrange the pages order before merging.
                  </p>
                </div>
              )}

              {/* SPLIT PDF */}
              {tool.id === 'split-pdf' && (
                <div className="space-y-3">
                  <label className="font-bold text-slate-700 block">Split Mode</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={splitRange === 'all'}
                        onChange={() => setSplitRange('all')}
                        className="text-[#0066FF] focus:ring-[#0066FF]"
                      />
                      <span className="font-medium text-slate-800">Extract all pages to individual PDFs (ZIP)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={splitRange !== 'all'}
                        onChange={() => setSplitRange('1-2')}
                        className="text-[#0066FF] focus:ring-[#0066FF]"
                      />
                      <span className="font-medium text-slate-800">Custom page range</span>
                    </label>
                  </div>
                  {splitRange !== 'all' && (
                    <input
                      type="text"
                      value={splitRange}
                      onChange={(e) => setSplitRange(e.target.value)}
                      placeholder="e.g. 1-3, 5, 8-10"
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-xs focus:border-[#0066FF] focus:outline-hidden"
                    />
                  )}
                </div>
              )}

              {/* COMPRESS PDF */}
              {tool.id === 'compress-pdf' && (
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">Compression Profile</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['extreme', 'recommended', 'low'] as const).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setPdfQuality(q)}
                        className={`p-2 rounded-xl text-center capitalize font-bold text-xs border transition-all ${
                          pdfQuality === q
                            ? 'border-[#0066FF] bg-blue-50 text-[#0066FF]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* DELETE PAGES */}
              {tool.id === 'delete-pdf-pages' && (
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">Pages to Delete</label>
                  <input
                    type="text"
                    value={pagesToDelete}
                    onChange={(e) => setPagesToDelete(e.target.value)}
                    placeholder="e.g. 1, 3, 5"
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-xs focus:border-[#0066FF] focus:outline-hidden"
                  />
                  <span className="text-[11px] text-slate-400">Comma-separated page numbers.</span>
                </div>
              )}

              {/* EXTRACT PAGES */}
              {tool.id === 'extract-pdf-pages' && (
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">Pages to Extract</label>
                  <input
                    type="text"
                    value={pagesToExtract}
                    onChange={(e) => setPagesToExtract(e.target.value)}
                    placeholder="e.g. 2, 4, 6"
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-mono text-xs focus:border-[#0066FF] focus:outline-hidden"
                  />
                  <span className="text-[11px] text-slate-400">Comma-separated page numbers to keep.</span>
                </div>
              )}

              {/* ROTATE PDF & ROTATE IMAGE */}
              {(tool.id === 'rotate-pdf' || tool.id === 'rotate-image') && (
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">Rotation Angle</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => setRotationAngle(deg)}
                        className={`p-2.5 rounded-xl font-bold border transition-all ${
                          rotationAngle === deg
                            ? 'border-[#0066FF] bg-blue-50 text-[#0066FF]'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {deg}° CW
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* FLIP IMAGE */}
              {tool.id === 'flip-image' && (
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">Flip Axis</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFlipH(!flipH)}
                      className={`p-2.5 rounded-xl font-bold border transition-all ${
                        flipH ? 'border-[#0066FF] bg-blue-50 text-[#0066FF]' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Horizontal {flipH ? '✓' : ''}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlipV(!flipV)}
                      className={`p-2.5 rounded-xl font-bold border transition-all ${
                        flipV ? 'border-[#0066FF] bg-blue-50 text-[#0066FF]' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      Vertical {flipV ? '✓' : ''}
                    </button>
                  </div>
                </div>
              )}

              {/* ADD TEXT TO PDF */}
              {tool.id === 'add-text-to-pdf' && (
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Annotation Text</label>
                    <input
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:border-[#0066FF] focus:outline-hidden"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Font Size</label>
                      <input
                        type="number"
                        min={10}
                        max={48}
                        value={pdfFontSize}
                        onChange={(e) => setPdfFontSize(Number(e.target.value))}
                        className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:border-[#0066FF]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Color</label>
                      <input
                        type="color"
                        value={pdfTextColor}
                        onChange={(e) => setPdfTextColor(e.target.value)}
                        className="w-full h-9 p-1 border border-slate-200 rounded-xl cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Placement</label>
                    <select
                      value={pdfTextPos}
                      onChange={(e) => setPdfTextPos(e.target.value as any)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs focus:border-[#0066FF]"
                    >
                      <option value="top-center">Top Center Header</option>
                      <option value="center">Middle of Page</option>
                      <option value="bottom-center">Bottom Center Footer</option>
                      <option value="bottom-right">Bottom Right Corner</option>
                      <option value="top-left">Top Left Corner</option>
                    </select>
                  </div>
                </div>
              )}

              {/* WATERMARK PDF */}
              {(tool.id === 'pdf-watermark' || tool.id === 'watermark-pdf') && (
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Watermark Stamp</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl font-bold text-xs focus:border-[#0066FF]"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>Opacity</span>
                      <span>{Math.round(watermarkOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={0.8}
                      step={0.05}
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="w-full accent-[#0066FF]"
                    />
                  </div>
                </div>
              )}

              {/* PAGE NUMBERS PDF */}
              {(tool.id === 'pdf-page-numbers' || tool.id === 'page-numbers-pdf') && (
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Position</label>
                    <select
                      value={pageNumberPos}
                      onChange={(e) => setPageNumberPos(e.target.value as any)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs focus:border-[#0066FF]"
                    >
                      <option value="bottom-center">Bottom Center</option>
                      <option value="bottom-right">Bottom Right</option>
                      <option value="top-center">Top Center</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Format</label>
                    <select
                      value={pageNumberFormat}
                      onChange={(e) => setPageNumberFormat(e.target.value as any)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs focus:border-[#0066FF]"
                    >
                      <option value="Page {n} of {total}">Page 1 of N</option>
                      <option value="Page {n}">Page 1</option>
                      <option value="{n}">1</option>
                    </select>
                  </div>
                </div>
              )}

              {/* PASSWORD PROTECT PDF */}
              {tool.id === 'protect-pdf' && (
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">Set Document Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={pdfPassword}
                      onChange={(e) => setPdfPassword(e.target.value)}
                      placeholder="Enter secret password"
                      className="w-full p-2.5 pr-10 border border-slate-200 rounded-xl text-xs focus:border-[#0066FF] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-[10px] font-bold"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              )}

              {/* RESIZE IMAGE TO EXACT KB */}
              {tool.id === 'resize-image-to-kb' && (
                <div className="space-y-4">
                  {/* File status hint */}
                  {files.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-3 flex items-center justify-between text-xs text-indigo-950">
                      <div>
                        <span className="text-indigo-600 font-bold block text-[11px] uppercase tracking-wider">Original File Size</span>
                        <span className="font-extrabold text-sm">{(files[0].size / 1024).toFixed(1)} KB</span>
                      </div>
                      <div className="text-right">
                        <span className="text-indigo-600 font-bold block text-[11px] uppercase tracking-wider">Target Goal</span>
                        <span className="font-extrabold text-sm text-indigo-700">≤ {targetKB} KB</span>
                      </div>
                    </div>
                  )}

                  {/* Quick Preset Buttons */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5 text-xs">Quick Popular Presets</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { kb: 20, label: '20 KB', desc: 'Signatures / UPSC' },
                        { kb: 50, label: '50 KB', desc: 'Passport Photo' },
                        { kb: 100, label: '100 KB', desc: 'Govt Job Forms' },
                        { kb: 200, label: '200 KB', desc: 'Certificates' },
                        { kb: 500, label: '500 KB', desc: 'Web & Email' },
                        { kb: 1000, label: '1 MB', desc: 'High Res' },
                      ].map((preset) => (
                        <button
                          key={preset.kb}
                          type="button"
                          onClick={() => setTargetKB(preset.kb)}
                          className={`p-2 rounded-xl text-left border transition-all ${
                            targetKB === preset.kb
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-extrabold text-xs">{preset.label}</div>
                          <div className="text-[10px] text-slate-500 truncate">{preset.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Size Number & Slider */}
                  <div>
                    <div className="flex justify-between font-bold text-slate-700 text-xs mb-1">
                      <span>Target Maximum Size (KB)</span>
                      <span className="text-indigo-600 font-extrabold">{targetKB} KB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={5}
                        max={1000}
                        step={5}
                        value={targetKB}
                        onChange={(e) => setTargetKB(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                      <div className="relative w-24 shrink-0">
                        <input
                          type="number"
                          min={2}
                          max={50000}
                          value={targetKB}
                          onChange={(e) => setTargetKB(Math.max(1, Number(e.target.value)))}
                          className="w-full p-1.5 pr-7 border border-slate-200 rounded-xl text-xs font-bold text-right focus:border-indigo-600 focus:outline-hidden"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">KB</span>
                      </div>
                    </div>
                  </div>

                  {/* Mode Selection */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">Size Constraint Mode</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setKbResizeMode('strict_under')}
                        className={`p-2 rounded-xl text-center font-bold text-xs border transition-all ${
                          kbResizeMode === 'strict_under'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Strictly ≤ {targetKB} KB
                      </button>
                      <button
                        type="button"
                        onClick={() => setKbResizeMode('closest')}
                        className={`p-2 rounded-xl text-center font-bold text-xs border transition-all ${
                          kbResizeMode === 'closest'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Closest Match
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {kbResizeMode === 'strict_under'
                        ? 'Guaranteed to stay under the limit so exam/job portals never reject your upload.'
                        : 'Tunes quality to get as close to the target file size as possible.'}
                    </p>
                  </div>

                  {/* Output Format */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-xs">Output Format</label>
                    <select
                      value={kbOutputFormat}
                      onChange={(e) => setKbOutputFormat(e.target.value as any)}
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:border-indigo-600 bg-white"
                    >
                      <option value="image/jpeg">JPG / JPEG (Standard for Govt & Job Portals)</option>
                      <option value="image/webp">WebP (Modern Compact Format)</option>
                      <option value="image/png">PNG (Lossless Graphic)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* IMAGE COMPRESSOR */}
              {tool.id === 'compress-image' && (
                <div className="space-y-3">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Quality Level</span>
                    <span>{imageQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={imageQuality}
                    onChange={(e) => setImageQuality(Number(e.target.value))}
                    className="w-full accent-[#0066FF]"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Smaller Size</span>
                    <span>Higher Quality</span>
                  </div>
                </div>
              )}

              {/* RESIZE IMAGE */}
              {tool.id === 'resize-image' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Width (px)</label>
                      <input
                        type="number"
                        value={resizeWidth}
                        onChange={(e) => setResizeWidth(Number(e.target.value))}
                        className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:border-[#0066FF]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Height (px)</label>
                      <input
                        type="number"
                        value={resizeHeight}
                        onChange={(e) => setResizeHeight(Number(e.target.value))}
                        className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:border-[#0066FF]"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={maintainAspect}
                      onChange={(e) => setMaintainAspect(e.target.checked)}
                      className="rounded-sm text-[#0066FF] focus:ring-[#0066FF]"
                    />
                    <span className="font-medium text-slate-700">Maintain Aspect Ratio</span>
                  </label>
                </div>
              )}

              {/* CROP IMAGE */}
              {tool.id === 'crop-image' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Aspect Ratio Preset</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: 'Freeform', val: 'free' },
                        { label: '1:1 Square', val: '1:1' },
                        { label: '4:3 Standard', val: '4:3' },
                        { label: '16:9 Wide', val: '16:9' },
                        { label: '9:16 Reel', val: '9:16' },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => {
                            setCropRatio(preset.val as any);
                            if (imgNaturalSize) {
                              const nw = imgNaturalSize.width;
                              const nh = imgNaturalSize.height;
                              let targetW = nw;
                              let targetH = nh;
                              if (preset.val === '1:1') {
                                const side = Math.min(nw, nh);
                                targetW = side;
                                targetH = side;
                              } else if (preset.val === '4:3') {
                                targetH = Math.min(nh, Math.round(nw * (3 / 4)));
                                targetW = Math.round(targetH * (4 / 3));
                              } else if (preset.val === '16:9') {
                                targetH = Math.min(nh, Math.round(nw * (9 / 16)));
                                targetW = Math.round(targetH * (16 / 9));
                              } else if (preset.val === '9:16') {
                                targetW = Math.min(nw, Math.round(nh * (9 / 16)));
                                targetH = Math.round(targetW * (16 / 9));
                              }
                              const x = Math.round((nw - targetW) / 2);
                              const y = Math.round((nh - targetH) / 2);
                              setCropX(x);
                              setCropY(y);
                              setCropW(targetW);
                              setCropH(targetH);
                            }
                          }}
                          className={`p-2 rounded-xl text-center font-bold text-[11px] border transition-all ${
                            cropRatio === preset.val
                              ? 'border-[#0066FF] bg-blue-50 text-[#0066FF]'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Crop Boundaries (Pixels)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block">X Offset</span>
                        <input
                          type="number"
                          value={cropX}
                          onChange={(e) => setCropX(Number(e.target.value))}
                          className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:border-[#0066FF]"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Y Offset</span>
                        <input
                          type="number"
                          value={cropY}
                          onChange={(e) => setCropY(Number(e.target.value))}
                          className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:border-[#0066FF]"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Width</span>
                        <input
                          type="number"
                          value={cropW}
                          onChange={(e) => setCropW(Number(e.target.value))}
                          className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:border-[#0066FF]"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Height</span>
                        <input
                          type="number"
                          value={cropH}
                          onChange={(e) => setCropH(Number(e.target.value))}
                          className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:border-[#0066FF]"
                        />
                      </div>
                    </div>
                  </div>
                  {imgNaturalSize && (
                    <p className="text-[10px] text-slate-400">
                      Original image resolution: {imgNaturalSize.width} × {imgNaturalSize.height} px
                    </p>
                  )}
                </div>
              )}

              {/* BLUR / CENSOR SENSOR TOOL */}
              {tool.id === 'blur-image' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Censor Style</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: 'Mosaic / Pixelate', val: 'pixelate' },
                        { label: 'Gaussian Blur', val: 'blur' },
                        { label: 'Blackout Bar', val: 'blackout' },
                      ].map((style) => (
                        <button
                          key={style.val}
                          type="button"
                          onClick={() => setCensorStyle(style.val as any)}
                          className={`p-2 rounded-xl text-center font-bold text-[11px] border transition-all ${
                            censorStyle === style.val
                              ? 'border-[#0066FF] bg-blue-50 text-[#0066FF]'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Sensor Area Preset</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        {
                          label: '🎯 Center Area',
                          action: () => {
                            if (imgNaturalSize) {
                              const w = Math.round(imgNaturalSize.width * 0.5);
                              const h = Math.round(imgNaturalSize.height * 0.5);
                              setCropX(Math.round((imgNaturalSize.width - w) / 2));
                              setCropY(Math.round((imgNaturalSize.height - h) / 2));
                              setCropW(w);
                              setCropH(h);
                            }
                          }
                        },
                        {
                          label: '👤 Face & ID Region',
                          action: () => {
                            if (imgNaturalSize) {
                              const w = Math.round(imgNaturalSize.width * 0.4);
                              const h = Math.round(imgNaturalSize.height * 0.35);
                              setCropX(Math.round((imgNaturalSize.width - w) / 2));
                              setCropY(Math.round(imgNaturalSize.height * 0.15));
                              setCropW(w);
                              setCropH(h);
                            }
                          }
                        },
                        {
                          label: '📄 Bottom Subtitles / Bar',
                          action: () => {
                            if (imgNaturalSize) {
                              setCropX(0);
                              setCropY(Math.round(imgNaturalSize.height * 0.75));
                              setCropW(imgNaturalSize.width);
                              setCropH(Math.round(imgNaturalSize.height * 0.25));
                            }
                          }
                        },
                        {
                          label: '🔲 Full Image Sensor',
                          action: () => {
                            if (imgNaturalSize) {
                              setCropX(0);
                              setCropY(0);
                              setCropW(imgNaturalSize.width);
                              setCropH(imgNaturalSize.height);
                            }
                          }
                        },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={preset.action}
                          className="p-2 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 rounded-xl text-left font-bold text-[11px] text-slate-700 hover:text-[#0066FF] transition-all"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>Sensor Intensity</span>
                      <span>{censorIntensity}px</span>
                    </div>
                    <input
                      type="range"
                      min={6}
                      max={40}
                      value={censorIntensity}
                      onChange={(e) => setCensorIntensity(Number(e.target.value))}
                      className="w-full accent-[#0066FF]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Subtle Obscurity</span>
                      <span>Maximum Censor</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Censor Box Coordinates</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block">X</span>
                        <input
                          type="number"
                          value={cropX}
                          onChange={(e) => setCropX(Number(e.target.value))}
                          className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:border-[#0066FF]"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Y</span>
                        <input
                          type="number"
                          value={cropY}
                          onChange={(e) => setCropY(Number(e.target.value))}
                          className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:border-[#0066FF]"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Width</span>
                        <input
                          type="number"
                          value={cropW}
                          onChange={(e) => setCropW(Number(e.target.value))}
                          className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:border-[#0066FF]"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Height</span>
                        <input
                          type="number"
                          value={cropH}
                          onChange={(e) => setCropH(Number(e.target.value))}
                          className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:border-[#0066FF]"
                        />
                      </div>
                    </div>
                  </div>
                  {imgNaturalSize && (
                    <p className="text-[10px] text-slate-400">
                      Resolution: {imgNaturalSize.width} × {imgNaturalSize.height} px
                    </p>
                  )}
                </div>
              )}

              {/* PASSPORT PHOTO */}
              {tool.id === 'passport-photo' && (
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Standard Size</label>
                    <select
                      value={passportStandard}
                      onChange={(e) => setPassportStandard(e.target.value as any)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs focus:border-[#0066FF]"
                    >
                      <option value="US_2x2">US / India (2x2 inch / 51x51mm)</option>
                      <option value="EU_35x45">Europe / UK / Schengen (35x45mm)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Sheet Copies</label>
                    <input
                      type="number"
                      min={2}
                      max={8}
                      value={passportCopies}
                      onChange={(e) => setPassportCopies(Number(e.target.value))}
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs focus:border-[#0066FF]"
                    />
                  </div>
                </div>
              )}

              {/* REMOVE BACKGROUND */}
              {tool.id === 'remove-background' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Replacement Background</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['transparent', 'white', 'blue', 'black', 'green'] as const).map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setBgRemoveColor(bg)}
                          className={`p-2 rounded-xl text-center capitalize font-bold text-xs border transition-all ${
                            bgRemoveColor === bg
                              ? 'border-[#0066FF] bg-blue-50 text-[#0066FF]'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {bg}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>Edge Sensitivity / Tolerance</span>
                      <span>{bgTolerance}</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={70}
                      value={bgTolerance}
                      onChange={(e) => setBgTolerance(Number(e.target.value))}
                      className="w-full accent-[#0066FF]"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Conservative</span>
                      <span>Aggressive Isolation</span>
                    </div>
                  </div>
                </div>
              )}

              {/* IMAGES TO PDF */}
              {(tool.id === 'jpg-to-pdf' || tool.id === 'png-to-pdf' || tool.id === 'images-to-pdf' || tool.id === 'image-to-pdf') && (
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Orientation</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPdfOrientation('portrait')}
                        className={`p-2 rounded-xl font-bold border transition-all ${
                          pdfOrientation === 'portrait' ? 'border-[#0066FF] bg-blue-50 text-[#0066FF]' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Portrait
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdfOrientation('landscape')}
                        className={`p-2 rounded-xl font-bold border transition-all ${
                          pdfOrientation === 'landscape' ? 'border-[#0066FF] bg-blue-50 text-[#0066FF]' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Landscape
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Page Format</label>
                    <select
                      value={pdfPageSize}
                      onChange={(e) => setPdfPageSize(e.target.value as any)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-xs focus:border-[#0066FF]"
                    >
                      <option value="a4">A4 Standard</option>
                      <option value="letter">US Letter</option>
                    </select>
                  </div>
                </div>
              )}

            </div>

            {/* PROCESS ACTION BUTTON */}
            <div className="pt-2">
              <button
                onClick={handleProcess}
                disabled={files.length === 0 || status === 'processing'}
                className="w-full py-3.5 px-6 bg-[#0066FF] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                id="tool-process-submit-btn"
              >
                {status === 'processing' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing File...</span>
                  </>
                ) : (
                  <>
                    <span>Convert / Process File</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* FREE WATERMARK CONTROLS */}
            <div className="pt-3 border-t border-slate-100 space-y-3" id="watermark-options-panel">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Watermark Setting</span>
                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                  !includeWatermark ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {!includeWatermark ? '✓ No Watermark' : 'Stamp Active'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setIncludeWatermark(false)}
                  className={`p-2.5 rounded-xl text-center font-bold text-[11px] border transition-all flex flex-col items-center gap-1 ${
                    !includeWatermark
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-700 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  id="watermark-remove-toggle-btn"
                >
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>No Watermark</span>
                  </span>
                  <span className="text-[9px] text-emerald-600 font-semibold">100% Clean (Free)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeWatermark(true)}
                  className={`p-2.5 rounded-xl text-center font-bold text-[11px] border transition-all flex flex-col items-center gap-1 ${
                    includeWatermark
                      ? 'border-[#0066FF] bg-blue-50 text-[#0066FF] shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  id="watermark-add-toggle-btn"
                >
                  <span>Include Stamp</span>
                  <span className="text-[9px] text-slate-400 font-normal">Subtle DocMate Mark</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed text-center">
                {!includeWatermark 
                  ? '✨ Watermark removed. Your files will download with zero branding.'
                  : 'DocMate stamp will appear in the subtle corner of your output.'}
              </p>
            </div>

          </div>

          {/* Clean In-Workspace Ad Slot */}
          <AdSlot format="horizontal" />
        </div>

      </div>

    </div>
  );
};
