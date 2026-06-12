import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const projectOptions = [
  { name: 'checkpoint', entries: 86, last: 'last 2h ago' },
  { name: 'rust-rays', entries: 64, last: 'last yesterday' },
  { name: 'dotfiles', entries: 38, last: 'last 5d ago' },
  { name: 'voxel-engine', entries: 25, last: 'paused' },
];

const recentEntries = [
  { time: '11:08', msg: 'fuzzy finder modal opens on cmd+k' },
  { time: '09:14', msg: 'rewrote header as floating notch' },
  { time: 'yest.', msg: 'shipped articles category filter' },
  { time: 'yest.', msg: 'decided on roboto mono globally' },
];

export default function UserNewDevlogPage() {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState('checkpoint');
  const [message, setMessage] = useState('');

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="dl-modal-wrap">
      <div className="dl-modal">
        <div className="dl-modal-head">
          <span className="accent">+</span>
          <span>new devlog</span>
          <span className="dim">· short note · auto-timestamped</span>
          <span className="dl-modal-x dim" onClick={() => navigate('/user/devlogs')}>esc</span>
        </div>

        <div className="dl-modal-body">
          <div className="comp-field">
            <span className="comp-field-label">project <span className="accent">*</span></span>
            <div className="dl-proj-list">
              {projectOptions.map((p) => (
                <div
                  key={p.name}
                  className={'dl-proj-row' + (p.name === selectedProject ? ' active' : '')}
                  onClick={() => setSelectedProject(p.name)}
                >
                  <span>~/{p.name}</span>
                  <span className="dim">{p.entries} entries · {p.last}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="comp-field">
            <span className="comp-field-label">what'd you do?</span>
            <textarea
              className="dl-modal-input"
              placeholder="describe what you worked on..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="dim" style={{ fontSize: 11, marginTop: 6 }}>
              supports markdown · keep it short
            </div>
          </div>

          <div className="comp-field">
            <span className="comp-field-label">tags</span>
            <div className="comp-tags">
              <span className="art-tag-add">+ add</span>
            </div>
          </div>

          <div className="dl-meta-row dim">
            <span>{timestamp} (auto)</span>
            <span>·</span>
            <span>linked to ~/{selectedProject}</span>
          </div>
        </div>

        <div className="dl-modal-foot">
          <span className="dim">⌘↵ save · esc cancel</span>
          <div className="comp-bar-right">
            <button className="btn-ghost" onClick={() => navigate('/user/devlogs')}>cancel</button>
            <button className="btn-primary">save entry</button>
          </div>
        </div>
      </div>

      <div className="dl-modal-side">
        <div className="comp-panel">
          <div className="panel-head">// recent in ~/{selectedProject}</div>
          <ul className="dl-modal-recent">
            {recentEntries.map((e, i) => (
              <li key={i}><span className="dim">{e.time}</span> {e.msg}</li>
            ))}
          </ul>
        </div>
        <div className="comp-panel">
          <div className="panel-head">// streak</div>
          <div className="dash-streak-value">14 <span className="dim">days</span></div>
          <div className="dim" style={{ fontSize: 11 }}>keep it going. one entry counts.</div>
        </div>
      </div>
    </div>
  );
}
