import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  User, 
  Search,
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
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Usuarios</h1>
        <p className="text-gray-500 text-sm">Administra los permisos y perfiles de los residentes.</p>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-4 bg-gray-50/50 border-b border-gray-100">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Buscar por nombre, apto..." 
              className="pl-10 h-9 rounded-lg text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50/30 border-b border-gray-100">
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Apartamento</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded-full w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                       No se encontraron usuarios.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 leading-tight">{user.full_name}</div>
                            <div className="text-[10px] text-gray-400 uppercase mt-0.5">ID: {user.id.substring(0, 8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                          <Mail className="w-3.5 h-3.5 text-gray-300" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
                            <Smartphone className="w-3.5 h-3.5 text-gray-300" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                           <MapPin className="w-3.5 h-3.5 text-gray-300" />
                           <span>Apto {user.apartment || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border uppercase",
                          user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                        )}>
                          {user.role}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 px-3 text-[10px] font-bold border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                            onClick={() => handleToggleRole(user)}
                          >
                            Cambiar Rol
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-primary">
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
