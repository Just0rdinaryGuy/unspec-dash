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
import { Search, Download, X, FileSpreadsheet, Bookmark, Star, Save } from "lucide-react"
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
        date?: string
    }
    setFilters: (filters: any) => void
    onExport?: () => void
}

interface FilterOptions {
    sto_list: string[]
    sector_list: string[]
    spec_status_list: string[]
    available_dates?: string[]
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
    const [savedSTO, setSavedSTO] = useState<string | null>(null)

    // Load saved STO from local storage
    useEffect(() => {
        const saved = localStorage.getItem("saved_sto_filter")
        if (saved) {
            setSavedSTO(saved)
        }
    }, [])

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
            const params = new URLSearchParams()
            if (filters.sto) params.append("sto", filters.sto)
            if (filters.sector) params.append("sector", filters.sector)
            if (filters.specStatus) params.append("spec_status", filters.specStatus)
            if (filters.search) params.append("search", filters.search)
            if (filters.date && filters.date !== "ALL") params.append("date_filter", filters.date)

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

    const saveStoFilter = () => {
        if (filters.sto) {
            localStorage.setItem("saved_sto_filter", filters.sto)
            setSavedSTO(filters.sto)
            alert("Filter STO berhasil disimpan sebagai bookmark!")
        } else {
            alert("Pilih STO terlebih dahulu untuk disimpan.")
        }
    }

    const loadStoFilter = () => {
        if (savedSTO) {
            setFilters({ ...filters, sto: savedSTO })
        }
    }

    const hasActiveFilters = filters.sto || filters.sector || filters.specStatus || filters.search
    const isStoSaved = savedSTO && filters.sto === savedSTO

    return (
        <Card className="shadow-sm">
            <CardContent className="p-4">
                <div className="flex flex-col gap-4">
                    {/* Top Row: Search and Primary Filters */}
                    <div className="flex flex-col lg:flex-row gap-3">
                        {/* Search - Flexible Width */}
                        <div className="lg:flex-1 relative min-w-[200px]">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari ND atau ODP..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Date Filter */}
                        <div className="w-full lg:w-[180px]">
                            <Select
                                value={filters.date || "ALL"}
                                onValueChange={(value) => setFilters({ ...filters, date: value === "ALL" ? "" : value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Tanggal" />
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
                        <div className="w-full lg:w-[180px]">
                            <Select
                                value={filters.status || "ALL"}
                                onValueChange={(value) => setFilters({ ...filters, status: value === "ALL" ? "" : value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Status Tiket" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Status</SelectItem>
                                    <SelectItem value="PROGRESS">PROGRESS</SelectItem>
                                    <SelectItem value="KENDALA">KENDALA</SelectItem>
                                    <SelectItem value="CLOSED">CLOSED</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Bottom Row: Secondary Filters & Actions */}
                    <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
                        {/* STO Filter + Bookmark Group */}
                        <div className="flex gap-2 w-full lg:w-auto lg:flex-1">
                            <div className="flex-1 lg:max-w-[300px]">
                                <MultiSelect
                                    options={options.sto_list.map(sto => ({ label: sto, value: sto }))}
                                    selected={filters.sto ? filters.sto.split(",") : []}
                                    onChange={(values) => setFilters({ ...filters, sto: values.join(",") })}
                                    placeholder="Pilih STO (Multiple)"
                                    className="bg-background"
                                />
                            </div>

                            {/* Bookmark Control */}
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={saveStoFilter}
                                    title="Simpan Filter STO ini"
                                    className={isStoSaved ? "text-yellow-500 border-yellow-500" : "text-muted-foreground"}
                                >
                                    <Bookmark className={isStoSaved ? "fill-current h-4 w-4" : "h-4 w-4"} />
                                </Button>
                                {savedSTO && filters.sto !== savedSTO && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={loadStoFilter}
                                        title="Load Saved STO"
                                        className="gap-2"
                                    >
                                        <Star className="h-3 w-3 fill-current" />
                                        Load Saved
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* SPEC Status Filter */}
                        <div className="w-full lg:w-[180px]">
                            <Select
                                value={filters.specStatus || "ALL"}
                                onValueChange={(value) => setFilters({ ...filters, specStatus: value === "ALL" ? "" : value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Spec Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Spec</SelectItem>
                                    {options.spec_status_list.map(status => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Action Buttons Group */}
                        <div className="flex gap-2 ml-auto">
                            <Button
                                onClick={handleExportExcel}
                                variant="outline"
                                size="sm"
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white hover:text-white border-green-600 whitespace-nowrap"
                            >
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                {loading ? "Exporting..." : "Export Excel"}
                            </Button>

                            {hasActiveFilters && (
                                <Button onClick={clearFilters} variant="ghost" size="sm" className="whitespace-nowrap">
                                    <X className="h-4 w-4 mr-2" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
