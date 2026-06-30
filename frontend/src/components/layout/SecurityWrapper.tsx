"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/lib/constants';

// Koordinat Pusat Balikpapan
const BALIKPAPAN_LAT = -1.265;
const BALIKPAPAN_LON = 116.83;
const MAX_RADIUS_KM = 50.0;

// Helper menghitung jarak Haversine di client
function calculateDistance(lat1: number, lon1: number, lat2 = BALIKPAPAN_LAT, lon2 = BALIKPAPAN_LON): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Mendapatkan waktu saat ini dalam WITA
function getWitaTime(): { hour: number; minutes: number; seconds: number; formatted: string } {
    const now = new Date();
    // Offset local to UTC
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    // Add 8 hours for WITA
    const wita = new Date(utc + (3600000 * 8));
    
    const hour = wita.getHours();
    const minutes = wita.getMinutes();
    const seconds = wita.getSeconds();
    
    const formatted = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} WITA`;
    return { hour, minutes, seconds, formatted };
}

export default function SecurityWrapper({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    
    // Status Pembatasan
    const [timeBlocked, setTimeBlocked] = useState(false);
    const [locationBlocked, setLocationBlocked] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState("");
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    
    // 1. Live Clock & Time-based check
    useEffect(() => {
        const isBypassed = sessionStorage.getItem('bypass_security') === 'true';
        if (isBypassed) {
            setTimeBlocked(false);
            return;
        }

        const checkTime = () => {
            const wita = getWitaTime();
            setCurrentTime(wita.formatted);
            
            // Bypass time check hanya jika user adalah developer
            if (user?.role === 'developer') {
                setTimeBlocked(false);
                return;
            }
            
            if (wita.hour < 8 || wita.hour >= 22) {
                setTimeBlocked(true);
            } else {
                setTimeBlocked(false);
            }
        };
        
        checkTime();
        const interval = setInterval(checkTime, 1000);
        return () => clearInterval(interval);
    }, [user]);

    // 2. Geolocation tracking
    useEffect(() => {
        const isBypassed = sessionStorage.getItem('bypass_security') === 'true';
        if (isBypassed) {
            setLocationBlocked(false);
            return;
        }

        // Hanya cek lokasi jika user sudah login
        if (!isAuthenticated || !user) {
            setLocationBlocked(false);
            return;
        }

        // Bypass lokasi jika developer atau leader
        if (user.role === 'developer' || user.role === 'leader') {
            setLocationBlocked(false);
            return;
        }

        if (!navigator.geolocation) {
            setLocationError("Browser Anda tidak mendukung layanan lokasi (Geolocation).");
            setLocationBlocked(true);
            return;
        }

        const handleSuccess = (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;
            setCoords({ latitude, longitude });
            
            // Simpan ke sessionStorage agar bisa diakses oleh fetch interceptor
            sessionStorage.setItem('user_lat', String(latitude));
            sessionStorage.setItem('user_lon', String(longitude));

            const dist = calculateDistance(latitude, longitude);
            setDistance(dist);

            if (dist > MAX_RADIUS_KM) {
                setLocationBlocked(true);
                setLocationError(`Anda berada di luar wilayah operasional (${dist.toFixed(1)} km dari Balikpapan). Maksimal ${MAX_RADIUS_KM} km.`);
            } else {
                setLocationBlocked(false);
                setLocationError(null);
            }
        };

        const handleError = (error: GeolocationPositionError) => {
            console.error("Geolocation error:", error);
            setLocationBlocked(true);
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    setLocationError("Izin lokasi ditolak. Harap aktifkan izin lokasi di browser Anda untuk menggunakan sistem ini.");
                    break;
                case error.POSITION_UNAVAILABLE:
                    setLocationError("Informasi lokasi tidak tersedia.");
                    break;
                case error.TIMEOUT:
                    setLocationError("Waktu permintaan lokasi habis.");
                    break;
                default:
                    setLocationError("Terjadi kesalahan mendeteksi lokasi.");
            }
        };

        // Watch position real-time
        const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        });

        return () => navigator.geolocation.clearWatch(watchId);
    }, [isAuthenticated, user]);

    // 3. Global Fetch Interceptor
    useEffect(() => {
        const originalFetch = window.fetch;
        
        window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
            let url = '';
            if (typeof input === 'string') {
                url = input;
            } else if (input instanceof URL) {
                url = input.toString();
            } else if (input instanceof Request) {
                url = input.url;
            } else if (input && typeof input === 'object' && 'url' in input) {
                url = (input as any).url;
            }
            
            // Hanya intercept request ke API Backend kita
            if (url && (url.startsWith(API_BASE_URL) || url.startsWith('/api') || url.includes('/api/'))) {
                const token = localStorage.getItem('token');
                const lat = sessionStorage.getItem('user_lat');
                const lon = sessionStorage.getItem('user_lon');
                const bypass = sessionStorage.getItem('bypass_security');
                
                if (input instanceof Request) {
                    const headers = new Headers(input.headers);
                    if (token) {
                        headers.set('Authorization', `Bearer ${token}`);
                    }
                    if (lat) {
                        headers.set('X-User-Latitude', lat);
                    }
                    if (lon) {
                        headers.set('X-User-Longitude', lon);
                    }
                    if (bypass === 'true') {
                        headers.set('X-Bypass-Security', 'true');
                    }
                    input = new Request(input, { headers });
                } else {
                    // Clone atau inisialisasi headers
                    const headers = new Headers(init?.headers || {});
                    
                    if (token) {
                        headers.set('Authorization', `Bearer ${token}`);
                    }
                    if (lat) {
                        headers.set('X-User-Latitude', lat);
                    }
                    if (lon) {
                        headers.set('X-User-Longitude', lon);
                    }
                    if (bypass === 'true') {
                        headers.set('X-Bypass-Security', 'true');
                    }
                    
                    init = {
                        ...init,
                        headers
                    };
                }
            }
            
            return originalFetch(input, init);
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, []);

    // RENDER OVERLAY PEMBATASAN WAKTU
    if (timeBlocked) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 transition-all">
                <div className="max-w-md w-full bg-slate-900/90 border border-red-500/20 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
                    <div className="w-16 h-16 bg-red-950/50 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">⏰</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Akses Waktu Dibatasi</h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        Aplikasi Warga Online Ceria (WOC) hanya dapat diakses selama jam operasional pada pukul <span className="font-semibold text-red-400">08:00 - 22:00 WITA</span>.
                    </p>
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 font-mono text-xl text-red-500 tracking-wider">
                        {currentTime || "00:00:00 WITA"}
                    </div>
                    <p className="text-xs text-slate-500 mt-6 leading-relaxed">
                        Silakan kembali lagi selama jam operasional untuk mengakses dashboard.
                    </p>
                    <button 
                        onClick={() => {
                            sessionStorage.setItem('bypass_security', 'true');
                            setTimeBlocked(false);
                            setLocationBlocked(false);
                        }}
                        className="w-full bg-red-900/50 hover:bg-red-800/60 border border-red-500/30 text-white font-semibold py-3 px-6 rounded-2xl transition-all shadow-lg active:scale-95 text-sm mt-6"
                    >
                        Bypass Akses (Testing)
                    </button>
                </div>
            </div>
        );
    }

    // RENDER OVERLAY PEMBATASAN LOKASI
    if (locationBlocked) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 transition-all">
                <div className="max-w-md w-full bg-slate-900/90 border border-amber-500/20 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500"></div>
                    <div className="w-16 h-16 bg-amber-950/50 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">📍</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Izin Lokasi Diperlukan</h2>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        Sistem mendeteksi bahwa Anda berada di luar wilayah operasional WOC Balikpapan atau izin geolokasi browser ditolak.
                    </p>
                    
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-sm text-left text-slate-300 mb-6 space-y-2">
                        <div className="font-semibold text-amber-500">Pesan Status:</div>
                        <div className="font-mono text-xs leading-relaxed text-slate-400">
                            {locationError || "Mendeteksi koordinat lokasi..."}
                        </div>
                        {coords && (
                            <div className="text-xs text-slate-500 border-t border-slate-800/80 pt-2 font-mono">
                                Lat: {coords.latitude.toFixed(6)}, Lon: {coords.longitude.toFixed(6)}
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 px-6 rounded-2xl transition-all shadow-lg active:scale-95 text-sm"
                        >
                            Refresh Halaman & Minta Ulang
                        </button>

                        <button 
                            onClick={() => {
                                sessionStorage.setItem('bypass_security', 'true');
                                setTimeBlocked(false);
                                setLocationBlocked(false);
                            }}
                            className="w-full bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/30 text-white font-semibold py-3 px-6 rounded-2xl transition-all shadow-lg active:scale-95 text-sm"
                        >
                            Bypass Lokasi (Testing)
                        </button>
                        
                        <div className="text-left text-xs text-slate-500 border-t border-slate-800/80 pt-4 space-y-2">
                            <span className="font-semibold block text-slate-400">Cara mengaktifkan lokasi browser:</span>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Klik ikon gembok (🔒) di sebelah kiri bilah alamat URL browser Anda.</li>
                                <li>Aktifkan pilihan <span className="font-semibold">Location / Lokasi</span> menjadi "Allow" atau "Izinkan".</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
