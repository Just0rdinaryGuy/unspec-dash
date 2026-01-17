import DashboardLayout from "@/components/layout/DashboardLayout";
import SummaryCards from "@/components/dashboard/SummaryCards";
import HVCPivotTable from "@/components/dashboard/HVCPivotTable";
import StatusKurmaTable from "@/components/dashboard/StatusKurmaTable";
import ODPList from "@/components/dashboard/ODPList";

export default function HomePage() {
    return (
        <DashboardLayout>
            <div className="space-y-4">
                {/* Summary Cards di atas */}
                <SummaryCards />

                {/* Main content area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left column: Tables */}
                    <div className="lg:col-span-2 space-y-4">
                        <HVCPivotTable />
                        <StatusKurmaTable />
                    </div>

                    {/* Right column: ODP List */}
                    <div className="lg:col-span-1">
                        <ODPList />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
