import Link from 'next/link';

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      background: 'linear-gradient(to bottom, #e3f2fd, #ffffff)',
    }}>
      <div style={{ maxWidth: '600px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Microscope RPG
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '2rem' }}>
          Build epic timelines with AI co-players
        </p>

        <Link
          href="/game"
          style={{
            display: 'inline-block',
            padding: '1rem 2rem',
            background: '#1976d2',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '1.25rem',
            fontWeight: '600',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Start Playing
        </Link>

        <div style={{
          marginTop: '3rem',
          padding: '1.5rem',
          background: 'white',
          borderRadius: '8px',
          textAlign: 'left',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Features
          </h2>
          <ul style={{ lineHeight: '1.8', color: '#555' }}>
            <li>✅ Collaborative timeline-building gameplay</li>
            <li>✅ AI-powered co-players using Claude</li>
            <li>✅ Separate conversations per Period/Event</li>
            <li>✅ Local storage (your data stays private)</li>
            <li>✅ Context-aware AI that remembers game state</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
