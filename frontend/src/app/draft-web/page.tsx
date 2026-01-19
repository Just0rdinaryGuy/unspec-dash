"use client";

import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Mermaid from "@/components/Mermaid";
import { Copy, FileText, Book, Menu, X, Info, AlertTriangle, CheckCircle, Zap } from "lucide-react";

// Helper for code blocks to render Mermaid or standard code
const CodeBlock = ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const code = String(children).replace(/\n$/, "");

    // 1. Handle Mermaid Diagrams
    if (!inline && match && match[1] === "mermaid") {
        return <Mermaid chart={code} />;
    }

    // 2. Handle Inline Code (Single backticks)
    if (inline) {
        return (
            <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-sm font-mono text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700" {...props}>
                {children}
            </code>
        );
    }

    // 3. Handle Block Code (Triple backticks)
    return (
        <div className="relative group my-6 overflow-hidden rounded-md border border-gray-200 dark:border-gray-800">
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                    onClick={() => navigator.clipboard.writeText(code)}
                    className="p-1.5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 shadow-sm"
                    title="Copy code"
                >
                    <Copy size={14} />
                </button>
            </div>
            {/* GitHub-like Code Block */}
            <div className="bg-gray-50 dark:bg-[#0d1117] p-4 overflow-x-auto text-[13px] leading-[1.6]">
                <code className={`${className} block font-mono text-gray-800 dark:text-gray-300`} {...props}>
                    {children}
                </code>
            </div>
        </div>
    );
};

// Dynamic Callout Component (Alerts)
const CustomBlockquote = ({ children }: any) => {
    // Extract text content safely
    let text = "";
    React.Children.forEach(children, (child) => {
        if (typeof child === 'string') text += child;
        else if (child?.props?.children) {
            if (Array.isArray(child.props.children)) text += child.props.children.join("");
            else text += child.props.children;
        }
    });

    const lowerText = text.toLowerCase();
    let variant = "default";
    if (lowerText.includes("note:") || lowerText.includes("catatan") || lowerText.includes("informasi")) variant = "info";
    if (lowerText.includes("warning:") || lowerText.includes("peringatan") || lowerText.includes("kendala")) variant = "warning";
    if (lowerText.includes("tip:") || lowerText.includes("saran")) variant = "success";

    const styles = {
        default: "border-l-4 border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300",
        info: "border-l-4 border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100",
        warning: "border-l-4 border-amber-500 bg-amber-50 dark:border-amber-500 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100",
        success: "border-l-4 border-green-500 bg-green-50 dark:border-green-500 dark:bg-green-900/20 text-green-900 dark:text-green-100",
    };

    const icons = {
        default: null,
        info: <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />,
        success: <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />,
    };

    return (
        <div className={`my-6 px-4 py-3 rounded-r-md flex items-start gap-3 ${styles[variant as keyof typeof styles]}`}>
            {icons[variant as keyof typeof icons]}
            <div className="prose-p:my-0 prose-strong:font-bold">{children}</div>
        </div>
    );
};

// Custom Heading with Badges
const CustomHeading = ({ level, children, ...props }: any) => {
    const text = children?.toString() || '';
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

    // Badge Logic
    const renderBadge = (text: string) => {
        if (text.includes("Phase 3")) return <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"><Zap size={12} className="mr-1" /> Phase 3</span>;
        if (text.includes("Ready") || text.includes("Sukses")) return <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle size={12} className="mr-1" /> Live</span>;
        if (text.includes("Draft") || text.includes("Pending")) return <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Draft</span>;
        return null;
    };

    return React.createElement(`h${level}`, { id, ...props, className: "group flex items-center scroll-mt-24 relative" }, [
        <span key="content" className="mr-2">{children}</span>,
        <span key="badge">{renderBadge(text)}</span>,
        <a key="anchor" href={`#${id}`} className="ml-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-opacity no-underline text-lg">#</a>
    ]);
};

interface Heading {
    id: string;
    text: string;
    level: number;
}

export default function DocsPage() {
    const [activeDoc, setActiveDoc] = useState<"master" | "readme">("master");
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [headings, setHeadings] = useState<Heading[]>([]);
    const [activeHeading, setActiveHeading] = useState<string>("");
    const [tocOpen, setTocOpen] = useState<boolean>(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => {
        fetchDoc(activeDoc);
    }, [activeDoc]);

    useEffect(() => {
        if (content) {
            const headingRegex = /^#{1,3}\s+(.+)$/gm;
            const matches = [...content.matchAll(headingRegex)];
            const extractedHeadings: Heading[] = matches.map((match) => {
                const level = match[0].match(/^#+/)?.[0].length || 1;
                const text = match[1].trim();
                const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                return { id, text, level };
            });
            setHeadings(extractedHeadings);
        }
    }, [content]);

    useEffect(() => {
        const handleScroll = () => {
            const headingElements = headings.map(h => document.getElementById(h.id)).filter(Boolean);
            const scrollPosition = window.scrollY + 120; // Offset for sticky header

            for (let i = headingElements.length - 1; i >= 0; i--) {
                const element = headingElements[i];
                if (element && element.offsetTop <= scrollPosition) {
                    setActiveHeading(headings[i].id);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [headings]);

    const fetchDoc = async (docId: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/system/docs/${docId}`);
            if (!res.ok) {
                let errorMsg = res.statusText;
                try {
                    const errorJson = await res.json();
                    if (errorJson.detail) errorMsg = errorJson.detail;
                } catch (e) {
                    // ignore json parse error
                }
                throw new Error(errorMsg);
            }
            const data = await res.json();
            setContent(data.content);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const scrollToHeading = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTocOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#ffffff] dark:bg-[#0d1117] flex flex-col transition-colors duration-200">
            {/* Navbar like GitHub */}
            <header className="bg-[#f6f8fa] dark:bg-[#010409] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
                <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setTocOpen(!tocOpen)}
                            className="lg:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                        >
                            {tocOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                            <Book size={20} />
                            <span className="tracking-tight">WOC Documentation</span>
                            <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 font-normal border border-gray-300 dark:border-gray-700">v3.0</span>
                        </div>
                    </div>

                    <nav className="flex gap-2">
                        {[
                            { id: "master", label: "Draft WOC" },
                            { id: "readme", label: "Unspec Docs" }
                        ].map((doc) => (
                            <button
                                key={doc.id}
                                onClick={() => setActiveDoc(doc.id as any)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 border
                                ${activeDoc === doc.id
                                        ? "bg-white dark:bg-[#21262d] text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 shadow-sm"
                                        : "bg-transparent text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-200 dark:hover:bg-gray-800"}`}
                            >
                                <FileText size={14} />
                                <span className="capitalize">{doc.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            <div className="flex flex-1 max-w-[1400px] w-full mx-auto">
                {/* Sticky Sidebar with GitHub style */}
                {headings.length > 0 && (
                    <aside className={`
                        ${tocOpen ? 'translate-x-0' : '-translate-x-full'}
                        lg:translate-x-0 lg:block
                        fixed lg:sticky top-14 left-0 h-[calc(100vh-3.5rem)] w-72 
                        bg-[#f6f8fa] lg:bg-transparent dark:bg-[#0d1117] lg:dark:bg-transparent
                        border-r border-gray-200 dark:border-gray-800 lg:border-none
                        transition-transform duration-300 z-20 overflow-y-auto pl-4 pr-6 py-8
                    `}>
                        <h5 className="font-semibold text-xs text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider px-2">
                            On this page
                        </h5>
                        <nav className="space-y-0.5 relative">
                            {/* Active indicator line */}
                            <div className="absolute left-0 w-[2px] bg-gray-200 dark:bg-gray-800 h-full" />

                            {headings.map((heading) => (
                                <button
                                    key={heading.id}
                                    onClick={() => scrollToHeading(heading.id)}
                                    className={`
                                        block w-full text-left px-3 py-1.5 text-sm transition-colors border-l-2 -ml-[2px] relative
                                        ${heading.level === 1 ? 'font-semibold mt-4 text-gray-900 dark:text-gray-100' : ''}
                                        ${heading.level === 2 ? 'pl-3 text-gray-600 dark:text-gray-400' : ''}
                                        ${heading.level === 3 ? 'pl-5 text-xs text-gray-500 dark:text-gray-500' : ''}
                                        ${activeHeading === heading.id
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-medium'
                                            : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-gray-200'
                                        }
                                    `}
                                >
                                    {heading.text}
                                </button>
                            ))}
                        </nav>
                    </aside>
                )}

                <main className="flex-1 min-w-0 w-full px-4 sm:px-6 lg:px-8 py-8 bg-[#ffffff] dark:bg-[#0d1117]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 space-y-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-gray-400 dark:border-gray-600"></div>
                            <span className="text-sm text-gray-500">Loading documentation...</span>
                        </div>
                    ) : error ? (
                        <div className="max-w-3xl mx-auto mt-10 p-6 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 rounded-lg text-red-600 dark:text-red-400 text-center shadow-sm">
                            <AlertTriangle className="mx-auto h-10 w-10 mb-3" />
                            <h3 className="font-semibold text-lg">Unable to load document</h3>
                            <p className="text-sm mt-1 opacity-80">{error}</p>
                        </div>
                    ) : (
                        <div ref={contentRef} className="max-w-5xl mx-auto">
                            {/* Paper UI - Document Container */}
                            <div className="bg-white dark:bg-[#0d1117] md:border md:border-gray-200 md:dark:border-gray-800 md:rounded-lg md:shadow-sm md:p-12 p-4 min-h-[500px]">
                                <article className="prose prose-slate prose-lg dark:prose-invert max-w-none
                                    text-gray-700 dark:text-[#e6edf3] font-sans leading-relaxed
                                    
                                    /* Headings */
                                    prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                                    prose-h1:text-4xl prose-h1:font-bold prose-h1:pb-4 prose-h1:border-b prose-h1:border-gray-200 dark:prose-h1:border-gray-800 prose-h1:mb-10
                                    prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-16 prose-h2:mb-6 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-200 dark:prose-h2:border-gray-800
                                    prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
                                    
                                    /* Paragraphs & Lists */
                                    prose-p:leading-7 prose-p:mb-5 text-[16px]
                                    prose-li:my-1.5 prose-li:leading-7
                                    prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6 marker:text-gray-400 dark:marker:text-gray-500
                                    prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
                                    
                                    /* Links */
                                    prose-a:text-[#0969da] dark:prose-a:text-[#4493f8] prose-a:no-underline hover:prose-a:underline
                                    
                                    /* Code & Pre */
                                    prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:bg-gray-100 dark:prose-code:bg-[rgba(110,118,129,0.4)] prose-code:text-sm prose-code:font-mono prose-code:text-gray-800 dark:prose-code:text-gray-200 before:prose-code:content-none after:prose-code:content-none
                                    prose-pre:bg-gray-50 dark:prose-pre:bg-[#161b22] prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700 prose-pre:rounded-lg
                                    
                                    /* HR */
                                    prose-hr:my-12 prose-hr:border-gray-200 dark:prose-hr:border-gray-800
                                    
                                    /* Table */
                                    /* Table - Simple Grid Style (User Request) */
                                    prose-table:w-full prose-table:border-collapse prose-table:my-8 prose-table:block prose-table:overflow-x-auto
                                    prose-th:border prose-th:border-gray-500 dark:prose-th:border-gray-600 prose-th:px-4 prose-th:py-3 prose-th:bg-transparent prose-th:text-gray-900 dark:prose-th:text-gray-100 prose-th:font-bold prose-th:bg-gray-100/50 dark:prose-th:bg-gray-800/30
                                    prose-td:border prose-td:border-gray-500 dark:prose-td:border-gray-600 prose-td:px-4 prose-td:py-3 prose-td:bg-transparent
                                    prose-tr:bg-transparent

                                    /* Multimedia */
                                    [&_.mermaid]:bg-gray-50 dark:[&_.mermaid]:bg-[#0d1117] [&_.mermaid]:border [&_.mermaid]:border-gray-200 dark:[&_.mermaid]:border-gray-800 [&_.mermaid]:rounded-lg [&_.mermaid]:p-6 [&_.mermaid]:flex [&_.mermaid]:justify-center [&_.mermaid]:my-10
                                    prose-img:rounded-lg prose-img:border prose-img:border-gray-200 dark:prose-img:border-gray-800 prose-img:shadow-sm prose-img:bg-white dark:prose-img:bg-transparent prose-img:mx-auto
                                ">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        rehypePlugins={[rehypeRaw]}
                                        components={{
                                            code: CodeBlock as any,
                                            blockquote: CustomBlockquote,
                                            h1: (props) => <CustomHeading level={1} {...props} />,
                                            h2: (props) => <CustomHeading level={2} {...props} />,
                                            h3: (props) => <CustomHeading level={3} {...props} />,
                                            h4: (props) => <CustomHeading level={4} {...props} />,
                                            table: ({ children, ...props }: any) => (
                                                <div className="overflow-x-auto my-8">
                                                    <table className="min-w-full text-sm border-collapse border border-gray-500 dark:border-gray-600" {...props}>
                                                        {children}
                                                    </table>
                                                </div>
                                            ),
                                            th: ({ children, ...props }: any) => (
                                                <th className="border border-gray-500 dark:border-gray-600 px-4 py-3 text-left font-bold text-gray-900 dark:text-gray-100 bg-gray-100/50 dark:bg-gray-800/30" {...props}>
                                                    {children}
                                                </th>
                                            ),
                                            td: ({ children, ...props }: any) => (
                                                <td className="border border-gray-500 dark:border-gray-600 px-4 py-3 text-gray-700 dark:text-gray-300" {...props}>
                                                    {children}
                                                </td>
                                            ),
                                            img: ({ node, ...props }: any) => (
                                                <div className="flex flex-col items-center my-10 group">
                                                    <div className="relative overflow-hidden rounded-lg shadow-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0d1117] transition-transform hover:scale-[1.01]">
                                                        <img
                                                            className="max-h-[700px] object-contain block m-0"
                                                            {...props}
                                                        />
                                                    </div>
                                                    {props.alt && (
                                                        <span className="mt-3 text-sm text-gray-500 dark:text-gray-400 font-medium italic">
                                                            {props.alt}
                                                        </span>
                                                    )}
                                                </div>
                                            )
                                        }}
                                    >
                                        {content}
                                    </ReactMarkdown>
                                </article>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <footer className="py-10 text-center border-t border-gray-200 dark:border-gray-800 bg-[#f6f8fa] dark:bg-[#0d1117] mt-auto">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    WOC System Documentation &bull; v3.0
                </p>
            </footer>
        </div>
    );
}
