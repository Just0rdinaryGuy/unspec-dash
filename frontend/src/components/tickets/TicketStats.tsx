"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/constants"
import axios from "axios"

interface TicketSummary {
    total_tickets: number
    total_open: number
    total_progress: number
    total_close: number
    total_kendala: number
    avg_resolution_time: number | null
}

interface TicketStatsProps {
    stats: TicketSummary | null
    loading: boolean
}

export default function TicketStats({ stats, loading }: TicketStatsProps) {
    // Default values safe for rendering
    const safeStats = stats || {
        total_tickets: 0,
        total_open: 0,
        total_progress: 0,
        total_close: 0,
        total_kendala: 0,
        avg_resolution_time: 0
    }

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
                            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{safeStats.total_tickets.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        Semua tiket
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Progress</CardTitle>
                    <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-500">{safeStats.total_progress.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        Sedang dikerjakan
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Closed</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-500">{safeStats.total_close.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        Selesai
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Kendala</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-500">{safeStats.total_kendala.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        Bermasalah
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
