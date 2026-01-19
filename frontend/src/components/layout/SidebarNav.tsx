"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NAV_ITEMS } from "@/lib/constants"
import {
    LayoutDashboard,
    Database,
    Activity,
    Wrench,
    Users,
    Settings,
    BarChart3
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const iconMap = {
    LayoutDashboard,
    Database,
    Activity,
    Wrench,
    BarChart3
}

interface SidebarNavProps {
    onNavigate?: () => void
}

export default function SidebarNav({ onNavigate }: SidebarNavProps) {
    const pathname = usePathname()
    const { user } = useAuth()

    return (
        <nav className="flex-1 p-4 space-y-2">
            {NAV_ITEMS.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap]
                const isActive = pathname === item.href

                return (
                    <Link
                        key={item.id}
                        href={item.href}
                        onClick={onNavigate}
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
                    onClick={onNavigate}
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
                    onClick={onNavigate}
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
    )
}
