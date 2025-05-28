"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Copy, FileText, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism"

const defaultMarkdown = `# Welcome to Markdown Editor

This is a **live markdown editor** with synchronized scrolling between the editor and preview panes.

## Features

- ✅ Live preview
- ✅ Synchronized scrolling
- ✅ File upload support
- ✅ Copy to clipboard
- ✅ GitHub Flavored Markdown
- ✅ Syntax highlighting

## Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));
\`\`\`

## Lists

### Unordered List
- Item 1
- Item 2
  - Nested item
  - Another nested item
- Item 3

### Ordered List
1. First item
2. Second item
3. Third item

## Tables

| Feature | Status |
|---------|--------|
| Live Preview | ✅ |
| Sync Scroll | ✅ |
| File Upload | ✅ |

## Blockquote

> This is a blockquote. You can use it to highlight important information or quotes.

## Links and Images

[Visit Next.js](https://nextjs.org)

---

Happy editing! 🚀`

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState(defaultMarkdown)
  const [isScrolling, setIsScrolling] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const syncScroll = useCallback(
    (source: "editor" | "preview") => {
      if (isScrolling) return

      setIsScrolling(true)

      if (source === "editor" && editorRef.current && previewRef.current) {
        const editor = editorRef.current
        const preview = previewRef.current
        
        const scrollPercentage = editor.scrollTop / Math.max(1, editor.scrollHeight - editor.clientHeight)
        const targetScrollTop = scrollPercentage * Math.max(0, preview.scrollHeight - preview.clientHeight)
        
        preview.scrollTo({
          top: targetScrollTop,
          behavior: 'auto'
        })
      } else if (source === "preview" && previewRef.current && editorRef.current) {
        const preview = previewRef.current
        const editor = editorRef.current
        
        const scrollPercentage = preview.scrollTop / Math.max(1, preview.scrollHeight - preview.clientHeight)
        const targetScrollTop = scrollPercentage * Math.max(0, editor.scrollHeight - editor.clientHeight)
        
        editor.scrollTo({
          top: targetScrollTop,
          behavior: 'auto'
        })
      }

      setTimeout(() => setIsScrolling(false), 50)
    },
    [isScrolling],
  )

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file && (file.type === "text/markdown" || file.name.endsWith(".md"))) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          setMarkdown(content)
          toast({
            title: "File uploaded",
            description: "Markdown file has been loaded successfully.",
          })
        }
        reader.readAsText(file)
      } else {
        toast({
          title: "Invalid file",
          description: "Please upload a .md or .markdown file.",
          variant: "destructive",
        })
      }
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [toast],
  )

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      toast({
        title: "Copied!",
        description: "Markdown content copied to clipboard.",
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive",
      })
    }
  }, [markdown, toast])

  const downloadMarkdown = useCallback(() => {
    try {
      const blob = new Blob([markdown], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `markdown-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.md`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Downloaded!",
        description: "Markdown file has been downloaded.",
      })
    } catch (err) {
      toast({
        title: "Download failed",
        description: "Failed to download markdown file.",
        variant: "destructive",
      })
    }
  }, [markdown, toast])

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Markdown Editor</h1>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,text/markdown"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={downloadMarkdown}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Pane */}
        <div className="w-1/2 border-r flex flex-col">
          <div className="bg-muted/50 px-4 py-2 border-b">
            <h2 className="text-sm font-medium text-muted-foreground">Editor</h2>
          </div>
          <div className="flex-1 relative">
            <Textarea
              ref={editorRef}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              onScroll={() => syncScroll("editor")}
              className="absolute inset-0 resize-none border-0 rounded-none focus-visible:ring-0 font-mono text-sm leading-6 p-4"
              placeholder="Type your markdown here..."
              style={{
                lineHeight: '1.5',
                fontSize: '14px',
                padding: '16px'
              }}
            />
          </div>
        </div>

        {/* Preview Pane */}
        <div className="w-1/2 flex flex-col bg-white dark:bg-white">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-600">Preview</h2>
          </div>
          <div 
            ref={previewRef} 
            className="flex-1 overflow-auto p-4" 
            onScroll={() => syncScroll("preview")}
          >
            <div className="prose prose-sm prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-headings:font-semibold prose-h1:text-2xl prose-h1:mb-4 prose-h2:text-xl prose-h2:mb-3 prose-h3:text-lg prose-h3:mb-2 prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-900 prose-pre:text-gray-100">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code(props) {
                    const { node, className, children, ...rest } = props
                    const match = /language-(\w+)/.exec(className || "")
                    const isInline = !match
                    return !isInline ? (
                      <SyntaxHighlighter 
                        style={tomorrow as any} 
                        language={match[1]} 
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          lineHeight: '1.5'
                        }}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...rest}>
                        {children}
                      </code>
                    )
                  },
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-semibold text-gray-900 mb-4 mt-6 first:mt-0 border-b border-gray-200 pb-2">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-5 border-b border-gray-100 pb-1">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-700 mb-3 leading-relaxed">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 mb-3 space-y-1 text-gray-700">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 mb-3 space-y-1 text-gray-700">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-gray-700">
                      {children}
                    </li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-2 my-4 italic text-gray-700">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border border-gray-200 text-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-gray-50">
                      {children}
                    </thead>
                  ),
                  th: ({ children }) => (
                    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-900">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">
                      {children}
                    </td>
                  ),
                }}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
