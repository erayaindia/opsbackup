import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
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
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        history: {
          depth: 100,
          newGroupDelay: 500,
        },
        // Disable link to configure separately
        link: false,
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
    parseOptions: {
      preserveWhitespace: 'full',
    },
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

        // Text formatting and editing keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
          switch (event.key.toLowerCase()) {
            case 'z':
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
            case 'y':
              // Ctrl+Y for redo
              event.preventDefault();
              editor?.chain().focus().redo().run();
              return true;
            case 'b':
              event.preventDefault();
              editor?.chain().focus().toggleBold().run();
              return true;
            case 'i':
              event.preventDefault();
              editor?.chain().focus().toggleItalic().run();
              return true;
            case 'u':
              event.preventDefault();
              editor?.chain().focus().toggleUnderline().run();
              return true;
            case 's':
              if (event.shiftKey) {
                event.preventDefault();
                editor?.chain().focus().toggleStrike().run();
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
    if (!editor) return null;

    return (
      <div className="flex items-center gap-1 p-2 border-b border-gray-600 bg-gray-900 flex-wrap">
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          className="h-8 w-8 p-0 hover:bg-gray-700 text-gray-300 disabled:opacity-50"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          className="h-8 w-8 p-0 hover:bg-gray-700 text-gray-300 disabled:opacity-50"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        {/* Text Formatting */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-8 w-8 p-0 hover:bg-gray-700 ${
            editor.isActive('bold') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-8 w-8 p-0 hover:bg-gray-700 ${
            editor.isActive('italic') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`h-8 w-8 p-0 hover:bg-gray-700 ${
            editor.isActive('underline') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`h-8 w-8 p-0 hover:bg-gray-700 ${
            editor.isActive('strike') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'
          }`}
          title="Strikethrough (Ctrl+Shift+S)"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        {/* Text Alignment */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            document.execCommand('justifyLeft', false, null);
            editor.chain().focus().run();
          }}
          className="h-8 w-8 p-0 hover:bg-gray-700 text-gray-300"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            document.execCommand('justifyCenter', false, null);
            editor.chain().focus().run();
          }}
          className="h-8 w-8 p-0 hover:bg-gray-700 text-gray-300"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            document.execCommand('justifyRight', false, null);
            editor.chain().focus().run();
          }}
          className="h-8 w-8 p-0 hover:bg-gray-700 text-gray-300"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            document.execCommand('justifyFull', false, null);
            editor.chain().focus().run();
          }}
          className="h-8 w-8 p-0 hover:bg-gray-700 text-gray-300"
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        {/* Lists */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`h-8 w-8 p-0 hover:bg-gray-700 ${
            editor.isActive('bulletList') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'
          }`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`h-8 w-8 p-0 hover:bg-gray-700 ${
            editor.isActive('orderedList') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (editor.can().toggleTaskList()) {
              editor.chain().focus().toggleTaskList().run();
            }
          }}
          className={`h-8 w-8 p-0 hover:bg-gray-700 ${
            editor.isActive('taskList') ? 'bg-gray-700 text-blue-400' : 'text-gray-300'
          }`}
          title="To-do List"
        >
          <CheckSquare className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        {/* Find & Replace */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFindReplace(true)}
          className="h-8 w-8 p-0 hover:bg-gray-700 text-gray-300"
          title="Find & Replace (Ctrl+F)"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    );
  }, [editor]);

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
          margin: 0;
        }

        .notion-editor-content ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.25rem 0;
          margin: 0;
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
          opacity: 0.6;
        }

        /* Additional selectors for TipTap TaskItem content */
        .notion-editor-content li[data-type="taskItem"][data-checked="true"] * {
          text-decoration: line-through !important;
          opacity: 0.6 !important;
        }

        /* More specific selectors for checked task items */
        .notion-editor-content [data-checked="true"] {
          text-decoration: line-through !important;
          opacity: 0.6 !important;
        }

        .notion-editor-content [data-checked="true"] p,
        .notion-editor-content [data-checked="true"] div,
        .notion-editor-content [data-checked="true"] span {
          text-decoration: line-through !important;
          opacity: 0.6 !important;
        }

        /* Target TipTap task item content specifically */
        .notion-editor-content li[data-checked="true"] > div,
        .notion-editor-content li[data-checked="true"] > p {
          text-decoration: line-through !important;
          opacity: 0.6 !important;
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
        {EditorToolbar}
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

      {/* Find & Replace Dialog */}
      {showFindReplace && (
        <div className="absolute top-4 right-4 z-50 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg min-w-[300px]">
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
  ), [editor, linkPreviews, showSlashMenu, menuPosition, slashQuery, handleLinkPreviewClose, handleSlashCommandSelect, showFindReplace, findText, replaceText, currentMatch, totalMatches, findInEditor, findNext, replaceCurrent, replaceAll, debouncedSearch]);

  return (
    <RichEditorErrorBoundary>
      {EditorComponent}
    </RichEditorErrorBoundary>
  );
};

export default RichEditor;