"use client";

import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Mermaid from "@/components/Mermaid";
import { Copy, FileText, Book, Menu, X, Github } from "lucide-react";

// GitHub Dark Theme Colors
// bg-canvas-default: #0d1117
// bg-canvas-subtle: #161b22
// border-default: #30363d
// text-default: #c9d1d9
// accent-emphasis: #1f6feb

// Helper for code blocks to render Mermaid
const CodeBlock = ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const code = String(children).replace(/\n$/, "");

    if (!inline && match && match[1] === "mermaid") {
        return <Mermaid chart={code} />;
    }

    return (
        <div className="relative group my-4 rounded-md border border-[#30363d] bg-[#161b22] text-[#c9d1d9]">
            <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d] rounded-t-md">
                <span className="text-xs font-mono text-gray-400">{match?.[1] || 'text'}</span>
                <button
                    onClick={() => navigator.clipboard.writeText(code)}
                    className="p-1.5 rounded hover:bg-[#30363d] text-gray-400 hover:text-white transition-colors"
                    title="Copy code"
                >
                    <Copy size={14} />
                </button>
            </div>
            <div className="p-4 overflow-x-auto">
                <code className={`${className} block text-sm font-mono leading-relaxed bg-transparent`} {...props}>
                    {children}
                </code>
            </div>
        </div>
    );
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

    // Extract headings from markdown for TOC
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

    // Scroll spy
    useEffect(() => {
        const handleScroll = () => {
            const headingElements = headings.map(h => document.getElementById(h.id)).filter(Boolean);
            const scrollPosition = window.scrollY + 100;

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
                throw new Error(`Failed to load document: ${res.statusText}`);
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

    const CustomHeading = ({ level, children, ...props }: any) => {
        const text = children?.toString() || '';
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

        // Add group class for hover anchor link effect (optional, simplified here)
        return React.createElement(`h${level}`, { id, ...props, className: 'group flex items-center gap-2' }, children);
    };

    return (
        <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex flex-col font-sans">
            {/* Header - GitHub Header Style */}
            <header className="bg-[#161b22] border-b border-[#30363d] sticky top-0 z-30">
                <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setTocOpen(!tocOpen)}
                            className="lg:hidden p-1.5 rounded-md hover:bg-[#30363d] text-[#c9d1d9]"
                        >
                            {tocOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <div className="flex items-center gap-2 font-semibold text-[#c9d1d9]">
                            <Book className="w-5 h-5 text-gray-400" />
                            <span>WOC Draft Web</span>
                        </div>
                    </div>

                    <div className="flex bg-[#30363d] p-1 rounded-md">
                        <button
                            onClick={() => setActiveDoc("master")}
                            className={`px-3 py-1 text-sm font-medium rounded-sm transition-all
                                ${activeDoc === "master" ? "bg-[#1f6feb] text-white shadow-sm" : "hover:text-white text-gray-400"}`}
                        >
                            Master Docs WOC
                        </button>
                        <button
                            onClick={() => setActiveDoc("readme")}
                            className={`px-3 py-1 text-sm font-medium rounded-sm transition-all
                                ${activeDoc === "readme" ? "bg-[#1f6feb] text-white shadow-sm" : "hover:text-white text-gray-400"}`}
                        >
                            Docs Unspec
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 max-w-[1400px] w-full mx-auto">
                {/* Sidebar - GitHub Settings Sidebar Style */}
                <aside className={`
                    fixed lg:sticky top-14 left-0 h-[calc(100vh-3.5rem)] w-72 
                    bg-[#0d1117] lg:bg-transparent border-r border-[#30363d] lg:border-none
                    transform ${tocOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 
                    transition-transform duration-200 z-20 overflow-y-auto pt-6 pb-10 px-6
                `}>
                    <h5 className="mb-3 font-semibold text-[#c9d1d9] text-xs uppercase tracking-wider">
                        Table of Contents
                    </h5>
                    <nav className="space-y-0.5">
                        {headings.map((heading) => (
                            <button
                                key={heading.id}
                                onClick={() => scrollToHeading(heading.id)}
                                className={`
                                    block w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors leading-snug
                                    ${heading.level === 1 ? 'font-semibold text-[#c9d1d9] mt-2' : ''}
                                    ${heading.level === 2 ? 'pl-5 text-[#8b949e]' : ''}
                                    ${heading.level === 3 ? 'pl-8 text-xs text-[#8b949e]' : ''}
                                    ${activeHeading === heading.id
                                        ? 'bg-[#1f6feb] text-white'
                                        : 'hover:bg-[#161b22] hover:text-[#c9d1d9]'
                                    }
                                `}
                            >
                                {heading.text}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Backdrp for mobile */}
                {tocOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-10 lg:hidden"
                        onClick={() => setTocOpen(false)}
                    />
                )}

                {/* Main Content - GitHub Readme Style */}
                <main className="flex-1 w-full min-w-0 lg:border-l border-[#30363d]">
                    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 lg:py-10">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="w-8 h-8 border-2 border-[#1f6feb] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : error ? (
                            <div className="border border-red-900/50 bg-red-900/10 text-red-400 p-4 rounded-md">
                                {error}
                            </div>
                        ) : (
                            <article className="prose prose-invert max-w-none
                                prose-headings:border-b prose-headings:border-[#30363d] prose-headings:pb-2 prose-headings:mb-4
                                prose-h1:text-3xl prose-h1:font-semibold prose-h1:text-[#c9d1d9] prose-h1:mt-8
                                prose-h2:text-2xl prose-h2:font-semibold prose-h2:text-[#c9d1d9] prose-h2:mt-10
                                prose-h3:text-xl prose-h3:font-semibold prose-h3:text-[#c9d1d9] prose-h3:mt-8
                                prose-p:text-[#c9d1d9] prose-p:leading-7 prose-p:my-4
                                prose-a:text-[#58a6ff] prose-a:no-underline hover:prose-a:underline
                                prose-strong:text-[#c9d1d9] prose-strong:font-semibold
                                prose-ul:my-4 prose-ul:pl-6 prose-li:my-1 prose-li:text-[#c9d1d9]
                                prose-img:bg-white prose-img:p-2 prose-img:rounded-md prose-img:border prose-img:border-[#30363d]
                                prose-hr:border-[#30363d] prose-hr:my-8
                                prose-blockquote:border-l-4 prose-blockquote:border-[#30363d] prose-blockquote:text-[#8b949e] prose-blockquote:pl-4 prose-blockquote:italic
                                
                                /* Table Styling mimic GitHub */
                                prose-table:border-collapse prose-table:w-full prose-table:my-6 prose-table:block prose-table:overflow-auto
                                prose-th:border prose-th:border-[#30363d] prose-th:px-3 prose-th:py-2 prose-th:bg-[#161b22] prose-th:text-[#c9d1d9] prose-th:font-semibold prose-th:text-left
                                prose-td:border prose-td:border-[#30363d] prose-td:px-3 prose-td:py-2 prose-td:text-[#c9d1d9] prose-tr:bg-[#0d1117] prose-tr:even:bg-[#161b22]
                            ">
                                {/* README Header mimicking GitHub's file header */}
                                <div className="mb-8 border border-[#30363d] rounded-md bg-[#0d1117]">
                                    <div className="bg-[#161b22] px-4 py-3 border-b border-[#30363d] rounded-t-md flex items-center gap-2 text-sm text-[#c9d1d9] font-mono">
                                        <Book size={16} />
                                        <span className="font-semibold">{activeDoc === 'master' ? 'WOC_MASTER_DOCUMENT.md' : 'README.md'}</span>
                                    </div>
                                    <div className="p-6 sm:p-10 bg-[#0d1117] rounded-b-md">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            rehypePlugins={[rehypeRaw]}
                                            components={{
                                                code: CodeBlock as any,
                                                h1: (props) => <CustomHeading level={1} {...props} />,
                                                h2: (props) => <CustomHeading level={2} {...props} />,
                                                h3: (props) => <CustomHeading level={3} {...props} />,
                                                // Images
                                                img: ({ node, ...props }: any) => (
                                                    <a href={props.src} target="_blank" rel="noopener noreferrer" className="block my-8 group">
                                                        <div className="border border-[#30363d] rounded-lg overflow-hidden bg-[#0d1117]">
                                                            <img {...props} className="block max-w-full h-auto mx-auto m-0 p-0 bg-transparent border-0" />
                                                        </div>
                                                        {props.alt && (
                                                            <p className="text-center text-[#8b949e] text-sm mt-2">{props.alt}</p>
                                                        )}
                                                    </a>
                                                ),
                                                // Tables - override prose default to ensure wrapper
                                                table: ({ children, ...props }: any) => (
                                                    <div className="my-6 w-full overflow-hidden border border-[#30363d] rounded-md">
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left text-sm" {...props}>
                                                                {children}
                                                            </table>
                                                        </div>
                                                    </div>
                                                ),
                                                thead: ({ children, ...props }: any) => (
                                                    <thead className="bg-[#161b22] text-[#c9d1d9] font-semibold" {...props}>{children}</thead>
                                                ),
                                                tbody: ({ children, ...props }: any) => (
                                                    <tbody className="bg-[#0d1117]" {...props}>{children}</tbody>
                                                ),
                                                tr: ({ children, ...props }: any) => (
                                                    <tr className="border-b border-[#30363d] last:border-0 hover:bg-[#161b22]/50 transition-colors" {...props}>{children}</tr>
                                                ),
                                                th: ({ children, ...props }: any) => (
                                                    <th className="px-4 py-3 border-r border-[#30363d] last:border-0 whitespace-nowrap" {...props}>{children}</th>
                                                ),
                                                td: ({ children, ...props }: any) => (
                                                    <td className="px-4 py-3 border-r border-[#30363d] last:border-0 align-top" {...props}>{children}</td>
                                                )
                                            }}
                                        >
                                            {content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </article>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
