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
import { Search, X, FileSpreadsheet, Bookmark, Save, Trash2, Plus } from "lucide-react"
import { MultiSelect } from "@/components/ui/multi-select"
import { API_BASE_URL } from "@/lib/constants"
import axios from "axios"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

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

interface SavedBookmark {
    id: string
    name: string
    value: string
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

    // Bookmark State
    const [bookmarks, setBookmarks] = useState<SavedBookmark[]>([])
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
    const [newBookmarkName, setNewBookmarkName] = useState("")

    useEffect(() => {
        const saved = localStorage.getItem("sto_filter_bookmarks")
        if (saved) {
            try {
                setBookmarks(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse bookmarks", e)
            }
        }
    }, [])

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/data-explorer/filters`)
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

    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters({ ...filters, search: searchInput })
        }, 500)

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

    const saveBookmark = () => {
        if (!newBookmarkName.trim()) {
            alert("Nama bookmark tidak boleh kosong")
            return
        }
        if (!filters.sto) {
            alert("Pilih STO terlebih dahulu")
            return
        }

        const newBookmark: SavedBookmark = {
            id: Date.now().toString(),
            name: newBookmarkName,
            value: filters.sto
        }

        const updatedBookmarks = [...bookmarks, newBookmark]
        setBookmarks(updatedBookmarks)
        localStorage.setItem("sto_filter_bookmarks", JSON.stringify(updatedBookmarks))
        setNewBookmarkName("")
        setIsSaveDialogOpen(false)
    }

    const deleteBookmark = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const updatedBookmarks = bookmarks.filter(b => b.id !== id)
        setBookmarks(updatedBookmarks)
        localStorage.setItem("sto_filter_bookmarks", JSON.stringify(updatedBookmarks))
    }

    const applyBookmark = (stoValue: string) => {
        setFilters({ ...filters, sto: stoValue })
    }

    const hasActiveFilters = filters.sto || filters.sector || filters.specStatus || filters.search

    return (
        <Card className="shadow-sm border-muted/40">
            <CardContent className="p-4">
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4">
                    {/* Row 1 Left: Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari ND atau ODP..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9 bg-background w-full"
                        />
                    </div>

                    {/* Row 1 Right: Date & Status */}
                    <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto">
                        <div className="w-full md:w-[180px]">
                            <Select
                                value={filters.date || "ALL"}
                                onValueChange={(value) => setFilters({ ...filters, date: value === "ALL" ? "" : value })}
                            >
                                <SelectTrigger className="bg-background">
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

                        <div className="w-full md:w-[180px]">
                            <Select
                                value={filters.status || "ALL"}
                                onValueChange={(value) => setFilters({ ...filters, status: value === "ALL" ? "" : value })}
                            >
                                <SelectTrigger className="bg-background">
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

                    {/* Row 2 Left: STO */}
                    <div className="w-full min-w-0">
                        <MultiSelect
                            options={options.sto_list.map(sto => ({ label: sto, value: sto }))}
                            selected={filters.sto ? filters.sto.split(",") : []}
                            onChange={(values) => setFilters({ ...filters, sto: values.join(",") })}
                            placeholder="Pilih STO (Multiple)"
                            className="bg-background w-full"
                            maxCount={10}
                        />
                    </div>

                    {/* Row 2 Right: Controls */}
                    <div className="flex flex-wrap gap-2 w-full xl:w-auto items-center justify-start xl:justify-end">

                        {/* Bookmarks */}
                        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="bg-background px-3 whitespace-nowrap" title="Bookmarks">
                                        <Bookmark className="h-4 w-4 mr-2" />
                                        Bookmarks
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[240px]">
                                    <DropdownMenuLabel>STO Bookmarks</DropdownMenuLabel>
                                    <DialogTrigger asChild>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Simpan Filter Saat Ini...
                                        </DropdownMenuItem>
                                    </DialogTrigger>

                                    {bookmarks.length > 0 && <DropdownMenuSeparator />}

                                    {bookmarks.map(b => (
                                        <DropdownMenuItem key={b.id} onClick={() => applyBookmark(b.value)} className="justify-between group">
                                            <span className="truncate mr-2">{b.name}</span>
                                            <Trash2
                                                className="h-3 w-3 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => deleteBookmark(b.id, e)}
                                            />
                                        </DropdownMenuItem>
                                    ))}

                                    {bookmarks.length === 0 && (
                                        <div className="p-2 text-xs text-muted-foreground text-center">
                                            Belum ada bookmark
                                        </div>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Simpan Filter STO</DialogTitle>
                                    <DialogDescription>
                                        Beri nama bookmark ini.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                    <Input
                                        placeholder="Contoh: STO mana kek terserah"
                                        value={newBookmarkName}
                                        onChange={(e) => setNewBookmarkName(e.target.value)}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>Batal</Button>
                                    <Button onClick={saveBookmark}>Simpan</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Spec Status */}
                        <div className="w-[140px]">
                            <Select
                                value={filters.specStatus || "ALL"}
                                onValueChange={(value) => setFilters({ ...filters, specStatus: value === "ALL" ? "" : value })}
                            >
                                <SelectTrigger className="bg-background">
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

                        {/* Export Button */}
                        <Button
                            onClick={handleExportExcel}
                            variant="outline"
                            size="sm" // Matches other inputs better
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white hover:text-white border-green-600 whitespace-nowrap h-10 px-4"
                        >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            {loading ? "..." : "Export"}
                        </Button>

                        {/* Clear Button (X) */}
                        {hasActiveFilters && (
                            <Button onClick={clearFilters} variant="ghost" size="icon" title="Clear Filters" className="h-10 w-10">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
