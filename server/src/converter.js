
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const mammoth = require('mammoth');
const { PDFDocument } = require('pdf-lib');
const XLSX = require('xlsx');

ffmpeg.setFfmpegPath(ffmpegPath);

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const OUTPUTS_DIR = path.join(__dirname, '../outputs');

if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR, { recursive: true });

// ── Images ────────────────────────────────────────────────────────────────────
async function convertImage(sourcePath, targetFormat) {
  const base = path.basename(sourcePath, path.extname(sourcePath));
  const outFile = path.join(OUTPUTS_DIR, base + '.' + targetFormat);
  await sharp(sourcePath).toFormat(targetFormat === 'jpg' ? 'jpeg' : targetFormat).toFile(outFile);
  return outFile;
}

// ── Audio / Video ─────────────────────────────────────────────────────────────
function convertMedia(sourcePath, targetFormat) {
  return new Promise((resolve, reject) => {
    const base = path.basename(sourcePath, path.extname(sourcePath));
    const outFile = path.join(OUTPUTS_DIR, base + '.' + targetFormat);
    ffmpeg(sourcePath)
      .toFormat(targetFormat)
      .on('end', () => resolve(outFile))
      .on('error', reject)
      .save(outFile);
  });
}

// ── LibreOffice conversion (DOCX/PDF → PDF/TXT/DOCX) ─────────────────────────
function convertWithLibreOffice(sourcePath, targetFormat) {
  try {
    const cmd = 'libreoffice --headless --convert-to ' + targetFormat + ' --outdir "' + OUTPUTS_DIR + '" "' + sourcePath + '"';
    execSync(cmd, { timeout: 60000 });
    const base = path.basename(sourcePath, path.extname(sourcePath));
    const outFile = path.join(OUTPUTS_DIR, base + '.' + targetFormat);
    if (fs.existsSync(outFile)) return outFile;
    throw new Error('LibreOffice output file not found');
  } catch (err) {
    throw new Error('LibreOffice conversion failed: ' + err.message);
  }
}

// ── DOCX → TXT fallback ───────────────────────────────────────────────────────
async function docxToTxt(sourcePath) {
  const base = path.basename(sourcePath, path.extname(sourcePath));
  const outFile = path.join(OUTPUTS_DIR, base + '.txt');
  const result = await mammoth.extractRawText({ path: sourcePath });
  fs.writeFileSync(outFile, result.value);
  return outFile;
}

// ── DOCX → PDF fallback (basic) ───────────────────────────────────────────────
async function docxToPdfFallback(sourcePath) {
  const txtResult = await mammoth.extractRawText({ path: sourcePath });
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { height } = page.getSize();
  page.drawText(txtResult.value.slice(0, 3000), {
    x: 50, y: height - 60, size: 11, maxWidth: 500, lineHeight: 16,
  });
  const pdfBytes = await pdfDoc.save();
  const base = path.basename(sourcePath, path.extname(sourcePath));
  const outFile = path.join(OUTPUTS_DIR, base + '.pdf');
  fs.writeFileSync(outFile, pdfBytes);
  return outFile;
}

// ── Spreadsheets ──────────────────────────────────────────────────────────────
function convertSpreadsheet(sourcePath, targetFormat) {
  const base = path.basename(sourcePath, path.extname(sourcePath));
  const outFile = path.join(OUTPUTS_DIR, base + '.' + targetFormat);
  const wb = XLSX.readFile(sourcePath);
  XLSX.writeFile(wb, outFile);
  return outFile;
}

// ── Check if LibreOffice is available ────────────────────────────────────────
function hasLibreOffice() {
  try {
    execSync('libreoffice --version', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

// ── Main dispatcher ───────────────────────────────────────────────────────────
async function convert(sourcePath, sourceMime, targetFormat) {
  const fmt = targetFormat.toLowerCase();
  const libreAvailable = hasLibreOffice();

  // Images
  if (sourceMime.startsWith('image/') && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(fmt)) {
    return convertImage(sourcePath, fmt);
  }

  // Audio
  if (sourceMime.startsWith('audio/') && ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(fmt)) {
    return convertMedia(sourcePath, fmt);
  }

  // Video
  if (sourceMime.startsWith('video/') && ['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(fmt)) {
    return convertMedia(sourcePath, fmt);
  }

  // DOCX → PDF
  if (sourceMime.includes('wordprocessingml') && fmt === 'pdf') {
    if (libreAvailable) return convertWithLibreOffice(sourcePath, 'pdf');
    return docxToPdfFallback(sourcePath);
  }

  // DOCX → TXT
  if (sourceMime.includes('wordprocessingml') && fmt === 'txt') {
    return docxToTxt(sourcePath);
  }

  // PDF → anything (LibreOffice)
  if (sourceMime === 'application/pdf' && libreAvailable) {
    return convertWithLibreOffice(sourcePath, fmt);
  }

  // Spreadsheets
  if ((sourceMime.includes('spreadsheet') || sourceMime === 'text/csv') && ['csv', 'xlsx', 'xls'].includes(fmt)) {
    return convertSpreadsheet(sourcePath, fmt);
  }

  throw new Error('Unsupported conversion: ' + sourceMime + ' to ' + targetFormat);
}

module.exports = { convert };

