"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Activity, Ticket } from "lucide-react"
import { API_BASE_URL } from "@/lib/constants"
import { formatNumber, formatPercentage } from "@/lib/utils"

interface NetworkSummary {
    total_hvc: {
        diamond: number
        gold: number
        platinum: number
        regular: number
        total: number
    }
    total_customer: {
        diamond: number
        gold: number
        platinum: number
        regular: number
        total: number
    }
    network_health: {
        spec: number
        unspec: number
        spec_count: number
        unspec_count: number
        total_nodes: number
    }
    ticket_status: {
        open: number
        closed: number
        total: number
    }
}

export default function SummaryCards() {
    const [summary, setSummary] = useState<NetworkSummary | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Fetch summary data dari API
        fetch(`${API_BASE_URL}/api/dashboard/summary`)
            .then(res => res.json())
            .then(data => {
                // Backend return total_hvc, frontend expect total_customer
                // Bikin alias buat compatibility
                if (data.total_hvc && !data.total_customer) {
                    data.total_customer = data.total_hvc
                }
                setSummary(data)
                setLoading(false)
            })
            .catch(err => {
                console.error("Error fetching summary:", err)
                setLoading(false)
            })
    }, [])

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
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

    if (!summary) {
        return <div className="text-center text-muted-foreground">Gagal load data</div>
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Total Customer Tipe */}
            <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium">Total Customer Tipe</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(summary.total_customer.total)}</div>
                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                            <span>💎 Diamond:</span>
                            <span className="font-medium">{summary.total_customer.diamond}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>🥇 Gold:</span>
                            <span className="font-medium">{summary.total_customer.gold}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>🥈 Platinum:</span>
                            <span className="font-medium">{summary.total_customer.platinum}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>⚪ Regular:</span>
                            <span className="font-medium">{summary.total_customer.regular || 0}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: Kualitas Jaringan */}
            <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium">Kualitas Jaringan</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatPercentage(summary.network_health.spec)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">SPEC Status</p>
                    <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 transition-all"
                                    style={{ width: `${summary.network_health.spec}%` }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {formatNumber(summary.network_health.spec_count)}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>UNSPEC: {formatPercentage(summary.network_health.unspec)}</span>
                            <span>Total: {formatNumber(summary.network_health.total_nodes)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card 3: Ticket Status */}
            <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium">Ticket Status</CardTitle>
                    <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(summary.ticket_status.total)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Total Tickets</p>
                    <div className="mt-3 flex justify-between text-sm">
                        <div>
                            <div className="text-yellow-600 dark:text-yellow-400 font-semibold">
                                {summary.ticket_status.open}
                            </div>
                            <div className="text-xs text-muted-foreground">Open</div>
                        </div>
                        <div>
                            <div className="text-green-600 dark:text-green-400 font-semibold">
                                {summary.ticket_status.closed}
                            </div>
                            <div className="text-xs text-muted-foreground">Closed</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
