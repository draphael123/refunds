import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Refund Converter - Process Accurate Refunds',
  description: 'Process accurate refunds for patients who are due them',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
