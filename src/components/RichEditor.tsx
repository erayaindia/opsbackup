import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Extension } from '@tiptap/core';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  CheckSquare,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Search,
  Link as LinkIcon,
  Replace
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SlashCommand } from './slash-commands/SlashCommand';
import { SlashCommandMenu, SlashCommandMenuRef } from './slash-commands/SlashCommandMenu';
import { SlashCommand as SlashCommandType } from './slash-commands/types';
import {
  EditorContent as EditorContentType,
  EditorRange,
  SlashCommandProps,
  SlashCommandRenderProps,
  SlashCommandKeyDownProps,
  MenuPosition,
  EditorNode,
  EditorClickHandler,
  EditorKeyDownHandler
} from './editor-types';
import { RichEditorErrorBoundary } from './RichEditorErrorBoundary';

// Optional task list extensions - will be loaded dynamically
let TaskList: typeof import('@tiptap/extension-task-list').default | null = null;
let TaskItem: typeof import('@tiptap/extension-task-item').default | null = null;

// Custom keyboard shortcuts extension
const KeyboardShortcuts = Extension.create({
  name: 'keyboardShortcuts',

  addKeyboardShortcuts() {
    return {
      'Mod-b': () => {
        this.editor.chain().focus().toggleBold().run();
        return true;
      },
      'Mod-i': () => {
        this.editor.chain().focus().toggleItalic().run();
        return true;
      },
      'Mod-u': () => {
        this.editor.chain().focus().toggleUnderline().run();
        return true;
      },
      'Mod-Shift-s': () => {
        this.editor.chain().focus().toggleStrike().run();
        return true;
      },
      'Mod-k': () => {
        const url = window.prompt('Enter URL:');
        if (url) {
          const { from, to } = this.editor.state.selection;
          const text = this.editor.state.doc.textBetween(from, to);
          if (text) {
            this.editor.chain().focus().setLink({ href: url }).run();
          } else {
            this.editor.chain().focus().insertContent(`<a href="${url}" class="notion-link" target="_blank" rel="noopener noreferrer">${url}</a>`).run();
          }
        }
        return true;
      },
    };
  },
});

// Custom clean link prevention extension
const LinkCleanup = Extension.create({
  name: 'linkCleanup',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('linkCleanup'),
        props: {
          handleKeyDown: (view, event) => {
            const { state, dispatch } = view;
            const { selection } = state;
            const { $from } = selection;

            // If we're typing a space or enter after a link, break out of it
            if (event.key === ' ' || event.key === 'Enter') {
              const linkMark = $from.marks().find(mark => mark.type.name === 'link');
              if (linkMark) {
                // Remove the stored link mark so new text won't be linked
                const tr = state.tr.removeStoredMark(linkMark.type);
                dispatch(tr);
                return false;
              }
            }

            return false;
          },
          handleTextInput: (view, from, to, text) => {
            const { state, dispatch } = view;
            const { selection } = state;
            const { $from } = selection;

            // If we're typing regular text after a link, break out of it
            const linkMark = $from.marks().find(mark => mark.type.name === 'link');
            if (linkMark && text !== ' ') {
              // Check if we're at the end of the link content
              const pos = $from.pos;
              const beforePos = Math.max(0, pos - 1);
              const textBefore = state.doc.textBetween(beforePos, pos);

              // If the previous character is not a space and we're still in a link mark,
              // and we're typing new content, break out of the link
              if (textBefore && textBefore !== ' ') {
                const tr = state.tr.removeStoredMark(linkMark.type);
                dispatch(tr);
                return false;
              }
            }

            // Simple URL auto-detection - only when typing space after a URL
            if (text === ' ') {
              const pos = $from.pos;
              const textContent = $from.node().textContent;
              const words = textContent.slice(0, $from.parentOffset).split(/\s+/);
              const lastWord = words[words.length - 1];

              // Check if the last word looks like a URL
              if (lastWord && (
                /^https?:\/\/[^\s]+$/i.test(lastWord) ||
                /^www\.[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/i.test(lastWord) ||
                /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.(com|org|net|edu|gov|io|ai|app|dev)$/i.test(lastWord)
              )) {
                const startPos = pos - lastWord.length;
                const endPos = pos;
                const href = lastWord.startsWith('http') ? lastWord : `https://${lastWord}`;

                const tr = state.tr.addMark(
                  startPos,
                  endPos,
                  state.schema.marks.link.create({ href })
                );
                dispatch(tr);
                return false;
              }
            }

            return false;
          },
        },
      }),
    ];
  },
});

interface RichEditorProps {
  value?: EditorContentType;
  onChange?: (json: EditorContentType) => void;
  disableUndoRedo?: boolean;
  hideToolbar?: boolean;
  placeholder?: string;
  className?: string;
}

export const RichEditor: React.FC<RichEditorProps> = ({
  value,
  onChange,
  disableUndoRedo = false,
  hideToolbar = false,
  placeholder,
  className
}) => {
  // Debug logging
  console.log('RichEditor initialized, Link extension should be loaded');
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashRange, setSlashRange] = useState<EditorRange | null>(null);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ top: 0, left: 0 });
  const menuRef = useRef<SlashCommandMenuRef>(null);
  const [extensionsLoaded, setExtensionsLoaded] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const findReplaceRef = useRef<HTMLDivElement>(null);

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

  // Cleanup search timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle click outside to close find and replace modal
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFindReplace && findReplaceRef.current && !findReplaceRef.current.contains(event.target as Node)) {
        setShowFindReplace(false);
      }
    };

    if (showFindReplace) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFindReplace]);

  // Helper function to convert content to proper format for editor
  const normalizeContent = React.useCallback((content: any) => {
    if (!content) return '';

    // If it's a string that looks like JSON, try to parse it
    if (typeof content === 'string') {
      // Check if it's a JSON string representing TipTap document
      if (content.startsWith('{"type":"doc"') || content.startsWith('{\"type\":\"doc\"')) {
        try {
          const parsed = JSON.parse(content);
          // Validate that it's a proper TipTap document structure
          if (parsed && typeof parsed === 'object' && parsed.type === 'doc') {
            return parsed;
          }
          return content;
        } catch (e) {
          // If parsing fails, return as HTML string
          return content;
        }
      }
      // Regular HTML string or plain text
      return content;
    }

    // If it's already a JSON object, validate and return as-is
    if (typeof content === 'object' && content !== null) {
      // If it has the proper document structure, return it
      if (content.type === 'doc') {
        return content;
      }
      // If it's some other object, stringify and return
      return JSON.stringify(content);
    }

    return '';
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        document: {
          content: 'block*',
        },
        // Allow HTML to preserve formatting
        parseOptions: {
          preserveWhitespace: 'full',
        },
        // Enable HTML support
        enableInputRules: true,
        enablePasteRules: true,
        // Configure history properly with StarterKit
        history: disableUndoRedo ? false : {
          depth: 100,
          newGroupDelay: 500,
        },
        // Disable link to configure separately
        link: false,
      }),
      Link.configure({
        openOnClick: true,
        autolink: false,
        defaultProtocol: 'https',
        linkOnPaste: false, // Disable automatic paste linking
        HTMLAttributes: {
          class: 'notion-link',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        protocols: ['http', 'https', 'ftp', 'mailto'],
        validate: (url) => {
          return /^https?:\/\//.test(url) || /^mailto:/.test(url) || /^ftp:\/\//.test(url);
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      Placeholder.configure({
        placeholder: placeholder || '',
      }),
      KeyboardShortcuts,
      LinkCleanup,
      /*
      Link Href Syncing Implementation Test Cases:

      1. Edit existing link text:
         - Type "www.youtube.com" - becomes link with href="https://www.youtube.com"
         - Edit to "www.erayastyle.com" - href automatically updates to "https://www.erayastyle.com"

      2. Remove link formatting:
         - Edit link text to "not a url anymore" - link mark gets removed completely

      3. Auto-link detection:
         - Type "google.com" - automatically becomes link with href="https://google.com"
         - Paste "https://example.com" - becomes clickable link

      4. Boundary handling:
         - Backspace/delete at link edges properly updates href for remaining text
         - Partial edits within link maintain sync between visible text and href
      */
      Underline,
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

                // Calculate position using viewport coordinates
                try {
                  const { selection } = props.editor.state;
                  const coords = props.editor.view.coordsAtPos(selection.from);

                  // Use viewport coordinates for fixed positioning
                  const viewportTop = coords.bottom + 8;
                  const viewportLeft = coords.left;

                  // Ensure menu doesn't go off screen
                  const menuWidth = 460; // SlashCommandMenu width
                  const menuHeight = 400; // Approximate max height
                  const screenWidth = window.innerWidth;
                  const screenHeight = window.innerHeight;

                  let adjustedLeft = viewportLeft;
                  let adjustedTop = viewportTop;

                  // Adjust if menu goes off right edge
                  if (adjustedLeft + menuWidth > screenWidth) {
                    adjustedLeft = screenWidth - menuWidth - 20;
                  }

                  // Adjust if menu goes off bottom edge
                  if (adjustedTop + menuHeight > screenHeight) {
                    adjustedTop = coords.top - menuHeight - 8; // Show above cursor
                  }

                  setMenuPosition({
                    top: Math.max(10, adjustedTop),
                    left: Math.max(10, adjustedLeft),
                  });
                } catch (error) {
                  setMenuPosition({ top: 100, left: 100 });
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
    content: normalizeContent(value),
    parseOptions: {
      preserveWhitespace: 'full',
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange?.(json);

    },
    editorProps: {
      attributes: {
        class: 'notion-editor-content',
      },
      handleKeyDown: (view, event) => {
        const { state, dispatch } = view;
        const { selection } = state;
        const { $from } = selection;

        // Check if we're in a task item
        const taskItem = $from.node($from.depth);
        const isInTaskItem = taskItem && taskItem.type.name === 'taskItem';

        // Space key toggles task item when in a task list
        if (event.key === ' ' && event.ctrlKey && isInTaskItem) {
          event.preventDefault();
          const tr = state.tr.setNodeMarkup($from.before($from.depth), undefined, {
            ...taskItem.attrs,
            checked: !taskItem.attrs.checked,
          });
          dispatch(tr);
          return true;
        }

        // Enter key in task item creates new task
        if (event.key === 'Enter' && !event.shiftKey && isInTaskItem) {
          if (editor && editor.can().splitListItem('taskItem')) {
            event.preventDefault();
            editor.chain().focus().splitListItem('taskItem').run();
            return true;
          }
        }

        // Shift+Enter creates newline within task content
        if (event.key === 'Enter' && event.shiftKey && isInTaskItem) {
          event.preventDefault();
          editor?.chain().focus().setHardBreak().run();
          return true;
        }

        // Backspace at start of empty task converts to paragraph
        if (event.key === 'Backspace' && isInTaskItem && selection.empty && $from.parentOffset === 0) {
          const taskContent = taskItem.content;
          if (taskContent.size === 0) {
            event.preventDefault();
            if (editor?.can().liftListItem('taskItem')) {
              editor.chain().focus().liftListItem('taskItem').run();
            } else {
              editor?.chain().focus().setParagraph().run();
            }
            return true;
          }
        }

        // Tab for indenting tasks
        if (event.key === 'Tab' && !event.shiftKey && isInTaskItem) {
          if (editor?.can().sinkListItem('taskItem')) {
            event.preventDefault();
            editor.chain().focus().sinkListItem('taskItem').run();
            return true;
          }
        }

        // Shift+Tab for outdenting tasks
        if (event.key === 'Tab' && event.shiftKey && isInTaskItem) {
          if (editor?.can().liftListItem('taskItem')) {
            event.preventDefault();
            editor.chain().focus().liftListItem('taskItem').run();
            return true;
          }
        }

        // Keep only find & replace and undo/redo shortcuts in editorProps
        if (event.ctrlKey || event.metaKey) {
          switch (event.key.toLowerCase()) {
            case 'z':
              if (!disableUndoRedo) {
                if (event.shiftKey) {
                  // Ctrl+Shift+Z for redo (alternative to Ctrl+Y)
                  event.preventDefault();
                  editor?.chain().focus().redo().run();
                  return true;
                } else {
                  // Ctrl+Z for undo
                  event.preventDefault();
                  editor?.chain().focus().undo().run();
                  return true;
                }
              }
              break;
            case 'y':
              if (!disableUndoRedo) {
                // Ctrl+Y for redo
                event.preventDefault();
                editor?.chain().focus().redo().run();
                return true;
              }
              break;
            case 'f':
              // Ctrl+F for find & replace
              event.preventDefault();
              setShowFindReplace(true);
              return true;
          }
        }

        return false;
      },
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement;

        // Allow link clicks to pass through
        if (target.classList.contains('notion-link') || target.tagName === 'A') {
          return false; // Let the browser handle link clicks
        }

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
  }, [extensionsLoaded, disableUndoRedo]);

  // Update editor content when value prop changes
  React.useEffect(() => {
    if (!editor || value === undefined) return;

    try {
      const normalizedContent = normalizeContent(value);
      const currentContent = editor.getJSON();

      // Only update if content is actually different
      if (JSON.stringify(normalizedContent) !== JSON.stringify(currentContent)) {
        // Store current cursor position
        const { from, to } = editor.state.selection;

        // Set the normalized content
        editor.commands.setContent(normalizedContent, false);

        // Try to restore cursor position if it's valid
        requestAnimationFrame(() => {
          try {
            const docSize = editor.state.doc.content.size;
            if (from <= docSize && to <= docSize) {
              editor.commands.setTextSelection({ from, to });
            }
          } catch (error) {
            // Silent fallback if cursor restoration fails
          }
        });
      }
    } catch (error) {
      console.warn('Editor content update error:', error);
    }
  }, [editor, value, normalizeContent]);

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


  // Find and replace helper functions
  const countMatches = useCallback((searchText: string) => {
    if (!editor || !searchText) {
      setTotalMatches(0);
      setCurrentMatch(0);
      return;
    }

    const content = editor.state.doc.textContent;
    const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = content.match(regex);
    const matchCount = matches ? matches.length : 0;

    setTotalMatches(matchCount);
    setCurrentMatch(0);
  }, [editor]);

  const findInEditor = useCallback((searchText: string, selectFirst = true) => {
    if (!editor || !searchText) {
      setTotalMatches(0);
      setCurrentMatch(0);
      return;
    }

    const content = editor.state.doc.textContent;
    const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = content.match(regex);
    const matchCount = matches ? matches.length : 0;

    setTotalMatches(matchCount);

    if (matchCount > 0 && selectFirst) {
      setCurrentMatch(1);
      // Find first occurrence and set cursor position
      const firstIndex = content.toLowerCase().indexOf(searchText.toLowerCase());
      if (firstIndex !== -1) {
        editor.commands.focus();
        editor.commands.setTextSelection({ from: firstIndex, to: firstIndex + searchText.length });
      }
    } else if (!selectFirst) {
      setCurrentMatch(0);
    } else {
      setCurrentMatch(0);
    }
  }, [editor]);

  const debouncedSearch = useCallback((searchText: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      countMatches(searchText);
    }, 300); // 300ms delay
  }, [countMatches]);

  const findNext = useCallback(() => {
    if (!editor || !findText || totalMatches === 0) return;

    const content = editor.state.doc.textContent;
    const currentPos = editor.state.selection.from;
    const searchFrom = currentPos + 1;

    const index = content.toLowerCase().indexOf(findText.toLowerCase(), searchFrom);
    if (index !== -1) {
      editor.commands.setTextSelection({ from: index, to: index + findText.length });
      setCurrentMatch(prev => prev < totalMatches ? prev + 1 : 1);
    } else {
      // Loop back to beginning
      const firstIndex = content.toLowerCase().indexOf(findText.toLowerCase());
      if (firstIndex !== -1) {
        editor.commands.setTextSelection({ from: firstIndex, to: firstIndex + findText.length });
        setCurrentMatch(1);
      }
    }
  }, [editor, findText, totalMatches]);

  const replaceAll = useCallback(() => {
    if (!editor || !findText || !replaceText) return;

    const html = editor.getHTML();
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newHtml = html.replace(regex, replaceText);
    editor.commands.setContent(newHtml);

    // Clear search after replace
    setTotalMatches(0);
    setCurrentMatch(0);
  }, [editor, findText, replaceText]);

  const replaceCurrent = useCallback(() => {
    if (!editor || !findText || !replaceText) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);

    if (selectedText.toLowerCase() === findText.toLowerCase()) {
      editor.commands.insertContentAt({ from, to }, replaceText);
      // Find next occurrence
      setTimeout(() => findNext(), 100);
    }
  }, [editor, findText, replaceText, findNext]);

  // Toolbar component
  const EditorToolbar = useMemo(() => {
    if (!editor || hideToolbar) return null;

    return (
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-700/50 bg-gray-950/50 flex-wrap">
        {/* Undo/Redo buttons removed completely */}

        {/* Text Formatting */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-6 w-6 p-0 hover:bg-gray-800/50 ${
            editor.isActive('bold') ? 'bg-gray-800 text-blue-400' : 'text-gray-500'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-6 w-6 p-0 hover:bg-gray-800/50 ${
            editor.isActive('italic') ? 'bg-gray-800 text-blue-400' : 'text-gray-500'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`h-6 w-6 p-0 hover:bg-gray-800/50 ${
            editor.isActive('underline') ? 'bg-gray-800 text-blue-400' : 'text-gray-500'
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`h-6 w-6 p-0 hover:bg-gray-800/50 ${
            editor.isActive('strike') ? 'bg-gray-800 text-blue-400' : 'text-gray-500'
          }`}
          title="Strikethrough (Ctrl+Shift+S)"
        >
          <Strikethrough className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              const { from, to } = editor.state.selection;
              const text = editor.state.doc.textBetween(from, to);
              if (text) {
                // If text is selected, make it a link
                editor.chain().focus().setLink({ href: url }).run();
              } else {
                // If no text selected, insert the URL as both text and link
                editor.chain().focus().insertContent(`<a href="${url}" class="notion-link" target="_blank" rel="noopener noreferrer">${url}</a>`).run();
              }
            }
          }}
          className={`h-6 w-6 p-0 hover:bg-gray-800/50 ${
            editor.isActive('link') ? 'bg-gray-800 text-blue-400' : 'text-gray-500'
          }`}
          title="Add Link (Ctrl+K)"
        >
          <LinkIcon className="h-3 w-3" />
        </Button>

        <div className="w-px h-4 bg-gray-700/30 mx-0.5" />

        {/* Text Alignment */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`h-6 w-6 p-0 hover:bg-gray-800/50 ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-gray-800 text-blue-400' : 'text-gray-500'
          }`}
          title="Align Left"
        >
          <AlignLeft className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`h-6 w-6 p-0 hover:bg-gray-800/50 ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-gray-800 text-blue-400' : 'text-gray-500'
          }`}
          title="Align Center"
        >
          <AlignCenter className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`h-6 w-6 p-0 hover:bg-gray-800/50 ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-gray-800 text-blue-400' : 'text-gray-500'
          }`}
          title="Align Right"
        >
          <AlignRight className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`h-6 w-6 p-0 hover:bg-gray-800/50 ${
            editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-800 text-blue-400' : 'text-gray-500'
          }`}
          title="Justify"
        >
          <AlignJustify className="h-3 w-3" />
        </Button>

        <div className="w-px h-4 bg-gray-700/30 mx-0.5" />

        {/* Lists */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`h-6 w-6 p-0 hover:bg-gray-800/50 ${
            editor.isActive('bulletList') ? 'bg-gray-800 text-blue-400' : 'text-gray-500'
          }`}
          title="Bullet List"
        >
          <List className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`h-6 w-6 p-0 hover:bg-gray-800/50 ${
            editor.isActive('orderedList') ? 'bg-gray-800 text-blue-400' : 'text-gray-500'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (editor.can().toggleTaskList()) {
              editor.chain().focus().toggleTaskList().run();
            }
          }}
          className={`h-6 w-6 p-0 hover:bg-gray-800/50 ${
            editor.isActive('taskList') ? 'bg-gray-800 text-blue-400' : 'text-gray-500'
          }`}
          title="To-do List"
        >
          <CheckSquare className="h-3 w-3" />
        </Button>

        <div className="w-px h-4 bg-gray-700/30 mx-0.5" />

        {/* Find & Replace */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFindReplace(true)}
          className="h-6 w-6 p-0 hover:bg-gray-800/50 text-gray-500"
          title="Find & Replace (Ctrl+F)"
        >
          <Search className="h-3 w-3" />
        </Button>
      </div>
    );
  }, [editor, disableUndoRedo]);

  const EditorComponent = useMemo(() => (
    <div className="notion-editor h-full relative" style={{backgroundColor: '#111219'}}>
      <style jsx global="true">{`
        .notion-editor-content {
          outline: none;
          padding: 12px 16px;
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif;
          line-height: 1.5;
          font-size: 14px;
          min-height: 60px;
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
          content: "";
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

        .notion-editor-content u {
          text-decoration: underline;
          color: #ffffff;
        }

        .notion-editor-content s {
          text-decoration: line-through;
          color: #ffffff;
        }

        /* Text formatting combinations */
        .notion-editor-content strong em {
          font-weight: 700;
          font-style: italic;
          color: #ffffff;
        }

        .notion-editor-content strong u {
          font-weight: 700;
          text-decoration: underline;
          color: #ffffff;
        }

        /* Text alignment */
        .notion-editor-content [style*="text-align: left"] {
          text-align: left;
        }

        .notion-editor-content [style*="text-align: center"] {
          text-align: center;
        }

        .notion-editor-content [style*="text-align: right"] {
          text-align: right;
        }

        .notion-editor-content [style*="text-align: justify"] {
          text-align: justify;
        }

        /* Highlight colors */
        .notion-editor-content mark {
          border-radius: 0.25em;
          padding: 0.125em 0.25em;
        }

        /* Colored text spans */
        .notion-editor-content span[style*="color"] {
          /* Ensure color inheritance */
        }

        /* Background highlights */
        .notion-editor-content mark[style*="background-color"] {
          border-radius: 0.25em;
          padding: 0.125em 0.25em;
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
          margin: 4px 0;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
          padding: 4px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .notion-editor-content ul[data-type="taskList"] li {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 1px 0;
          margin: 0;
          border-radius: 2px;
          transition: background-color 0.2s ease;
        }

        .notion-editor-content ul[data-type="taskList"] li:hover {
          background-color: rgba(255, 255, 255, 0.03);
          padding-left: 4px;
          padding-right: 4px;
          margin-left: -4px;
          margin-right: -4px;
        }

        .notion-editor-content ul[data-type="taskList"] li .task-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          line-height: 1.5;
        }

        .notion-editor-content ul[data-type="taskList"] li input[type="checkbox"] {
          margin-top: 0.2rem;
          cursor: pointer;
          flex-shrink: 0;
          appearance: none !important;
          background-color: transparent !important;
          background: transparent !important;
          border: 1px solid #404040 !important;
          border-radius: 0 !important;
          width: 16px !important;
          height: 16px !important;
          min-width: 16px !important;
          min-height: 16px !important;
          max-width: 16px !important;
          max-height: 16px !important;
          box-sizing: border-box !important;
          position: relative !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .notion-editor-content ul[data-type="taskList"] li input[type="checkbox"]:hover {
          border-color: #60a5fa !important;
          background-color: rgba(96, 165, 250, 0.1) !important;
          background: rgba(96, 165, 250, 0.1) !important;
        }

        .notion-editor-content ul[data-type="taskList"] li input[type="checkbox"]:checked {
          background-color: #3b82f6 !important;
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }

        .notion-editor-content ul[data-type="taskList"] li input[type="checkbox"]:checked::before {
          content: "✓" !important;
          color: white !important;
          font-size: 10px !important;
          font-weight: 600 !important;
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          line-height: 1 !important;
        }

        .notion-editor-content ul[data-type="taskList"] li[data-checked="true"] .task-content {
          text-decoration: line-through;
          opacity: 0.6;
        }

        /* TipTap TaskItem specific styling */
        .notion-editor-content li[data-type="taskItem"][data-checked="true"] {
          text-decoration: line-through;
          opacity: 0.6;
        }

        .notion-editor-content li[data-type="taskItem"][data-checked="true"] p {
          text-decoration: line-through;
          opacity: 0.6;
        }

        /* nested tasks indent */
        .notion-editor-content ul[data-type="taskList"] ul[data-type="taskList"] {
          margin-left: 1.5rem;
        }

        /* ensure no bullet markers leak in */
        .notion-editor-content ul[data-type="taskList"] li::marker {
          content: none;
        }

        .notion-editor-content li[data-type="taskItem"] {
          display: flex;
          align-items: flex-start;
          margin: 0;
          padding: 2px 4px;
          border-radius: 2px;
          transition: all 0.2s ease;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid transparent;
        }

        .notion-editor-content li[data-type="taskItem"]:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(96, 165, 250, 0.2);
        }

        .notion-editor-content li[data-type="taskItem"] > label {
          flex-shrink: 0;
          margin-right: 6px;
          margin-top: 1px;
          user-select: none;
          display: flex;
          align-items: center;
        }

        .notion-editor-content li[data-type="taskItem"] > label > input[type="checkbox"] {
          appearance: none !important;
          background-color: transparent !important;
          background: transparent !important;
          border: 1px solid #404040 !important;
          border-radius: 0 !important;
          width: 16px !important;
          height: 16px !important;
          min-width: 16px !important;
          min-height: 16px !important;
          max-width: 16px !important;
          max-height: 16px !important;
          box-sizing: border-box !important;
          cursor: pointer !important;
          position: relative !important;
          margin: 0 !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          vertical-align: middle !important;
        }

        .notion-editor-content li[data-type="taskItem"] > label > input[type="checkbox"]:hover {
          border-color: #60a5fa !important;
          background-color: rgba(96, 165, 250, 0.1) !important;
          background: rgba(96, 165, 250, 0.1) !important;
          transform: scale(1.05) !important;
        }

        .notion-editor-content li[data-type="taskItem"] > label > input[type="checkbox"]:checked {
          background-color: #3b82f6 !important;
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
          transform: scale(1) !important;
        }

        .notion-editor-content li[data-type="taskItem"] > label > input[type="checkbox"]:checked::before {
          content: "✓" !important;
          color: white !important;
          font-size: 10px !important;
          font-weight: 600 !important;
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          line-height: 1 !important;
          animation: checkmarkPop 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
        }

        @keyframes checkmarkPop {
          0% { transform: translate(-50%, -50%) scale(0); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }

        .notion-editor-content li[data-type="taskItem"] > div {
          flex: 1;
          min-width: 0;
          line-height: 1.4;
          padding-top: 1px;
        }

        .notion-editor-content li[data-type="taskItem"][data-checked="true"] {
          background: rgba(34, 197, 94, 0.05);
          border-color: rgba(34, 197, 94, 0.2);
        }

        .notion-editor-content li[data-type="taskItem"][data-checked="true"] > div {
          text-decoration: line-through;
          opacity: 0.7;
          color: #9ca3af;
          transition: all 0.3s ease;
        }

        /* Additional selectors for TipTap TaskItem content */
        .notion-editor-content li[data-type="taskItem"][data-checked="true"] * {
          text-decoration: line-through !important;
          opacity: 0.7 !important;
          color: #9ca3af !important;
        }

        /* More specific selectors for checked task items */
        .notion-editor-content [data-checked="true"] {
          text-decoration: line-through !important;
          opacity: 0.7 !important;
          color: #9ca3af !important;
        }

        .notion-editor-content [data-checked="true"] p,
        .notion-editor-content [data-checked="true"] div,
        .notion-editor-content [data-checked="true"] span {
          text-decoration: line-through !important;
          opacity: 0.7 !important;
          color: #9ca3af !important;
        }

        /* Target TipTap task item content specifically */
        .notion-editor-content li[data-checked="true"] > div,
        .notion-editor-content li[data-checked="true"] > p {
          text-decoration: line-through !important;
          opacity: 0.7 !important;
          color: #9ca3af !important;
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
          width: 16px !important;
          height: 16px !important;
          min-width: 16px !important;
          min-height: 16px !important;
          max-width: 16px !important;
          max-height: 16px !important;
          box-sizing: border-box !important;
          border: 1px solid #404040 !important;
          border-radius: 0 !important;
          margin-right: 8px !important;
          cursor: pointer !important;
          background-color: transparent !important;
          position: relative !important;
          vertical-align: middle !important;
          line-height: 14px !important;
          text-align: center !important;
          font-size: 10px !important;
          font-weight: 600 !important;
          color: #ffffff !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          user-select: none !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }

        .notion-editor-content .todo-checkbox:hover {
          border-color: #60a5fa !important;
          background-color: rgba(96, 165, 250, 0.1) !important;
          transform: scale(1.05) !important;
        }

        .notion-editor-content .todo-checkbox[data-checked="true"] {
          background-color: #3b82f6 !important;
          border-color: #3b82f6 !important;
          animation: checkmarkPop 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
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
          pointer-events: auto !important;
          user-select: text !important;
        }

        .notion-editor-content .notion-link:hover {
          color: #93c5fd !important;
          text-decoration: underline !important;
        }

        .notion-editor-content .notion-link:visited {
          color: #a78bfa !important;
        }

        /* Ensure links in all contexts are clickable */
        .notion-editor-content a {
          color: #60a5fa !important;
          text-decoration: underline !important;
          cursor: pointer !important;
          pointer-events: auto !important;
        }


        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }



        /* Placeholder when empty */
        .notion-editor-content .is-empty::before {
          content: "";
          float: left;
          color: #6b7280;
          pointer-events: none;
          height: 0;
        }

      `}</style>

      <div>
        {EditorToolbar}
        <EditorContent
          editor={editor}
          className="h-full"
        />


      </div>

      {/* Find & Replace Dialog */}
      {showFindReplace && (
        <div
          ref={findReplaceRef}
          className="absolute top-4 right-4 z-50 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg min-w-[300px]"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white text-sm font-medium">Find & Replace</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFindReplace(false)}
              className="h-6 w-6 p-0 hover:bg-gray-700 text-gray-400"
            >
              ×
            </Button>
          </div>

          <div className="space-y-2">
            <div>
              <input
                type="text"
                placeholder="Find..."
                value={findText}
                onChange={(e) => {
                  setFindText(e.target.value);
                  if (e.target.value) {
                    debouncedSearch(e.target.value);
                  } else {
                    setTotalMatches(0);
                    setCurrentMatch(0);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    findNext();
                  }
                }}
                className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              {totalMatches > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  {currentMatch} of {totalMatches} matches
                </div>
              )}
            </div>
            <div>
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && findText && replaceText) {
                    replaceCurrent();
                  }
                }}
                className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => findInEditor(findText, true)}
                disabled={!findText}
                className="text-xs h-7 px-3 py-1 hover:bg-gray-700 text-gray-300 border border-gray-600 disabled:opacity-50"
              >
                Find
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={findNext}
                disabled={!findText || totalMatches === 0}
                className="text-xs h-7 px-3 py-1 hover:bg-gray-700 text-gray-300 border border-gray-600 disabled:opacity-50"
              >
                Next
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={replaceCurrent}
                disabled={!findText || !replaceText || totalMatches === 0}
                className="text-xs h-7 px-3 py-1 hover:bg-gray-700 text-gray-300 border border-gray-600 disabled:opacity-50"
              >
                Replace
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={replaceAll}
                disabled={!findText || !replaceText || totalMatches === 0}
                className="text-xs h-7 px-3 py-1 hover:bg-gray-700 text-gray-300 border border-gray-600 disabled:opacity-50"
              >
                Replace All
              </Button>
            </div>
          </div>
        </div>
      )}

      {showSlashMenu && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[99998]"
            onClick={handleSlashMenuClose}
            style={{ zIndex: 99998 }}
          />
          {/* Menu */}
          <div
            className="fixed z-[99999]"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              zIndex: 99999,
              position: 'fixed',
            }}
          >
            <SlashCommandMenu
              ref={menuRef}
              query={slashQuery}
              onSelect={handleSlashCommandSelect}
              onClose={handleSlashMenuClose}
            />
          </div>
        </>,
        document.body
      )}
    </div>
  ), [editor, showSlashMenu, menuPosition, slashQuery, handleSlashCommandSelect, showFindReplace, findText, replaceText, currentMatch, totalMatches, findInEditor, findNext, replaceCurrent, replaceAll, debouncedSearch]);

  return (
    <RichEditorErrorBoundary>
      {EditorComponent}
    </RichEditorErrorBoundary>
  );
};

export default RichEditor;