import { AbsoluteFill, spring } from 'remotion'
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-python'
import type { Scene, WordTimestamp } from '@/lib/types'

// VS Code Dark+ colour palette — embedded so Remotion's headless Chrome picks it up
// without needing an external stylesheet.
const PRISM_CSS = `
.token.comment,.token.prolog,.token.cdata{color:#6a9955;font-style:italic}
.token.doctype,.token.punctuation{color:#d4d4d4}
.token.namespace{opacity:.7}
.token.property,.token.tag,.token.constant,.token.symbol,.token.deleted{color:#9cdcfe}
.token.boolean,.token.number{color:#b5cea8}
.token.selector,.token.attr-name,.token.string,.token.char,.token.builtin,.token.inserted{color:#ce9178}
.token.operator,.token.entity,.token.url,.language-css .token.string,.style .token.string{color:#d4d4d4}
.token.atrule,.token.attr-value,.token.keyword{color:#569cd6}
.token.function,.token.class-name{color:#dcdcaa}
.token.regex,.token.important,.token.variable{color:#d16969}
.token.parameter{color:#9cdcfe}
.token.module{color:#c586c0}
.token.type-annotation{color:#4ec9b0}
`

function detectLanguage(code: string): Prism.Grammar {
  if (/def |import |elif |print\(|:\n/.test(code)) return Prism.languages.python
  if (/\.(tsx?|jsx?)$/.test(code) || /const |let |=>/m.test(code)) return Prism.languages.typescript
  return Prism.languages.javascript
}

function highlight(code: string): string {
  try {
    const grammar = detectLanguage(code)
    return Prism.highlight(code, grammar, 'typescript')
  } catch {
    // Safe HTML-escape fallback
    return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}

export const CodeSnippet: React.FC<{
  scene: Scene
  wordTimestamps: WordTimestamp[]
  frame: number
}> = ({ scene, frame }) => {
  if (!scene.code) return null

  const sceneFrame = Math.max(0, frame - scene.start_time * 30)
  const progress = spring({ frame: sceneFrame, fps: 30, config: { damping: 14, stiffness: 120 } })

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'flex-end', padding: '0 80px 120px' }}>
      {/* Inject theme CSS so Prism tokens render correctly in headless Chrome */}
      <style>{PRISM_CSS}</style>

      <pre
        style={{
          fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
          fontSize: 21,
          lineHeight: 1.65,
          color: '#d4d4d4',
          margin: 0,
          maxWidth: 880,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          // Liquid glass surface — Apple-style double-border
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.13)',
          boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.18), 0 12px 40px rgba(0,0,0,0.45)',
          borderRadius: 14,
          padding: '26px 34px',
          // Spring entrance
          transform: `translateY(${(1 - progress) * 24}px)`,
          opacity: progress,
        }}
        dangerouslySetInnerHTML={{ __html: highlight(scene.code) }}
      />
    </AbsoluteFill>
  )
}
