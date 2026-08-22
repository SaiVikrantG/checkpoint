import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { select } from 'd3-selection';
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom';
import { drag as d3Drag } from 'd3-drag';

const MOBILE_BREAKPOINT = 480;

const categories = [
  { id: 'systems', color: '#e2b714' },
  { id: 'graphics', color: '#7aa2f7' },
  { id: 'web', color: '#7ed4ad' },
  { id: 'cli', color: '#c792ea' },
  { id: 'writing', color: '#f78c6c' },
];

const projects = [
  { id: 'checkpoint', links: ['web', 'writing', 'systems'], path: '/projects' },
  { id: 'rust-rays', links: ['graphics', 'systems'], path: '/projects' },
  { id: 'voxel-engine', links: ['graphics', 'systems'], path: '/projects' },
  { id: 'todo-tree', links: ['cli', 'systems'], path: '/projects' },
  { id: 'dotfiles', links: ['cli'], path: '/projects' },
  { id: 'newsletter', links: ['web', 'writing'], path: '/projects' },
  { id: 'tinyhttp', links: ['systems', 'web'], path: '/projects' },
  { id: 'blog-engine?', links: ['writing', 'web'], path: '/projects' },
];

function buildGraph(width, height) {
  const catNodes = categories.map((c) => ({ ...c, type: 'cat' }));
  const projNodes = projects.map((p) => ({ ...p, type: 'proj' }));
  const nodes = [...catNodes, ...projNodes];

  const linkDefs = [];
  projNodes.forEach((p) => {
    p.links.forEach((catId) => {
      linkDefs.push({ source: p.id, target: catId });
    });
  });

  const sim = forceSimulation(nodes)
    .force(
      'link',
      forceLink(linkDefs)
        .id((d) => d.id)
        .distance(180)
        .strength(0.4),
    )
    .force(
      'charge',
      forceManyBody().strength((d) => (d.type === 'cat' ? -800 : -300)),
    )
    .force('center', forceCenter(width / 2, height / 2))
    .force(
      'collide',
      forceCollide((d) => (d.type === 'cat' ? 70 : 30)),
    )
    .stop();

  for (let i = 0; i < 300; i++) sim.tick();

  const nodePositions = {};
  nodes.forEach((n) => {
    nodePositions[n.id] = { x: n.x, y: n.y };
  });

  const links = linkDefs.map((l) => ({
    sourceId: typeof l.source === 'object' ? l.source.id : l.source,
    targetId: typeof l.target === 'object' ? l.target.id : l.target,
  }));

  return { nodePositions, links };
}

// Computes a d3-zoom transform {x, y, k} that fits all node positions inside
// the given viewport with padding, so the graph opens legible instead of at 1:1.
function fitTransform(nodePositions, width, height, nodeRadius = 40, padding = 0.85) {
  const points = Object.values(nodePositions);
  if (points.length === 0) return zoomIdentity;

  const minX = Math.min(...points.map((p) => p.x)) - nodeRadius;
  const maxX = Math.max(...points.map((p) => p.x)) + nodeRadius;
  const minY = Math.min(...points.map((p) => p.y)) - nodeRadius;
  const maxY = Math.max(...points.map((p) => p.y)) + nodeRadius;

  const bboxW = Math.max(maxX - minX, 1);
  const bboxH = Math.max(maxY - minY, 1);

  const scale = Math.min((width / bboxW) * padding, (height / bboxH) * padding, 1);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  return zoomIdentity
    .translate(width / 2, height / 2)
    .scale(scale)
    .translate(-cx, -cy);
}

export default function BoardPage() {
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
  const scaleRef = useRef(1);
  const [dims, setDims] = useState({ w: 1280, h: 600 });
  const [nodePositions, setNodePositions] = useState(null);
  const [links, setLinks] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDims({ w: width, h: Math.min(height, 600) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Binds d3-zoom to the svg once. d3-zoom natively handles wheel, drag-to-pan,
  // and touch (including pinch-to-zoom), replacing the old mouse-only handlers.
  useEffect(() => {
    const svg = select(svgRef.current);
    const zoomBehavior = d3Zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        scaleRef.current = event.transform.k;
        setView({ x: event.transform.x, y: event.transform.y, scale: event.transform.k });
      });
    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);
    return () => {
      svg.on('.zoom', null);
      zoomBehaviorRef.current = null;
    };
  }, []);

  const fitToViewport = useCallback((positions) => {
    const transform = fitTransform(positions, dims.w, dims.h);
    if (zoomBehaviorRef.current && svgRef.current) {
      select(svgRef.current).call(zoomBehaviorRef.current.transform, transform);
    } else {
      scaleRef.current = transform.k;
      setView({ x: transform.x, y: transform.y, scale: transform.k });
    }
  }, [dims]);

  useEffect(() => {
    // Re-initializes locally-mutable state (nodePositions gets dragged independently
    // afterward via node drag handlers), not purely derived data — legitimate effect use.
    const result = buildGraph(dims.w, dims.h);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNodePositions(result.nodePositions);
    setLinks(result.links);
    fitToViewport(result.nodePositions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims]);

  // Creates (and re-binds on every render) a d3-drag behavior for one node. Cheap for
  // this node count; keeps drag deltas in sync with the current zoom scale via scaleRef.
  const bindNodeDrag = useCallback((el, nodeId) => {
    if (!el) return;
    const dragBehavior = d3Drag()
      .on('start', (event) => {
        event.sourceEvent.stopPropagation();
      })
      .on('drag', (event) => {
        setNodePositions((prev) => ({
          ...prev,
          [nodeId]: {
            x: (prev[nodeId]?.x ?? 0) + event.dx / scaleRef.current,
            y: (prev[nodeId]?.y ?? 0) + event.dy / scaleRef.current,
          },
        }));
      });
    select(el).call(dragBehavior);
  }, []);

  const handleNodeClick = useCallback(
    (node) => {
      if (node.type === 'proj' && node.path) {
        navigate(node.path);
      }
    },
    [navigate],
  );

  const isHighlighted = useCallback(
    (sourceId, targetId) => {
      if (!hovered) return false;
      return hovered === sourceId || hovered === targetId;
    },
    [hovered],
  );

  const resetLayout = useCallback(() => {
    const result = buildGraph(dims.w, dims.h);
    setNodePositions(result.nodePositions);
    setLinks(result.links);
    fitToViewport(result.nodePositions);
  }, [dims, fitToViewport]);

  // The canvas/svg below is rendered unconditionally (not gated on nodePositions) so that
  // containerRef/svgRef are attached to the DOM before the mount-only ResizeObserver and
  // d3-zoom binding effects (both `useEffect(..., [])`) run — otherwise those refs are still
  // null on the very first commit and the observer/zoom behavior silently never attaches.
  const allNodes = nodePositions
    ? [
        ...categories.map((c) => ({ ...c, type: 'cat', ...nodePositions[c.id] })),
        ...projects.map((p) => ({ ...p, type: 'proj', ...nodePositions[p.id] })),
      ]
    : [];
  const nodeById = Object.fromEntries(allNodes.map((n) => [n.id, n]));

  const zoomPercent = Math.round(view.scale * 100);
  const isMobile = dims.w < MOBILE_BREAKPOINT;
  const catOuterR = isMobile ? 24 : 34;
  const catInnerR = isMobile ? 10 : 14;
  const catLabelOffsetY = isMobile ? 40 : 56;
  const projR = isMobile ? 6 : 8;
  const projLabelOffsetX = isMobile ? 10 : 14;

  return (
    <div className="board-page">
      <div className="board-head">
        <div>
          <h1 className="board-h1">idea_board</h1>
          <div className="board-sub">
            // a graph of what i'm thinking about · drag nodes · scroll to zoom · click projects to
            open
          </div>
        </div>
        <div className="board-legend">
          {categories.map((c) => (
            <span key={c.id} className="legend-item">
              <span className="legend-dot" style={{ background: c.color }} />
              {c.id}
            </span>
          ))}
          <span className="legend-sep">|</span>
          <span className="legend-item">
            <span className="legend-dot legend-dot-white" />
            project
          </span>
        </div>
      </div>

      <div
        className="board-canvas"
        ref={containerRef}
        style={{
          '--label-size': isMobile ? '10px' : '12px',
          '--label-size-cat': isMobile ? '11px' : '13px',
        }}
      >
        <svg ref={svgRef} viewBox={`0 0 ${dims.w} ${dims.h}`} className="board-svg">
          <defs>
            <pattern id="dotgrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="var(--border)" />
            </pattern>
          </defs>
          <rect width={dims.w} height={dims.h} fill="url(#dotgrid)" />

          <g transform={`translate(${view.x}, ${view.y}) scale(${view.scale})`}>
            {links.map((link, i) => {
              const source = nodeById[link.sourceId];
              const target = nodeById[link.targetId];
              if (!source || !target) return null;
              const catNode = source.type === 'cat' ? source : target;
              const highlighted = isHighlighted(link.sourceId, link.targetId);
              return (
                <line
                  key={i}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={catNode.color}
                  strokeOpacity={highlighted ? 0.8 : 0.2}
                  strokeWidth={highlighted ? 2 : 1.25}
                  style={{ transition: 'stroke-opacity 0.2s, stroke-width 0.2s' }}
                />
              );
            })}

            {allNodes
              .filter((n) => n.type === 'cat')
              .map((c) => (
                <g
                  key={c.id}
                  ref={(el) => bindNodeDrag(el, c.id)}
                  style={{ cursor: 'grab', touchAction: 'none' }}
                  onMouseEnter={() => setHovered(c.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={catOuterR}
                    fill={c.color}
                    fillOpacity="0.12"
                    stroke={c.color}
                    strokeOpacity="0.4"
                  />
                  <circle cx={c.x} cy={c.y} r={catInnerR} fill={c.color} />
                  <text
                    x={c.x}
                    y={c.y + catLabelOffsetY}
                    className="node-label cat-label"
                    fill={c.color}
                  >
                    {c.id}
                  </text>
                </g>
              ))}

            {allNodes
              .filter((n) => n.type === 'proj')
              .map((p) => (
                <g
                  key={p.id}
                  ref={(el) => bindNodeDrag(el, p.id)}
                  style={{ cursor: 'pointer', touchAction: 'none' }}
                  onMouseEnter={() => setHovered(p.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleNodeClick(p)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={projR}
                    fill="var(--fg)"
                    stroke="var(--bg)"
                    strokeWidth="2"
                  />
                  <text
                    x={p.x + projLabelOffsetX}
                    y={p.y + 4}
                    className="node-label proj-label"
                  >
                    {p.id}
                  </text>
                </g>
              ))}
          </g>
        </svg>

        <div className="board-controls">
          <button className="board-btn" onClick={resetLayout}>
            re-layout
          </button>
          <span className="board-zoom">{zoomPercent}%</span>
        </div>
      </div>
    </div>
  );
}
