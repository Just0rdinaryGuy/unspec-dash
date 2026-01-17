"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "@/lib/constants"
import {
    LayoutDashboard,
    Database,
    Activity,
    Wrench,
    Moon,
    Sun,
    Users,
    Settings,
    LogOut,
    BarChart3
} from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

// Map icon names ke komponen lucide
const iconMap = {
    LayoutDashboard,
    Database,
    Activity,
    Wrench,
    BarChart3
}

export default function Sidebar() {
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const { user, logout } = useAuth()

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <aside className="w-64 border-r border-border bg-card flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border">
                <h1 className="text-xl font-bold text-foreground">
                    Monitoring Unspec Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">by Just0rdinaryGuy</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {NAV_ITEMS.map((item) => {
                    const Icon = iconMap[item.icon as keyof typeof iconMap]
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {item.title}
                        </Link>
                    )
                })}

                {(user?.role === 'admin' || user?.role === 'developer') ? (
                    <Link
                        href="/users"
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                            pathname === "/users"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <Users className="w-5 h-5" />
                        User Management
                    </Link>
                ) : (
                    <Link
                        href="/settings"
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                            pathname === "/settings"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <Settings className="w-5 h-5" />
                        Account Settings
                    </Link>
                )}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border space-y-4">
                {user && (
                    <div className="flex items-center gap-2 px-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs font-medium text-foreground">
                            {user.username} ({user.role})
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    {mounted && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="h-9 w-9 shrink-0"
                            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {theme === "dark" ? (
                                <Sun className="w-4 h-4" />
                            ) : (
                                <Moon className="w-4 h-4" />
                            )}
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={logout}
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </Button>
                </div>
            </div>
        </aside>
    )
}
