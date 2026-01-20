"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { NAV_GROUPS } from "@/lib/constants"
import {
    LayoutDashboard,
    Database,
    Activity,
    Wrench,
    Users,
    Settings,
    BarChart3,
    ChevronDown,
    ChevronRight,
} from "lucide-react"
import { useState } from "react"
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
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        "Dashboard Unspec": true,
        "WOC": true
    })

    const toggleGroup = (title: string) => {
        setOpenGroups(prev => ({
            ...prev,
            [title]: !prev[title]
        }))
    }

    return (
        <nav className="flex-1 p-4 space-y-4">
            {NAV_GROUPS.map((group) => (
                <div key={group.title} className="space-y-1">
                    <button
                        onClick={() => toggleGroup(group.title)}
                        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                    >
                        {group.title}
                        {openGroups[group.title] ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>

                    {openGroups[group.title] && (
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = iconMap[item.icon as keyof typeof iconMap]
                                const isActive = pathname === item.href

                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        onClick={onNavigate}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-2",
                                            isActive
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.title}
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>
            ))}

            <div className="pt-4 mt-4 border-t border-border">
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
            </div>
        </nav>
    )
}
