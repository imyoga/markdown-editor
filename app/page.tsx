'use client'

import type React from 'react'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Copy, FileText, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
	tomorrow,
	oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism'
import 'katex/dist/katex.min.css'

const defaultMarkdown = `# Welcome to Enhanced Markdown Editor

This is a **live markdown editor** with advanced preview capabilities inspired by VS Code's Markdown Preview Enhanced extension.

## ✨ Enhanced Features

- ✅ **Live preview** with real-time rendering
- ✅ **Synchronized scrolling** between editor and preview
- ✅ **Math support** with KaTeX rendering
- ✅ **Advanced syntax highlighting** 
- ✅ **GitHub Flavored Markdown** (tables, task lists, strikethrough)
- ✅ **Wiki-style links** and enhanced formatting
- ✅ **File upload/download** support
- ✅ **Copy to clipboard** functionality

## 🧮 Math Support

### Inline Math
You can write inline math like this: $E = mc^2$ or $\\sum_{i=1}^{n} x_i$.

### Block Math
$$
\\frac{d}{dx}\\left( \\int_{0}^{x} f(u)\\,du\\right)=f(x)
$$

$$
\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}
\\begin{pmatrix}
x \\\\
y
\\end{pmatrix}
=
\\begin{pmatrix}
ax + by \\\\
cx + dy
\\end{pmatrix}
$$

## 💻 Enhanced Code Highlighting

### JavaScript
\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Arrow function with destructuring
const processUser = ({ name, age, email }) => ({
  displayName: \`\${name} (\${age})\`,
  contact: email.toLowerCase()
});

console.log(fibonacci(10)); // Output: 55
\`\`\`

### Python
\`\`\`python
import numpy as np
import matplotlib.pyplot as plt

def plot_sine_wave(freq=1, amplitude=1, phase=0):
    """Generate and plot a sine wave with given parameters."""
    x = np.linspace(0, 4*np.pi, 1000)
    y = amplitude * np.sin(freq * x + phase)
    
    plt.figure(figsize=(10, 6))
    plt.plot(x, y, 'b-', linewidth=2, label=f'sin({freq}x)')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.show()

# Usage
plot_sine_wave(freq=2, amplitude=1.5)
\`\`\`

### TypeScript
\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
  preferences?: UserPreferences;
}

interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}

class UserManager {
  private users: Map<number, User> = new Map();

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const id = Date.now();
    const user: User = { id, ...userData };
    this.users.set(id, user);
    return user;
  }

  getUser(id: number): User | undefined {
    return this.users.get(id);
  }
}
\`\`\`

## 📋 Advanced Lists & Task Management

### Nested Task Lists
- [x] **Setup project structure**
  - [x] Initialize Next.js project
  - [x] Install UI components
  - [x] Setup Tailwind CSS
- [ ] **Implement features**
  - [x] Basic markdown rendering
  - [x] Math support with KaTeX
  - [x] Syntax highlighting
  - [ ] Diagram support (future)
  - [ ] Export functionality (future)
- [ ] **Testing & deployment**
  - [ ] Write unit tests
  - [ ] E2E testing
  - [ ] Deploy to production

### Ordered Lists with Sub-items
1. **Primary objectives**
   1. Enhance markdown preview
   2. Improve user experience
   3. Add advanced features
2. **Secondary goals**
   1. Performance optimization
   2. Accessibility improvements
   3. Mobile responsiveness

## 📊 Enhanced Tables

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Live Preview | ✅ Complete | High | Real-time rendering |
| Math Support | ✅ Complete | High | KaTeX integration |
| Syntax Highlighting | ✅ Complete | High | Prism.js powered |
| Sync Scrolling | ✅ Complete | Medium | Smooth experience |
| File Operations | ✅ Complete | Medium | Upload/Download |
| Export Options | 🚧 In Progress | Low | PDF, HTML, etc. |
| Diagram Support | 📋 Planned | Low | Mermaid, PlantUML |

## 🎨 Enhanced Styling Elements

### Blockquotes with Rich Content

> **📝 Important Note**
> 
> This enhanced markdown editor supports advanced features like:
> - Mathematical expressions: $\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$
> - Code highlighting with multiple languages
> - Rich table formatting
> - And much more!

### Strikethrough and Emphasis

~~This text is struck through~~ while **this is bold** and *this is italic*.

You can also combine them: ***bold and italic*** or ~~***struck bold italic***~~.

## 🔗 Links and References

- [React Documentation](https://react.dev)
- [Next.js Guide](https://nextjs.org/docs)
- [Markdown Guide](https://www.markdownguide.org)
- [KaTeX Documentation](https://katex.org)

## 🌟 What Makes This Better?

This enhanced preview provides:

1. **Mathematical typesetting** that rivals LaTeX
2. **Professional code highlighting** with proper syntax recognition
3. **GitHub-flavored markdown** with full feature support
4. **Responsive design** that works on all devices
5. **Performance optimization** for large documents

---

**Happy editing!** 🚀 This enhanced markdown editor brings professional-grade preview capabilities to your workflow.`

export default function MarkdownEditor() {
	const [markdown, setMarkdown] = useState(defaultMarkdown)
	const [isScrolling, setIsScrolling] = useState(false)
	const editorRef = useRef<HTMLTextAreaElement>(null)
	const previewRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const { toast } = useToast()

	const syncScroll = useCallback(
		(source: 'editor' | 'preview') => {
			if (isScrolling) return

			setIsScrolling(true)

			if (source === 'editor' && editorRef.current && previewRef.current) {
				const editor = editorRef.current
				const preview = previewRef.current

				const scrollPercentage =
					editor.scrollTop /
					Math.max(1, editor.scrollHeight - editor.clientHeight)
				const targetScrollTop =
					scrollPercentage *
					Math.max(0, preview.scrollHeight - preview.clientHeight)

				preview.scrollTo({
					top: targetScrollTop,
					behavior: 'auto',
				})
			} else if (
				source === 'preview' &&
				previewRef.current &&
				editorRef.current
			) {
				const preview = previewRef.current
				const editor = editorRef.current

				const scrollPercentage =
					preview.scrollTop /
					Math.max(1, preview.scrollHeight - preview.clientHeight)
				const targetScrollTop =
					scrollPercentage *
					Math.max(0, editor.scrollHeight - editor.clientHeight)

				editor.scrollTo({
					top: targetScrollTop,
					behavior: 'auto',
				})
			}

			setTimeout(() => setIsScrolling(false), 50)
		},
		[isScrolling]
	)

	const handleFileUpload = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0]
			if (
				file &&
				(file.type === 'text/markdown' || file.name.endsWith('.md'))
			) {
				const reader = new FileReader()
				reader.onload = (e) => {
					const content = e.target?.result as string
					setMarkdown(content)
					toast({
						title: 'File uploaded',
						description: 'Markdown file has been loaded successfully.',
					})
				}
				reader.readAsText(file)
			} else {
				toast({
					title: 'Invalid file',
					description: 'Please upload a .md or .markdown file.',
					variant: 'destructive',
				})
			}
			// Reset the input
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
		},
		[toast]
	)

	const copyToClipboard = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(markdown)
			toast({
				title: 'Copied!',
				description: 'Markdown content copied to clipboard.',
			})
		} catch (err) {
			toast({
				title: 'Copy failed',
				description: 'Failed to copy content to clipboard.',
				variant: 'destructive',
			})
		}
	}, [markdown, toast])

	const downloadMarkdown = useCallback(() => {
		try {
			const blob = new Blob([markdown], { type: 'text/markdown' })
			const url = URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `markdown-${new Date()
				.toISOString()
				.slice(0, 19)
				.replace(/:/g, '-')}.md`
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			URL.revokeObjectURL(url)

			toast({
				title: 'Downloaded!',
				description: 'Markdown file has been downloaded.',
			})
		} catch (err) {
			toast({
				title: 'Download failed',
				description: 'Failed to download markdown file.',
				variant: 'destructive',
			})
		}
	}, [markdown, toast])

	return (
		<div className='h-screen flex flex-col bg-background font-sans'>
			{/* Header */}
			<div className='border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
				<div className='flex items-center justify-between p-4'>
					<div className='flex items-center gap-2'>
						<FileText className='h-5 w-5' />
						<h1 className='text-lg font-semibold tracking-tight'>
							Enhanced Markdown Editor
						</h1>
					</div>
					<div className='flex items-center gap-2'>
						<input
							ref={fileInputRef}
							type='file'
							accept='.md,.markdown,text/markdown'
							onChange={handleFileUpload}
							className='hidden'
						/>
						<Button
							variant='outline'
							size='sm'
							onClick={() => fileInputRef.current?.click()}
						>
							<Upload className='h-4 w-4 mr-2' />
							Upload
						</Button>
						<Button variant='outline' size='sm' onClick={copyToClipboard}>
							<Copy className='h-4 w-4 mr-2' />
							Copy
						</Button>
						<Button variant='outline' size='sm' onClick={downloadMarkdown}>
							<Download className='h-4 w-4 mr-2' />
							Download
						</Button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='flex-1 flex overflow-hidden'>
				{/* Editor Pane */}
				<div className='w-1/2 border-r flex flex-col'>
					<div className='bg-muted/50 px-4 py-2 border-b'>
						<h2 className='text-sm font-medium text-muted-foreground tracking-wide'>
							EDITOR
						</h2>
					</div>
					<div className='flex-1 relative'>
						<Textarea
							ref={editorRef}
							value={markdown}
							onChange={(e) => setMarkdown(e.target.value)}
							onScroll={() => syncScroll('editor')}
							className='absolute inset-0 resize-none border-0 rounded-none focus-visible:ring-0 font-mono text-sm leading-relaxed p-4 bg-gray-50 dark:bg-gray-900'
							placeholder='Type your markdown here...'
							style={{
								lineHeight: '1.6',
								fontSize: '14px',
								padding: '16px',
								fontFamily: 'var(--font-mono)',
								fontWeight: '400',
								letterSpacing: '0.025em',
							}}
						/>
					</div>
				</div>

				{/* Preview Pane */}
				<div className='w-1/2 flex flex-col bg-white dark:bg-gray-900'>
					<div className='bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700'>
						<h2 className='text-sm font-medium text-gray-600 dark:text-gray-400 tracking-wide'>
							ENHANCED PREVIEW
						</h2>
					</div>
					<div
						ref={previewRef}
						className='flex-1 overflow-auto p-4'
						onScroll={() => syncScroll('preview')}
					>
						<div className='prose prose-lg prose-gray dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-headings:font-semibold prose-h1:text-3xl prose-h1:mb-6 prose-h1:border-b prose-h1:border-gray-200 dark:prose-h1:border-gray-700 prose-h1:pb-3 prose-h2:text-2xl prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-100 dark:prose-h2:border-gray-800 prose-h2:pb-2 prose-h3:text-xl prose-h3:mb-3 prose-ul:my-4 prose-ol:my-4 prose-li:my-1 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-950/20 prose-blockquote:py-3 prose-blockquote:px-4 prose-blockquote:my-4 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-table:border-collapse prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600 prose-th:bg-gray-50 dark:prose-th:bg-gray-800 prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600'>
							<ReactMarkdown
								remarkPlugins={[remarkGfm, remarkMath]}
								rehypePlugins={[rehypeKatex]}
								components={{
									code(props) {
										const { node, className, children, ...rest } = props
										const match = /language-(\w+)/.exec(className || '')
										const isInline = !match

										if (!isInline) {
											return (
												<SyntaxHighlighter
													style={tomorrow as any}
													language={match[1]}
													PreTag='div'
													customStyle={{
														margin: 0,
														borderRadius: '0.5rem',
														fontSize: '14px',
														lineHeight: '1.6',
														padding: '1rem',
														background: '#2d3748',
														border: '1px solid #4a5568',
														fontFamily:
															'JetBrains Mono, SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace',
														fontWeight: '400',
														letterSpacing: '0.025em',
													}}
													showLineNumbers={true}
													lineNumberStyle={{
														minWidth: '3em',
														paddingRight: '1em',
														color: '#718096',
														borderRight: '1px solid #4a5568',
														marginRight: '1em',
														textAlign: 'right',
														userSelect: 'none',
														paddingLeft: '0.5em',
														fontFamily:
															'JetBrains Mono, SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace',
													}}
													wrapLines={true}
													lineProps={{
														style: { display: 'block', width: '100%' },
													}}
												>
													{String(children).replace(/\n$/, '')}
												</SyntaxHighlighter>
											)
										} else {
											return (
												<code
													className='bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 px-2 py-1 rounded text-sm font-mono'
													style={{
														fontFamily:
															'JetBrains Mono, SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace',
														fontWeight: '500',
														letterSpacing: '0.025em',
													}}
													{...rest}
												>
													{children}
												</code>
											)
										}
									},
									h1: ({ children }) => (
										<h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 mt-8 first:mt-0 border-b border-gray-200 dark:border-gray-700 pb-3'>
											{children}
										</h1>
									),
									h2: ({ children }) => (
										<h2 className='text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 mt-6 border-b border-gray-100 dark:border-gray-800 pb-2'>
											{children}
										</h2>
									),
									h3: ({ children }) => (
										<h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-5'>
											{children}
										</h3>
									),
									h4: ({ children }) => (
										<h4 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4'>
											{children}
										</h4>
									),
									p: ({ children }) => (
										<p className='text-gray-700 dark:text-gray-300 mb-4 leading-relaxed'>
											{children}
										</p>
									),
									ul: ({ children }) => (
										<ul className='list-disc pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300'>
											{children}
										</ul>
									),
									ol: ({ children }) => (
										<ol className='list-decimal pl-6 mb-4 space-y-2 text-gray-700 dark:text-gray-300'>
											{children}
										</ol>
									),
									li: ({ children }) => (
										<li className='text-gray-700 dark:text-gray-300'>
											{children}
										</li>
									),
									blockquote: ({ children }) => (
										<blockquote className='border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 pl-6 py-3 my-4 italic text-gray-700 dark:text-gray-300 rounded-r-lg'>
											{children}
										</blockquote>
									),
									table: ({ children }) => (
										<div className='overflow-x-auto my-6'>
											<table className='min-w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden text-sm'>
												{children}
											</table>
										</div>
									),
									thead: ({ children }) => (
										<thead className='bg-gray-50 dark:bg-gray-800'>
											{children}
										</thead>
									),
									th: ({ children }) => (
										<th className='border border-gray-200 dark:border-gray-600 px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100'>
											{children}
										</th>
									),
									td: ({ children }) => (
										<td className='border border-gray-200 dark:border-gray-600 px-4 py-3 text-gray-700 dark:text-gray-300'>
											{children}
										</td>
									),
									a: ({ children, href }) => (
										<a
											href={href}
											className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline underline-offset-2 transition-colors'
											target={href?.startsWith('http') ? '_blank' : undefined}
											rel={
												href?.startsWith('http')
													? 'noopener noreferrer'
													: undefined
											}
										>
											{children}
										</a>
									),
									img: ({ src, alt }) => (
										<img
											src={src}
											alt={alt}
											className='max-w-full h-auto rounded-lg shadow-md my-4 mx-auto block'
										/>
									),
									hr: () => (
										<hr className='border-gray-300 dark:border-gray-600 my-8' />
									),
									input: ({ type, checked, disabled }) => {
										if (type === 'checkbox') {
											return (
												<input
													type='checkbox'
													checked={checked}
													disabled={disabled}
													className='mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
												/>
											)
										}
										return null
									},
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
