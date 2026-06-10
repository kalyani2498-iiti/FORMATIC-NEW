const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const db = require('./db');

const router = express.Router();

const ALLOWED_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/html',
  'text/plain',
  'text/markdown',
  'video/mp4',
  'audio/mpeg',
  'audio/wav',
]);

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

router.post('/', upload.array('files', 20), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No valid files uploaded' });
  }

  const results = req.files.map(file => {
    const id = uuidv4();
    const now = Date.now();
    const expiresAt = now + 30 * 60 * 1000;

    db.prepare(`
      INSERT INTO conversions
        (id, original_name, source_path, source_mime,
         source_size, target_format, status, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, 'queued', ?, ?)
    `).run(
      id,
      file.originalname,
      file.path,
      file.mimetype,
      file.size,
      req.body.targetFormat || 'unknown',
      now,
      expiresAt
    );

    return {
      id,
      originalName: file.originalname,
      size: file.size,
      expiresAt,
    };
  });

  res.json({ conversions: results });
});

module.exports = router;
