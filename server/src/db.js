
const Database = require('better-sqlite3');
const path = require('path');

// This opens (or creates) the database file at server/data/formatic.db
const db = new Database(path.join(__dirname, '../data/formatic.db'));

// Create the conversions table if it doesn't exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS conversions (
    id TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    source_path TEXT NOT NULL,
    source_mime TEXT NOT NULL,
    source_size INTEGER NOT NULL,
    target_format TEXT NOT NULL,
    output_path TEXT,
    output_size INTEGER,
    status TEXT NOT NULL DEFAULT 'queued',
    error_msg TEXT,
    created_at INTEGER NOT NULL,
    converted_at INTEGER,
    purged_at INTEGER,
    download_token TEXT,
    expires_at INTEGER NOT NULL
  );
`);

console.log('Database ready');
module.exports = db;