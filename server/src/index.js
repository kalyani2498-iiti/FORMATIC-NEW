require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const uploadRouter = require('./upload');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Formatic server is running' });
});

app.use('/api/upload', uploadRouter);

app.get('/api/status/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM conversions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({
    id: row.id,
    status: row.status,
    originalName: row.original_name,
    targetFormat: row.target_format,
    error: row.error || null,
    expiresAt: row.expires_at,
  });
});

app.get('/api/download/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM conversions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (row.status !== 'done') return res.status(400).json({ error: 'File is not ready (status: ' + row.status + ')' });
  if (!fs.existsSync(row.output_path)) return res.status(404).json({ error: 'Output file missing' });

  const ext = path.extname(row.output_path);
  const downloadName = path.basename(row.original_name, path.extname(row.original_name)) + ext;
  res.download(row.output_path, downloadName);
});

app.use(express.static(path.join(__dirname, '../../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT);
});

