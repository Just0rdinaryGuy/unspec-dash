"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { API_BASE_URL } from "@/lib/constants"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function RegisterPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        username: "",
        nik: "",
        full_name: "",
        password: "",
        confirmPassword: ""
    })
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match")
            return
        }

        setLoading(true)

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: formData.username,
                    nik: formData.nik,
                    full_name: formData.full_name,
                    password: formData.password,
                    role: "user", // Default role
                    is_active: true
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                if (Array.isArray(data.detail)) {
                    const messages = data.detail.map((err: any) => {
                        const field = err.loc[err.loc.length - 1]
                        return `${field}: ${err.msg}`
                    }).join(", ")
                    throw new Error(messages)
                }
                throw new Error(data.detail || "Registrasi Gagal")
            }

            // Show success message
            setError("") // Clear errors
            alert("Registrasi berhasil! Mohon menunggu persetujuan Admin untuk mengaktifkan akun anda.")
            router.push("/login")
        } catch (err: any) {
            setError(err.message || "Terjadi Kesalahan")
            setLoading(false)
        }
    }

    return (
        <div
            className="min-h-screen w-full bg-cover bg-center flex items-center justify-start pl-[5%] md:pl-[10%]"
            style={{
                backgroundImage: "url('/login-bg.jpg')",
            }}
        >
            <div className="absolute inset-0 bg-black/30 pointer-events-none" />

            <Card className="w-[380px] z-10 bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">Daftar Akun</CardTitle>
                    <CardDescription className="text-gray-200">
                        Buat akun baru untuk akses Web WOC Balikpapan
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 text-white">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-gray-100">Username</label>
                            <Input
                                type="text"
                                placeholder="Masukan Username"
                                value={formData.username}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '')
                                    setFormData({ ...formData, username: val })
                                }}
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-gray-100">NIK (Nomor Induk Karyawan)</label>
                            <Input
                                type="text"
                                placeholder="Masukan NIK"
                                value={formData.nik}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '')
                                    setFormData({ ...formData, nik: val })
                                }}
                                inputMode="numeric"
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-gray-100">Nama Lengkap</label>
                            <Input
                                type="text"
                                placeholder="Masukan Nama Lengkap"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-gray-100">Password</label>
                            <Input
                                type="password"
                                placeholder="Masukan Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-gray-100">Konfirmasi Password</label>
                            <Input
                                type="password"
                                placeholder="Ulangi Password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20"
                                required
                            />
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-200">Sudah punya akun?</span>
                            <Link href="/login" className="text-white hover:underline font-medium cursor-pointer relative z-50">
                                Sign In
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-white text-black hover:bg-gray-200 font-semibold"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Membuat Akun...
                                </>
                            ) : (
                                "Daftar Akun"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div >
    )
}
