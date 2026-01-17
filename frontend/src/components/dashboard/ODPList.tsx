"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { API_BASE_URL } from "@/lib/constants"

interface ODPInfo {
    odp_name: string
    total_subscribers: number
    sto: string
    sector: string
    spec_count: number
    unspec_count: number
}

export default function ODPList() {
    const [data, setData] = useState<ODPInfo[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/dashboard/odp-list?limit=50`)
            .then(res => res.json())
            .then(data => {
                // Filter hanya ODP dengan UNSPEC > 1
                const filtered = data.filter((odp: ODPInfo) => odp.unspec_count > 1)
                setData(filtered)
                setLoading(false)
            })
            .catch(err => {
                console.error("Error:", err)
                setLoading(false)
            })
    }, [])

    return (
        <Card className="flex flex-col max-h-[calc(100vh-8rem)]">
            <CardHeader>
                <CardTitle className="text-lg">ODP List</CardTitle>
                <p className="text-sm text-muted-foreground">Jumlah Pelanggan Unspec terbanyak per ODP</p>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-6 pb-4">
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">Belum ada data</div>
                    ) : (
                        <div className="space-y-4">
                            {data.map((odp, idx) => (
                                <div
                                    key={`${odp.odp_name}-${idx}`}
                                    className="flex flex-col gap-2 border-b pb-3 last:border-0"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="font-medium text-sm text-foreground">
                                                {odp.odp_name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {odp.sto} • {odp.sector}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-foreground">{odp.unspec_count}</div>
                                        </div>
                                    </div>

                                    <div className="text-[10px] text-red-500 font-medium">
                                        {odp.unspec_count} Pelanggan UNSPEC
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
