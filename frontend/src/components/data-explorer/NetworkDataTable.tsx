"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { API_BASE_URL } from "@/lib/constants"
import { formatPower, getStatusColor, cn } from "@/lib/utils"

interface NetworkNode {
    node_id: string
    port: string
    nd: string
    status: string
    rx_power: number
    sto: string
    sector: string
    odp: string
    hvc_category: string | null
    spec_status: string
}

interface NetworkDataTableProps {
    filters: {
        sto: string
        sector: string
        redamanStatus: string
        search: string
    }
}

export default function NetworkDataTable({ filters }: NetworkDataTableProps) {
    const [data, setData] = useState<NetworkNode[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const limit = 150 // jumlah per page

    useEffect(() => {
        fetchData()
    }, [page, filters])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Bikin query params
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString()
            })

            if (filters.sto) params.append("sto", filters.sto)
            if (filters.sector) params.append("sector", filters.sector)
            if (filters.redamanStatus) params.append("spec_status", filters.redamanStatus)
            if (filters.search) params.append("search", filters.search)

            const response = await fetch(`${API_BASE_URL}/api/data-explorer/nodes?${params}`)
            const result = await response.json()

            setData(result.data)
            setTotal(result.pagination.total)
            setTotalPages(result.pagination.total_pages)
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    // Reset ke page 1 kalo filter berubah
    useEffect(() => {
        setPage(1)
    }, [filters])

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                    <CardTitle>Data Unspec</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Showing {data.length} of {total.toLocaleString()}
                    </p>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[140px] font-semibold">Node ID</TableHead>
                                <TableHead className="w-[100px] font-semibold">Port</TableHead>
                                <TableHead className="w-[180px] font-semibold">ND</TableHead>
                                <TableHead className="w-[90px] font-semibold">Status</TableHead>
                                <TableHead className="w-[110px] font-semibold">RX Power</TableHead>
                                <TableHead className="w-[60px] font-semibold">STO</TableHead>
                                <TableHead className="w-[140px] font-semibold">Sector</TableHead>
                                <TableHead className="w-[300px] font-semibold">ODP</TableHead>
                                <TableHead className="w-[90px] font-semibold">HVC</TableHead>
                                <TableHead className="w-[90px] font-semibold">Status Jaringan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-32 text-center">
                                        Loading data...
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-32 text-center">
                                        Tidak ada data yang sesuai filter
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((node, idx) => {
                                    const powerFormatted = formatPower(node.rx_power)

                                    return (
                                        <TableRow
                                            key={`${node.node_id}-${node.nd}-${idx}`}
                                            className="hover:bg-muted/50 transition-colors"
                                        >
                                            <TableCell className="font-mono text-xs">{node.node_id}</TableCell>
                                            <TableCell className="font-mono text-xs">{node.port}</TableCell>
                                            <TableCell className="font-mono text-xs">{node.nd}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-xs", getStatusColor(node.status))}
                                                >
                                                    {node.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    "font-semibold text-sm",
                                                    powerFormatted.color
                                                )}>
                                                    {powerFormatted.value}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-medium">{node.sto}</TableCell>
                                            <TableCell className="text-sm">{node.sector}</TableCell>
                                            <TableCell className="text-xs max-w-[300px] truncate" title={node.odp}>
                                                {node.odp}
                                            </TableCell>
                                            <TableCell>
                                                {node.hvc_category && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {node.hvc_category}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-xs font-semibold", getStatusColor(node.spec_status))}
                                                >
                                                    {node.spec_status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {!loading && data.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
