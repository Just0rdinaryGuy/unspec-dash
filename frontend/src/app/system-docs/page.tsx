"use client";

import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Mermaid from "@/components/Mermaid";
import { Copy, FileText, Book, Menu, X } from "lucide-react";

// Helper for code blocks to render Mermaid
const CodeBlock = ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const code = String(children).replace(/\n$/, "");

    if (!inline && match && match[1] === "mermaid") {
        return <Mermaid chart={code} />;
    }

    return (
        <div className="relative group my-4">
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => navigator.clipboard.writeText(code)}
                    className="p-1 rounded bg-gray-700 dark:bg-gray-600 text-white hover:bg-gray-600 dark:hover:bg-gray-500"
                    title="Copy code"
                >
                    <Copy size={14} />
                </button>
            </div>
            <code className={`${className} block bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-md overflow-x-auto text-sm font-mono leading-relaxed`} {...props}>
                {children}
            </code>
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

    // Scroll spy for active heading
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

        return React.createElement(`h${level}`, { id, ...props }, children);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-200">
            <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm sticky top-0 z-20 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setTocOpen(!tocOpen)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Toggle Table of Contents"
                        >
                            {tocOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <div className="flex items-center gap-2 font-bold text-xl text-blue-900 dark:text-blue-400">
                            <Book className="w-6 h-6" />
                            <span className="hidden sm:inline">WOC System Docs</span>
                        </div>
                    </div>

                    <nav className="flex gap-2">
                        <button
                            onClick={() => setActiveDoc("master")}
                            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2
                ${activeDoc === "master"
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"}`}
                        >
                            <FileText size={16} />
                            <span className="hidden sm:inline">Master Spec</span>
                        </button>
                        <button
                            onClick={() => setActiveDoc("readme")}
                            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2
                ${activeDoc === "readme"
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"}`}
                        >
                            <FileText size={16} />
                            <span className="hidden sm:inline">README</span>
                        </button>
                    </nav>
                </div>
            </header>

            <div className="flex-1 flex max-w-7xl w-full mx-auto">
                {/* Table of Contents Sidebar */}
                {headings.length > 0 && (
                    <aside className={`
                        ${tocOpen ? 'translate-x-0' : '-translate-x-full'}
                        lg:translate-x-0 lg:static
                        fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-800 
                        transition-transform duration-300 z-10 overflow-y-auto p-4
                    `}>
                        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <Menu size={16} />
                            Table of Contents
                        </h3>
                        <nav className="space-y-1">
                            {headings.map((heading) => (
                                <button
                                    key={heading.id}
                                    onClick={() => scrollToHeading(heading.id)}
                                    className={`
                                        block w-full text-left px-3 py-2 rounded text-sm transition-colors
                                        ${heading.level === 1 ? 'font-semibold' : ''}
                                        ${heading.level === 2 ? 'pl-6 text-sm' : ''}
                                        ${heading.level === 3 ? 'pl-9 text-xs' : ''}
                                        ${activeHeading === heading.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-2 border-blue-600'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border-l-2 border-transparent'
                                        }
                                    `}
                                >
                                    {heading.text}
                                </button>
                            ))}
                        </nav>
                    </aside>
                )}

                <main className="flex-1 px-4 py-8 overflow-x-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center text-red-600 dark:text-red-400">
                            <p className="font-semibold">Error loading document</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    ) : (
                        <div ref={contentRef} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8 md:p-12 transition-colors duration-200">
                            <article className="prose prose-slate prose-lg dark:prose-invert max-w-none 
              prose-headings:text-blue-900 dark:prose-headings:text-blue-400 prose-headings:font-bold prose-headings:scroll-mt-20
              prose-h1:text-3xl sm:prose-h1:text-4xl prose-h1:border-b prose-h1:pb-4 prose-h1:mb-8 dark:prose-h1:border-gray-700
              prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-l-4 prose-h2:border-blue-500 prose-h2:pl-4
              prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:leading-relaxed prose-p:my-4 prose-p:text-gray-700 dark:prose-p:text-gray-300
              prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-strong:font-bold
              prose-ul:my-6 prose-ul:space-y-2 prose-li:text-gray-700 dark:prose-li:text-gray-300
              prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:py-3 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300 prose-blockquote:my-6
              prose-code:text-blue-600 dark:prose-code:text-blue-300 prose-code:bg-blue-50 dark:prose-code:bg-blue-900/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-[''] prose-code:after:content-['']
              prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:my-6
              prose-img:rounded-lg prose-img:shadow-md
              [&_.mermaid]:bg-gray-50 dark:[&_.mermaid]:bg-gray-800 [&_.mermaid]:p-6 [&_.mermaid]:rounded-lg [&_.mermaid]:flex [&_.mermaid]:justify-center [&_.mermaid]:my-8
            ">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeRaw]}
                                    components={{
                                        code: CodeBlock as any,
                                        h1: (props) => <CustomHeading level={1} {...props} />,
                                        h2: (props) => <CustomHeading level={2} {...props} />,
                                        h3: (props) => <CustomHeading level={3} {...props} />,
                                        // Custom Table for responsiveness
                                        table: ({ children, ...props }: any) => (
                                            <div className="overflow-x-auto my-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props}>
                                                    {children}
                                                </table>
                                            </div>
                                        ),
                                        // Custom Image for better presentation
                                        img: ({ node, ...props }: any) => (
                                            <div className="flex flex-col items-center my-8">
                                                <img
                                                    className="rounded-lg shadow-md border border-gray-100 dark:border-gray-800 max-h-[600px] object-contain"
                                                    {...props}
                                                />
                                                {props.alt && (
                                                    <span className="mt-3 text-sm text-gray-500 dark:text-gray-400 italic">
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
                    )}
                </main>
            </div>

            <footer className="bg-white dark:bg-gray-900 border-t dark:border-gray-800 py-8 mt-auto transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    &copy; 2026 WOC System. All docs are auto-generated from source.
                </div>
            </footer>
        </div>
    );
}
