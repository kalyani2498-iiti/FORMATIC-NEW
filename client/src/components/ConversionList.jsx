import { useEffect, useState } from 'react'
import axios from 'axios'

function ProgressBar({ status }) {
  const width = status === 'queued' ? '10%' : status === 'processing' ? '60%' : status === 'done' ? '100%' : '100%'
  const color = status === 'done' ? '#22c55e' : status === 'error' ? '#ef4444' : '#8b5cf6'
  return (
    <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden', marginTop: '8px' }}>
      <div style={{ height: '100%', width: width, background: color, borderRadius: '99px', transition: 'width 0.6s ease, background 0.3s ease' }} />
    </div>
  )
}

function ConversionItem({ conversion }) {
  const [status, setStatus] = useState('queued')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function run() {
      try {
        await axios.post('/api/upload/convert/' + conversion.id)
        const poll = setInterval(async () => {
          const res = await axios.get('/api/status/' + conversion.id)
          const d = res.data
          setStatus(d.status)
          if (d.status === 'done' || d.status === 'error') {
            clearInterval(poll)
            if (d.error) setErrorMsg(d.error)
          }
        }, 1500)
      } catch (e) {
        setStatus('error')
        setErrorMsg('Conversion failed')
      }
    }
    run()
  }, [conversion.id])

  const statusConfig = {
    queued: { label: 'Queued', color: 'rgba(255,255,255,0.3)' },
    processing: { label: 'Converting...', color: '#a78bfa' },
    done: { label: 'Done', color: '#22c55e' },
    error: { label: 'Failed', color: '#f87171' },
  }

  const cfg = statusConfig[status] || statusConfig.queued
  const downloadUrl = '/api/download/' + conversion.id

  const dotIndex = conversion.originalName.lastIndexOf('.')
  const ext = dotIndex >= 0 ? conversion.originalName.slice(dotIndex + 1) : ''
  const nameWithoutExt = dotIndex >= 0 ? conversion.originalName.slice(0, dotIndex) : conversion.originalName

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid ' + (status === 'done' ? 'rgba(34,197,94,0.2)' : status === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'), borderRadius: '12px', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nameWithoutExt}</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}>.{ext}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            {status === 'processing' && (
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa', animation: 'pulse 1.2s infinite' }} />
            )}
            <span style={{ fontSize: '12px', color: cfg.color, fontWeight: '500' }}>{cfg.label}</span>
            {errorMsg && <span style={{ fontSize: '12px', color: 'rgba(248,113,113,0.7)' }}>-- {errorMsg}</span>}
          </div>
        </div>

        {status === 'done' && (
          <a
            href={downloadUrl}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', background: 'rgba(34,197,94,0.12)', border: '0.5px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}
          >
            Download
          </a>
        )}
      </div>
      <ProgressBar status={status} />
    </div>
  )
}

export default function ConversionList({ conversions }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Conversions</span>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>{conversions.length} file{conversions.length !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {conversions.map(function(c) {
          return <ConversionItem key={c.id} conversion={c} />
        })}
      </div>
      <style>{'.pulse { animation: pulse 1.2s infinite } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }'}</style>
    </div>
  )
}

