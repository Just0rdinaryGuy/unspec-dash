"use client"

import { useState, useEffect } from "react"
import { format, getMonth, getYear, setMonth as setDateMonth, setYear as setDateYear } from "date-fns"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { API_BASE_URL } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Upload, FileSpreadsheet, RefreshCw, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LabelList
} from "recharts"
import * as XLSX from "xlsx"

// Types
interface DailyReport {
    date: string
    total_saldo: number
    close: number
    saldo_lama: number
    target: number
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

const YEARS = Array.from({ length: 10 }, (_, i) => 2024 + i)

export default function ReportPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [data, setData] = useState<DailyReport[]>([])
    const [currentTime, setCurrentTime] = useState(new Date())
    const [isMounted, setIsMounted] = useState(false)

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

    // Set mounted state (client-side only)
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Update jam setiap detik
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        fetchReports()
    }, [selectedMonth, selectedYear])

    const fetchReports = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem("token")
            // Pass month as 1-indexed (month+1) buat backend
            const res = await fetch(`${API_BASE_URL}/api/reports?month=${selectedMonth + 1}&year=${selectedYear}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const result = await res.json()
                setData(result)
            }
        } catch (error) {
            console.error("Failed to fetch reports", error)
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateToday = async () => {
        setGenerating(true)
        try {
            const token = localStorage.getItem("token")
            // Default target could be dynamic, hardcoded 127 for now as per screenshot
            const res = await fetch(`${API_BASE_URL}/api/reports/generate?target=127`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.ok) {
                // Refresh data if current month view matches today
                const today = new Date()
                if (today.getMonth() === selectedMonth && today.getFullYear() === selectedYear) {
                    fetchReports()
                } else {
                    alert("Report generated! Switch to current month to view.")
                }
            } else {
                alert("Failed to generate report")
            }
        } catch (error) {
            console.error(error)
            alert("Error generating report")
        } finally {
            setGenerating(false)
        }
    }

    const handleExportExcel = async () => {
        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`${API_BASE_URL}/api/reports/export?month=${selectedMonth + 1}&year=${selectedYear}`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            })

            if (!response.ok) throw new Error("Export failed")

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Laporan_Unspec_${selectedYear}-${selectedMonth + 1}.xlsx`
            document.body.appendChild(a)
            a.click()
            a.remove()
        } catch (error) {
            console.error("Export error", error)
            alert("Gagal men-download Excel")
        }
    }

    // Prepare data for chart (format dates)
    const chartData = data.map(item => ({
        ...item,
        displayDate: format(new Date(item.date), 'dd-MMM')
    }))

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Report Saldo Unspec</h2>
                        <p className="text-muted-foreground">
                            Monitoring Saldo Unspec & Closures
                        </p>
                    </div>

                    <div className="flex items-center gap-2 relative z-50">
                        {/* Period Picker */}
                        <Select
                            value={selectedMonth.toString()}
                            onValueChange={(val) => setSelectedMonth(parseInt(val))}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map((m, i) => (
                                    <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={selectedYear.toString()}
                            onValueChange={(val) => setSelectedYear(parseInt(val))}
                        >
                            <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {YEARS.map(y => (
                                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {/* Actions */}
                        {/* Refresh button removed as per user request (Auto-update enabled) */}

                        <Button variant="secondary" onClick={handleExportExcel}>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Export Excel
                        </Button>
                    </div>
                </div>

                {/* Chart Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Saldo Unspec Balikpapan</CardTitle>
                                <CardDescription>
                                    Visualisasi data harian bulan {MONTHS[selectedMonth]} {selectedYear}
                                </CardDescription>
                            </div>
                            {/* Real-time Clock - Client-side only to prevent hydration error */}
                            {isMounted && (
                                <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20">
                                    <div className="text-sm font-medium text-primary">
                                        {currentTime.toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: false
                                        })}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {currentTime.toLocaleDateString('id-ID', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={chartData}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 20,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="displayDate"
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    {/* Close - Orange Bar */}
                                    <Bar dataKey="close" name="Close" fill="#ff7300" />

                                    {/* Saldo Lama (Progress/Backlog) - Purple/Blue Bar */}
                                    <Bar dataKey="saldo_lama" name="Saldo Lama" fill="#8884d8" />

                                    {/* Target - Red dashed line */}
                                    <Line type="monotone" dataKey="target" name="Target Saldo" stroke="#ff0000" strokeDasharray="5 5" strokeWidth={2} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Table Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detailed Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Total Saldo (Unspec)</TableHead>
                                        <TableHead>Close</TableHead>
                                        <TableHead>Saldo Lama</TableHead>
                                        <TableHead>Target Saldo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No reports found for this month.
                                                {(user?.role === 'admin' || user?.role === 'developer') && " Click 'Generate Today' to create one."}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.map((row) => (
                                            <TableRow key={row.date}>
                                                <TableCell>{format(new Date(row.date), 'dd MMM yyyy')}</TableCell>
                                                <TableCell className="font-bold">{row.total_saldo}</TableCell>
                                                <TableCell className="text-orange-600">{row.close}</TableCell>
                                                <TableCell className="text-muted-foreground">{row.saldo_lama}</TableCell>
                                                <TableCell>{row.target}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
