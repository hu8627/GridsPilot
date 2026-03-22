import './globals.css'

export const metadata = {
  title: 'NexaFlow OS',
  description: 'AI-Native Business OS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-200">{children}</body>
    </html>
  )
}
