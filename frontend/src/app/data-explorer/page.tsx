"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import NetworkDataTable from "@/components/data-explorer/NetworkDataTable"
import FilterBar from "@/components/data-explorer/FilterBar"

export default function DataExplorerPage() {
    const [filters, setFilters] = useState({
        sto: "",
        sector: "",
        redamanStatus: "",
        search: ""
    })

    return (
        <DashboardLayout>
            <div className="space-y-4">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold">Data Explorer</h1>
                    <p className="text-muted-foreground">
                        Data Jaringan yang perlu dipantau!
                    </p>
                </div>

                {/* Filter Bar */}
                <FilterBar
                    filters={filters}
                    setFilters={setFilters}
                    showStatusFilter={false}
                    persistenceKey="data_explorer_bookmarks"
                />

                {/* Main Data Table */}
                <NetworkDataTable filters={filters} />
            </div>
        </DashboardLayout>
    )
}
