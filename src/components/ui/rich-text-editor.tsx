import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import './rich-text-editor.css'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Node, mergeAttributes } from '@tiptap/core'
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

// Custom Checkbox Extension
const Checkbox = Node.create({
  name: 'checkbox',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      checked: {
        default: false,
        parseHTML: element => element.getAttribute('data-checked') === 'true',
        renderHTML: attributes => {
          return {
            'data-checked': attributes.checked,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="checkbox"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'checkbox',
        'class': 'checkbox-wrapper'
      }),
      ['input', {
        type: 'checkbox',
        checked: HTMLAttributes['data-checked'] === 'true' ? true : false,
        'class': 'inline-checkbox'
      }],
      ' '
    ]
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('span')
      dom.setAttribute('data-type', 'checkbox')
      dom.className = 'checkbox-wrapper'
      dom.style.display = 'inline-flex'
      dom.style.alignItems = 'center'
      dom.style.verticalAlign = 'top'

      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.className = 'inline-checkbox'
      checkbox.checked = node.attrs.checked

      const applyStrikethrough = (checked: boolean) => {
        // Find the current paragraph that contains this checkbox
        const paragraph = dom.closest('p')
        if (paragraph) {
          if (checked) {
            paragraph.style.textDecoration = 'line-through'
            paragraph.style.opacity = '0.6'
          } else {
            paragraph.style.textDecoration = 'none'
            paragraph.style.opacity = '1'
          }
        }
      }

      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement
        if (typeof getPos === 'function') {
          editor.chain().focus().command(({ tr }) => {
            tr.setNodeMarkup(getPos(), undefined, {
              ...node.attrs,
              checked: target.checked,
            })
            return true
          }).run()

          // Apply strikethrough after state update
          setTimeout(() => applyStrikethrough(target.checked), 0)
        }
      })

      dom.appendChild(checkbox)

      // Apply initial strikethrough state
      setTimeout(() => applyStrikethrough(node.attrs.checked), 0)

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) {
            return false
          }
          checkbox.checked = updatedNode.attrs.checked
          applyStrikethrough(updatedNode.attrs.checked)
          return true
        },
      }
    }
  },
})

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

  const insertCheckbox = () => {
    editor.chain().focus().insertContent({ type: 'checkbox', attrs: { checked: false } }).insertContent(' ').run()
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
      label: 'Checkbox',
      onClick: insertCheckbox,
      isActive: false,
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
      Checkbox,
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
        border border-border rounded-none bg-background shadow-sm ${className}
      `}>
        <div className="border-b border-border p-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-muted animate-pulse rounded-none" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-none" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-none" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-none" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-none" />
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
      border border-border rounded-none bg-background shadow-sm
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