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
      try {
        // Use the task list extension to create proper TaskList nodes
        if (editor.can().toggleTaskList()) {
          editor.chain().focus().toggleTaskList().run();
        } else {
          // Fallback: insert a paragraph and convert to task list
          editor.chain().focus().insertContent('Task item').toggleTaskList().run();
        }
      } catch (error) {
        // Final fallback if task list extensions are not available
        editor.chain().focus().insertContent('☐ Task item').run();
      }
    },
  },
];

// Text formatting
export const textFormatting: SlashCommand[] = [
  {
    id: 'bold',
    title: 'Bold',
    icon: 'B',
    shortcut: 'Ctrl+B',
    run: (editor) => {
      editor.chain().focus().toggleBold().run();
    },
  },
  {
    id: 'italic',
    title: 'Italic',
    icon: 'I',
    shortcut: 'Ctrl+I',
    run: (editor) => {
      editor.chain().focus().toggleItalic().run();
    },
  },
  {
    id: 'underline',
    title: 'Underline',
    icon: 'U',
    shortcut: 'Ctrl+U',
    run: (editor) => {
      editor.chain().focus().toggleUnderline().run();
    },
  },
  {
    id: 'strikethrough',
    title: 'Strikethrough',
    icon: 'S̶',
    shortcut: 'Ctrl+Shift+S',
    run: (editor) => {
      editor.chain().focus().toggleStrike().run();
    },
  },
];

// Advanced blocks
export const advancedBlocks: SlashCommand[] = [
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
];


export const slashCommands: SlashCommand[] = [
  ...basicBlocks,
  ...textFormatting,
  ...advancedBlocks,
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

export const getFilteredTextFormatting = (query: string): SlashCommand[] => {
  if (!query) return textFormatting;

  return textFormatting.filter(command =>
    command.title.toLowerCase().includes(query.toLowerCase())
  );
};

export const getFilteredAdvancedBlocks = (query: string): SlashCommand[] => {
  if (!query) return advancedBlocks;

  return advancedBlocks.filter(command =>
    command.title.toLowerCase().includes(query.toLowerCase())
  );
};

