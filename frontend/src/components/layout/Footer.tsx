import { Github, Send, Globe } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function Footer() {
    const currentYear = new Date().getFullYear()
    const [loginLocation, setLoginLocation] = useState<string | null>(null)

    useEffect(() => {
        const lat = sessionStorage.getItem('user_lat')
        const lon = sessionStorage.getItem('user_lon')
        
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
        } else {
            // Jika koordinat GPS tidak aktif/di-bypass, deteksi via IP Publik
            fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => {
                if (data && data.city && data.region) {
                    setLoginLocation(`${data.city}, ${data.region} (IP: ${data.ip})`)
                }
            })
            .catch(() => {})
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

                <div className="text-center text-xs text-muted-foreground/80">
                    {loginLocation && (
                        <p className="mb-2 font-mono text-[10px] text-muted-foreground/70">
                            Lokasi Login: {loginLocation}
                        </p>
                    )}
                    <p>
                        &copy; {currentYear > 2026 ? `2026 - ${currentYear}` : "2026"} Web WOC (Warga Online Ceria) by Arya Dharma
                    </p>
                </div>
            </div>
        </footer>
    )
}
