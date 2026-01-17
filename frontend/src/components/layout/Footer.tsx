import { Github, Send, Globe } from "lucide-react"
import Link from "next/link"

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="w-full py-8 mt-auto">
            <div className="container flex flex-col items-center justify-center gap-6">

                {/* Social Icons */}
                <div className="flex items-center gap-4">
                    <Link
                        href="https://github.com/Just0rdinaryGuy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-muted/30 hover:bg-muted text-foreground/80 hover:text-foreground transition-colors"
                    >
                        <Github className="w-5 h-5" />
                        <span className="sr-only">GitHub</span>
                    </Link>
                    <Link
                        href="https://t.me/Just0rdinaryGuy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-muted/30 hover:bg-muted text-foreground/80 hover:text-foreground transition-colors"
                    >
                        <Send className="w-5 h-5" />
                        <span className="sr-only">Telegram</span>
                    </Link>
                    <Link
                        href="https://just0rdinaryguy.github.io/-/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-muted/30 hover:bg-muted text-foreground/80 hover:text-foreground transition-colors"
                    >
                        <Globe className="w-5 h-5" />
                        <span className="sr-only">Website</span>
                    </Link>
                </div>

                {/* Separator */}
                <div className="w-full max-w-[500px] h-px bg-border/50" />

                <div className="text-center text-sm text-muted-foreground">
                    <p>
                        &copy; {currentYear > 2026 ? `2026 - ${currentYear}` : "2026"} Just0rdinaryGuy. Dibuat dengan Next.js & Shadcn/ui.
                    </p>
                </div>
            </div>
        </footer>
    )
}
