/**
 * Konstanta yang dipake di seluruh aplikasi
 */

// List STO yang available 
export const STO_LIST = [
    "BAM", "BRU", "GSA", "KJN", "KTB"
] as const

// List sector area 
export const SECTOR_LIST = [
    "SEKTOR - BALIKPAPAN - BALIKPAPAN - BATU AMPAR",
    "SEKTOR - BALIKPAPAN - BALIKPAPAN BARU",
    "SEKTOR - BALIKPAPAN - KS TUBUN",
    "UNMAP"
] as const

// Kategori HVC
export const HVC_CATEGORIES = [
    "Diamond",
    "Gold",
    "Platinum",
    "Regular"
] as const

// Status jaringan
export const NETWORK_STATUS = [
    "ONLINE",
    "OFFLINE",
    "KENDALA"
] as const

// Status SPEC
export const SPEC_STATUS = [
    "SPEC",
    "UNSPEC"
] as const

// Status ticket
export const TICKET_STATUS = [
    "OPEN",
    "PROGRESS",
    "CLOSE",
    "KENDALA"
] as const

// Range redaman yang dianggap SPEC
export const SPEC_RANGE = {
    MIN: -24.89,
    MAX: -13.5
}

// API Base URL - dievaluasi lazy saat runtime di browser
export function getApiBaseUrl(): string {
    if (typeof window !== 'undefined') {
        const port = window.location.port
        if (port === '3005' || port === '3000') {
            return `${window.location.protocol}//${window.location.hostname}:8005`
        }
        return `${window.location.protocol}//${window.location.hostname}`
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

// Kompatibel mundur - variabel ini TIDAK BOLEH dipakai di server-side
// Untuk file "use client", ini aman karena dievaluasi di browser
export let API_BASE_URL = ''
if (typeof window !== 'undefined') {
    API_BASE_URL = getApiBaseUrl()
}

// Menu navigation items
export const NAV_ITEMS = [
    {
        id: "dashboard",
        title: "Dashboard",
        href: "/",
        icon: "LayoutDashboard"
    },
    {
        id: "data-explorer",
        title: "Data Unspec",
        href: "/data-explorer",
        icon: "Database"
    },
    {
        id: "update-data",
        title: "Update Data",
        href: "/update-data",
        icon: "Activity"
    },
    {
        id: "tickets",
        title: "Status Tiket",
        href: "/tickets",
        icon: "Wrench"
    },
    {
        id: "report",
        title: "Laporan Harian",
        href: "/report",
        icon: "BarChart3"
    }
] as const

export const NAV_GROUPS = [
    {
        title: "Dashboard Unspec",
        items: [
            { id: "dashboard", title: "Dashboard", href: "/", icon: "LayoutDashboard" },
            { id: "data-explorer", title: "Data Unspec", href: "/data-explorer", icon: "Database" },
            { id: "update-data", title: "Update Data", href: "/update-data", icon: "Activity" },
            { id: "tickets", title: "Status Tiket", href: "/tickets", icon: "Wrench" },
            { id: "report", title: "Laporan Harian", href: "/report", icon: "BarChart3" }
        ]
    },
    {
        title: "WOC",
        items: []
    }
] as const

export type STO = typeof STO_LIST[number]
export type Sector = typeof SECTOR_LIST[number]
export type HVCCategory = typeof HVC_CATEGORIES[number]
export type NetworkStatus = typeof NETWORK_STATUS[number]
export type SpecStatus = typeof SPEC_STATUS[number]
export type TicketStatus = typeof TICKET_STATUS[number]
