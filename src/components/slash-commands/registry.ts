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
  {
    id: 'uploadFile',
    title: 'Upload file',
    icon: '📎',
    shortcut: '',
    subtitle: 'Insert file with preview',
    run: (editor) => {
      // This will be handled specially in the Rich Editor
      // The actual file picker will be triggered
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