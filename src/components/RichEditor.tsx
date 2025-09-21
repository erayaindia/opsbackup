import React, { useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { SlashCommand } from './slash-commands/SlashCommand';
import { SlashCommandMenu, SlashCommandMenuRef } from './slash-commands/SlashCommandMenu';
import { SlashCommand as SlashCommandType } from './slash-commands/types';

// Optional task list extensions - will be loaded dynamically
let TaskList: any = null;
let TaskItem: any = null;

interface RichEditorProps {
  value?: any;
  onChange?: (json: any) => void;
}

export const RichEditor: React.FC<RichEditorProps> = ({ value, onChange }) => {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashRange, setSlashRange] = useState<{ from: number; to: number } | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const menuRef = useRef<SlashCommandMenuRef>(null);
  const [extensionsLoaded, setExtensionsLoaded] = useState(false);

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
        console.log('Task list extensions not available:', error);
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
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'notion-table',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'notion-table-row',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'notion-table-header',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'notion-table-cell',
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
          command: ({ editor, range }: any) => {
            // This will be handled by the menu selection
          },
          render: () => {
            let popup: any = null;

            return {
              onStart: (props: any) => {
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

              onUpdate: (props: any) => {
                setSlashQuery(props.query || '');
                setSlashRange(props.range);
                popup = props;
              },

              onKeyDown: (props: any) => {
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
        console.log('TipTap click handler triggered');
        const target = event.target as HTMLElement;

        if (target.classList.contains('todo-checkbox')) {
          console.log('Todo checkbox clicked in TipTap handler!');
          event.preventDefault();
          event.stopPropagation();

          const todoId = target.getAttribute('data-todo-id');
          const isChecked = target.getAttribute('data-checked') === 'true';
          const newChecked = !isChecked;

          console.log(`Toggling todo ${todoId} from ${isChecked} to ${newChecked}`);

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
  }, [extensionsLoaded, value]);

  const handleSlashCommandSelect = (command: SlashCommandType) => {
    if (editor && slashRange) {
      editor.chain()
        .focus()
        .deleteRange(slashRange)
        .run();

      command.run(editor);
    }
    setShowSlashMenu(false);
  };

  const handleSlashMenuClose = () => {
    setShowSlashMenu(false);
  };

  // Table management functions
  const handleTableAction = (action: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!editor) return;

    switch (action) {
      case 'addColumnBefore':
        editor.chain().focus().addColumnBefore().run();
        break;
      case 'addColumnAfter':
        editor.chain().focus().addColumnAfter().run();
        break;
      case 'addRowBefore':
        editor.chain().focus().addRowBefore().run();
        break;
      case 'addRowAfter':
        editor.chain().focus().addRowAfter().run();
        break;
      case 'deleteColumn':
        editor.chain().focus().deleteColumn().run();
        break;
      case 'deleteRow':
        editor.chain().focus().deleteRow().run();
        break;
      case 'deleteTable':
        editor.chain().focus().deleteTable().run();
        break;
    }
  };

  // Add global functions for table controls
  React.useEffect(() => {
    (window as any).addTableColumn = (buttonElement: HTMLElement) => {
      if (editor) {
        // Find the table and add column
        const tableWrapper = buttonElement.closest('.table-wrapper');
        if (tableWrapper) {
          // Try to focus on the table first
          const table = tableWrapper.querySelector('table');
          if (table) {
            // Use a more direct approach for HTML tables
            const firstRow = table.querySelector('tr');
            if (firstRow) {
              const newHeaderCell = document.createElement('th');
              newHeaderCell.className = 'notion-table-header';
              newHeaderCell.textContent = 'New Column';
              firstRow.appendChild(newHeaderCell);

              // Add cells to all other rows
              const allRows = table.querySelectorAll('tr');
              for (let i = 1; i < allRows.length; i++) {
                const newCell = document.createElement('td');
                newCell.className = 'notion-table-cell';
                newCell.textContent = `Cell ${i}`;
                allRows[i].appendChild(newCell);
              }
            }
          }
        }
      }
    };

    (window as any).addTableRow = (buttonElement: HTMLElement) => {
      if (editor) {
        const tableWrapper = buttonElement.closest('.table-wrapper');
        if (tableWrapper) {
          const table = tableWrapper.querySelector('table tbody');
          if (table) {
            const firstRow = tableWrapper.querySelector('tr');
            const columnCount = firstRow ? firstRow.children.length : 3;

            const newRow = document.createElement('tr');
            newRow.className = 'notion-table-row';

            for (let i = 0; i < columnCount; i++) {
              const newCell = document.createElement('td');
              newCell.className = 'notion-table-cell';
              newCell.textContent = `Cell ${i + 1}`;
              newRow.appendChild(newCell);
            }

            table.appendChild(newRow);
          }
        }
      }
    };

    // Cleanup
    return () => {
      delete (window as any).addTableColumn;
      delete (window as any).addTableRow;
    };
  }, [editor]);

  // Handle clicks on todo checkboxes
  const handleTodoClick = (event: React.MouseEvent) => {
    console.log('Click detected on:', event.target);
    const target = event.target as HTMLElement;

    console.log('Target classes:', target.className);
    console.log('Target classList contains todo-checkbox:', target.classList.contains('todo-checkbox'));

    if (target.classList.contains('todo-checkbox')) {
      console.log('Todo checkbox clicked!');
      event.preventDefault();
      event.stopPropagation();

      const todoId = target.getAttribute('data-todo-id');
      const isChecked = target.getAttribute('data-checked') === 'true';
      const newChecked = !isChecked;

      console.log(`Toggling todo ${todoId} from ${isChecked} to ${newChecked}`);

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

      console.log(`Todo ${todoId} toggled to: ${newChecked}`);
    } else {
      console.log('Click not on todo checkbox');
    }
  };

  return (
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

        /* Table styles */
        .notion-editor-content .table-wrapper {
          position: relative !important;
          margin: 1rem 0 !important;
        }

        .notion-editor-content table,
        .notion-editor-content .notion-table {
          border-collapse: collapse !important;
          width: 100% !important;
          table-layout: fixed !important;
          border: 1px solid #4b5563 !important;
          display: table !important;
          visibility: visible !important;
          position: relative !important;
        }

        /* Add column button */
        .notion-editor-content .add-column-btn {
          position: absolute !important;
          top: 0 !important;
          right: -30px !important;
          width: 24px !important;
          height: 100% !important;
          background: transparent !important;
          border: none !important;
          color: #6b7280 !important;
          cursor: pointer !important;
          opacity: 0 !important;
          transition: all 0.2s ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 16px !important;
          z-index: 10 !important;
          font-weight: bold !important;
        }

        .notion-editor-content .table-wrapper:hover .add-column-btn {
          opacity: 1 !important;
        }

        .notion-editor-content .add-column-btn:hover {
          color: #ffffff !important;
          background: rgba(55, 65, 81, 0.8) !important;
          border-radius: 4px !important;
        }

        /* Add row button */
        .notion-editor-content .add-row-btn {
          position: absolute !important;
          bottom: -30px !important;
          left: 0 !important;
          width: 100% !important;
          height: 24px !important;
          background: transparent !important;
          border: none !important;
          color: #6b7280 !important;
          cursor: pointer !important;
          opacity: 0 !important;
          transition: all 0.2s ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 16px !important;
          z-index: 10 !important;
          font-weight: bold !important;
        }

        .notion-editor-content .table-wrapper:hover .add-row-btn {
          opacity: 1 !important;
        }

        .notion-editor-content .add-row-btn:hover {
          color: #ffffff !important;
          background: rgba(55, 65, 81, 0.8) !important;
          border-radius: 4px !important;
        }

        /* Drag handle for columns */
        .column-drag-handle {
          position: absolute;
          top: -10px;
          left: -5px;
          width: 10px;
          height: 10px;
          background: #6b7280;
          border-radius: 2px;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
          z-index: 15;
        }

        .table-wrapper:hover .column-drag-handle {
          opacity: 1;
        }

        .column-drag-handle:hover {
          background: #ffffff;
        }

        /* Tooltip styles */
        .table-tooltip {
          position: absolute;
          background: #1f2937;
          color: #ffffff;
          padding: 6px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 20;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .add-column-btn:hover + .table-tooltip,
        .add-row-btn:hover + .table-tooltip {
          opacity: 1;
        }

        .notion-editor-content th,
        .notion-editor-content td,
        .notion-editor-content .notion-table-header,
        .notion-editor-content .notion-table-cell {
          border: 1px solid #4b5563 !important;
          padding: 8px 12px !important;
          position: relative !important;
          vertical-align: top !important;
          background-color: #191919 !important;
          color: #ffffff !important;
          min-width: 100px !important;
          min-height: 40px !important;
          display: table-cell !important;
        }

        .notion-editor-content th {
          background-color: #374151 !important;
          font-weight: 600 !important;
          text-align: left !important;
        }

        .notion-editor-content .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(59, 130, 246, 0.3);
          pointer-events: none;
        }

        .notion-editor-content .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: #3b82f6;
          pointer-events: none;
        }

        .notion-editor-content .tableWrapper {
          overflow-x: auto;
        }

        .notion-editor-content .resize-cursor {
          cursor: ew-resize;
          cursor: col-resize;
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

      <div onClick={handleTodoClick}>
        <EditorContent
          editor={editor}
          className="h-full"
        />
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
  );
};

export default RichEditor;