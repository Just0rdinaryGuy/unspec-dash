"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, Download, X, FileSpreadsheet } from "lucide-react"
import { MultiSelect } from "@/components/ui/multi-select"
import { API_BASE_URL } from "@/lib/constants"
import axios from "axios"

interface FilterBarProps {
    filters: {
        status?: string
        sto: string
        sector: string
        specStatus: string
        search: string
        date?: string // Added date
    }
    setFilters: (filters: any) => void
    onExport?: () => void // Optional custom export handler
}

interface FilterOptions {
    sto_list: string[]
    sector_list: string[]
    spec_status_list: string[]
    available_dates?: string[] // Added available_dates
}

export default function FilterBar({ filters, setFilters, onExport }: FilterBarProps) {
    const [searchInput, setSearchInput] = useState("")
    const [options, setOptions] = useState<FilterOptions>({
        sto_list: [],
        sector_list: [],
        spec_status_list: [],
        available_dates: []
    })
    const [loading, setLoading] = useState(false)

    // Fetch filter options on mount
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                // Fetch basic filters
                const response = await axios.get(`${API_BASE_URL}/api/data-explorer/filters`)

                // Fetch available dates
                const dateResponse = await axios.get(`${API_BASE_URL}/api/tickets/dates`)

                setOptions({
                    ...response.data,
                    available_dates: dateResponse.data
                })
            } catch (error) {
                console.error("Error fetching filters:", error)
            }
        }
        fetchFilters()
    }, [])

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters({ ...filters, search: searchInput })
        }, 500) // 500ms debounce

        return () => clearTimeout(timer)
    }, [searchInput])

    const handleExportExcel = async () => {
        if (onExport) {
            onExport()
            return
        }

        try {
            setLoading(true)
            // Build query params
            const params = new URLSearchParams()
            if (filters.sto) params.append("sto", filters.sto)
            if (filters.sector) params.append("sector", filters.sector)
            if (filters.specStatus) params.append("spec_status", filters.specStatus)
            if (filters.search) params.append("search", filters.search)
            if (filters.date && filters.date !== "ALL") params.append("date_filter", filters.date)

            // Direct download URL
            window.open(`${API_BASE_URL}/api/data-explorer/export-excel?${params.toString()}`, '_blank')

        } catch (error) {
            console.error("Error exporting:", error)
            alert("Gagal export Excel")
        } finally {
            setLoading(false)
        }
    }

    const clearFilters = () => {
        setFilters({
            sto: "",
            sector: "",
            specStatus: "",
            search: ""
        })
        setSearchInput("")
    }

    const hasActiveFilters = filters.sto || filters.sector || filters.specStatus || filters.search

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Search */}
                    <div className="lg:col-span-2 relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari ND atau ODP..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9"
                        />
                    </div>



                    {/* Date Filter (New) */}
                    <div className="flex flex-col gap-1">
                        <Select
                            value={filters.date || "ALL"}
                            onValueChange={(value) => setFilters({ ...filters, date: value === "ALL" ? "" : value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Tanggal Data" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Latest Data</SelectItem>
                                {options.available_dates && options.available_dates.map(date => (
                                    <SelectItem key={date} value={date}>{date}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Ticket Status Filter */}
                    <div className="flex flex-col gap-1">
                        <Select
                            value={filters.status || "ALL"}
                            onValueChange={(value) => setFilters({ ...filters, status: value === "ALL" ? "" : value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status Tiket" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua Status Tiket</SelectItem>
                                <SelectItem value="PROGRESS">PROGRESS</SelectItem>
                                <SelectItem value="KENDALA">KENDALA</SelectItem>
                                <SelectItem value="CLOSED">CLOSED</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* STO Filter - MultiSelect */}
                    <div className="flex flex-col gap-1">
                        <MultiSelect
                            options={options.sto_list.map(sto => ({ label: sto, value: sto }))}
                            selected={filters.sto ? filters.sto.split(",") : []}
                            onChange={(values) => setFilters({ ...filters, sto: values.join(",") })}
                            placeholder="Pilih STO (Multiple)"
                            className="bg-background"
                        />
                    </div>



                    {/* SPEC Status Filter */}
                    <Select
                        value={filters.specStatus || "ALL"}
                        onValueChange={(value) => setFilters({ ...filters, specStatus: value === "ALL" ? "" : value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Status</SelectItem>
                            {options.spec_status_list.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                    <Button
                        onClick={handleExportExcel}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white hover:text-white border-green-600"
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        {loading ? "Exporting..." : "Export Excel (.xlsx)"}
                    </Button>

                    {hasActiveFilters && (
                        <Button onClick={clearFilters} variant="ghost" size="sm">
                            <X className="h-4 w-4 mr-2" />
                            Clear Filters
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
