import { SlashCommand } from './types';

// Basic blocks
export const basicBlocks: SlashCommand[] = [
  {
    id: 'paragraph',
    title: 'Text',
    icon: 'T',
    shortcut: '',
    run: (editor) => {
      editor.chain().focus().setParagraph().run();
    },
  },
  {
    id: 'heading1',
    title: 'Heading 1',
    icon: 'H1',
    shortcut: '#',
    run: (editor) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    },
  },
  {
    id: 'heading2',
    title: 'Heading 2',
    icon: 'H2',
    shortcut: '##',
    run: (editor) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    },
  },
  {
    id: 'heading3',
    title: 'Heading 3',
    icon: 'H3',
    shortcut: '###',
    run: (editor) => {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    },
  },
  {
    id: 'bulletList',
    title: 'Bulleted list',
    icon: '⋅⋅⋅',
    shortcut: '-',
    run: (editor) => {
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    id: 'orderedList',
    title: 'Numbered list',
    icon: '123',
    shortcut: '1.',
    run: (editor) => {
      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    id: 'todoList',
    title: 'To-do list',
    icon: '☐',
    shortcut: '[]',
    run: (editor) => {
      console.log('To-do list command triggered!');

      try {
        // Try to use the task list extension first
        if (editor.can().toggleTaskList && editor.can().toggleTaskList()) {
          console.log('Using task list extension');
          editor.chain().focus().toggleTaskList().run();
        } else {
          console.log('Task list not available, using interactive fallback');
          // Create a simple visible checkbox
          const todoId = `todo-${Date.now()}`;
          const todoHTML = `<p>
            <span class="todo-checkbox" data-todo-id="${todoId}" data-checked="false" style="
              display: inline-block;
              width: 18px;
              height: 18px;
              border: 2px solid #ffffff;
              border-radius: 3px;
              margin-right: 10px;
              cursor: pointer;
              background-color: #2a2a2a;
              position: relative;
              vertical-align: middle;
              line-height: 14px;
              text-align: center;
              font-size: 12px;
              color: #ffffff;
            ">☐</span><span class="todo-text" data-todo-id="${todoId}" style="color: #ffffff;">Task item</span>
          </p>`;

          editor.chain().focus().insertContent(todoHTML).run();
        }
      } catch (error) {
        console.log('Error occurred, using simple fallback:', error);
        // Simple text fallback
        editor.chain().focus().insertContent('☐ Task item').run();
      }
    },
  },
  {
    id: 'toggleList',
    title: 'Toggle list',
    icon: '▶',
    shortcut: '>',
    run: (editor) => {
      // Create a collapsible toggle block
      editor.chain().focus().insertContent('▶ ').run();
    },
  },
];

// Advanced blocks
export const advancedBlocks: SlashCommand[] = [
  {
    id: 'page',
    title: 'Page',
    icon: '📄',
    shortcut: '',
    run: (editor) => {
      editor.chain().focus().insertContent('📄 New Page').run();
    },
  },
  {
    id: 'callout',
    title: 'Callout',
    icon: '💡',
    shortcut: '',
    run: (editor) => {
      editor.chain().focus().insertContent('💡 ').run();
    },
  },
  {
    id: 'quote',
    title: 'Quote',
    icon: '❝',
    shortcut: '"',
    run: (editor) => {
      editor.chain().focus().toggleBlockquote().run();
    },
  },
  {
    id: 'table',
    title: 'Table',
    icon: '⚏',
    shortcut: '',
    run: (editor) => {
      console.log('Table command executed');

      // Try the direct TipTap table insertion first
      try {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        console.log('Table inserted successfully with TipTap extension');

        // Add controls to TipTap table too
        setTimeout(() => {
          const tables = document.querySelectorAll('table:not([data-table-wrapper])');
          tables.forEach((table) => {
            if (!table.parentElement?.classList.contains('table-wrapper')) {
              // Create wrapper
              const wrapper = document.createElement('div');
              wrapper.className = 'table-wrapper';
              table.parentNode?.insertBefore(wrapper, table);
              wrapper.appendChild(table);

              // Add column button
              const addColumnBtn = document.createElement('button');
              addColumnBtn.className = 'add-column-btn';
              addColumnBtn.innerHTML = '+';
              addColumnBtn.setAttribute('title', 'Add column');
              addColumnBtn.onclick = () => {
                if (editor.can().addColumnAfter()) {
                  editor.chain().focus().addColumnAfter().run();
                }
              };
              wrapper.appendChild(addColumnBtn);

              // Add row button
              const addRowBtn = document.createElement('button');
              addRowBtn.className = 'add-row-btn';
              addRowBtn.innerHTML = '+';
              addRowBtn.setAttribute('title', 'Add row');
              addRowBtn.onclick = () => {
                if (editor.can().addRowAfter()) {
                  editor.chain().focus().addRowAfter().run();
                }
              };
              wrapper.appendChild(addRowBtn);
            }
          });
        }, 100);
        return;
      } catch (error) {
        console.log('TipTap table extension failed:', error);
      }

      // If that fails, use HTML insertion with proper structure
      console.log('Using HTML table fallback');
      const tableContent = `
        <table class="notion-table" data-table-wrapper="true">
          <thead>
            <tr class="notion-table-row">
              <th class="notion-table-header">Column 1</th>
              <th class="notion-table-header">Column 2</th>
              <th class="notion-table-header">Column 3</th>
            </tr>
          </thead>
          <tbody>
            <tr class="notion-table-row">
              <td class="notion-table-cell">Cell 1</td>
              <td class="notion-table-cell">Cell 2</td>
              <td class="notion-table-cell">Cell 3</td>
            </tr>
            <tr class="notion-table-row">
              <td class="notion-table-cell">Cell 4</td>
              <td class="notion-table-cell">Cell 5</td>
              <td class="notion-table-cell">Cell 6</td>
            </tr>
          </tbody>
        </table>
      `;

      editor.chain().focus().insertContent(tableContent).run();

      // Add controls after insertion
      setTimeout(() => {
        const tables = document.querySelectorAll('table[data-table-wrapper="true"]');
        tables.forEach((table) => {
          if (!table.parentElement?.classList.contains('table-wrapper')) {
            // Create wrapper
            const wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper';
            table.parentNode?.insertBefore(wrapper, table);
            wrapper.appendChild(table);

            // Add column button
            const addColumnBtn = document.createElement('button');
            addColumnBtn.className = 'add-column-btn';
            addColumnBtn.innerHTML = '+';
            addColumnBtn.setAttribute('title', 'Add column');
            addColumnBtn.onclick = () => window.addTableColumn && (window as any).addTableColumn(addColumnBtn);
            wrapper.appendChild(addColumnBtn);

            // Add row button
            const addRowBtn = document.createElement('button');
            addRowBtn.className = 'add-row-btn';
            addRowBtn.innerHTML = '+';
            addRowBtn.setAttribute('title', 'Add row');
            addRowBtn.onclick = () => window.addTableRow && (window as any).addTableRow(addRowBtn);
            wrapper.appendChild(addRowBtn);
          }
        });
      }, 100);
    },
  },
  {
    id: 'addTableColumn',
    title: 'Add table column',
    icon: '⚏+',
    shortcut: '',
    run: (editor) => {
      try {
        if (editor.can().addColumnAfter()) {
          editor.chain().focus().addColumnAfter().run();
        }
      } catch (error) {
        console.log('Add column not available');
      }
    },
  },
  {
    id: 'addTableRow',
    title: 'Add table row',
    icon: '⚏↓',
    shortcut: '',
    run: (editor) => {
      try {
        if (editor.can().addRowAfter()) {
          editor.chain().focus().addRowAfter().run();
        }
      } catch (error) {
        console.log('Add row not available');
      }
    },
  },
  {
    id: 'deleteTableColumn',
    title: 'Delete table column',
    icon: '⚏-',
    shortcut: '',
    run: (editor) => {
      try {
        if (editor.can().deleteColumn()) {
          editor.chain().focus().deleteColumn().run();
        }
      } catch (error) {
        console.log('Delete column not available');
      }
    },
  },
  {
    id: 'deleteTableRow',
    title: 'Delete table row',
    icon: '⚏↑',
    shortcut: '',
    run: (editor) => {
      try {
        if (editor.can().deleteRow()) {
          editor.chain().focus().deleteRow().run();
        }
      } catch (error) {
        console.log('Delete row not available');
      }
    },
  },
  {
    id: 'divider',
    title: 'Divider',
    icon: '—',
    shortcut: '---',
    run: (editor) => {
      try {
        editor.chain().focus().setHorizontalRule().run();
      } catch (error) {
        // Fallback if horizontal rule extension is not available
        editor.chain().focus().insertContent('\n---\n').run();
      }
    },
  },
  {
    id: 'linkToPage',
    title: 'Link to page',
    icon: '📎',
    shortcut: '++',
    run: (editor) => {
      editor.chain().focus().insertContent('[[Link to page]]').run();
    },
  },
];

// AI section
export const notionAI: SlashCommand[] = [
  {
    id: 'continueWriting',
    title: 'Continue writing',
    icon: '✨',
    shortcut: '',
    run: (editor) => {
      // Placeholder for AI functionality
      editor.chain().focus().insertContent(' [AI continues writing...]').run();
    },
  },
];

export const slashCommands: SlashCommand[] = [
  ...basicBlocks,
  ...advancedBlocks,
  ...notionAI,
];

export const getFilteredCommands = (query: string): SlashCommand[] => {
  if (!query) return slashCommands;

  return slashCommands.filter(command =>
    command.title.toLowerCase().includes(query.toLowerCase())
  );
};

export const getFilteredBasicBlocks = (query: string): SlashCommand[] => {
  if (!query) return basicBlocks;

  return basicBlocks.filter(command =>
    command.title.toLowerCase().includes(query.toLowerCase())
  );
};

export const getFilteredAdvancedBlocks = (query: string): SlashCommand[] => {
  if (!query) return advancedBlocks;

  return advancedBlocks.filter(command =>
    command.title.toLowerCase().includes(query.toLowerCase())
  );
};

export const getFilteredNotionAI = (query: string): SlashCommand[] => {
  if (!query) return notionAI;

  return notionAI.filter(command =>
    command.title.toLowerCase().includes(query.toLowerCase())
  );
};