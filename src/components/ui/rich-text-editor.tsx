import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import './rich-text-editor.css'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from './button'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Link as LinkIcon, 
  Heading1, 
  Heading2, 
  Heading3,
  MoreHorizontal
} from 'lucide-react'

interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

const MenuBar = ({ editor, isMobile = false }) => {
  if (!editor) {
    return null
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const buttons = [
    {
      icon: Bold,
      label: 'Bold',
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
    },
    {
      icon: Italic,
      label: 'Italic', 
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
    },
    {
      icon: UnderlineIcon,
      label: 'Underline',
      onClick: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive('underline'),
    },
    {
      icon: Heading1,
      label: 'Heading 1',
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive('heading', { level: 1 }),
    },
    {
      icon: Heading2,
      label: 'Heading 2',
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
    },
    {
      icon: Heading3,
      label: 'Heading 3',
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive('heading', { level: 3 }),
    },
    {
      icon: List,
      label: 'Bullet List',
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
    },
    {
      icon: ListOrdered,
      label: 'Numbered List',
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
    },
    {
      icon: CheckSquare,
      label: 'Task List',
      onClick: () => {
        if (editor.isActive('taskList')) {
          // If already in a task list, remove it
          editor.chain().focus().toggleTaskList().run()
        } else {
          // Convert current paragraph to task list item
          const { selection } = editor.state
          const { $from } = selection
          
          // Check if we're in a paragraph
          if ($from.parent.type.name === 'paragraph') {
            editor.chain()
              .focus()
              .wrapInList('taskList')
              .run()
          } else {
            // Fallback to toggleTaskList
            editor.chain().focus().toggleTaskList().run()
          }
        }
      },
      isActive: editor.isActive('taskList'),
    },
    {
      icon: LinkIcon,
      label: 'Link',
      onClick: setLink,
      isActive: editor.isActive('link'),
    },
  ]

  // Mobile view - compact toolbar with most essential buttons
  if (isMobile) {
    return (
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2 bg-muted/30">
        {buttons.slice(0, 6).map((button, index) => {
          const Icon = button.icon
          return (
            <Button
              key={index}
              variant={button.isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={button.onClick}
              className={`
                h-7 w-7 p-0 text-xs transition-all duration-200
                ${button.isActive 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'hover:bg-accent hover:text-accent-foreground'
                }
              `}
              title={button.label}
            >
              <Icon className="h-3 w-3" />
            </Button>
          )
        })}
        {buttons.length > 6 && (
          <span className="text-xs text-muted-foreground ml-1 px-1">+{buttons.length - 6}</span>
        )}
      </div>
    )
  }

  // Desktop view - button toolbar
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border p-3 bg-muted/30">
      {buttons.map((button, index) => {
        const Icon = button.icon
        return (
          <Button
            key={index}
            variant={button.isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={button.onClick}
            className={`
              h-8 w-8 p-0 transition-all duration-200 hover:scale-105
              ${button.isActive 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'hover:bg-accent hover:text-accent-foreground'
              }
            `}
            title={button.label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        )
      })}
    </div>
  )
}

export function RichTextEditor({ 
  content = '', 
  onChange, 
  placeholder = 'Start writing...', 
  className = '', 
  minHeight = '120px' 
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
    },
    editorProps: {
      attributes: {
        class: 'max-w-none focus:outline-none p-4 text-sm',
        style: `min-height: ${minHeight}`,
      },
    },
  })

  // Check if we're on mobile (simple check)
  const [isMobile, setIsMobile] = React.useState(false)
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Update editor content when prop changes
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Don't render until editor is ready
  if (!editor) {
    return (
      <div className={`
        border border-border rounded-lg bg-background shadow-sm ${className}
      `}>
        <div className="border-b border-border p-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
          </div>
        </div>
        <div className="p-4 flex items-center justify-center" style={{ minHeight }}>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading editor...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`
      border border-border rounded-lg bg-background shadow-sm 
      hover:shadow-md transition-shadow duration-200
      focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50
      ${className}
    `}>
      <MenuBar editor={editor} isMobile={isMobile} />
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className="rich-text-editor-content"
        />
      </div>
    </div>
  )
}