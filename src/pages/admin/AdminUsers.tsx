import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  User, 
  Shield, 
  ShieldAlert, 
  Mail, 
  Smartphone,
  MapPin,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });
    setUsers(data || []);
    setLoading(false);
  };

  const handleToggleRole = async (user: any) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`¿Cambiar el rol de ${user.full_name} a ${newRole}?`)) return;
    
    await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
    fetchUsers();
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.apartment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-muted-foreground mt-1">Administra los permisos y perfiles de los residentes.</p>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="p-6 bg-white border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre, apto o email..." 
              className="pl-10 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b text-gray-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Apartamento</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-8 bg-gray-50/50"></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{user.full_name}</div>
                            <div className="text-xs text-muted-foreground">ID: {user.id.substring(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary/50" />
                        {user.apartment || 'No asignado'}
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        )}>
                          {user.role === 'admin' ? <ShieldAlert className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                          {user.role}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8"
                            onClick={() => handleToggleRole(user)}
                          >
                            Cambiar Rol
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 px-2">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
