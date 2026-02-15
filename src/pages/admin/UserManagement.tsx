import { UserCog, Shield, User, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAdmin } from '@/hooks/useAdmin';

export default function UserManagement() {
    const { useAdminUsers, useUpdateUserRole } = useAdmin();
    const { data: users, isLoading } = useAdminUsers();
    const updateRole = useUpdateUserRole();

    const handleRoleChange = (userId: number, newRole: string) => {
        updateRole.mutate({ id: userId, role: newRole });
    };

    const adminCount = users?.filter(u => u.role === 'ADMIN').length ?? 0;
    const userCount = users?.filter(u => u.role === 'USER').length ?? 0;
    const viewerCount = users?.filter(u => u.role === 'VIEWER').length ?? 0;

    return (
        <div>
            <div className="page-header mb-8 inline-block">
                USER MANAGEMENT
            </div>

            {/* Role Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
                    <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Admins</div>
                    <div className="text-2xl font-bold text-destructive">{adminCount}</div>
                </div>
                <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
                    <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Users</div>
                    <div className="text-2xl font-bold text-primary">{userCount}</div>
                </div>
                <div className="bg-card border border-border p-4 rounded-lg shadow-sm">
                    <div className="text-xs text-muted-foreground uppercase font-bold mb-1">Viewers</div>
                    <div className="text-2xl font-bold text-muted-foreground">{viewerCount}</div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                <div className="section-header flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    All Operators ({users?.length ?? 0})
                </div>
                {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading users...</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users?.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-mono text-sm">{user.id}</TableCell>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{user.email || '-'}</TableCell>
                                    <TableCell>{user.department || '-'}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={user.role}
                                            onValueChange={(value) => handleRoleChange(user.id, value)}
                                            disabled={updateRole.isPending}
                                        >
                                            <SelectTrigger className="w-32 h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ADMIN">
                                                    <span className="flex items-center gap-2">
                                                        <Shield className="h-3.5 w-3.5 text-destructive" />
                                                        Admin
                                                    </span>
                                                </SelectItem>
                                                <SelectItem value="USER">
                                                    <span className="flex items-center gap-2">
                                                        <User className="h-3.5 w-3.5 text-primary" />
                                                        User
                                                    </span>
                                                </SelectItem>
                                                <SelectItem value="VIEWER">
                                                    <span className="flex items-center gap-2">
                                                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                                        Viewer
                                                    </span>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.isActive ? 'default' : 'secondary'} className="text-xs">
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(user.createdDate).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}
