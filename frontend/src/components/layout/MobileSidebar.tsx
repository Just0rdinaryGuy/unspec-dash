"use client"

import { Menu, X, Moon, Sun, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import SidebarNav from "./SidebarNav"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"

export default function MobileSidebar() {
    const [open, setOpen] = useState(false)
    const { theme, setTheme } = useTheme()
    const { user, logout } = useAuth()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <>
            {/* Trigger Button - Mobile Only */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setOpen(true)}
            >
                <Menu className="h-6 w-6" />
            </Button>

            {/* Overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-100 ease-in-out"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Sidebar drawer */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-50 h-full w-72 bg-background border-r shadow-lg transition-transform duration-300 ease-in-out transform flex flex-col",
                open ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Header */}
                <div className="p-6 border-b border-border flex justify-between items-center bg-card">
                    <div>
                        <h2 className="text-lg font-bold">Unspec Dash</h2>
                        <p className="text-xs text-muted-foreground">By Just0rdinaryGuy</p>
                        <p className="text-xs text-muted-foreground">Excel Prima Bara</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Nav */}
                <div className="flex-1 overflow-y-auto py-4 bg-card">
                    <SidebarNav onNavigate={() => setOpen(false)} />
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border space-y-4 bg-card">
                    {user && (
                        <div className="flex items-center gap-2 px-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-xs font-medium text-foreground">
                                {user.username}
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
                            >
                                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 justify-start gap-2 text-red-500"
                            onClick={logout}
                        >
                            <LogOut className="w-4 h-4" />
                            Log Out
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}
