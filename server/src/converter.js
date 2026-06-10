// server/src/converter.js
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const mammoth = require('mammoth');
const { PDFDocument } = require('pdf-lib');
const XLSX = require('xlsx');

ffmpeg.setFfmpegPath(ffmpegPath);

const UPLOADS_DIR = path.join(__dirname, '../uploads');
const OUTPUTS_DIR = path.join(__dirname, '../outputs');

// Make sure outputs folder exists
if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR, { recursive: true });

// ── Images ────────────────────────────────────────────────────────────────────
async function convertImage(sourcePath, targetFormat) {
  const outFile = path.join(OUTPUTS_DIR, path.basename(sourcePath, path.extname(sourcePath)) + '.' + targetFormat);
  await sharp(sourcePath).toFormat(targetFormat).toFile(outFile);
  return outFile;
}

// ── Audio / Video ─────────────────────────────────────────────────────────────
function convertMedia(sourcePath, targetFormat) {
  return new Promise((resolve, reject) => {
    const outFile = path.join(OUTPUTS_DIR, path.basename(sourcePath, path.extname(sourcePath)) + '.' + targetFormat);
    ffmpeg(sourcePath)
      .toFormat(targetFormat)
      .on('end', () => resolve(outFile))
      .on('error', reject)
      .save(outFile);
  });
}

// ── DOCX → TXT ────────────────────────────────────────────────────────────────
async function docxToTxt(sourcePath) {
  const outFile = path.join(OUTPUTS_DIR, path.basename(sourcePath, '.docx') + '.txt');
  const result = await mammoth.extractRawText({ path: sourcePath });
  fs.writeFileSync(outFile, result.value);
  return outFile;
}

// ── DOCX → PDF (basic — embeds text as a simple PDF) ─────────────────────────
async function docxToPdf(sourcePath) {
  const txtResult = await mammoth.extractRawText({ path: sourcePath });
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { height } = page.getSize();
  page.drawText(txtResult.value.slice(0, 2000), { x: 50, y: height - 60, size: 11, maxWidth: 500, lineHeight: 16 });
  const pdfBytes = await pdfDoc.save();
  const outFile = path.join(OUTPUTS_DIR, path.basename(sourcePath, '.docx') + '.pdf');
  fs.writeFileSync(outFile, pdfBytes);
  return outFile;
}

// ── CSV ↔ XLSX ────────────────────────────────────────────────────────────────
function convertSpreadsheet(sourcePath, targetFormat) {
  const wb = XLSX.readFile(sourcePath);
  const outFile = path.join(OUTPUTS_DIR, path.basename(sourcePath, path.extname(sourcePath)) + '.' + targetFormat);
  XLSX.writeFile(wb, outFile);
  return outFile;
}

// ── Main dispatcher ───────────────────────────────────────────────────────────
async function convert(sourcePath, sourceMime, targetFormat) {
  const fmt = targetFormat.toLowerCase();

  // Images
  if (sourceMime.startsWith('image/') && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(fmt)) {
    return convertImage(sourcePath, fmt === 'jpg' ? 'jpeg' : fmt);
  }

  // Audio
  if (sourceMime.startsWith('audio/') && ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(fmt)) {
    return convertMedia(sourcePath, fmt);
  }

  // Video
  if (sourceMime.startsWith('video/') && ['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(fmt)) {
    return convertMedia(sourcePath, fmt);
  }

  // DOCX → TXT
  if (sourceMime.includes('wordprocessingml') && fmt === 'txt') {
    return docxToTxt(sourcePath);
  }

  // DOCX → PDF
  if (sourceMime.includes('wordprocessingml') && fmt === 'pdf') {
    return docxToPdf(sourcePath);
  }

  // Spreadsheets
  if ((sourceMime.includes('spreadsheet') || sourceMime === 'text/csv') && ['csv', 'xlsx', 'xls'].includes(fmt)) {
    return convertSpreadsheet(sourcePath, fmt);
  }

  throw new Error(`Unsupported conversion: ${sourceMime} → ${targetFormat}`);
}

module.exports = { convert };
