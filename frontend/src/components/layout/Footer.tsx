import { Github, Send, Globe } from "lucide-react"
import Link from "next/link"

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="w-full py-4 mt-auto border-t bg-card/50 backdrop-blur-sm">
            <div className="container flex flex-col items-center justify-center gap-4">

                {/* Social Icons */}
                <div className="flex items-center gap-4">
                    <Link
                        href="https://github.com/Just0rdinaryGuy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Github className="w-5 h-5" />
                        <span className="sr-only">GitHub</span>
                    </Link>
                    <Link
                        href="https://t.me/Just0rdinaryGuy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Send className="w-5 h-5" />
                        <span className="sr-only">Telegram</span>
                    </Link>
                    <Link
                        href="https://just0rdinaryguy.github.io/-/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Globe className="w-5 h-5" />
                        <span className="sr-only">Website</span>
                    </Link>
                </div>

                <div className="text-center text-xs text-muted-foreground/80">
                    <p>
                        &copy; {currentYear > 2026 ? `2026 - ${currentYear}` : "2026"} Web WOC (Warga Online Ceria) by Just0rdinaryGuy.
                    </p>
                </div>
            </div>
        </footer>
    )
}
