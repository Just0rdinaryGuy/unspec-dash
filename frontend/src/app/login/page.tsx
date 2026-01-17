"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { API_BASE_URL } from "@/lib/constants"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
    const { login } = useAuth()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    username,
                    password,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.detail || "Login Gagal")
            }

            await login(data.access_token)
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
            {/* Dark overlay for better contrast */}
            <div className="absolute inset-0 bg-black/30 pointer-events-none" />

            <Card className="w-[380px] z-10 bg-white/10 backdrop-blur-md border-white/20 text-white shadow-2xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight">Login</CardTitle>
                    <CardDescription className="text-gray-200">
                        Masukan username dan password untuk akses Web WOC Balikpapan
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
                            <label htmlFor="username" className="text-sm font-medium leading-none text-gray-100">Username</label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Masukan Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium leading-none text-gray-100">Password</label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Masukan Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20"
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="remember" className="border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black" />
                                <label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-200">
                                    Remember me
                                </label>
                            </div>
                            <Link href="/register" className="text-sm text-gray-200 hover:text-white hover:underline relative z-50 cursor-pointer">
                                Daftar Akun
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
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
