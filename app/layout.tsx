import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Microscope RPG with AI',
  description: 'Collaborative timeline-building RPG with AI co-players',
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
