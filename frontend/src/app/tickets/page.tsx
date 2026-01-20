"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardLayout from "@/components/layout/DashboardLayout"

export default function TicketsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Status Tiket</h2>
                    <p className="text-muted-foreground">
                        Halaman ini sedang dalam pengembangan.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Tiket</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
                            Data tiket akan muncul di sini.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    )
}
