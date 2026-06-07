import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '../components/Editor';

export default function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState(null);
  const [status, setStatus] = useState('draft');
  const [wordCount, setWordCount] = useState(0);

  const handleUpdate = useCallback((data) => {
    setContent(data);
    const words = data.text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, []);

  const handleSave = () => {
    setStatus('saving...');
    setTimeout(() => setStatus('saved'), 800);
  };

  const handlePublish = () => {
    setStatus('published');
  };

  return (
    <div className="editorpage-layout">
      <div className="editorpage-head">
        <div className="editorpage-head-left">
          <button className="btn-ghost editorpage-back" onClick={() => navigate(-1)}>
            ← back
          </button>
          <span className="editorpage-status">{status}</span>
        </div>
        <div className="editorpage-head-right">
          <span className="editorpage-wc">{wordCount} words</span>
          <button className="btn-ghost" onClick={handleSave}>save draft</button>
          <button className="btn-primary" onClick={handlePublish}>publish</button>
        </div>
      </div>

      <div className="editorpage-title-wrap">
        <input
          className="editorpage-title"
          placeholder="untitled"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="editorpage-body">
        <Editor onUpdate={handleUpdate} />
      </div>
    </div>
  );
}
