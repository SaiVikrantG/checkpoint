import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';

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
    .force('link', forceLink(linkDefs).id((d) => d.id).distance(180).strength(0.4))
    .force('charge', forceManyBody().strength((d) => (d.type === 'cat' ? -800 : -300)))
    .force('center', forceCenter(width / 2, height / 2))
    .force('collide', forceCollide((d) => (d.type === 'cat' ? 70 : 30)))
    .stop();

  for (let i = 0; i < 300; i++) sim.tick();

  const nodePositions = {};
  nodes.forEach((n) => { nodePositions[n.id] = { x: n.x, y: n.y }; });

  const links = linkDefs.map((l) => ({
    sourceId: typeof l.source === 'object' ? l.source.id : l.source,
    targetId: typeof l.target === 'object' ? l.target.id : l.target,
  }));

  return { nodePositions, links };
}

export default function BoardPage() {
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 1280, h: 600 });
  const [nodePositions, setNodePositions] = useState(null);
  const [links, setLinks] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [panning, setPanning] = useState(null);

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

  useEffect(() => {
    const result = buildGraph(dims.w, dims.h);
    setNodePositions(result.nodePositions);
    setLinks(result.links);
    setView({ x: 0, y: 0, scale: 1 });
  }, [dims]);

  const getSvgPoint = useCallback((e) => {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }, []);

  const handleMouseDown = useCallback((e, nodeId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging({ id: nodeId });
  }, []);

  const handleCanvasMouseDown = useCallback((e) => {
    if (e.target === svgRef.current || e.target.tagName === 'rect') {
      const svgP = getSvgPoint(e);
      setPanning({ startX: svgP.x, startY: svgP.y, viewX: view.x, viewY: view.y });
    }
  }, [getSvgPoint, view]);

  const handleMouseMove = useCallback((e) => {
    if (dragging) {
      const svgP = getSvgPoint(e);
      const worldX = (svgP.x - view.x) / view.scale;
      const worldY = (svgP.y - view.y) / view.scale;
      setNodePositions((prev) => ({
        ...prev,
        [dragging.id]: { x: worldX, y: worldY },
      }));
    } else if (panning) {
      const svgP = getSvgPoint(e);
      setView((v) => ({
        ...v,
        x: panning.viewX + (svgP.x - panning.startX),
        y: panning.viewY + (svgP.y - panning.startY),
      }));
    }
  }, [dragging, panning, getSvgPoint, view]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setPanning(null);
  }, []);

  const handleWheelRef = useRef(null);
  handleWheelRef.current = (e) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    if (e.ctrlKey) {
      const delta = Math.pow(0.99, e.deltaY);
      setView((v) => {
        const newScale = Math.max(0.3, Math.min(3, v.scale * delta));
        const ratio = newScale / v.scale;
        return {
          scale: newScale,
          x: svgP.x - (svgP.x - v.x) * ratio,
          y: svgP.y - (svgP.y - v.y) * ratio,
        };
      });
    } else {
      setView((v) => ({
        ...v,
        x: v.x - e.deltaX,
        y: v.y - e.deltaY,
      }));
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e) => handleWheelRef.current(e);
    const prevent = (e) => e.preventDefault();

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('gesturestart', prevent);
    el.addEventListener('gesturechange', prevent);
    el.addEventListener('gestureend', prevent);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('gesturestart', prevent);
      el.removeEventListener('gesturechange', prevent);
      el.removeEventListener('gestureend', prevent);
    };
  }, [nodePositions !== null]);

  const handleNodeClick = useCallback((node) => {
    if (node.type === 'proj' && node.path) {
      navigate(node.path);
    }
  }, [navigate]);

  const isHighlighted = useCallback((sourceId, targetId) => {
    if (!hovered) return false;
    return hovered === sourceId || hovered === targetId;
  }, [hovered]);

  const resetLayout = useCallback(() => {
    const result = buildGraph(dims.w, dims.h);
    setNodePositions(result.nodePositions);
    setLinks(result.links);
    setView({ x: 0, y: 0, scale: 1 });
  }, [dims]);

  if (!nodePositions) return null;

  const allNodes = [
    ...categories.map((c) => ({ ...c, type: 'cat', ...nodePositions[c.id] })),
    ...projects.map((p) => ({ ...p, type: 'proj', ...nodePositions[p.id] })),
  ];
  const nodeById = Object.fromEntries(allNodes.map((n) => [n.id, n]));

  const zoomPercent = Math.round(view.scale * 100);

  return (
    <div className="board-page">
      <div className="board-head">
        <div>
          <h1 className="board-h1">idea_board</h1>
          <div className="board-sub">// a graph of what i'm thinking about · drag nodes · scroll to zoom · click projects to open</div>
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

      <div className="board-canvas" ref={containerRef}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${dims.w} ${dims.h}`}
          className="board-svg"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: panning ? 'grabbing' : dragging ? 'grabbing' : 'default' }}
        >
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

            {allNodes.filter((n) => n.type === 'cat').map((c) => (
              <g
                key={c.id}
                style={{ cursor: 'grab' }}
                onMouseDown={(e) => handleMouseDown(e, c.id)}
                onMouseEnter={() => setHovered(c.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <circle cx={c.x} cy={c.y} r="34" fill={c.color} fillOpacity="0.12" stroke={c.color} strokeOpacity="0.4" />
                <circle cx={c.x} cy={c.y} r="14" fill={c.color} />
                <text x={c.x} y={c.y + 56} className="node-label cat-label" fill={c.color}>
                  {c.id}
                </text>
              </g>
            ))}

            {allNodes.filter((n) => n.type === 'proj').map((p) => (
              <g
                key={p.id}
                style={{ cursor: 'pointer' }}
                onMouseDown={(e) => handleMouseDown(e, p.id)}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleNodeClick(p)}
              >
                <circle cx={p.x} cy={p.y} r="8" fill="var(--fg)" stroke="var(--bg)" strokeWidth="2" />
                <text x={p.x + 14} y={p.y + 4} className="node-label proj-label">
                  {p.id}
                </text>
              </g>
            ))}
          </g>
        </svg>

        <div className="board-controls">
          <button className="board-btn" onClick={resetLayout}>re-layout</button>
          <span className="board-zoom">{zoomPercent}%</span>
        </div>
      </div>
    </div>
  );
}
