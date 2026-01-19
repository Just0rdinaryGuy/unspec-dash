"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Mermaid from "@/components/Mermaid";
import { Copy, FileText, Book } from "lucide-react";

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
                    className="p-1 rounded bg-gray-700 text-white hover:bg-gray-600"
                    title="Copy code"
                >
                    <Copy size={14} />
                </button>
            </div>
            <code className={`${className} block bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm`} {...props}>
                {children}
            </code>
        </div>
    );
};

export default function DocsPage() {
    const [activeDoc, setActiveDoc] = useState<"master" | "readme">("master");
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Use environment variable or fallback to localhost/API path
    // In production (VPS), backend is likely behind /api/ reverse proxy or on a specific port.
    // Assuming configured proxy like task list said.
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => {
        fetchDoc(activeDoc);
    }, [activeDoc]);

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

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-200">
            <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm sticky top-0 z-10 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl text-blue-900 dark:text-blue-400">
                        <Book className="w-6 h-6" />
                        <span>WOC System Docs</span>
                    </div>

                    <nav className="flex gap-2">
                        <button
                            onClick={() => setActiveDoc("master")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                ${activeDoc === "master"
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"}`}
                        >
                            <FileText size={16} />
                            Master Spec
                        </button>
                        <button
                            onClick={() => setActiveDoc("readme")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                ${activeDoc === "readme"
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"}`}
                        >
                            <FileText size={16} />
                            README
                        </button>
                    </nav>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
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
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 md:p-12 transition-colors duration-200">
                        <article className="prose prose-slate prose-lg dark:prose-invert max-w-none
              prose-headings:text-blue-900 dark:prose-headings:text-blue-400 prose-headings:font-bold
              prose-h1:text-4xl prose-h1:border-b prose-h1:pb-4 prose-h1:mb-8 dark:prose-h1:border-gray-700
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:border-l-4 prose-h2:border-blue-500 prose-h2:pl-4
              prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
              prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300
              prose-code:text-blue-600 dark:prose-code:text-blue-300 prose-code:bg-blue-50 dark:prose-code:bg-blue-900/30 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']
              prose-img:rounded-lg prose-img:shadow-md
              [&_.mermaid]:bg-gray-50 dark:[&_.mermaid]:bg-gray-800 [&_.mermaid]:p-4 [&_.mermaid]:rounded-lg [&_.mermaid]:flex [&_.mermaid]:justify-center
            ">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                components={{
                                    code: CodeBlock as any,
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
                                                <span className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
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

            <footer className="bg-white dark:bg-gray-900 border-t dark:border-gray-800 py-8 mt-auto transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    &copy; 2026 WOC System. All docs are auto-generated from source.
                </div>
            </footer>
        </div>
    );
}
