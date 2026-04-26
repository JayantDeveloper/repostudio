import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '32px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(248,251,255,0.55)', letterSpacing: '0.01em' }}>
            RepoStudio
          </span>
          <Image
            src="/logo.png"
            alt=""
            width={22}
            height={22}
            style={{ objectFit: 'contain', width: 22, height: 22, opacity: 0.55 }}
          />
        </Link>
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(248,251,255,0.32)' }}>
          © {new Date().getFullYear()} RepoStudio. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/docs" style={{ fontSize: 13, color: 'rgba(248,251,255,0.42)', textDecoration: 'none' }}>Docs</Link>
          <Link href="/dashboard" style={{ fontSize: 13, color: 'rgba(248,251,255,0.42)', textDecoration: 'none' }}>Dashboard</Link>
          <Link href="mailto:jaymaheshwari2603@gmail.com" style={{ fontSize: 13, color: 'rgba(248,251,255,0.42)', textDecoration: 'none' }}>Contact</Link>
        </div>
      </footer>
    </div>
  )
}
