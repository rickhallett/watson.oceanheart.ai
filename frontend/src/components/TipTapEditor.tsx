import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

const TipTapEditor: React.FC = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start editing your clinical review...',
      }),
    ],
    content: `
      <h2>Clinical Review Template</h2>
      <p>Use this editor to review and edit LLM-generated clinical summaries.</p>
      <p>Key features:</p>
      <ul>
        <li>Rich text editing with formatting</li>
        <li>Real-time diff computation</li>
        <li>Label classification system</li>
        <li>Export functionality</li>
      </ul>
    `,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4 border border-gray-300 rounded-lg',
      },
    },
  });

  return (
    <div className="tiptap-editor">
      <div className="editor-toolbar">
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={editor?.isActive('bold') ? 'is-active' : ''}
          disabled={!editor?.can().chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={editor?.isActive('italic') ? 'is-active' : ''}
          disabled={!editor?.can().chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          className={editor?.isActive('strike') ? 'is-active' : ''}
          disabled={!editor?.can().chain().focus().toggleStrike().run()}
        >
          Strike
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor?.isActive('heading', { level: 2 }) ? 'is-active' : ''}
        >
          H2
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={editor?.isActive('bulletList') ? 'is-active' : ''}
        >
          Bullet List
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default TipTapEditor;