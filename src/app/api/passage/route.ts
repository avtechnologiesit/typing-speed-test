import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const FALLBACK: Record<string, string[]> = {
  ssc_english: [
    "The government of India has been working tirelessly to improve the infrastructure across the country. Roads, bridges, and highways are being constructed at an unprecedented pace. The aim is to connect every village and town with the rest of the nation.",
    "Digital India is a flagship programme of the Government of India with a vision to transform India into a digitally empowered society and knowledge economy. The programme was launched by the Prime Minister to promote inclusive growth.",
    "The Reserve Bank of India serves as the central bank of the country and regulates the monetary policy. It controls the money supply, manages foreign exchange, and supervises the banking sector to ensure financial stability across the nation.",
  ],
  court_english: [
    "Whereas the plaintiff has filed this suit for recovery of the sum of money allegedly due and payable by the defendant under the terms of the agreement executed between the parties. The defendant denies the claim and has filed a written statement.",
    "The Supreme Court of India in its landmark judgment held that the right to privacy is a fundamental right guaranteed under Article 21 of the Constitution. The said judgment overruled earlier decisions and settled the law on this important question.",
  ],
  free_english: [
    "The quick brown fox jumps over the lazy dog near the riverbank. Every morning the animals gather at the water hole to quench their thirst. The lion watches from a distance while the zebras drink peacefully in the golden sunlight.",
    "Technology has transformed the way people communicate, work, and entertain themselves. The internet connects billions of people around the world, enabling the exchange of information at the speed of light every single day.",
  ],
  ldc_hindi: [
    "भारत सरकार ने देश के विकास के लिए अनेक योजनाएं चलाई हैं। ग्रामीण क्षेत्रों में सड़कें और बिजली पहुंचाई जा रही हैं। शिक्षा और स्वास्थ्य सुविधाओं का विस्तार किया जा रहा है।",
    "राष्ट्रीय शिक्षा नीति का उद्देश्य हर बच्चे को गुणवत्तापूर्ण शिक्षा प्रदान करना है। सरकार ने साक्षरता दर बढ़ाने के लिए अनेक कार्यक्रम शुरू किए हैं।",
  ],
  ssc_hindi: [
    "भारतीय संविधान विश्व का सबसे लंबा लिखित संविधान है। इसमें नागरिकों के मूल अधिकारों और कर्तव्यों का उल्लेख किया गया है। संविधान की उद्देशिका में समाजवाدी धर्मनिरपेक्ष गणतंत्र की स्थापना की गई है।",
  ],
}

function getFallback(mode: string): string {
  const list = FALLBACK[mode] || FALLBACK['free_english']
  return list[Math.floor(Math.random() * list.length)]
}

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('mode') || 'free_english'
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json({ passage: getFallback(mode), source: 'fallback' })
  }

  const prompts: Record<string, string> = {
    ssc_english: "Write a 60-word passage for SSC CGL typing test practice. Use formal English about Indian government, economy, or public affairs. No abbreviations, no numbers, no special symbols. Natural sentences only. Return ONLY the passage text.",
    court_english: "Write a 60-word passage for High Court typist exam practice. Use formal legal English. Do not use apostrophes or contractions. No numbers. Return ONLY the passage text.",
    free_english: "Write a 60-word passage for English typing practice. Use clear natural sentences about everyday topics. Varied vocabulary. No numbers or special symbols. Return ONLY the passage text.",
    ldc_hindi: "Hindi mein 60 shabdon ka ek anucched likhiye jo LDC pariksha ke liye upyukt ho. Sarkar ya shiksha vishay par. Keval Devanagari lipi mein. Sirf anucched likhiye.",
    ssc_hindi: "Hindi mein 60 shabdon ka ek anucched likhiye jo SSC Hindi Typing Test ke liye upyukt ho. Rashtriya mahatva ke vishay par. Keval Devanagari lipi mein. Sirf anucched likhiye.",
  }

  const prompt = prompts[mode] || prompts['free_english']

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    const passage = data?.content?.[0]?.text?.trim() || getFallback(mode)
    return NextResponse.json({ passage, source: 'claude' }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch {
    return NextResponse.json({ passage: getFallback(mode), source: 'fallback' })
  }
}
