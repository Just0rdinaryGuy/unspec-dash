"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { STO_LIST, TICKET_STATUS } from "@/lib/constants"

interface TicketFiltersProps {
    filters: {
        status: string
        sto: string
    }
    setFilters: (filters: any) => void
}

export default function TicketFilters({ filters, setFilters }: TicketFiltersProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Status Filter */}
                    <Select
                        value={filters.status || "ALL"}
                        onValueChange={(value) => setFilters({ ...filters, status: value === "ALL" ? "" : value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua Status</SelectItem>
                            {TICKET_STATUS.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* STO Filter */}
                    <Select
                        value={filters.sto || "ALL"}
                        onValueChange={(value) => setFilters({ ...filters, sto: value === "ALL" ? "" : value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by STO" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Semua STO</SelectItem>
                            {STO_LIST.map(sto => (
                                <SelectItem key={sto} value={sto}>{sto}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    )
}
