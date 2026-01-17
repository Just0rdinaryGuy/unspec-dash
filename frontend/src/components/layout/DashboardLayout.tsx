"use client"

import { ReactNode } from "react"
import Sidebar from "./Sidebar"

interface DashboardLayoutProps {
    children: ReactNode
}

import MobileSidebar from "./MobileSidebar"
import Footer from "./Footer"

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {/* Desktop Sidebar (Hidden on Mobile) */}
            <div className="hidden md:flex">
                <Sidebar />
            </div>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto flex flex-col">
                {/* Mobile Header (Visible only on Mobile) */}
                <div className="md:hidden p-4 border-b border-border flex items-center justify-between bg-card sticky top-0 z-40">
                    <h1 className="font-bold text-lg">Unspec Dash</h1>
                    <MobileSidebar />
                </div>

                <div className="container mx-auto p-4 md:p-6 lg:p-8 flex-1">
                    {children}
                </div>
                <Footer />
            </main>
        </div>
    )
}
