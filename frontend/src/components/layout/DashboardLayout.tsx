"use client"

import { ReactNode } from "react"
import Sidebar from "./Sidebar"

interface DashboardLayoutProps {
    children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* Sidebar */}
            <Sidebar />

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
