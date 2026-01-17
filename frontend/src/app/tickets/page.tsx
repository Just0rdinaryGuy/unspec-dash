"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import ServiceRecoveryTable from "@/components/tickets/ServiceRecoveryTable"
import FilterBar from "@/components/data-explorer/FilterBar"
import TicketStats from "@/components/tickets/TicketStats"
import { useState, useEffect } from "react"
import { API_BASE_URL } from "@/lib/constants"
import axios from "axios"

export default function TicketsPage() {
    const [filters, setFilters] = useState({
        status: "",
        sto: "",
        sector: "",
        specStatus: "",
        search: "",
        date: ""
    })

    // State buat Stats
    const [stats, setStats] = useState(null)
    const [loadingStats, setLoadingStats] = useState(true)

    const fetchStats = async () => {
        setLoadingStats(true)
        try {
            const response = await axios.get(`${API_BASE_URL}/api/tickets/summary`)
            setStats(response.data)
        } catch (error) {
            console.error("Error fetching stats:", error)
        } finally {
            setLoadingStats(false)
        }
    }

    // Initial Fetch
    useEffect(() => {
        fetchStats()
    }, [])

    // Handler Export Custom
    const handleCustomExport = () => {
        // Bikin export URL dengan filter yang aktif
        const params = new URLSearchParams()
        if (filters.status && filters.status !== "ALL") params.append("status", filters.status)
        if (filters.sto && filters.sto !== "ALL") params.append("sto", filters.sto)
        if (filters.date && filters.date !== "ALL") params.append("date_filter", filters.date)
        if (filters.search) params.append("search", filters.search)

        // Buka custom export endpoint
        window.open(`${API_BASE_URL}/api/tickets/service-recovery/export?${params.toString()}`, '_blank')
    }

    return (
        <DashboardLayout>
            <div className="space-y-4">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold">Service Recovery</h1>
                    <p className="text-muted-foreground">
                        Ticket tracking & repair logs untuk maintenance jaringan
                    </p>
                </div>

                {/* Ticket Stats Summary - Controlled Component */}
                <TicketStats stats={stats} loading={loadingStats} />

                {/* Filter */}
                <FilterBar
                    filters={filters}
                    setFilters={setFilters}
                    onExport={handleCustomExport}
                />

                {/* Service Recovery Table - Trigger Stats Refresh */}
                <ServiceRecoveryTable
                    filters={filters}
                    onDataChange={fetchStats}
                />
            </div>
        </DashboardLayout>
    )
}
