"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { API_BASE_URL } from "@/lib/constants"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
    const { user } = useAuth()
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: "", text: "" })

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setMessage({ type: "error", text: "Password baru tidak cocok" })
            return
        }
        if (password.length < 8) {
            setMessage({ type: "error", text: "Password harus minimal 8 karakter" })
            return
        }

        setLoading(true)
        setMessage({ type: "", text: "" })

        try {
            const token = localStorage.getItem("token")
            // Assuming current user update endpoint (using user ID)
            if (!user?.id) throw new Error("User ID not found")

            const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    password: password
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.detail || "Gagal update password")

            setMessage({ type: "success", text: "Password berhasil diupdate" })
            setPassword("")
            setConfirmPassword("")
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Terjadi Kesalahan" })
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">Pengaturan Akun</h2>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Akun</CardTitle>
                            <CardDescription>Informasi Akun Anda</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Username</label>
                                    <Input value={user?.username} disabled className="bg-muted" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Role</label>
                                    <Input value={user?.role} disabled className="bg-muted" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">NIK</label>
                                    <Input value={user?.nik || '-'} disabled className="bg-muted" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nama Lengkap</label>
                                    <Input value={user?.full_name || '-'} disabled className="bg-muted" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Ganti Password</CardTitle>
                            <CardDescription>Update password anda</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                                {message.text && (
                                    <Alert variant={message.type === "error" ? "destructive" : "default"} className={message.type === "success" ? "bg-green-50 text-green-900 border-green-200" : ""}>
                                        <AlertDescription>{message.text}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Password Baru</label>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        placeholder="Minimal 8 karakter"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Konfirmasi Password Baru</label>
                                    <Input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        placeholder="Ulangi password baru"
                                    />
                                </div>

                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Password
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
