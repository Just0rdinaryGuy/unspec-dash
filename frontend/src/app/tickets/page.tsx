import DashboardLayout from "@/components/layout/DashboardLayout"
import { Wrench } from "lucide-react"

export default function StatusTiketPage() {
    return (
        <DashboardLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <div className="p-4 rounded-full bg-accent/20">
                    <Wrench className="w-12 h-12 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold">Status Tiket</h1>
                <p className="text-muted-foreground max-w-md">
                    Halaman ini sedang dalam pengembangan.
                    <br />
                    Fitur ini akan segera hadir untuk memantau status tiket teknisi.
                </p>
            </div>
        </DashboardLayout>
    )
}
