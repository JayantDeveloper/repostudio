import { HeroSection } from '@/components/marketing/HeroSection'
import { CTAButton } from '@/components/marketing/CTAButton'
import { ScrollReveal } from '@/components/marketing/ScrollReveal'

function IngestIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
function ScriptIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}
function RenderIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.055)',
  backdropFilter: 'blur(16px) saturate(160%)',
  WebkitBackdropFilter: 'blur(16px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.16), 0 8px 32px rgba(0,0,0,0.35)',
}

const PIPELINE = [
  {
    step: '01', sub: 'Ingest', icon: <IngestIcon />, iconColor: 'var(--accent-glow)',
    iconBg: 'linear-gradient(135deg, rgba(53,214,255,0.2), rgba(47,123,255,0.14))',
    iconBorder: 'rgba(53,214,255,0.22)',
    title: 'Reads the repo. Records the live app.',
    detail: 'RepoStudio maps the file tree, fetches the most significant source files, and uses Playwright to record a live scroll through your deployed product — so every scene is grounded in what the code actually does.',
  },
  {
    step: '02', sub: 'Script', icon: <ScriptIcon />, iconColor: '#c084fc',
    iconBg: 'linear-gradient(135deg, rgba(157,124,255,0.2), rgba(47,123,255,0.14))',
    iconBorder: 'rgba(157,124,255,0.22)',
    title: 'An AI director writes the story.',
    detail: "A product marketer prompt scans your imports and maps them to user-facing claims — 'supabase' becomes 'Real-time Sync', 'framer-motion' becomes 'Fluid Animations'. Nothing is invented.",
  },
  {
    step: '03', sub: 'Render', icon: <RenderIcon />, iconColor: 'var(--accent-glow)',
    iconBg: 'linear-gradient(135deg, rgba(47,123,255,0.2), rgba(53,214,255,0.1))',
    iconBorder: 'rgba(47,123,255,0.22)',
    title: 'Assembled frame-by-frame. Exported in seconds.',
    detail: 'Remotion composites brand colors, the live scroll recording, captions, and narration into a 1080p MP4 — stored in your dashboard, ready to share.',
  },
]

export default function MarketingPage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px 128px', overflow: 'hidden' }}>
      <ScrollReveal />

      {/* ── Hero (client island — needs signIn + scroll spring) */}
      <HeroSection />

      {/* ── Pipeline — pure server HTML, CSS entrance animations */}
      <section id="how-it-works" style={{ marginBottom: 128 }}>
        <div className="glass-animate" style={{ marginBottom: 80 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
            color: 'rgba(53,214,255,0.65)', textTransform: 'uppercase',
            display: 'block', marginBottom: 14,
          }}>
            The Pipeline
          </span>
          <h2 style={{
            fontSize: 'clamp(36px, 5vw, 58px)',
            fontWeight: 740, color: '#f8fbff', margin: 0,
            letterSpacing: '-0.022em', lineHeight: 1.06,
          }}>
            Three steps.<br />One polished video.
          </h2>
        </div>

        <div style={{ position: 'relative', paddingLeft: 56 }}>
          <div style={{
            position: 'absolute', left: 11, top: 8, bottom: 48,
            width: 1,
            background: 'linear-gradient(to bottom, rgba(53,214,255,0.7), rgba(47,123,255,0.3), transparent)',
          }} />

          {PIPELINE.map(({ step, sub, icon, iconColor, iconBg, iconBorder, title, detail }, i) => (
            <div
              key={step}
              className="glass-animate"
              style={{
                display: 'grid',
                gridTemplateColumns: '96px 1fr',
                gap: 48,
                alignItems: 'flex-start',
                paddingBottom: i < 2 ? 72 : 0,
                position: 'relative',
                transitionDelay: `${i * 120}ms`,
              }}
            >
              <div style={{
                position: 'absolute', left: -48, top: 6,
                width: 10, height: 10, borderRadius: '50%',
                background: 'rgba(53,214,255,0.9)',
                boxShadow: '0 0 16px rgba(53,214,255,0.6)',
              }} />

              <div style={{
                fontSize: 88, fontWeight: 800, lineHeight: 0.88,
                color: '#ffffff', letterSpacing: '-0.05em',
                userSelect: 'none', paddingTop: 2,
              }}>
                {step}
              </div>

              <div style={{ paddingTop: 8 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: iconBg, border: `1px solid ${iconBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: iconColor, marginBottom: 16,
                }}>
                  {icon}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.13em',
                  color: 'rgba(53,214,255,0.6)', textTransform: 'uppercase',
                  display: 'block', marginBottom: 10,
                }}>
                  {sub}
                </span>
                <h3 style={{ fontSize: 26, fontWeight: 700, color: '#f8fbff', margin: '0 0 14px', letterSpacing: '-0.015em', lineHeight: 1.2 }}>
                  {title}
                </h3>
                <p style={{ color: 'rgba(248,251,255,0.52)', lineHeight: 1.74, fontSize: 16, margin: 0, maxWidth: 580 }}>
                  {detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features */}
      <section id="features" style={{ marginBottom: 128 }}>
        <div className="glass-animate" style={{ textAlign: 'right', marginBottom: 72 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
            color: 'rgba(53,214,255,0.65)', textTransform: 'uppercase',
            display: 'block', marginBottom: 14,
          }}>
            Why RepoStudio
          </span>
          <h2 style={{
            fontSize: 'clamp(36px, 5vw, 58px)',
            fontWeight: 740, color: '#f8fbff', margin: 0,
            letterSpacing: '-0.022em', lineHeight: 1.06,
          }}>
            Everything automated.<br />Nothing compromised.
          </h2>
        </div>

        <div className="glass-animate" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14, transitionDelay: '80ms' }}>
          <div style={{ ...GLASS, borderRadius: 24, padding: 48, position: 'relative', overflow: 'hidden', minHeight: 280, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 90% at 10% 0%, rgba(53,214,255,0.10), transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, rgba(53,214,255,0.2), rgba(47,123,255,0.14))', border: '1px solid rgba(53,214,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-glow)', marginBottom: 18 }}>
                <IngestIcon />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 700, color: '#f8fbff', margin: '0 0 10px' }}>Context Ingestion</h3>
              <p style={{ color: 'rgba(248,251,255,0.58)', lineHeight: 1.7, margin: 0, fontSize: 15, maxWidth: 440 }}>
                RepoStudio maps the full file tree, reads real source files, and records a live Playwright scroll through the deployed product.
              </p>
            </div>
          </div>

          <div style={{ ...GLASS, borderRadius: 24, padding: 40, position: 'relative', overflow: 'hidden', minHeight: 280, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 120% 70% at 100% 0%, rgba(157,124,255,0.12), transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, rgba(157,124,255,0.2), rgba(47,123,255,0.14))', border: '1px solid rgba(157,124,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', marginBottom: 18 }}>
                <ScriptIcon />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#f8fbff', margin: '0 0 10px' }}>AI Scripting</h3>
              <p style={{ color: 'rgba(248,251,255,0.55)', lineHeight: 1.7, margin: 0, fontSize: 15 }}>
                Maps imports to commercial claims. No fabrication — every badge is traceable to the code.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-animate" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, transitionDelay: '160ms' }}>
          <div style={{ ...GLASS, borderRadius: 24, padding: 40, position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 80% at 0% 100%, rgba(47,123,255,0.12), transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, rgba(47,123,255,0.2), rgba(53,214,255,0.1))', border: '1px solid rgba(47,123,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-glow)', marginBottom: 18 }}>
                <RenderIcon />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#f8fbff', margin: '0 0 10px' }}>Cinematic Render</h3>
              <p style={{ color: 'rgba(248,251,255,0.55)', lineHeight: 1.7, margin: 0, fontSize: 15 }}>
                Remotion composes brand colors, the live scroll recording, and captions into a 1080p MP4.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
            {[
              { value: '45s', label: 'Polished video, zero editing' },
              { value: '1080p', label: 'MP4, ready to post anywhere' },
              { value: '8×', label: 'Source files grounding every scene' },
            ].map(({ value, label }, i) => (
              <div key={value} style={{
                borderTop: '1px solid rgba(255,255,255,0.1)',
                borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                padding: '36px 28px 12px',
              }}>
                <div style={{
                  fontSize: 56, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1,
                  background: 'linear-gradient(145deg, #fff 10%, rgba(53,214,255,0.65) 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  marginBottom: 10,
                }}>
                  {value}
                </div>
                <p style={{ color: 'rgba(248,251,255,0.45)', fontSize: 14, margin: 0, lineHeight: 1.55 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA */}
      <section
        className="glass-animate"
        style={{
          ...GLASS,
          borderRadius: 28,
          padding: '52px 64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 48,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div aria-hidden style={{
          position: 'absolute', top: 0, right: 0, width: '50%', height: '100%',
          background: 'radial-gradient(ellipse 80% 100% at 100% 50%, rgba(47,123,255,0.10), transparent)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 2, flex: 1 }}>
          <h2 style={{
            fontSize: 34, fontWeight: 740, margin: '0 0 12px', letterSpacing: '-0.012em',
            background: 'linear-gradient(160deg, #ffffff 20%, rgba(53,214,255,0.9) 60%, #ffffff 90%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Start creating in seconds
          </h2>
          <p style={{ color: 'rgba(248,251,255,0.58)', fontSize: 17, lineHeight: 1.64, maxWidth: 460, margin: 0 }}>
            Sign in with GitHub, paste a repository URL, and RepoStudio generates your demo video end-to-end.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 2, flexShrink: 0 }}>
          <CTAButton />
        </div>
      </section>
    </div>
  )
}
