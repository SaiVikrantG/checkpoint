const devlogs = [
  {
    id: 1,
    project_id: 1,
    project_name: 'checkpoint',
    title: 'wired theme picker into css vars',
    content: '<p>hooked up the color picker to <code>document.documentElement.style.setProperty</code> for <code>--bg</code>, <code>--fg</code>, <code>--main</code>. localStorage persistence works. need to add server-side save later.</p>',
    is_public: true,
    created_by: 'user-123',
    updated_by: 'user-123',
    created_at: '2026-06-04T15:22:00Z',
    updated_at: '2026-06-04T15:22:00Z',
  },
  {
    id: 2,
    project_id: 1,
    project_name: 'checkpoint',
    title: 'fuzzy finder modal opens on cmd+/',
    content: '<p>added a telescope-style finder modal. filters articles, projects, devlogs. keyboard nav with arrow keys and enter. escape closes.</p>',
    is_public: true,
    created_by: 'user-123',
    updated_by: null,
    created_at: '2026-06-04T11:08:00Z',
    updated_at: '2026-06-04T11:08:00Z',
  },
  {
    id: 3,
    project_id: 1,
    project_name: 'checkpoint',
    title: 'rewrote header as floating notch',
    content: '<p>replaced the full-width nav bar with a pill-shaped floating notch. position fixed, backdrop blur, pointer-events passthrough on the wrapper.</p>',
    is_public: true,
    created_by: 'user-123',
    updated_by: null,
    created_at: '2026-06-04T09:14:00Z',
    updated_at: '2026-06-04T09:14:00Z',
  },
  {
    id: 4,
    project_id: 1,
    project_name: 'checkpoint',
    title: 'shipped articles category filter',
    content: '<p>filter chips for all/public/private on the articles page. uses simple array filter, no backend call yet.</p>',
    is_public: true,
    created_by: 'user-123',
    updated_by: null,
    created_at: '2026-06-03T22:40:00Z',
    updated_at: '2026-06-03T22:40:00Z',
  },
  {
    id: 5,
    project_id: 1,
    project_name: 'checkpoint',
    title: 'clerk auth integration done',
    content: 'sign in/up pages themed with css vars. role-based redirect works — admin goes to /admin, author goes to /user. RequireAuth and RequireRole guards in place.',
    is_public: true,
    created_by: 'user-123',
    updated_by: null,
    created_at: '2026-06-02T18:30:00Z',
    updated_at: '2026-06-02T18:30:00Z',
  },
  {
    id: 6,
    project_id: 1,
    project_name: 'checkpoint',
    title: 'tiptap editor embedded in article page',
    content: 'replaced the fake editor with real tiptap. toolbar stays fixed, content area scrolls. word count and reading time update live.',
    is_public: true,
    created_by: 'user-123',
    updated_by: null,
    created_at: '2026-06-01T14:00:00Z',
    updated_at: '2026-06-01T14:00:00Z',
  },
  {
    id: 7,
    project_id: 1,
    project_name: 'checkpoint',
    title: 'user dashboard layout done',
    content: 'sidebar nav, topbar with breadcrumbs, body area with outlet. greeting changes based on time of day. streak dots use color-mix for theme adaptation.',
    is_public: true,
    created_by: 'user-123',
    updated_by: null,
    created_at: '2026-05-30T10:00:00Z',
    updated_at: '2026-05-30T10:00:00Z',
  },
  {
    id: 8,
    project_id: 2,
    project_name: 'rust-rays',
    title: 'got soft shadows working, finally',
    content: 'random sampling on area lights with stratified jittering. 64 samples per pixel removes most noise. render time went from 2s to 18s for the cornell box.',
    is_public: true,
    created_by: 'user-123',
    updated_by: null,
    created_at: '2026-06-01T23:14:00Z',
    updated_at: '2026-06-01T23:14:00Z',
  },
  {
    id: 9,
    project_id: 2,
    project_name: 'rust-rays',
    title: 'bvh traversal is the bottleneck after all',
    content: 'profiled with perf. 72% of time in bvh_intersect. the issue is cache misses on deep trees. need to switch to a flattened array layout.',
    is_public: true,
    created_by: 'user-123',
    updated_by: null,
    created_at: '2026-06-01T18:30:00Z',
    updated_at: '2026-06-01T18:30:00Z',
  },
  {
    id: 10,
    project_id: 2,
    project_name: 'rust-rays',
    title: 'switched to f32x4 simd for ray packets',
    content: 'tracing 4 rays at once with std::simd. ~2.8x speedup on the sphere scene. had to restructure the hit record to be SoA instead of AoS.',
    is_public: true,
    created_by: 'user-123',
    updated_by: null,
    created_at: '2026-05-30T12:00:00Z',
    updated_at: '2026-05-30T12:00:00Z',
  },
  {
    id: 11,
    project_id: 2,
    project_name: 'rust-rays',
    title: 'basic scene with spheres and planes',
    content: 'phong shading, one point light, reflection up to 4 bounces. renders a 800x600 image in ~200ms. good enough to start adding features.',
    is_public: true,
    created_by: 'user-123',
    updated_by: null,
    created_at: '2026-05-25T20:00:00Z',
    updated_at: '2026-05-25T20:00:00Z',
  },
  {
    id: 12,
    project_id: 4,
    project_name: 'dotfiles',
    title: 'ghostty config + theme toggle macro',
    content: 'added ghostty terminal config. wrote a shell function that swaps the terminal theme and sends the new palette via OSC sequences. no restart needed.',
    is_public: true,
    created_by: 'user-123',
    updated_by: null,
    created_at: '2026-05-28T08:42:00Z',
    updated_at: '2026-05-28T08:42:00Z',
  },
  {
    id: 13,
    project_id: 4,
    project_name: 'dotfiles',
    title: 'nix flake update + neovim plugin pin',
    content: 'updated all flake inputs. pinned telescope.nvim to a specific commit because HEAD broke fuzzy matching on long paths.',
    is_public: true,
    created_by: 'user-123',
    updated_by: null,
    created_at: '2026-05-21T14:17:00Z',
    updated_at: '2026-05-21T14:17:00Z',
  },
  {
    id: 14,
    project_id: 4,
    project_name: 'dotfiles',
    title: 'idempotent install script',
    content: 'rewrote install.sh to be fully idempotent. no more symlink manager — just conditional copies and appends. safe to run multiple times.',
    is_public: true,
    created_by: 'user-123',
    updated_by: null,
    created_at: '2026-05-10T11:30:00Z',
    updated_at: '2026-05-10T11:30:00Z',
  },
  {
    id: 15,
    project_id: 3,
    project_name: 'voxel-engine',
    title: 'paused — coming back next month',
    content: 'putting this on hold to focus on checkpoint. greedy meshing works but chunk loading needs a proper job queue before it\'s usable.',
    is_public: true,
    created_by: 'user-123',
    updated_by: null,
    created_at: '2026-05-19T14:11:00Z',
    updated_at: '2026-05-19T14:11:00Z',
  },
  {
    id: 16,
    project_id: 3,
    project_name: 'voxel-engine',
    title: 'greedy meshing reduces triangles 12x',
    content: 'implemented the greedy meshing algorithm. a 16x16x16 chunk at ~50% fill goes from ~24k triangles to ~2k. huge GPU savings.',
    is_public: true,
    created_by: 'user-123',
    updated_by: null,
    created_at: '2026-05-15T16:00:00Z',
    updated_at: '2026-05-15T16:00:00Z',
  },
  {
    id: 17,
    project_id: 5,
    project_name: 'todo-tree',
    title: 'tree view rendering with bubbletea',
    content: 'nested todo items render as an indented tree. collapse/expand with enter key. bubbletea makes the TUI state management surprisingly clean.',
    is_public: true,
    created_by: 'user-123',
    updated_by: null,
    created_at: '2026-03-08T19:00:00Z',
    updated_at: '2026-03-08T19:00:00Z',
  },
  {
    id: 18,
    project_id: 5,
    project_name: 'todo-tree',
    title: 'json persistence for todo state',
    content: 'todos save to ~/.local/share/todo-tree/state.json. loads on startup, writes on every change. no database needed for a CLI tool.',
    is_public: true,
    created_by: 'user-123',
    updated_by: null,
    created_at: '2026-03-05T14:30:00Z',
    updated_at: '2026-03-05T14:30:00Z',
  },
];

export function getDevlogs() {
  return devlogs;
}

export function getDevlogById(id) {
  return devlogs.find((d) => d.id === id) || null;
}

export function getDevlogsByProject(projectId) {
  return devlogs.filter((d) => d.project_id === projectId);
}

export function getDevlogsGroupedByProject() {
  const groups = {};
  for (const d of devlogs) {
    if (!groups[d.project_name]) {
      groups[d.project_name] = { project_id: d.project_id, project_name: d.project_name, entries: [] };
    }
    groups[d.project_name].entries.push(d);
  }
  return Object.values(groups);
}

export function updateDevlog(id, updates) {
  const idx = devlogs.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  devlogs[idx] = { ...devlogs[idx], ...updates, updated_at: new Date().toISOString() };
  return devlogs[idx];
}

export function createDevlog(data) {
  const now = new Date().toISOString();
  const entry = {
    id: Math.max(...devlogs.map((d) => d.id)) + 1,
    is_public: true,
    created_by: 'user-123',
    updated_by: null,
    created_at: now,
    updated_at: now,
    ...data,
  };
  devlogs.unshift(entry);
  return entry;
}

export function deleteDevlog(id) {
  const idx = devlogs.findIndex((d) => d.id === id);
  if (idx !== -1) devlogs.splice(idx, 1);
}
