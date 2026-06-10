import { useState } from 'react'
import Dropzone from './components/Dropzone'
import ConversionList from './components/ConversionList'

export default function App() {
  const [conversions, setConversions] = useState([])

  return (
    <div style={{ minHeight: '100vh', background: '#07070e', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflowX: 'hidden' }}>

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '500px', background: 'radial-gradient(ellipse, rgba(109,40,217,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '300px', height: '300px', background: 'radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '5%', right: '10%', width: '250px', height: '250px', background: 'radial-gradient(ellipse, rgba(168,85,247,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <header style={{ position: 'relative', zIndex: 10, borderBottom: '0.5px solid rgba(255,255,255,0.06)', padding: '0 2.5rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(12px)', background: 'rgba(7,7,14,0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #6d28d9, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}>F</div>
          <span style={{ fontSize: '17px', fontWeight: '600', letterSpacing: '-0.4px', color: '#fff' }}>Formatic</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px rgba(34,197,94,0.6)' }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: '500' }}>Universal Converter</span>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '680px', margin: '0 auto', padding: '5rem 1.5rem 4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139,92,246,0.1)', border: '0.5px solid rgba(139,92,246,0.25)', borderRadius: '100px', padding: '4px 12px', marginBottom: '20px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }} />
            <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Free · Fast · Private</span>
          </div>
          <h1 style={{ fontSize: '52px', fontWeight: '700', letterSpacing: '-2px', lineHeight: '1.05', margin: '0 0 16px', color: '#fff' }}>
            Convert{' '}
            <span style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>anything</span>
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.38)', margin: 0, lineHeight: '1.6', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            Images, audio, video, documents, spreadsheets — converted instantly in your browser
          </p>
        </div>

        <Dropzone onConversionsQueued={c => setConversions(prev => [...c, ...prev])} />

        {conversions.length > 0 && (
          <div style={{ marginTop: '2.5rem' }}>
            <ConversionList conversions={conversions} />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '4rem' }}>
          {[['🖼', 'Images'], ['🎵', 'Audio'], ['🎬', 'Video'], ['📄', 'Docs'], ['📊', 'Sheets']].map(function(item) {
            return (
              <div key={item[1]} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: 0.4 }}>
                <span style={{ fontSize: '20px' }}>{item[0]}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>{item[1]}</span>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}


