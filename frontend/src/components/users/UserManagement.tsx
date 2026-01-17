"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { API_BASE_URL } from "@/lib/constants"
import { User } from "@/types/auth"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function UserManagement() {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [formData, setFormData] = useState({
        username: "",
        nik: "",
        full_name: "",
        password: "",
        role: "user",
        is_active: true
    })
    const [error, setError] = useState("")

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`${API_BASE_URL}/api/users/`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        try {
            const token = localStorage.getItem("token")
            const url = editingUser
                ? `${API_BASE_URL}/api/users/${editingUser.id}`
                : `${API_BASE_URL}/api/users/`

            const method = editingUser ? "PUT" : "POST"

            // Filter empty password if editing
            const { password, ...rest } = formData
            const body = editingUser && !password ? rest : formData

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            })

            const data = await res.json()
            if (!res.ok) {
                // Handle Pydantic validation errors (array of objects)
                if (Array.isArray(data.detail)) {
                    const messages = data.detail.map((err: any) => {
                        const field = err.loc[err.loc.length - 1]
                        return `${field}: ${err.msg}`
                    }).join(", ")
                    throw new Error(messages)
                }
                throw new Error(data.detail || "Operation failed")
            }

            setIsDialogOpen(false)
            fetchUsers()
            resetForm()
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this user?")) return
        try {
            const token = localStorage.getItem("token")
            await fetch(`${API_BASE_URL}/api/users/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            })
            fetchUsers()
        } catch (error) {
            console.error(error)
        }
    }

    const resetForm = () => {
        setEditingUser(null)
        setFormData({
            username: "",
            nik: "",
            full_name: "",
            password: "",
            role: "user",
            is_active: true
        })
        setError("")
    }

    const openEdit = (user: User) => {
        setEditingUser(user)
        setFormData({
            username: user.username,
            nik: user.nik,
            full_name: user.full_name || "",
            password: "", // Don't populate password
            role: user.role,
            is_active: user.is_active
        })
        setIsDialogOpen(true)
    }

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.nik.toLowerCase().includes(search.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(search.toLowerCase())
    )

    if (currentUser?.role !== "admin" && currentUser?.role !== "developer") {
        return <div className="p-8 text-center text-red-500">Access Denied. Admin or Developer only.</div>
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>User Management</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open)
                    if (!open) resetForm()
                }}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" /> Add User</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                            <DialogDescription>
                                {editingUser ? "Make changes to user account here." : "Create a new user account."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Username</label>
                                <Input
                                    value={formData.username}
                                    onChange={e => {
                                        const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '')
                                        setFormData({ ...formData, username: val })
                                    }}
                                    disabled={!!editingUser}
                                    placeholder="Alphanumeric only"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">NIK</label>
                                <Input
                                    value={formData.nik}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '')
                                        setFormData({ ...formData, nik: val })
                                    }}
                                    inputMode="numeric"
                                    placeholder="Enter numbers only"
                                    required
                                />
                            </div>
                            {!editingUser && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Password</label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            )}
                            {editingUser && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">New Password (leave blank to keep current)</label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <Select
                                    value={formData.role}
                                    onValueChange={val => setFormData({ ...formData, role: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        {currentUser?.role === 'developer' && (
                                            <SelectItem value="developer">Developer</SelectItem>
                                        )}
                                        <SelectItem value="user">User</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <Select
                                    value={formData.is_active ? "active" : "inactive"}
                                    onValueChange={val => setFormData({ ...formData, is_active: val === "active" })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full">
                                {editingUser ? "Update User" : "Create User"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="flex items-center mb-4">
                    <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        className="max-w-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Username</TableHead>
                                <TableHead>Full Name</TableHead>
                                <TableHead>NIK</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.username}</TableCell>
                                    <TableCell>{user.full_name}</TableCell>
                                    <TableCell>{user.nik}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            user.role === 'admin' ? 'default' :
                                                user.role === 'developer' ? 'secondary' : 'outline'
                                        }>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.is_active ? 'outline' : 'destructive'} className={user.is_active ? "text-green-600 border-green-600" : ""}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        {currentUser?.id !== user.id && (
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
