"use client"

import { useState, useEffect } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { API_BASE_URL } from "@/lib/constants"
import { getStatusColor, formatPower, cn } from "@/lib/utils"
import axios from "axios"

// CSS buat contentEditable placeholder
const styles = `
  [contenteditable][data-placeholder]:empty::before {
    content: attr(data-placeholder);
    color: hsl(var(--muted-foreground));
    opacity: 0.3;
  }
`
import { Input } from "@/components/ui/input"

interface ServiceTicket {
    id: number
    tgl: string
    sto: string
    odp: string
    nama_teknisi: string
    no_tiket: string
    redaman_awal: number
    redaman_akhir: number | null
    status_rfo: string
    ticket_status: string
    hvc_category: string | null
    nd: string | null
    keterangan: string | null
}

interface ServiceRecoveryTableProps {
    filters: {
        status: string
        sto: string
        specStatus: string
        date?: string
        search?: string
    }
    onDataChange?: () => void // Prop buat notify parent supaya refresh stats
}

export default function ServiceRecoveryTable({ filters, onDataChange }: ServiceRecoveryTableProps) {
    const [data, setData] = useState<ServiceTicket[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editForm, setEditForm] = useState<Partial<ServiceTicket>>({})
    const [saving, setSaving] = useState(false)

    // State Pagination
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(50)
    const [total, setTotal] = useState(0)

    // State Sorting
    const [sortField, setSortField] = useState<string>("")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

    useEffect(() => {
        // Reset page ke 1 kalo filter berubah
        setPage(1)
    }, [filters])

    useEffect(() => {
        fetchData()
    }, [filters, page, pageSize, sortField, sortOrder])

    const fetchData = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            // Pastiin kirim "ALL" dengan benar atau skip kalo kosong
            if (filters.status && filters.status !== "ALL") params.append("status", filters.status)
            if (filters.sto && filters.sto !== "ALL") params.append("sto", filters.sto)
            if (filters.date && filters.date !== "ALL") params.append("date_filter", filters.date)
            if (filters.specStatus && filters.specStatus !== "ALL") params.append("spec_status", filters.specStatus)
            if (filters.search) params.append("search", filters.search)

            // Params pagination
            params.append("page", page.toString())
            params.append("limit", pageSize.toString())

            // Params sorting
            if (sortField) {
                params.append("sort_by", sortField)
                params.append("sort_order", sortOrder)
            }

            const response = await axios.get(`${API_BASE_URL}/api/tickets/service-recovery?${params}`)

            // Handle Response Paginated
            if (response.data && response.data.items) {
                setData(response.data.items)
                setTotal(response.data.total)
            } else {
                // Fallback for list array (should not happen with new backend)
                setData(Array.isArray(response.data) ? response.data : [])
                setTotal(0)
            }
        } catch (error) {
            console.error("Error fetching tickets:", error)
            setData([])
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (ticket: ServiceTicket) => {
        setEditingId(ticket.id)
        setEditForm({
            odp: ticket.odp,
            no_tiket: ticket.no_tiket,
            nama_teknisi: ticket.nama_teknisi,
            status_rfo: ticket.status_rfo,
            ticket_status: ticket.ticket_status
        })
    }

    // Auto-save handler (onBlur or Enter)
    const handleSave = async (id: number, field: string, value: string) => {
        // Optimistic update
        const oldData = [...data]
        const newData = data.map(t => t.id === id ? { ...t, [field]: value } : t)
        setData(newData)

        try {
            setSaving(true)
            await axios.put(`${API_BASE_URL}/api/tickets/service-recovery/${id}`, {
                [field]: value
            })
            // Refresh parent stats
            if (onDataChange) {
                onDataChange()
            }
            // Success indicator could be added here
        } catch (error) {
            console.error("Failed to save:", error)
            setData(oldData) // Revert on error
            alert("Gagal menyimpan perubahan")
        } finally {
            setSaving(false)
        }
    }

    const handleSort = (field: string) => {
        if (sortField === field) {
            // Toggle order
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            // New field, default asc
            setSortField(field)
            setSortOrder("asc")
        }
    }

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        if (sortOrder === "asc") return <ArrowUp className="ml-2 h-4 w-4" />
        return <ArrowDown className="ml-2 h-4 w-4" />
    }

    // Helper Component for Editable Cells
    const EditableCell = ({
        value,
        field,
        id,
        placeholder,
        className
    }: {
        value: string,
        field: string,
        id: number,
        placeholder?: string,
        className?: string
    }) => {
        const [isEditing, setIsEditing] = useState(false)
        const [tempValue, setTempValue] = useState(value)

        useEffect(() => {
            setTempValue(value)
        }, [value])

        if (isEditing) {
            return (
                <div
                    contentEditable
                    suppressContentEditableWarning
                    className={cn(
                        "bg-background ring-1 ring-primary w-full outline-none px-1 rounded min-h-[20px] text-sm",
                        className
                    )}
                    onBlur={(e) => {
                        const newValue = e.currentTarget.textContent || ''
                        if (newValue !== value) {
                            handleSave(id, field, newValue)
                        }
                        setIsEditing(false)
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            e.currentTarget.blur()
                        }
                    }}
                    ref={(el) => {
                        if (el) {
                            el.focus()
                            // Place cursor at end
                            const range = document.createRange()
                            const sel = window.getSelection()
                            if (sel && el.childNodes.length > 0) {
                                range.setStart(el.childNodes[0], el.textContent?.length || 0)
                                range.collapse(true)
                                sel.removeAllRanges()
                                sel.addRange(range)
                            }
                        }
                    }}
                    data-placeholder={placeholder}
                >
                    {tempValue}
                </div>
            )
        }

        return (
            <div
                className={cn(
                    "cursor-pointer hover:bg-muted/50 px-1 rounded min-h-[20px] w-full text-sm flex items-center",
                    !value ? "text-muted-foreground/50 italic select-none" : "select-text",
                    className
                )}
                onDoubleClick={() => setIsEditing(true)}
                title="Double click to edit"
            >
                {value || placeholder || '-'}
            </div>
        )
    }

    // Format tanggal dari ISO string
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    // Calculate total pages
    const totalPages = Math.ceil(total / pageSize)

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Service Recovery Tickets</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            Total: {total} tickets | Page {page} of {totalPages || 1}
                        </p>
                    </div>
                    {saving && <Badge variant="secondary" className="animate-pulse">Saving...</Badge>}
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead onClick={() => handleSort("tgl")} className="w-[100px] font-semibold cursor-pointer hover:bg-muted">
                                        <div className="flex items-center">Tanggal <SortIcon field="tgl" /></div>
                                    </TableHead>
                                    <TableHead onClick={() => handleSort("sto")} className="w-[80px] font-semibold cursor-pointer hover:bg-muted">
                                        <div className="flex items-center">STO <SortIcon field="sto" /></div>
                                    </TableHead>
                                    <TableHead onClick={() => handleSort("nd")} className="w-[120px] font-semibold cursor-pointer hover:bg-muted">
                                        <div className="flex items-center">ND<SortIcon field="nd" /></div>
                                    </TableHead>
                                    <TableHead onClick={() => handleSort("odp")} className="w-[200px] font-semibold cursor-pointer hover:bg-muted">
                                        <div className="flex items-center">ODP <SortIcon field="odp" /></div>
                                    </TableHead>
                                    <TableHead onClick={() => handleSort("nama_teknisi")} className="w-[140px] font-semibold cursor-pointer hover:bg-muted">
                                        <div className="flex items-center">Teknisi <SortIcon field="nama_teknisi" /></div>
                                    </TableHead>
                                    <TableHead onClick={() => handleSort("no_tiket")} className="w-[140px] font-semibold cursor-pointer hover:bg-muted">
                                        <div className="flex items-center">No. Tiket <SortIcon field="no_tiket" /></div>
                                    </TableHead>
                                    <TableHead onClick={() => handleSort("redaman_awal")} className="w-[100px] font-semibold cursor-pointer text-center hover:bg-muted">
                                        <div className="flex items-center justify-center">Redaman Before <SortIcon field="redaman_awal" /></div>
                                    </TableHead>
                                    <TableHead onClick={() => handleSort("redaman_akhir")} className="w-[100px] font-semibold cursor-pointer text-center hover:bg-muted">
                                        <div className="flex items-center justify-center">Redaman After <SortIcon field="redaman_akhir" /></div>
                                    </TableHead>
                                    <TableHead className="w-[100px] font-semibold text-center">
                                        <div className="flex items-center justify-center">HVC</div>
                                    </TableHead>
                                    <TableHead onClick={() => handleSort("status_rfo")} className="w-[120px] font-semibold cursor-pointer hover:bg-muted">
                                        <div className="flex items-center">RFO / Perbaikan <SortIcon field="status_rfo" /></div>
                                    </TableHead>
                                    <TableHead onClick={() => handleSort("ticket_status")} className="w-[120px] font-semibold cursor-pointer hover:bg-muted">
                                        <div className="flex items-center">Status Tiket <SortIcon field="ticket_status" /></div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-32 text-center">
                                            Loading tickets...
                                        </TableCell>
                                    </TableRow>
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="h-32 text-center">
                                            Tidak ada ticket yang sesuai filter
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((ticket) => {
                                        const redamanAwal = formatPower(ticket.redaman_awal)

                                        return (
                                            <TableRow key={ticket.id} className="hover:bg-muted/50">
                                                <TableCell className="text-sm text-muted-foreground select-none">{formatDate(ticket.tgl)}</TableCell>
                                                <TableCell>
                                                    <EditableCell
                                                        value={ticket.sto}
                                                        field="sto"
                                                        id={ticket.id}
                                                        className="font-medium"
                                                    />
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground bg-muted/20 select-text">{ticket.nd || '-'}</TableCell>

                                                {/* ODP Editable */}
                                                <TableCell>
                                                    <EditableCell
                                                        value={ticket.odp}
                                                        field="odp"
                                                        id={ticket.id}
                                                    />
                                                </TableCell>

                                                {/* Teknisi Editable */}
                                                <TableCell>
                                                    <EditableCell
                                                        value={ticket.nama_teknisi}
                                                        field="nama_teknisi"
                                                        id={ticket.id}
                                                        placeholder="Nama Tim Teknisi"
                                                    />
                                                </TableCell>

                                                {/* No Tiket Editable */}
                                                <TableCell>
                                                    <EditableCell
                                                        value={ticket.no_tiket}
                                                        field="no_tiket"
                                                        id={ticket.id}
                                                        placeholder="No Tiket"
                                                        className="font-mono text-xs"
                                                    />
                                                </TableCell>

                                                <TableCell className="text-center font-mono text-xs select-none">
                                                    <div className={cn(redamanAwal.color)}>{redamanAwal.value}</div>
                                                </TableCell>
                                                <TableCell className="text-center font-mono text-xs select-none">
                                                    {ticket.redaman_akhir ? (
                                                        <div className={cn(formatPower(ticket.redaman_akhir).color)}>
                                                            {formatPower(ticket.redaman_akhir).value}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>



                                                {/* HVC Category */}
                                                <TableCell className="text-center text-xs select-none">
                                                    <Badge variant={ticket.hvc_category?.includes("DIAMOND") ? "default" : ticket.hvc_category?.includes("GOLD") ? "default" : ticket.hvc_category?.includes("PLATINUM") ? "default" : "secondary"} className="text-xs">
                                                        {ticket.hvc_category?.replace("HVC_", "") || "Regular"}
                                                    </Badge>
                                                </TableCell>

                                                {/* Status RFO Editable */}
                                                <TableCell className="select-none">
                                                    <input
                                                        className="bg-transparent border-none w-full text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 placeholder:text-muted-foreground/30"
                                                        defaultValue={ticket.status_rfo}
                                                        placeholder="RFO / Perbaikan"
                                                        onBlur={(e) => {
                                                            if (e.target.value !== ticket.status_rfo) {
                                                                handleSave(ticket.id, 'status_rfo', e.target.value)
                                                            }
                                                        }}
                                                    />
                                                </TableCell>

                                                {/* Status Tiket Select */}
                                                <TableCell className="select-none">
                                                    <select
                                                        className={cn(
                                                            "text-xs font-bold rounded px-2 py-1 border-none focus:outline-none cursor-pointer",
                                                            ticket.ticket_status === 'CLOSED' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                                                ticket.ticket_status === 'PROGRESS' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                                                    ticket.ticket_status === 'KENDALA' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                        )}
                                                        value={ticket.ticket_status}
                                                        onChange={(e) => handleSave(ticket.id, 'ticket_status', e.target.value)}
                                                    >
                                                        <option value="PROGRESS">PROGRESS</option>
                                                        <option value="KENDALA">KENDALA</option>
                                                        <option value="CLOSED">CLOSED</option>
                                                    </select>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} entries
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1 px-2">
                                {/* Simple Page Indicator */}
                                <span className="text-sm font-medium">Page {page}</span>
                            </div>
                            <button
                                className="px-3 py-1 text-sm border rounded hover:bg-muted disabled:opacity-50"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || totalPages === 0}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card >
        </>
    )
}
