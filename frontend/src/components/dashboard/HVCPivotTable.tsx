"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { API_BASE_URL } from "@/lib/constants"

interface HVCDistribution {
    sto: string
    diamond: number
    gold: number
    platinum: number
    regular: number
    grand_total: number
}

export default function HVCPivotTable() {
    const [data, setData] = useState<HVCDistribution[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/dashboard/hvc-pivot`)
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
                <CardTitle className="text-lg">Distribusi HVC by STO</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center text-sm">STO</TableHead>
                                <TableHead className="text-center text-sm">Diamond</TableHead>
                                <TableHead className="text-center text-sm">Gold</TableHead>
                                <TableHead className="text-center text-sm">Platinum</TableHead>
                                <TableHead className="text-center text-sm">Regular</TableHead>
                                <TableHead className="text-center text-sm font-semibold">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">No data</TableCell>
                                </TableRow>
                            ) : (
                                data.map((row) => (
                                    <TableRow key={row.sto}>
                                        <TableCell className="font-medium text-center text-sm">{row.sto}</TableCell>
                                        <TableCell className="text-center text-sm">{row.diamond}</TableCell>
                                        <TableCell className="text-center text-sm">{row.gold}</TableCell>
                                        <TableCell className="text-center text-sm">{row.platinum}</TableCell>
                                        <TableCell className="text-center text-sm">{row.regular}</TableCell>
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
