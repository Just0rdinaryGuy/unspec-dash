"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Ticket, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { API_BASE_URL } from "@/lib/constants"
import { formatNumber } from "@/lib/utils"

interface TicketSummary {
    total_tickets: number
    total_open: number
    total_progress: number
    total_close: number
    total_kendala: number
    avg_resolution_time: number | null
}

interface TicketStatsProps {
    stats?: TicketSummary | null
    loading?: boolean
    refreshtrigger?: number // Optional trigger to refetch if self-managed (deprecated setup)
}

export default function TicketStats({ stats: passedStats, loading: passedLoading }: TicketStatsProps) {
    const [localStats, setLocalStats] = useState<TicketSummary | null>(null)
    const [localLoading, setLocalLoading] = useState(true)

    // Use passed props if available, otherwise use local state
    const displayStats = passedStats !== undefined ? passedStats : localStats
    const isLoading = passedLoading !== undefined ? passedLoading : localLoading

    useEffect(() => {
        // Only fetch if no stats passed (legacy mode)
        if (passedStats === undefined) {
            fetch(`${API_BASE_URL}/api/tickets/summary`)
                .then(res => res.json())
                .then(data => {
                    setLocalStats(data)
                    setLocalLoading(false)
                })
                .catch(err => {
                    console.error("Error fetching stats:", err)
                    setLocalLoading(false)
                })
        }
    }, [passedStats])

    if (isLoading || !displayStats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="pb-2">
                            <div className="h-4 bg-muted rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 bg-muted rounded w-3/4"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Tickets */}
            <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-medium">Total</CardTitle>
                    <Ticket className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-primary">
                        {formatNumber(displayStats.total_tickets)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Semua tiket</p>
                </CardContent>
            </Card>

            {/* In Progress */}
            <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-medium">Progress</CardTitle>
                    <Clock className="h-5 w-5 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {formatNumber(displayStats.total_progress)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Sedang dikerjakan</p>
                </CardContent>
            </Card>

            {/* Closed */}
            <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-medium">Closed</CardTitle>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {formatNumber(displayStats.total_close)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Selesai</p>
                </CardContent>
            </Card>

            {/* Kendala */}
            <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-medium">Kendala</CardTitle>
                    <AlertCircle className="h-5 w-5 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {formatNumber(displayStats.total_kendala)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Bermasalah</p>
                </CardContent>
            </Card>
        </div>
    )
}
