"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/lib/constants"

interface StatusKurma {
    sto: string
    spec: number
    unspec: number
    grand_total: number
}

export default function StatusKurmaTable() {
    const [data, setData] = useState<StatusKurma[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/dashboard/status-kurma`)
            .then(res => res.json())
            .then(data => {
                setData(data)
                setLoading(false)
            })
            .catch(err => {
                console.error("Error:", err)
                setLoading(false)
            })
    }, [])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Status Kurma - SPEC vs UNSPEC</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center text-sm">STO</TableHead>
                                <TableHead className="text-center text-sm">SPEC</TableHead>
                                <TableHead className="text-center text-sm">UNSPEC</TableHead>
                                <TableHead className="text-center text-sm font-semibold">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">Loading...</TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">No data</TableCell>
                                </TableRow>
                            ) : (
                                data.map((row) => (
                                    <TableRow key={row.sto}>
                                        <TableCell className="font-medium text-center text-sm">{row.sto}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-sm">
                                                {row.spec}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-sm">
                                                {row.unspec}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center text-sm font-semibold">{row.grand_total}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
