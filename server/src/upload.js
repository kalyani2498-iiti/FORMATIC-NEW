// server/src/upload.js
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const { convert } = require('./converter');
const router = express.Router();

const ALLOWED_MIMES = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'text/csv',
  'video/mp4', 'video/avi', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
]);

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, ALLOWED_MIMES.has(file.mimetype));
  },
});

// POST /api/upload — receive files, queue them
router.post('/', upload.array('files', 20), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No valid files uploaded' });
  }
  const targetFormat = req.body.targetFormat || 'unknown';
  const now = Date.now();
  const expiresAt = now + 30 * 60 * 1000;

  const results = req.files.map(file => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO conversions
        (id, original_name, source_path, source_mime,
         source_size, target_format, status, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, 'queued', ?, ?)
    `).run(id, file.originalname, file.path, file.mimetype, file.size, targetFormat, now, expiresAt);
    return { id, originalName: file.originalname, size: file.size, expiresAt };
  });

  res.json({ conversions: results });
});

// POST /api/upload/convert/:id — trigger conversion for a queued file
router.post('/convert/:id', async (req, res) => {
  const row = db.prepare('SELECT * FROM conversions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Conversion not found' });
  if (row.status === 'done') return res.json({ status: 'done', outputPath: row.output_path });
  if (row.status === 'processing') return res.json({ status: 'processing' });

  db.prepare('UPDATE conversions SET status = ? WHERE id = ?').run('processing', row.id);

  try {
    const outputPath = await convert(row.source_path, row.source_mime, row.target_format);
    db.prepare('UPDATE conversions SET status = ?, output_path = ? WHERE id = ?')
      .run('done', outputPath, row.id);
    res.json({ status: 'done', id: row.id });
  } catch (err) {
    db.prepare('UPDATE conversions SET status = ?, error = ? WHERE id = ?')
      .run('error', err.message, row.id);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
