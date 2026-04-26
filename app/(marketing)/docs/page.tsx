export default function DocsPage() {
  return (
    <div style={{ maxWidth: 1000, margin: '64px auto', padding: '0 32px' }}>
      <div className="liquid-glass glass-surface" style={{ padding: '40px 60px' }}>
        <h1 style={{ color: '#f8fbff', fontWeight: 720 }}>Product Documentation</h1>
        <hr style={{ borderColor: 'rgba(255,255,255,0.12)', margin: '24px 0' }} />
        
        <div style={{ color: 'rgba(248,251,255,0.66)', lineHeight: 1.8 }}>
          <p>RepoStudio turns repositories into polished product videos through an automated generation pipeline.</p>
          <br />
          <h3 style={{ color: '#f8fbff' }}>Ingest</h3>
          <p>The system utilizes Firecrawl to extract context from public repositories. Playwright is deployed to capture high-fidelity DOM nodes of active deployments.</p>
          <br />
          <h3 style={{ color: '#f8fbff' }}>Script</h3>
          <p>NVIDIA Nemotron-3 acts as the director. It takes raw README data and converts it into a structured, cinematic JSON array containing [TEXT, CODE, DURATION, START].</p>
          <br />
          <h3 style={{ color: '#f8fbff' }}>Render</h3>
          <p>Remotion bundles the assets. A React Three Fiber scene is instantiated. The presenter mesh animates using Audio2Face telemetry derived from the Riva TTS pipeline.</p>
        </div>
      </div>
    </div>
  )
}
