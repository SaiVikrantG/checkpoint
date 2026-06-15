import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

export default function Editor({ content = '', onUpdate, collaborative = false }) {
  const extensions = [
    StarterKit.configure({
      codeBlock: false,
    }),
    Placeholder.configure({
      placeholder: 'start writing...',
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
    }),
    Image,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    CodeBlockLowlight.configure({
      lowlight,
    }),
  ];

  const editor = useEditor({
    extensions,
    content,
    onUpdate: ({ editor }) => {
      onUpdate?.({
        html: editor.getHTML(),
        json: editor.getJSON(),
        text: editor.getText(),
      });
    },
    editorProps: {
      attributes: {
        class: 'editor-content',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="editor-wrap">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

const LANGUAGES = ['plaintext', 'javascript', 'typescript', 'go', 'python', 'html', 'css', 'sql', 'bash', 'json', 'mermaid'];

function EditorToolbar({ editor }) {
  const btn = (label, action, isActive) => (
    <button
      className={'toolbar-btn' + (isActive ? ' active' : '')}
      onClick={action}
      tabIndex={-1}
      title={label}
    >
      {label}
    </button>
  );

  const inCodeBlock = editor.isActive('codeBlock');
  const currentLang = inCodeBlock ? (editor.getAttributes('codeBlock').language || 'plaintext') : null;

  return (
    <div className="editor-toolbar">
      <div className="toolbar-group">
        {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
        {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
        {btn('S', () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}
        {btn('`', () => editor.chain().focus().toggleCode().run(), editor.isActive('code'))}
      </div>
      <span className="toolbar-sep" />
      <div className="toolbar-group">
        {btn('H1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
        {btn('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
        {btn('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
      </div>
      <span className="toolbar-sep" />
      <div className="toolbar-group">
        {btn('•', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
        {btn('1.', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
        {btn('☐', () => editor.chain().focus().toggleTaskList().run(), editor.isActive('taskList'))}
      </div>
      <span className="toolbar-sep" />
      <div className="toolbar-group">
        {btn('—', () => editor.chain().focus().setHorizontalRule().run(), false)}
        {btn('< >', () => editor.chain().focus().toggleCodeBlock().run(), inCodeBlock)}
        {btn('"', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
      </div>
      {inCodeBlock && (
        <>
          <span className="toolbar-sep" />
          <select
            className="toolbar-lang-select"
            value={currentLang}
            onChange={(e) => editor.chain().focus().updateAttributes('codeBlock', { language: e.target.value }).run()}
          >
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </>
      )}
    </div>
  );
}
