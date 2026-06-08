import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: 'Typing Speed Test India — SSC, LDC, High Court, Hindi & English',
  description: 'Free online typing speed test for Indian government exams. Practice SSC CGL, LDC typing in English and Hindi. Check WPM and accuracy.',
}
export default function RootLayout({children}:{children:React.ReactNode}){
  return(
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+Devanagari:wght@400;500&display=swap" rel="stylesheet"/>
      </head>
      <body>{children}</body>
    </html>
  )
}