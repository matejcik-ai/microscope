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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>{`
          html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            height: 100vh;
            height: 100dvh; /* Use dynamic viewport height for mobile */
            width: 100vw;
            position: fixed;
            top: 0;
            left: 0;
          }
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
