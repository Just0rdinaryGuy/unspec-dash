"use client"

import { useState, useCallback } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, CheckCircle2, AlertCircle, Database, FileSpreadsheet, X, Info } from "lucide-react"
import { API_BASE_URL } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface ImportResult {
    status: string
    message: string
    summary: {
        total_imported: number
        spec_count: number
        unspec_count: number
        timestamp: string
    }
}

export default function SignalMonitoringPage() {
    const [file1, setFile1] = useState<File | null>(null)
    const [file2, setFile2] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [dragActive1, setDragActive1] = useState(false)
    const [dragActive2, setDragActive2] = useState(false)

    const handleDrag = useCallback((e: React.DragEvent, fileNum: 1 | 2, active: boolean) => {
        e.preventDefault()
        e.stopPropagation()
        if (fileNum === 1) {
            setDragActive1(active)
        } else {
            setDragActive2(active)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent, fileNum: 1 | 2) => {
        e.preventDefault()
        e.stopPropagation()
        if (fileNum === 1) {
            setDragActive1(false)
        } else {
            setDragActive2(false)
        }

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(fileNum, e.dataTransfer.files[0])
        }
    }, [])

    const handleFileChange = (fileNum: 1 | 2, file: File | null) => {
        if (fileNum === 1) {
            setFile1(file)
        } else {
            setFile2(file)
        }
        setResult(null)
        setError(null)
    }

    const clearFile = (fileNum: 1 | 2) => {
        if (fileNum === 1) {
            setFile1(null)
        } else {
            setFile2(null)
        }
    }

    const handleUpload = async () => {
        // Validasi: 
        // 1. Kedua file ada (Full Import)
        // 2. Cuma File 2 (Ukur Massal) ada (Partial Update)
        if ((!file1 && !file2) || (file1 && !file2)) {
            setError("Pilih kedua file untuk Full Import, atau hanya File Ukur Massal untuk Update Redaman.")
            return
        }

        setUploading(true)
        setError(null)
        setResult(null)

        try {
            const formData = new FormData()
            if (file1) formData.append("file1", file1)
            if (file2) formData.append("file2", file2)

            const response = await fetch(`${API_BASE_URL}/api/data-import/upload`, {
                method: "POST",
                body: formData
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail || "Upload gagal")
            }

            setResult(data)
            setFile1(null)
            setFile2(null)
        } catch (err: any) {
            let errorMsg = "Terjadi kesalahan saat upload"
            if (err.message) {
                try {
                    // Try to parse if it looks like JSON or check if it's [object Object]
                    if (err.message === "[object Object]") {
                        errorMsg = "Server validation error (422). Please check file inputs."
                    } else {
                        errorMsg = err.message
                    }
                } catch {
                    errorMsg = err.message
                }
            } else if (typeof err === "string") {
                errorMsg = err
            }
            setError(errorMsg)
        } finally {
            setUploading(false)
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-4">
                {/* Simple Header */}
                <div>
                    <h1 className="text-2xl font-bold">Update Data</h1>
                    <p className="text-muted-foreground">
                        Upload file Excel untuk update ke database Unspec
                    </p>
                </div>

                {/* Upload Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Files</CardTitle>
                        <CardDescription>
                            Pilih 2 file Excel (unspec semesta dan ukur massal). Sistem akan otomatis mendeteksi tipe file.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* File 1 Drop Zone */}
                            <div
                                onDragEnter={(e) => handleDrag(e, 1, true)}
                                onDragLeave={(e) => handleDrag(e, 1, false)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, 1)}
                                className={cn(
                                    "relative rounded-lg border-2 border-dashed transition-all",
                                    dragActive1 ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                                    file1 && "border-green-500 bg-green-50 dark:bg-green-950/10"
                                )}
                            >
                                <div className="p-6 text-center">
                                    <div className={cn(
                                        "mx-auto w-12 h-12 rounded-lg flex items-center justify-center mb-3",
                                        file1 ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
                                    )}>
                                        {file1 ? (
                                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                                        ) : (
                                            <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <h3 className="font-medium mb-2">File Unspec Semesta</h3>
                                    {file1 ? (
                                        <div className="space-y-2">
                                            <div className="text-sm text-green-600 font-medium">
                                                {file1.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {(file1.size / 1024).toFixed(2)} KB
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => clearFile(1)}
                                                className="mt-2"
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Ganti
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm text-muted-foreground mb-3">
                                                Drag & drop atau klik untuk pilih file
                                            </p>
                                            <input
                                                type="file"
                                                accept=".xlsx"
                                                onChange={(e) => handleFileChange(1, e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="file1-input"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => document.getElementById("file1-input")?.click()}
                                            >
                                                <Upload className="h-4 w-4 mr-1" />
                                                Pilih File
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* File 2 Drop Zone */}
                            <div
                                onDragEnter={(e) => handleDrag(e, 2, true)}
                                onDragLeave={(e) => handleDrag(e, 2, false)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, 2)}
                                className={cn(
                                    "relative rounded-lg border-2 border-dashed transition-all",
                                    dragActive2 ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                                    file2 && "border-green-500 bg-green-50 dark:bg-green-950/10"
                                )}
                            >
                                <div className="p-6 text-center">
                                    <div className={cn(
                                        "mx-auto w-12 h-12 rounded-lg flex items-center justify-center mb-3",
                                        file2 ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
                                    )}>
                                        {file2 ? (
                                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                                        ) : (
                                            <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                                        )}
                                    </div>
                                    <h3 className="font-medium mb-2">File Ukur Massal</h3>
                                    {file2 ? (
                                        <div className="space-y-2">
                                            <div className="text-sm text-green-600 font-medium">
                                                {file2.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {(file2.size / 1024).toFixed(2)} KB
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => clearFile(2)}
                                                className="mt-2"
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Ganti
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-sm text-muted-foreground mb-3">
                                                Drag & drop atau klik untuk pilih file
                                            </p>
                                            <input
                                                type="file"
                                                accept=".xlsx"
                                                onChange={(e) => handleFileChange(2, e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="file2-input"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => document.getElementById("file2-input")?.click()}
                                            >
                                                <Upload className="h-4 w-4 mr-1" />
                                                Pilih File
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Process Button */}
                        <div className="flex justify-center pt-2">
                            <Button
                                onClick={handleUpload}
                                disabled={(!file1 && !file2) || (file1 && !file2) || uploading}
                                size="lg"
                                className="px-8"
                            >
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Database className="h-4 w-4 mr-2" />
                                        {(!file1 && file2) ? "Update Redaman Only" : "Process & Import Data"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Success Result */}
                {result && (
                    <Card className="border-green-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="h-5 w-5" />
                                Import Berhasil
                            </CardTitle>
                            <CardDescription>
                                Data berhasil diimport ke database. Refresh halaman lain untuk melihat data terbaru.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="rounded-lg bg-muted p-4">
                                    <div className="text-2xl font-bold">{result.summary.total_imported}</div>
                                    <div className="text-sm text-muted-foreground mt-1">Total Nodes</div>
                                </div>
                                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4">
                                    <div className="text-2xl font-bold text-green-600">{result.summary.spec_count}</div>
                                    <div className="text-sm text-muted-foreground mt-1">SPEC</div>
                                </div>
                                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-4">
                                    <div className="text-2xl font-bold text-red-600">{result.summary.unspec_count}</div>
                                    <div className="text-sm text-muted-foreground mt-1">UNSPEC</div>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-4 text-center">
                                Imported at: {new Date(result.summary.timestamp).toLocaleString('id-ID', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                })}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Informasi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex gap-2">
                            <FileSpreadsheet className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                            <div>
                                <strong>Auto-Detection:</strong> Sistem akan otomatis mendeteksi tipe file berdasarkan struktur kolom.
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                            <div>
                                <strong>Status Tiket Otomatis:</strong> UNSPEC → PROGRESS, SPEC → CLOSED.
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 text-yellow-600 flex-shrink-0" />
                            <div>
                                <strong>Upload Tanggal Sama:</strong> Data akan di-replace. <strong>Upload Tanggal Berbeda:</strong> Data akan ditambahkan (historical).
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Info className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                            <div>
                                <strong>Update Redaman:</strong> Upload file Ukur Massal iBooster <span className="text-red-600 font-semibold">MERAH</span> (bukan biru, akan mismatch).
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                            <div>
                                <strong>Format Support:</strong> File .xlsx max 10MB per file.
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
