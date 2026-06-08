'use client'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const MODE_CONFIG: Record<string, { label: string; duration: number; lang: string; color: string }> = {
  ssc_english:   { label: 'SSC CGL',    duration: 120, lang: 'en', color: '#7c5cbf' },
  court_english: { label: 'High Court', duration: 300, lang: 'en', color: '#2563eb' },
  ldc_hindi:     { label: 'LDC Hindi',  duration: 120, lang: 'hi', color: '#16a34a' },
  ssc_hindi:     { label: 'SSC Hindi',  duration: 120, lang: 'hi', color: '#d97706' },
  free_english:  { label: 'Practice',   duration: 60,  lang: 'en', color: '#9d7de8' },
}

function calcStats(passage: string, typed: string, elapsed: number) {
  const minutes = Math.max(elapsed / 60, 0.01)
  let errors = 0
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] !== passage[i]) errors++
  }
  const rawWpm = Math.round((typed.trim().split(/\s+/).filter(Boolean).length) / minutes)
  const accuracy = typed.length > 0 ? Math.round(((typed.length - errors) / typed.length) * 100) : 100
  const netWpm = Math.round(rawWpm * (accuracy / 100))
  return { rawWpm, netWpm, accuracy, errors }
}

function TestInner() {
  const router = useRouter()
  const params = useSearchParams()
  const mode = params.get('mode') || 'free_english'
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.free_english

  const [passage, setPassage] = useState('')
  const [typed, setTyped] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'running' | 'done'>('loading')
  const [timeLeft, setTimeLeft] = useState(cfg.duration)
  const [elapsed, setElapsed] = useState(0)
  const [stats, setStats] = useState({ rawWpm: 0, netWpm: 0, accuracy: 100, errors: 0 })
  const [nickname, setNickname] = useState('')
  const [rank, setRank] = useState<number | null>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [newPassage, setNewPassage] = useState(false)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchPassage = useCallback(async () => {
    setStatus('loading')
    setTyped('')
    setTimeLeft(cfg.duration)
    setElapsed(0)
    setStats({ rawWpm: 0, netWpm: 0, accuracy: 100, errors: 0 })
    setRank(null)
    try {
      const r = await fetch('/api/passage?mode=' + mode)
      const d = await r.json()
      setPassage(d.passage || '')
      setStatus('ready')
    } catch {
      setPassage('The quick brown fox jumps over the lazy dog. Practice your typing speed every day to improve your words per minute and accuracy. Consistent effort leads to great results.')
      setStatus('ready')
    }
  }, [mode, cfg.duration])

  useEffect(() => { fetchPassage() }, [fetchPassage])

  // Timer
  useEffect(() => {
    if (status === 'running') {
      timerRef.current = setInterval(() => {
        const el = (Date.now() - startTimeRef.current) / 1000
        setElapsed(el)
        const tl = Math.max(0, cfg.duration - el)
        setTimeLeft(tl)
        if (tl <= 0) {
          clearInterval(timerRef.current!)
          setStatus('done')
        }
      }, 100)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [status, cfg.duration])

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { fetchPassage() }
      if (e.key === 'Enter' && status === 'ready') { inputRef.current?.focus() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [status, fetchPassage])

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    if (status === 'done') return
    if (status === 'ready' && val.length > 0) {
      setStatus('running')
      startTimeRef.current = Date.now()
    }
    if (val.length > passage.length) return
    setTyped(val)
    const el = status === 'running' ? (Date.now() - startTimeRef.current) / 1000 : 0
    const s = calcStats(passage, val, el)
    setStats(s)
    if (val.length === passage.length) {
      clearInterval(timerRef.current!)
      setStatus('done')
    }
  }

  const submitScore = async () => {
    try {
      const r = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, wpm: stats.rawWpm, netWpm: stats.netWpm, accuracy: stats.accuracy, nickname }),
      })
      const d = await r.json()
      if (d.rank) setRank(d.rank)
    } catch {}
    const r2 = await fetch('/api/score?mode=' + mode)
    const d2 = await r2.json()
    setLeaderboard(d2.leaderboard || [])
  }

  useEffect(() => {
    if (status === 'done') { submitScore() }
  }, [status])

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const pct = ((cfg.duration - timeLeft) / cfg.duration) * 100
  const isHindi = cfg.lang === 'hi'

  // Render passage with per-character coloring
  const renderPassage = () => {
    return Array.from(passage).map((char, i) => {
      let color = 'var(--text3)'
      let bg = 'transparent'
      if (i < typed.length) {
        color = typed[i] === char ? 'var(--green)' : 'var(--red)'
        if (typed[i] !== char) bg = '#ef444420'
      }
      if (i === typed.length) bg = 'rgba(157,125,232,.25)'
      return (
        <span key={i} style={{ color, background: bg, borderRadius: 2, transition: 'color .05s' }}>
          {char}
        </span>
      )
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>←</button>
          <div style={{ fontWeight: 700, fontSize: 14, color: cfg.color }}>{cfg.label}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', padding: '2px 8px', background: 'var(--bg3)', borderRadius: 6 }}>{isHindi ? 'हिंदी' : 'English'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Live stats */}
          {status === 'running' && (
            <>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 700, color: 'var(--purple2)', lineHeight: 1 }}>{stats.netWpm}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>WPM</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 700, color: stats.accuracy >= 95 ? 'var(--green)' : stats.accuracy >= 80 ? 'var(--amber)' : 'var(--red)', lineHeight: 1 }}>{stats.accuracy}%</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>Accuracy</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 700, color: timeLeft < 10 ? 'var(--red)' : 'var(--text)', lineHeight: 1, animation: timeLeft < 10 ? 'pulse 1s ease infinite' : 'none' }}>{fmtTime(timeLeft)}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>Remaining</div>
              </div>
            </>
          )}
          <button onClick={fetchPassage} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg3)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
            New passage ↺
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--border)', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${cfg.color},var(--purple2))`, transition: 'width .1s linear' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 20px' }}>
        {status === 'loading' && (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <div style={{ fontSize: 32, animation: 'pulse 1s ease infinite', marginBottom: 16 }}>⌨️</div>
            <div style={{ color: 'var(--text3)', fontSize: 14 }}>Loading passage...</div>
          </div>
        )}

        {(status === 'ready' || status === 'running') && (
          <div style={{ width: '100%', maxWidth: 820 }}>
            {/* Timer display for ready state */}
            {status === 'ready' && (
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 48, fontWeight: 800, color: 'var(--purple2)', lineHeight: 1 }}>{fmtTime(cfg.duration)}</div>
                <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 8 }}>Start typing to begin the test</div>
              </div>
            )}

            {/* Passage display */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 32px', marginBottom: 20, lineHeight: isHindi ? 2.2 : 2, fontSize: isHindi ? 18 : 20, fontFamily: isHindi ? "'Noto Sans Devanagari',sans-serif" : "'JetBrains Mono',monospace", letterSpacing: isHindi ? '0.02em' : '0.05em', wordSpacing: '0.2em', userSelect: 'none', minHeight: 120 }}>
              {renderPassage()}
              <span style={{ display: 'inline-block', width: 2, height: '1.1em', background: 'var(--purple2)', marginLeft: 1, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />
            </div>

            {/* Input area */}
            <textarea
              ref={inputRef}
              value={typed}
              onChange={handleInput}
              disabled={status === 'done'}
              placeholder={status === 'ready' ? (isHindi ? 'यहाँ टाइप करना शुरू करें...' : 'Start typing here...') : ''}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              style={{ width: '100%', background: 'var(--bg3)', border: `2px solid ${status === 'running' ? cfg.color : 'var(--border)'}`, borderRadius: 12, padding: '18px 20px', fontSize: isHindi ? 16 : 16, fontFamily: isHindi ? "'Noto Sans Devanagari',sans-serif" : 'inherit', color: 'var(--text)', resize: 'none', outline: 'none', lineHeight: isHindi ? 2 : 1.6, minHeight: 100, transition: 'border-color .2s', letterSpacing: isHindi ? '0.02em' : 'normal' }}
              rows={4}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: 'var(--text3)' }}>
              <span>{typed.length} / {passage.length} characters</span>
              <span>Press Esc to restart</span>
            </div>
          </div>
        )}

        {/* RESULTS SCREEN */}
        {status === 'done' && (
          <div style={{ width: '100%', maxWidth: 720, animation: 'fadeIn .4s ease' }}>
            {/* Score card */}
            <div style={{ background: 'var(--card)', border: `2px solid ${cfg.color}`, borderRadius: 20, padding: '32px', marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: cfg.color, letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase', fontWeight: 600 }}>Test Complete · {cfg.label}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Net WPM', value: String(stats.netWpm), color: 'var(--purple2)', big: true },
                  { label: 'Raw WPM', value: String(stats.rawWpm), color: 'var(--text)' },
                  { label: 'Accuracy', value: stats.accuracy + '%', color: stats.accuracy >= 95 ? 'var(--green)' : stats.accuracy >= 80 ? 'var(--amber)' : 'var(--red)' },
                  { label: 'Errors', value: String(stats.errors), color: stats.errors === 0 ? 'var(--green)' : 'var(--red)' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg3)', borderRadius: 12, padding: '16px 8px' }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: s.big ? 36 : 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Performance message */}
              <div style={{ marginBottom: 20, padding: '12px 20px', borderRadius: 10, background: 'var(--bg3)', fontSize: 14, color: 'var(--text2)', lineHeight: 1.5 }}>
                {stats.netWpm >= 60 ? '🏆 Excellent! You are well above the exam cutoff.' :
                 stats.netWpm >= 40 ? '✅ Good score! A bit more practice and you\'ll clear the cutoff.' :
                 stats.netWpm >= 25 ? '📈 Keep practicing — aim for 35+ WPM for most exams.' :
                 '💪 Great start! Daily practice of 20 minutes will improve your speed fast.'}
              </div>

              {/* Rank */}
              {rank && (
                <div style={{ marginBottom: 20, fontSize: 14, color: 'var(--text3)' }}>
                  You ranked <span style={{ color: cfg.color, fontWeight: 700, fontSize: 18 }}>#{rank}</span> this week in {cfg.label}
                </div>
              )}

              {/* Save score */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Your name (optional)"
                  style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border2)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 14, outline: 'none', width: 200 }} />
                <button onClick={fetchPassage}
                  style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${cfg.color},var(--purple2))`, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Try Again ↺
                </button>
                <button onClick={() => router.push('/')}
                  style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid var(--border2)', background: 'var(--bg3)', color: 'var(--text2)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  Change Mode
                </button>
              </div>
            </div>

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 16, letterSpacing: '0.05em' }}>🏆 THIS WEEK — {cfg.label.toUpperCase()}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {leaderboard.map((row: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: i === 0 ? `${cfg.color}18` : 'var(--bg3)', border: `1px solid ${i === 0 ? cfg.color + '44' : 'var(--border)'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: i === 0 ? cfg.color : 'var(--text3)', minWidth: 24 }}>#{i + 1}</span>
                        <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: i === 0 ? 600 : 400 }}>{row.nickname || 'Anonymous'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 700, color: 'var(--purple2)' }}>{row.net_wpm} WPM</span>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: 'var(--text3)' }}>{row.accuracy}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TestPage() {
  return <Suspense><TestInner /></Suspense>
}
