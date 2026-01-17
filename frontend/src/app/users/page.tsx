import DashboardLayout from "@/components/layout/DashboardLayout";
import UserManagement from "@/components/users/UserManagement";

export default function UsersPage() {
    return (
        <DashboardLayout>
            <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                <UserManagement />
            </div>
        </DashboardLayout>
    );
}
