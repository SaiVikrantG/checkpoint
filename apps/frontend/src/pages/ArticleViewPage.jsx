import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef } from 'react';
import { marked } from 'marked';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#3a3c40',
    primaryTextColor: '#d1d0c5',
    primaryBorderColor: '#e2b714',
    lineColor: '#646669',
    secondaryColor: '#2c2e31',
    tertiaryColor: '#25272a',
    fontFamily: 'Roboto Mono, monospace',
  },
});

const renderer = new marked.Renderer();
const originalCode = renderer.code.bind(renderer);
let mermaidId = 0;
renderer.code = function ({ text, lang }) {
  if (lang === 'mermaid') {
    const id = `mermaid-${mermaidId++}`;
    return `<div class="mermaid" id="${id}">${text}</div>`;
  }
  return originalCode({ text, lang });
};

marked.setOptions({
  gfm: true,
  breaks: true,
  renderer,
});

const placeholderArticles = {
  'notch-header': {
    title: 'designing a notch header in css',
    date: '2026-06-04',
    readTime: '6 min',
    category: 'checkpoint',
    content: `# Designing a Notch Header in CSS

The MacBook notch inspired a UI pattern that works surprisingly well as a navigation element.

## The Concept

Instead of a traditional navbar spanning the full width, we float a pill-shaped container at the top center of the viewport — like the notch on a MacBook screen.

\`\`\`css
.notch {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(28, 30, 32, 0.95);
  border-radius: 999px;
  padding: 8px 20px;
  backdrop-filter: blur(12px);
}
\`\`\`

## The Sliding Indicator

The active tab gets a sliding background indicator. The trick is measuring the active element's position relative to the container:

\`\`\`javascript
const containerRect = containerEl.getBoundingClientRect();
const itemRect = activeEl.getBoundingClientRect();
setIndicatorStyle({
  left: itemRect.left - containerRect.left,
  width: itemRect.width,
});
\`\`\`

## Responsive Considerations

On mobile, the notch shrinks and hides less important items. The clock disappears below 768px, and the ⌘K shortcut chip hides too.

> The best navigation is the one that feels invisible.

---

That's it. A floating pill, a sliding indicator, and some careful measurements.`,
  },
  'plain-markdown': {
    title: 'the case for plain markdown',
    date: '2026-05-28',
    readTime: '4 min',
    category: 'misc',
    content: `# The Case for Plain Markdown

Why I chose plain markdown over MDX, rich text editors, and proprietary formats.

## Portability

Markdown files are just text. They render on GitHub, in any text editor, and survive every platform migration. Your words are never locked in.

## Simplicity

No build step. No component imports. No runtime. Just paragraphs, headings, links, and code blocks.

### What you need 90% of the time:

- **Bold** and *italic* text
- [Links](https://example.com)
- Code blocks with syntax highlighting
- Images
- Lists (like this one)
- Blockquotes

> "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away." — Antoine de Saint-Exupéry

## The 10% Edge Cases

For diagrams, I use mermaid fenced blocks. For math, KaTeX. Both render from plain text. No special syntax beyond standard markdown extensions.

\`\`\`mermaid
graph TD
    A[Markdown] --> B[HTML]
    A --> C[PDF]
    A --> D[Whatever you need]
\`\`\`

## Conclusion

Choose the format that will still work in 10 years. That format is plain text.`,
  },
  raymarching: {
    title: 'raymarching, but slowly',
    date: '2026-05-20',
    readTime: '12 min',
    category: 'rust-rays',
    content: `# Raymarching, But Slowly

A step-by-step walkthrough of building a raymarcher from scratch in Rust.

## What is Raymarching?

Unlike traditional raytracing that computes ray-triangle intersections, raymarching steps along a ray using **signed distance functions** (SDFs) to find surfaces.

\`\`\`rust
fn raymarch(origin: Vec3, direction: Vec3) -> f32 {
    let mut t = 0.0;
    for _ in 0..MAX_STEPS {
        let p = origin + direction * t;
        let d = scene_sdf(p);
        if d < EPSILON {
            return t;
        }
        t += d;
        if t > MAX_DIST {
            break;
        }
    }
    MAX_DIST
}
\`\`\`

## Signed Distance Functions

An SDF returns the distance from any point to the nearest surface. Negative means inside, positive means outside.

### Sphere

\`\`\`rust
fn sphere_sdf(p: Vec3, radius: f32) -> f32 {
    p.length() - radius
}
\`\`\`

### Box

\`\`\`rust
fn box_sdf(p: Vec3, size: Vec3) -> f32 {
    let q = p.abs() - size;
    q.max(Vec3::ZERO).length() + q.x.max(q.y.max(q.z)).min(0.0)
}
\`\`\`

## Combining Shapes

The beauty of SDFs is how trivially they compose:

- **Union**: \`min(sdf_a, sdf_b)\`
- **Intersection**: \`max(sdf_a, sdf_b)\`
- **Subtraction**: \`max(sdf_a, -sdf_b)\`
- **Smooth union**: blends shapes together

## Normals via Gradient

\`\`\`rust
fn estimate_normal(p: Vec3) -> Vec3 {
    let e = 0.001;
    Vec3::new(
        scene_sdf(p + Vec3::X * e) - scene_sdf(p - Vec3::X * e),
        scene_sdf(p + Vec3::Y * e) - scene_sdf(p - Vec3::Y * e),
        scene_sdf(p + Vec3::Z * e) - scene_sdf(p - Vec3::Z * e),
    ).normalize()
}
\`\`\`

## Performance

The key insight: each step can be *large* when far from surfaces. This is what makes raymarching efficient — it naturally takes bigger steps in empty space.

---

Next up: adding soft shadows and ambient occlusion.`,
  },
};

export default function ArticleViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const articleRef = useRef(null);

  const article = placeholderArticles[slug];

  const htmlContent = useMemo(() => {
    if (!article) return '';
    return marked(article.content);
  }, [article]);

  useEffect(() => {
    if (htmlContent && articleRef.current) {
      const nodes = articleRef.current.querySelectorAll('.mermaid');
      if (nodes.length > 0) {
        mermaid.run({ nodes });
      }
    }
  }, [htmlContent]);

  if (!article) {
    return (
      <div className="article-view">
        <div className="article-view-empty">
          <p>article not found</p>
          <button className="btn-ghost" onClick={() => navigate('/articles')}>
            ← back to articles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="article-view">
      <div className="article-view-head">
        <button className="btn-ghost" onClick={() => navigate('/articles')}>
          ← articles
        </button>
        <span className="article-view-cat">{article.category}</span>
      </div>
      <h1 className="article-view-title">{article.title}</h1>
      <div className="article-view-meta">
        <span>{article.date}</span>
        <span>·</span>
        <span>{article.readTime} read</span>
      </div>
      <article
        ref={articleRef}
        className="article-view-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
