'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MODES = [
  { id: 'ssc_english', label: 'SSC CGL', sub: 'English · 2 min', lang: 'en', icon: '🏛', color: '#7c5cbf', desc: 'Staff Selection Commission — formal English passages' },
  { id: 'court_english', label: 'High Court', sub: 'English · 5 min', lang: 'en', icon: '⚖️', color: '#2563eb', desc: 'High Court typist exam — legal English passages' },
  { id: 'ldc_hindi', label: 'LDC Hindi', sub: 'Hindi · 2 min', lang: 'hi', icon: '🇮🇳', color: '#16a34a', desc: 'Lower Division Clerk — Hindi Devanagari passages' },
  { id: 'ssc_hindi', label: 'SSC Hindi', sub: 'Hindi · 2 min', lang: 'hi', icon: '📋', color: '#d97706', desc: 'SSC Hindi typing — Devanagari script passages' },
  { id: 'free_english', label: 'Free Practice', sub: 'English · 1 min', lang: 'en', icon: '⚡', color: '#9d7de8', desc: 'General English practice — everyday passages' },
]

const STATS = [
  { label: 'Test takers today', value: '12,847' },
  { label: 'Avg WPM on SSC', value: '38' },
  { label: 'Top score this week', value: '94 WPM' },
]

export default function HomePage() {
  const router = useRouter()
  const [selected, setSelected] = useState('ssc_english')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0 0 60px' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>⌨️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--purple3)', letterSpacing: '-0.3px' }}>TypeIndia</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.1em' }}>TYPING SPEED TEST</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['SSC', '#7c5cbf'], ['LDC', '#16a34a'], ['Hindi', '#d97706']].map(([l, c]) => (
            <span key={l} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, border: `1px solid ${c}44`, color: c, background: `${c}15` }}>{l}</span>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px 0' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.3em', color: 'var(--text3)', marginBottom: 14, textTransform: 'uppercase' }}>Free · No Login · Instant Results</div>
          <h1 style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 16 }}>
            <span style={{ background: 'linear-gradient(135deg,#c4a8ff,#9d7de8,#7c5cbf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Typing Speed Test</span>
            <br /><span style={{ color: 'var(--text)' }}>for Indian Exams</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text2)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
            Practice for SSC CGL, LDC, High Court typist exams in English and Hindi. Real exam passages, accurate WPM tracking.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 40 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--purple2)', fontFamily: "'JetBrains Mono',monospace" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mode selector */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 14, letterSpacing: '0.05em' }}>SELECT EXAM MODE</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
            {MODES.map(m => (
              <div key={m.id} onClick={() => setSelected(m.id)}
                style={{ padding: '18px 16px', borderRadius: 14, border: `2px solid ${selected === m.id ? m.color : 'var(--border)'}`, background: selected === m.id ? `${m.color}18` : 'var(--card)', cursor: 'pointer', transition: 'all .18s', position: 'relative' }}>
                {selected === m.id && <div style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: '50%', background: m.color, boxShadow: `0 0 8px ${m.color}` }} />}
                <div style={{ fontSize: 24, marginBottom: 8 }}>{m.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{m.sub}</div>
              </div>
            ))}
          </div>
          {selected && (
            <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text3)', padding: '10px 14px', background: 'var(--bg3)', borderRadius: 8, borderLeft: `3px solid ${MODES.find(m=>m.id===selected)?.color}` }}>
              {MODES.find(m => m.id === selected)?.desc}
            </div>
          )}
        </div>

        {/* Start button */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <button onClick={() => router.push('/test?mode=' + selected)}
            style={{ padding: '16px 48px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#7c5cbf,#9d7de8)', color: 'white', fontSize: 18, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.3px', boxShadow: '0 4px 24px rgba(124,92,191,.4)', transition: 'transform .15s, box-shadow .15s' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.transform = 'translateY(-2px)'; (e.target as HTMLElement).style.boxShadow = '0 8px 32px rgba(124,92,191,.5)' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'none'; (e.target as HTMLElement).style.boxShadow = '0 4px 24px rgba(124,92,191,.4)' }}>
            Start Typing Test ⌨️
          </button>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)' }}>Press Enter to start · Esc to restart</div>
        </div>

        {/* Tips */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
          {[
            ['📊', 'Live WPM tracking', 'See your words per minute update in real time as you type'],
            ['🎯', 'Accuracy meter', 'Track your error rate and net WPM (accuracy-adjusted)'],
            ['🏆', 'Weekly leaderboard', 'Compare your score with other aspirants this week'],
            ['🔄', 'AI passages', 'Fresh exam-style passages generated every session'],
          ].map(([icon, title, desc]) => (
            <div key={title as string} style={{ padding: '18px', borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 5 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
