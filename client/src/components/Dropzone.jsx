import { useRef, useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const FORMAT_OPTIONS = {
  image: ['jpg', 'png', 'webp', 'gif', 'bmp'],
  audio: ['mp3', 'wav', 'ogg'],
  video: ['mp4', 'avi', 'mov'],
  document: ['pdf', 'txt'],
  spreadsheet: ['xlsx', 'csv'],
}

const CATEGORY_META = {
  image: { icon: '🖼', label: 'Image' },
  audio: { icon: '🎵', label: 'Audio' },
  video: { icon: '🎬', label: 'Video' },
  document: { icon: '📄', label: 'Document' },
  spreadsheet: { icon: '📊', label: 'Spreadsheet' },
}

function getCategory(mime) {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('video/')) return 'video'
  if (mime.includes('wordprocessingml') || mime === 'application/pdf' || mime === 'text/plain') return 'document'
  if (mime.includes('spreadsheet') || mime === 'text/csv') return 'spreadsheet'
  return null
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function Dropzone({ onConversionsQueued }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState([])
  const [targetFormat, setTargetFormat] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const category = files.length > 0 ? getCategory(files[0].type) : null
  const formats = category ? FORMAT_OPTIONS[category] : []
  const meta = category ? CATEGORY_META[category] : null

  function handleFiles(incoming) {
    setFiles(Array.from(incoming))
    setTargetFormat('')
    setError('')
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  function removeFile(index) {
    const next = files.filter(function(_, i) { return i !== index })
    setFiles(next)
    if (next.length === 0) setTargetFormat('')
  }

  async function handleConvert() {
    if (!files.length) return setError('Please select a file.')
    if (!targetFormat) return setError('Please choose a target format.')
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      files.forEach(function(f) { fd.append('files', f) })
      fd.append('targetFormat', targetFormat)
      const res = await axios.post(`${API_BASE}/api/upload`, fd)
      onConversionsQueued(res.data.conversions)
      setFiles([])
      setTargetFormat('')
    } catch (e) {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div
        onClick={function() { if (!files.length) inputRef.current.click() }}
        onDragOver={function(e) { e.preventDefault(); setDragging(true) }}
        onDragLeave={function() { setDragging(false) }}
        onDrop={onDrop}
        style={{
          border: '1px solid ' + (dragging ? 'rgba(139,92,246,0.7)' : files.length > 0 ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.07)'),
          borderRadius: '20px',
          padding: files.length ? '1.75rem' : '4rem 2rem',
          textAlign: 'center',
          cursor: files.length ? 'default' : 'pointer',
          transition: 'all 0.25s ease',
          background: dragging ? 'rgba(109,40,217,0.07)' : files.length ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.015)',
          backdropFilter: 'blur(8px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {dragging && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(109,40,217,0.05)', borderRadius: '20px', pointerEvents: 'none' }} />
        )}

        <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={function(e) { handleFiles(e.target.files) }} />

        {files.length === 0 ? (
          <div>
            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(109,40,217,0.15)', border: '0.5px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 6v12M8 12l6-6 6 6" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 20h18" stroke="rgba(167,139,250,0.5)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ fontSize: '17px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
              Drop files here or click to browse
            </p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>
              Images · Audio · Video · Documents · Spreadsheets · up to 100 MB
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>{meta && meta.icon}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{meta && meta.label}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>{files.length} file{files.length !== 1 ? 's' : ''}</span>
              </div>
              <button
                onClick={function() { inputRef.current.click() }}
                style={{ fontSize: '12px', color: '#a78bfa', background: 'rgba(139,92,246,0.1)', border: '0.5px solid rgba(139,92,246,0.25)', borderRadius: '6px', cursor: 'pointer', padding: '4px 10px', fontWeight: '500' }}
              >
                + Add more
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' }}>
              {files.map(function(f, i) {
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '9px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '13px' }}>{meta && meta.icon}</span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>{formatBytes(f.size)}</p>
                      </div>
                    </div>
                    <button onClick={function() { removeFile(i) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', fontSize: '18px', padding: '0 0 0 10px', lineHeight: 1, flexShrink: 0 }}>x</button>
                  </div>
                )
              })}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>Convert to</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
                  {formats.map(function(f) {
                    const active = targetFormat === f
                    return (
                      <button
                        key={f}
                        onClick={function() { setTargetFormat(f) }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '100px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          border: active ? '1px solid rgba(167,139,250,0.6)' : '0.5px solid rgba(255,255,255,0.1)',
                          background: active ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
                          color: active ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
                          transition: 'all 0.15s',
                          letterSpacing: '0.02em',
                        }}
                      >
                        .{f.toUpperCase()}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={handleConvert}
                  disabled={uploading || !targetFormat}
                  style={{
                    padding: '9px 22px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: uploading || !targetFormat ? 'not-allowed' : 'pointer',
                    border: 'none',
                    background: uploading || !targetFormat ? 'rgba(109,40,217,0.2)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    color: uploading || !targetFormat ? 'rgba(255,255,255,0.3)' : '#fff',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: !uploading && targetFormat ? '0 0 20px rgba(139,92,246,0.35)' : 'none',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {uploading ? 'Uploading...' : 'Convert'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
          <span style={{ fontSize: '13px', color: '#f87171' }}>{error}</span>
        </div>
      )}
    </div>
  )
}
