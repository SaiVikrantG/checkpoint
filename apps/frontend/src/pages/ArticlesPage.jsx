import { useState } from 'react';

const categories = [
  { name: 'all', count: 24 },
  { name: 'checkpoint', count: 6 },
  { name: 'rust-rays', count: 4 },
  { name: 'voxel-engine', count: 3 },
  { name: 'dotfiles', count: 5 },
  { name: 'misc', count: 6 },
];

const articles = [
  { date: '2026-05-28', title: 'designing a notch header in css', read: '4 min', tags: ['css', 'layout'], cat: 'checkpoint' },
  { date: '2026-05-19', title: 'the case for plain markdown', read: '7 min', tags: ['writing'], cat: 'misc' },
  { date: '2026-05-02', title: 'raymarching, but slowly', read: '12 min', tags: ['graphics', 'rust'], cat: 'rust-rays' },
  { date: '2026-04-21', title: 'a tiny job queue in 200 lines', read: '9 min', tags: ['systems'], cat: 'misc' },
  { date: '2026-04-04', title: 'why i rewrote my dotfiles (again)', read: '5 min', tags: ['dotfiles'], cat: 'dotfiles' },
  { date: '2026-03-12', title: 'voxel meshing without the pain', read: '11 min', tags: ['graphics'], cat: 'voxel-engine' },
  { date: '2026-02-28', title: 'what i learned shipping checkpoint v0', read: '6 min', tags: ['checkpoint'], cat: 'checkpoint' },
];

const sorts = ['newest', 'oldest', 'read time'];

export default function ArticlesPage() {
  const [activeCat, setActiveCat] = useState('all');
  const [activeSort, setActiveSort] = useState('newest');
  const [search, setSearch] = useState('');

  let filtered = activeCat === 'all'
    ? articles
    : articles.filter((a) => a.cat === activeCat);

  if (search) {
    filtered = filtered.filter((a) =>
      a.title.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (activeSort === 'oldest') {
    filtered = [...filtered].reverse();
  } else if (activeSort === 'read time') {
    filtered = [...filtered].sort((a, b) => parseInt(a.read) - parseInt(b.read));
  }

  return (
    <div className="art-layout">
      <aside className="art-rail">
        <div className="rail-eyebrow">// category</div>
        <ul className="rail-list">
          {categories.map((c) => (
            <li
              key={c.name}
              className={'rail-item' + (c.name === activeCat ? ' active' : '')}
              onClick={() => setActiveCat(c.name)}
            >
              <span className="rail-bullet">{c.name === activeCat ? '▸' : '·'}</span>
              <span className="rail-name">{c.name}</span>
              <span className="rail-count">{c.count}</span>
            </li>
          ))}
        </ul>
        <div className="rail-eyebrow rail-eyebrow-2">// sort</div>
        <div className="rail-sort">
          {sorts.map((s) => (
            <button
              key={s}
              className={'chip' + (s === activeSort ? ' chip-active' : '')}
              onClick={() => setActiveSort(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </aside>

      <section className="art-main">
        <div className="art-head">
          <h1 className="art-h1">articles</h1>
          <div className="art-search">
            <span className="kbd">/</span>
            <input
              className="art-search-input"
              placeholder="filter by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="art-search-count">{filtered.length} results</span>
          </div>
        </div>

        <ul className="art-list">
          {filtered.map((a, i) => (
            <li key={i} className="art-row">
              <span className="art-date">{a.date}</span>
              <span className="art-title">{a.title}</span>
              <span className="art-tags">
                {a.tags.map((t) => (
                  <span key={t} className="art-tag">#{t}</span>
                ))}
              </span>
              <span className="art-read">{a.read}</span>
              <span className="art-arrow">&rarr;</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
