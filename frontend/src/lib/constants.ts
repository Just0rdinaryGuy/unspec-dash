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

// API Base URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
    },
    {
        id: "docs",
        title: "System Docs",
        href: "/docs",
        icon: "Book"
    }
] as const

export type STO = typeof STO_LIST[number]
export type Sector = typeof SECTOR_LIST[number]
export type HVCCategory = typeof HVC_CATEGORIES[number]
export type NetworkStatus = typeof NETWORK_STATUS[number]
export type SpecStatus = typeof SPEC_STATUS[number]
export type TicketStatus = typeof TICKET_STATUS[number]
