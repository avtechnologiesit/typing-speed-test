import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

async function getDb() {
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(process.env.DATABASE_URL || '')
  return sql
}

export async function POST(req: NextRequest) {
  try {
    const { mode, wpm, netWpm, accuracy, nickname } = await req.json()
    if (!mode || !wpm || !accuracy) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const sql = await getDb()
    await sql`
      CREATE TABLE IF NOT EXISTS scores (
        id SERIAL PRIMARY KEY,
        mode TEXT NOT NULL,
        wpm INT NOT NULL,
        net_wpm INT NOT NULL,
        accuracy INT NOT NULL,
        nickname TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `
    const result = await sql`
      INSERT INTO scores (mode, wpm, net_wpm, accuracy, nickname)
      VALUES (${mode}, ${wpm}, ${netWpm || wpm}, ${accuracy}, ${nickname || null})
      RETURNING id
    `
    const rank = await sql`
      SELECT COUNT(*) + 1 AS rank FROM scores
      WHERE mode = ${mode} AND net_wpm > ${netWpm || wpm}
      AND created_at > NOW() - INTERVAL '7 days'
    `
    return NextResponse.json({
      id: result[0]?.id,
      rank: Number(rank[0]?.rank || 1),
      saved: true,
    })
  } catch (err: any) {
    console.error('Score save error:', err.message)
    return NextResponse.json({ saved: false, error: err.message }, { status: 200 })
  }
}

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('mode') || 'free_english'
  try {
    const sql = await getDb()
    await sql`CREATE TABLE IF NOT EXISTS scores (id SERIAL PRIMARY KEY, mode TEXT NOT NULL, wpm INT NOT NULL, net_wpm INT NOT NULL, accuracy INT NOT NULL, nickname TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`
    const rows = await sql`
      SELECT nickname, wpm, net_wpm, accuracy, created_at
      FROM scores
      WHERE mode = ${mode} AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY net_wpm DESC LIMIT 10
    `
    return NextResponse.json({ leaderboard: rows })
  } catch (err: any) {
    return NextResponse.json({ leaderboard: [], error: err.message })
  }
}
