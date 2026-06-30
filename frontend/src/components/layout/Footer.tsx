import { Github, Send, Globe } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function Footer() {
    const currentYear = new Date().getFullYear()
    const [loginLocation, setLoginLocation] = useState<string | null>(null)
    const [accessTime, setAccessTime] = useState<string>("")
    const [deviceInfo, setDeviceInfo] = useState<string>("Mendeteksi...")
    const [ipAddress, setIpAddress] = useState<string>("Mendeteksi...")
    const [isOnline, setIsOnline] = useState<boolean>(true)

    // 1. Deteksi Lokasi (GPS / Nominatim OSM / IP) & IP Address
    useEffect(() => {
        const lat = sessionStorage.getItem('user_lat')
        const lon = sessionStorage.getItem('user_lon')
        
        // Deteksi status online awal
        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine)
        }

        if (lat && lon) {
            setLoginLocation(`Lat: ${parseFloat(lat).toFixed(4)}, Lon: ${parseFloat(lon).toFixed(4)}`)
            
            // Reverse geocoding sederhana menggunakan API Publik OpenStreetMap Nominatim
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`, {
                headers: {
                    'Accept-Language': 'id'
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data && data.address) {
                    const address = data.address
                    const cityPart = address.city || address.town || address.municipality || address.county || ""
                    const suburbPart = address.suburb || address.village || address.neighbourhood || ""
                    
                    if (suburbPart && cityPart) {
                        setLoginLocation(`${suburbPart}, ${cityPart} (Lat: ${parseFloat(lat).toFixed(4)}, Lon: ${parseFloat(lon).toFixed(4)})`)
                    } else if (data.name) {
                        setLoginLocation(`${data.name} (Lat: ${parseFloat(lat).toFixed(4)}, Lon: ${parseFloat(lon).toFixed(4)})`)
                    }
                }
            })
            .catch(() => {
                // Fallback jika API geocoding gagal
            })
        }

        // Ambil IP Publik secara parallel
        fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => {
                if (data && data.ip) {
                    setIpAddress(data.ip)
                    if (!lat || !lon) {
                        setLoginLocation(`${data.city || "Balikpapan"}, ${data.region || "Kaltim"} (IP: ${data.ip})`)
                    }
                }
            })
            .catch(() => {
                setIpAddress("127.0.0.1 / Terproteksi")
                if (!lat || !lon) {
                    setLoginLocation("Balikpapan, Kaltim (Lokal)")
                }
            })
    }, [])

    // 2. Real-time Access Time (WITA - UTC+8)
    useEffect(() => {
        const updateTime = () => {
            const now = new Date()
            // Konversi timezone lokal ke UTC, lalu tambahkan 8 jam untuk WITA
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
            const witaTime = new Date(utc + (3600000 * 8))
            
            const timeStr = witaTime.toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: false 
            })
            setAccessTime(`${timeStr} WITA`)
        }
        
        updateTime()
        const interval = setInterval(updateTime, 1000)
        return () => clearInterval(interval)
    }, [])

    // 3. Deteksi Perangkat (Browser & OS)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const ua = navigator.userAgent
            let browser = "Browser Lain"
            let os = "OS Lain"
            
            if (ua.indexOf("Firefox") > -1) browser = "Firefox"
            else if (ua.indexOf("Chrome") > -1) browser = "Chrome"
            else if (ua.indexOf("Safari") > -1) browser = "Safari"
            else if (ua.indexOf("Edge") > -1) browser = "Edge"
            else if (ua.indexOf("Trident") > -1 || ua.indexOf("MSIE") > -1) browser = "IE"
            
            if (ua.indexOf("Windows") > -1) os = "Windows"
            else if (ua.indexOf("Macintosh") > -1) os = "macOS"
            else if (ua.indexOf("Linux") > -1) os = "Linux"
            else if (ua.indexOf("Android") > -1) os = "Android"
            else if (ua.indexOf("iPhone") > -1) os = "iOS"
            
            setDeviceInfo(`${browser} (${os})`)
        }
    }, [])

    // 4. Listener Status Koneksi Jaringan
    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)
        
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    return (
        <footer className="w-full py-4 mt-auto border-t bg-card/50 backdrop-blur-sm">
            <div className="container flex flex-col items-center justify-center gap-4">

                {/* Social Icons */}
                <div className="flex items-center gap-4">
                    <Link
                        href=""
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Github className="w-5 h-5" />
                        <span className="sr-only">GitHub</span>
                    </Link>
                    <Link
                        href=""
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Send className="w-5 h-5" />
                        <span className="sr-only">Telegram</span>
                    </Link>
                    <Link
                        href=""
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Globe className="w-5 h-5" />
                        <span className="sr-only">Website</span>
                    </Link>
                </div>

                {/* Security Indicators & Credits */}
                <div className="text-center text-xs text-muted-foreground/80 flex flex-col items-center gap-3">
                    
                    {/* Horizontal 4 Security Items Bar */}
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] font-mono text-muted-foreground/70 bg-muted/30 dark:bg-muted/10 px-4 py-2 rounded-lg border border-border/40 max-w-4xl">
                        <div className="flex items-center gap-1">
                            <span className="text-primary font-semibold">1. Lokasi:</span>
                            <span className="text-foreground">{loginLocation || "Mendeteksi..."}</span>
                        </div>
                        <div className="hidden md:block text-muted-foreground/30">|</div>
                        <div className="flex items-center gap-1">
                            <span className="text-primary font-semibold">2. Waktu Akses:</span>
                            <span className="text-foreground">{accessTime || "Mendeteksi..."}</span>
                        </div>
                        <div className="hidden md:block text-muted-foreground/30">|</div>
                        <div className="flex items-center gap-1">
                            <span className="text-primary font-semibold">3. Perangkat:</span>
                            <span className="text-foreground">{deviceInfo}</span>
                        </div>
                        <div className="hidden md:block text-muted-foreground/30">|</div>
                        <div className="flex items-center gap-1">
                            <span className="text-primary font-semibold">4. Jaringan/IP:</span>
                            <span className="text-foreground flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                                {isOnline ? 'Online' : 'Offline'} ({ipAddress})
                            </span>
                        </div>
                    </div>

                    <p>
                        &copy; {currentYear > 2026 ? `2026 - ${currentYear}` : "2026"} Web WOC (Warga Online Ceria) by Arya Dharma
                    </p>
                </div>
            </div>
        </footer>
    )
}
