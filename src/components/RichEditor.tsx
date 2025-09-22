import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { SlashCommand } from './slash-commands/SlashCommand';
import { SlashCommandMenu, SlashCommandMenuRef } from './slash-commands/SlashCommandMenu';
import { SlashCommand as SlashCommandType } from './slash-commands/types';
import { LinkPreview } from './LinkPreview';
import {
  EditorContent as EditorContentType,
  EditorRange,
  SlashCommandProps,
  SlashCommandRenderProps,
  SlashCommandKeyDownProps,
  LinkPreview as LinkPreviewType,
  MenuPosition,
  EditorNode,
  EditorClickHandler,
  EditorKeyDownHandler
} from './editor-types';
import { RichEditorErrorBoundary } from './RichEditorErrorBoundary';

// Optional task list extensions - will be loaded dynamically
let TaskList: typeof import('@tiptap/extension-task-list').default | null = null;
let TaskItem: typeof import('@tiptap/extension-task-item').default | null = null;

interface RichEditorProps {
  value?: EditorContentType;
  onChange?: (json: EditorContentType) => void;
}

export const RichEditor: React.FC<RichEditorProps> = ({ value, onChange }) => {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashRange, setSlashRange] = useState<EditorRange | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ top: 0, left: 0 });
  const menuRef = useRef<SlashCommandMenuRef>(null);
  const [extensionsLoaded, setExtensionsLoaded] = useState(false);
  const [linkPreviews, setLinkPreviews] = useState<LinkPreviewType[]>([]);

  // Load task list extensions dynamically
  React.useEffect(() => {
    const loadTaskExtensions = async () => {
      try {
        const [taskListModule, taskItemModule] = await Promise.all([
          import('@tiptap/extension-task-list'),
          import('@tiptap/extension-task-item')
        ]);
        TaskList = taskListModule.default;
        TaskItem = taskItemModule.default;
        setExtensionsLoaded(true);
      } catch (error) {
        // Task list extensions not available, continue without them
        setExtensionsLoaded(true); // Mark as loaded even if failed
      }
    };

    loadTaskExtensions();
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        document: {
          content: 'block*',
        },
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          class: 'notion-link',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      ...(TaskList ? [TaskList] : []),
      ...(TaskItem ? [TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      })] : []),
      SlashCommand.configure({
        suggestion: {
          char: '/',
          allowSpaces: false,
          allowedPrefixes: [' ', '^'],
          startOfLine: false,
          command: ({ editor, range }: SlashCommandProps) => {
            // This will be handled by the menu selection
          },
          render: () => {
            let popup: SlashCommandRenderProps | null = null;

            return {
              onStart: (props: SlashCommandRenderProps) => {
                setShowSlashMenu(true);
                setSlashQuery(props.query || '');
                setSlashRange(props.range);

                // Calculate position
                try {
                  const { selection } = props.editor.state;
                  const coords = props.editor.view.coordsAtPos(selection.from);
                  const editorRect = props.editor.view.dom.getBoundingClientRect();

                  setMenuPosition({
                    top: coords.bottom - editorRect.top + 8,
                    left: coords.left - editorRect.left,
                  });
                } catch (error) {
                  setMenuPosition({ top: 50, left: 50 });
                }

                popup = props;
              },

              onUpdate: (props: SlashCommandRenderProps) => {
                setSlashQuery(props.query || '');
                setSlashRange(props.range);
                popup = props;
              },

              onKeyDown: (props: SlashCommandKeyDownProps) => {
                if (props.event.key === 'Escape') {
                  setShowSlashMenu(false);
                  return true;
                }

                return menuRef.current?.onKeyDown(props.event) ?? false;
              },

              onExit: () => {
                setShowSlashMenu(false);
                popup = null;
              },
            };
          },
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange?.(json);

      // Check for new links and create previews
      detectAndCreateLinkPreviews(editor);
    },
    editorProps: {
      attributes: {
        class: 'notion-editor-content',
      },
      handleKeyDown: (view, event) => {
        // Space key toggles task item when in a task list
        if (event.key === ' ' && event.ctrlKey) {
          const { state, dispatch } = view;
          const { selection } = state;
          const { $from } = selection;

          // Check if we're in a task item
          const taskItem = $from.node($from.depth);
          if (taskItem && taskItem.type.name === 'taskItem') {
            event.preventDefault();
            const tr = state.tr.setNodeMarkup($from.before($from.depth), undefined, {
              ...taskItem.attrs,
              checked: !taskItem.attrs.checked,
            });
            dispatch(tr);
            return true;
          }
        }
        return false;
      },
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement;

        if (target.classList.contains('todo-checkbox')) {
          event.preventDefault();
          event.stopPropagation();

          const todoId = target.getAttribute('data-todo-id');
          const isChecked = target.getAttribute('data-checked') === 'true';
          const newChecked = !isChecked;

          // Find the text element - it should be the next sibling
          const todoText = target.nextElementSibling as HTMLElement;

          // Toggle the checked state
          target.setAttribute('data-checked', newChecked.toString());

          // Update visual appearance
          if (newChecked) {
            // Checked state
            target.style.backgroundColor = '#3b82f6';
            target.style.borderColor = '#3b82f6';
            target.style.color = '#ffffff';
            target.textContent = '✓';

            if (todoText) {
              todoText.style.textDecoration = 'line-through';
              todoText.style.color = '#6b7280';
            }
          } else {
            // Unchecked state
            target.style.backgroundColor = '#2a2a2a';
            target.style.borderColor = '#ffffff';
            target.style.color = '#ffffff';
            target.textContent = '☐';

            if (todoText) {
              todoText.style.textDecoration = 'none';
              todoText.style.color = '#ffffff';
            }
          }

          return true; // Event handled
        }
        return false; // Let TipTap handle other clicks
      },
    },
  }, [extensionsLoaded]);

  // Update content separately to preserve cursor position
  React.useEffect(() => {
    if (!editor || !value) return;

    try {
      const currentContent = editor.getJSON();
      const newContent = JSON.stringify(value);
      const currentContentString = JSON.stringify(currentContent);

      // Only update if content has actually changed
      if (newContent !== currentContentString) {
        const { from, to } = editor.state.selection;

        try {
          editor.commands.setContent(value, false);

          // Try to restore cursor position
          requestAnimationFrame(() => {
            try {
              const docSize = editor.state.doc.content.size;
              if (from <= docSize && to <= docSize) {
                editor.commands.setTextSelection({ from, to });
              } else {
                editor.commands.focus('end');
              }
            } catch (error) {
              // Fallback to end position if cursor restoration fails
              try {
                editor.commands.focus('end');
              } catch (focusError) {
                // Silent fallback if even focus fails
              }
            }
          });
        } catch (contentError) {
          // If content setting fails, try to maintain editor state
          console.warn('Failed to update editor content:', contentError);
        }
      }
    } catch (error) {
      // Log error but don't crash the component
      console.warn('Editor content update error:', error);
    }
  }, [editor, value]);

  const handleSlashCommandSelect = useCallback((command: SlashCommandType) => {
    if (!editor || !slashRange) return;

    try {
      editor.chain()
        .focus()
        .deleteRange(slashRange)
        .run();

      command.run(editor);
    } catch (error) {
      console.warn('Failed to execute slash command:', error);
    } finally {
      setShowSlashMenu(false);
    }
  }, [editor, slashRange]);

  const handleSlashMenuClose = () => {
    setShowSlashMenu(false);
  };

  const detectAndCreateLinkPreviews = useCallback((editor: Editor) => {
    try {
      const doc = editor.state.doc;
      const linkUrls: string[] = [];

      doc.descendants((node: EditorNode) => {
        if (node.marks) {
          node.marks.forEach((mark) => {
            if (mark.type.name === 'link' && mark.attrs?.href) {
              const href = mark.attrs.href;
              if (typeof href === 'string' && href.startsWith('http')) {
                linkUrls.push(href);
              }
            }
          });
        }
      });

      // Remove duplicates and update link previews state
      const uniqueUrls = Array.from(new Set(linkUrls));
      const newPreviews = uniqueUrls.map((url, index) => ({
        url,
        id: `link-${url.replace(/[^a-zA-Z0-9]/g, '-')}-${index}`,
      }));

      setLinkPreviews(newPreviews);
    } catch (error) {
      // Silently handle link detection errors
      setLinkPreviews([]);
    }
  }, []);

  const handleLinkPreviewClose = useCallback((id: string) => {
    setLinkPreviews(prev => prev.filter(preview => preview.id !== id));
  }, []);

  const EditorComponent = useMemo(() => (
    <div className="notion-editor h-full relative bg-[#191919]">
      <style jsx global>{`
        .notion-editor-content {
          outline: none;
          padding: 60px 96px 200px;
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif;
          line-height: 1.5;
          font-size: 16px;
          min-height: 100vh;
        }

        .notion-editor-content .ProseMirror {
          outline: none;
        }

        .notion-editor-content p {
          margin: 3px 0;
          line-height: 1.5;
          color: #ffffff;
        }

        .notion-editor-content p.is-editor-empty:first-child::before {
          content: "Type '/' for commands";
          float: left;
          color: #6b7280;
          pointer-events: none;
          height: 0;
        }

        .notion-editor-content h1 {
          font-size: 2.5em;
          font-weight: 700;
          margin: 1em 0 0.5em;
          color: #ffffff;
          line-height: 1.2;
        }

        .notion-editor-content h2 {
          font-size: 1.875em;
          font-weight: 600;
          margin: 1.4em 0 0.5em;
          color: #ffffff;
          line-height: 1.3;
        }

        .notion-editor-content h3 {
          font-size: 1.5em;
          font-weight: 600;
          margin: 1em 0 0.5em;
          color: #ffffff;
          line-height: 1.3;
        }

        .notion-editor-content strong {
          font-weight: 700;
          color: #ffffff;
        }

        .notion-editor-content em {
          font-style: italic;
          color: #ffffff;
        }

        .notion-editor-content ul {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        .notion-editor-content ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        .notion-editor-content li {
          margin: 0.25em 0;
          color: #ffffff;
        }

        .notion-editor-content ul li {
          list-style-type: disc;
        }

        .notion-editor-content ol li {
          list-style-type: decimal;
        }

        .notion-editor-content ul li::marker {
          color: #6b7280;
        }

        .notion-editor-content ol li::marker {
          color: #6b7280;
        }

        /* Task list styles */
        .notion-editor-content ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }

        .notion-editor-content li[data-type="taskItem"] {
          display: flex;
          align-items: flex-start;
          margin: 0.25em 0;
        }

        .notion-editor-content li[data-type="taskItem"] > label {
          flex-shrink: 0;
          margin-right: 0.5em;
          margin-top: 0.125em;
          user-select: none;
        }

        .notion-editor-content li[data-type="taskItem"] > label > input[type="checkbox"] {
          appearance: none;
          background-color: transparent;
          border: 2px solid #6b7280;
          border-radius: 3px;
          width: 1em;
          height: 1em;
          cursor: pointer;
          position: relative;
          margin: 0;
        }

        .notion-editor-content li[data-type="taskItem"] > label > input[type="checkbox"]:checked {
          background-color: #3b82f6;
          border-color: #3b82f6;
        }

        .notion-editor-content li[data-type="taskItem"] > label > input[type="checkbox"]:checked::before {
          content: "✓";
          color: white;
          font-size: 0.75em;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          line-height: 1;
        }

        .notion-editor-content li[data-type="taskItem"] > div {
          flex: 1;
          min-width: 0;
        }

        .notion-editor-content li[data-type="taskItem"][data-checked="true"] > div {
          text-decoration: line-through;
          color: #6b7280;
        }

        .notion-editor-content li[data-type="taskItem"] ul {
          margin-top: 0.25em;
          padding-left: 1.5em;
        }

        .notion-editor-content blockquote {
          border-left: 3px solid #6b7280;
          padding-left: 1em;
          margin: 1em 0;
          color: #d1d5db;
          font-style: italic;
        }

        .notion-editor-content code {
          background: #374151;
          color: #f87171;
          padding: 0.125em 0.25em;
          border-radius: 0.25em;
          font-family: "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", monospace;
          font-size: 0.85em;
        }

        .notion-editor-content pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 1em;
          border-radius: 0.5em;
          margin: 1em 0;
          overflow-x: auto;
        }

        .notion-editor-content pre code {
          background: none;
          color: inherit;
          padding: 0;
          border-radius: 0;
        }

        /* Blockquote styles */
        .notion-editor-content blockquote {
          border-left: 3px solid #6b7280;
          padding-left: 1em;
          margin: 1em 0;
          color: #d1d5db;
          font-style: italic;
        }

        /* Horizontal rule styles */
        .notion-editor-content hr {
          border: none;
          border-top: 1px solid #4b5563;
          margin: 2em 0;
        }

        /* Callout styles */
        .notion-editor-content .callout {
          background: #374151;
          border-left: 3px solid #60a5fa;
          padding: 1em;
          margin: 1em 0;
          border-radius: 0.25em;
        }

        /* Selection styles */
        .notion-editor-content ::selection {
          background: rgba(46, 170, 220, 0.2);
        }

        /* Custom Todo Checkbox Styles */
        .notion-editor-content .todo-checkbox {
          display: inline-block !important;
          width: 18px !important;
          height: 18px !important;
          border: 2px solid #ffffff !important;
          border-radius: 3px !important;
          margin-right: 10px !important;
          cursor: pointer !important;
          background-color: #2a2a2a !important;
          position: relative !important;
          vertical-align: middle !important;
          line-height: 14px !important;
          text-align: center !important;
          font-size: 12px !important;
          color: #ffffff !important;
          transition: all 0.2s ease !important;
          user-select: none !important;
        }

        .notion-editor-content .todo-checkbox:hover {
          border-color: #9ca3af !important;
          background-color: #3a3a3a !important;
        }

        .notion-editor-content .todo-text {
          color: #ffffff !important;
          transition: all 0.2s ease !important;
        }

        /* Link styles */
        .notion-editor-content .notion-link {
          color: #60a5fa !important;
          text-decoration: underline !important;
          cursor: pointer !important;
          transition: color 0.2s ease !important;
        }

        .notion-editor-content .notion-link:hover {
          color: #93c5fd !important;
          text-decoration: underline !important;
        }

        .notion-editor-content .notion-link:visited {
          color: #a78bfa !important;
        }

        /* Link preview styles */
        .link-preview-card {
          position: relative;
          margin: 8px 0;
          background: #2a2a2a;
          border: 1px solid #374151;
          border-radius: 8px;
          overflow: hidden;
          max-width: 500px;
        }

        .link-preview-card:hover {
          border-color: #4b5563;
          background: #333333;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }



        /* Placeholder when empty */
        .notion-editor-content .is-empty::before {
          content: "Type '/' for commands";
          float: left;
          color: #6b7280;
          pointer-events: none;
          height: 0;
        }
      `}</style>

      <div>
        <EditorContent
          editor={editor}
          className="h-full"
        />

        {/* Link Previews */}
        {linkPreviews.length > 0 && (
          <div className="link-previews-container" style={{ marginTop: '16px' }}>
            {linkPreviews.map((preview) => (
              <LinkPreview
                key={preview.id}
                url={preview.url}
                onClose={() => handleLinkPreviewClose(preview.id)}
              />
            ))}
          </div>
        )}
      </div>

      {showSlashMenu && (
        <div
          className="absolute z-50"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          <SlashCommandMenu
            ref={menuRef}
            query={slashQuery}
            onSelect={handleSlashCommandSelect}
            onClose={handleSlashMenuClose}
          />
        </div>
      )}
    </div>
  ), [editor, linkPreviews, showSlashMenu, menuPosition, slashQuery, handleLinkPreviewClose, handleSlashCommandSelect]);

  return (
    <RichEditorErrorBoundary>
      {EditorComponent}
    </RichEditorErrorBoundary>
  );
};

export default RichEditor;