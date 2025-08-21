import React, { useState } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing...",
  rows = 15,
  disabled = false,
}) => {
  const [mode, setMode] = useState<'visual' | 'markdown'>('visual');

  const handleFormatText = (format: string) => {
    const textarea = document.querySelector('.w-tc-editor textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText = '';
    let newCursorPos = start;

    switch (format) {
      case 'bold':
        newText = value.substring(0, start) + `**${selectedText || 'bold text'}**` + value.substring(end);
        newCursorPos = start + (selectedText ? 2 : 10);
        break;
      case 'italic':
        newText = value.substring(0, start) + `*${selectedText || 'italic text'}*` + value.substring(end);
        newCursorPos = start + (selectedText ? 1 : 12);
        break;
      case 'heading':
        const lines = value.split('\n');
        const startLine = value.substring(0, start).split('\n').length - 1;
        lines[startLine] = `# ${lines[startLine] || 'Heading'}`;
        newText = lines.join('\n');
        newCursorPos = start + 2;
        break;
      case 'list':
        newText = value.substring(0, start) + `\n- ${selectedText || 'List item'}` + value.substring(end);
        newCursorPos = start + (selectedText ? 3 : 13);
        break;
      case 'paragraph':
        newText = value.substring(0, start) + `\n\n${selectedText || 'New paragraph'}` + value.substring(end);
        newCursorPos = start + (selectedText ? 2 : 17);
        break;
      default:
        return;
    }

    onChange(newText);
    
    // Reset cursor position after state update
    setTimeout(() => {
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  return (
    <div className="rich-text-editor">
      <div className="editor-toolbar">
        <div className="format-buttons">
          <button
            type="button"
            onClick={() => handleFormatText('bold')}
            className="format-btn"
            title="Bold"
            disabled={disabled}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => handleFormatText('italic')}
            className="format-btn"
            title="Italic"
            disabled={disabled}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => handleFormatText('heading')}
            className="format-btn"
            title="Heading"
            disabled={disabled}
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => handleFormatText('list')}
            className="format-btn"
            title="List"
            disabled={disabled}
          >
            •
          </button>
          <button
            type="button"
            onClick={() => handleFormatText('paragraph')}
            className="format-btn"
            title="Paragraph"
            disabled={disabled}
          >
            ¶
          </button>
        </div>
        
        <div className="mode-switch">
          <button
            type="button"
            className={mode === 'visual' ? 'active' : ''}
            onClick={() => setMode('visual')}
            disabled={disabled}
          >
            Visual
          </button>
          <button
            type="button"
            className={mode === 'markdown' ? 'active' : ''}
            onClick={() => setMode('markdown')}
            disabled={disabled}
          >
            Markdown
          </button>
        </div>
      </div>

      <div className="editor-container">
        {mode === 'visual' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="visual-editor"
            disabled={disabled}
          />
        ) : (
          <CodeEditor
            value={value}
            language="markdown"
            placeholder={placeholder}
            onChange={(evn) => onChange(evn.target.value)}
            padding={15}
            style={{
              fontSize: 14,
              backgroundColor: "#f5f5f5",
              fontFamily: 'ui-monospace,SFMono-Regular,"SF Mono",Consolas,"Liberation Mono",Menlo,monospace',
              minHeight: `${rows * 20}px`,
            }}
            disabled={disabled}
          />
        )}
      </div>

      {mode === 'visual' && (
        <div className="editor-help">
          <p><strong>Formatting Tips:</strong></p>
          <ul>
            <li><strong>**bold**</strong> for bold text</li>
            <li><em>*italic*</em> for italic text</li>
            <li><strong># Heading</strong> for headings</li>
            <li><strong>- List item</strong> for bullet points</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;