require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const uploadRouter = require('./upload');
const { convert } = require('./converter');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Formatic server is running' });
});

app.use('/api/upload', uploadRouter);

// ── Trigger conversion ─────────────────────────────────────────────────────
app.post('/api/convert/:id', async (req, res) => {
  const row = db.prepare('SELECT * FROM conversions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (row.status === 'done') return res.json({ status: 'done' });

  // Mark as converting immediately
  db.prepare("UPDATE conversions SET status = 'converting' WHERE id = ?").run(row.id);
  res.json({ status: 'converting' });

  // Run conversion in background
  try {
    const outputPath = await convert(row.source_path, row.source_mime, row.target_format);
    const size = fs.statSync(outputPath).size;
    db.prepare(`
      UPDATE conversions
      SET status = 'done', output_path = ?, output_size = ?, converted_at = ?
      WHERE id = ?
    `).run(outputPath, size, Date.now(), row.id);
  } catch (err) {
    console.error('Conversion error:', err.message);
    db.prepare(`
      UPDATE conversions
      SET status = 'error', error_msg = ?
      WHERE id = ?
    `).run(err.message, row.id);
  }
});

// ── Check status ───────────────────────────────────────────────────────────
app.get('/api/status/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM conversions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({
    id: row.id,
    status: row.status,
    originalName: row.original_name,
    targetFormat: row.target_format,
    error: row.error_msg || null,
    expiresAt: row.expires_at,
  });
});

// ── Download converted file ────────────────────────────────────────────────
app.get('/api/download/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM conversions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (row.status !== 'done') return res.status(400).json({ error: 'File not ready' });
  if (!fs.existsSync(row.output_path)) return res.status(404).json({ error: 'Output file missing' });

  const ext = path.extname(row.output_path);
  const downloadName = path.basename(row.original_name, path.extname(row.original_name)) + ext;
  res.download(row.output_path, downloadName);
});

app.use(express.static(path.join(__dirname, '../../client/dist')));

app.use((req, res) => {
  const indexPath = path.join(__dirname, '../../client/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Client not built yet' });
  }
});

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
});
