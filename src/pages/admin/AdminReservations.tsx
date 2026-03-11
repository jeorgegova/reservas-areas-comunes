import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  formatCurrency, 
  formatDate, 
  formatTime, 
  cn 
} from '@/lib/utils';
import { format } from 'date-fns';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const fetchReservations = async () => {
    setLoading(true);
    let query = supabase
      .from('reservations')
      .select(`
        *,
        profiles (full_name, apartment, email),
        common_areas (name)
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;
    setReservations(data || []);
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('reservations')
      .update({ 
        status: newStatus,
        updated_at: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
      })
      .eq('id', id);

    if (!error) fetchReservations();
  };

  const filteredReservations = reservations.filter(res => 
    res.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.profiles?.apartment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.common_areas?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors: any = {
    'approved': 'bg-green-100 text-green-800 border-green-200',
    'pending_payment': 'bg-red-100 text-red-800 border-red-200',
    'pending_validation': 'bg-amber-100 text-amber-800 border-amber-200',
    'rejected': 'bg-gray-100 text-gray-800 border-gray-200',
    'cancelled': 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Reservas</h1>
          <p className="text-muted-foreground mt-1">Valida y gestiona todas las solicitudes del conjunto.</p>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="p-6 bg-white border-b">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, apto o área..." 
                className="pl-10 h-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select 
                className="h-11 rounded-md border border-input bg-background px-3 py-2 text-sm w-full md:w-48 outline-none focus:ring-2 focus:ring-primary/20"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="pending_validation">Pendiente Validación</option>
                <option value="pending_payment">Pendiente Pago</option>
                <option value="approved">Aprobadas</option>
                <option value="rejected">Rechazadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b text-gray-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Usuario / Apto</th>
                  <th className="px-6 py-4">Área Común</th>
                  <th className="px-6 py-4">Fecha / Hora</th>
                  <th className="px-6 py-4">Costo</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-8 bg-gray-50/50"></td>
                    </tr>
                  ))
                ) : filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No se encontraron reservas con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((res) => (
                    <tr key={res.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{res.profiles?.full_name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          Apartamento {res.profiles?.apartment}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{res.common_areas?.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{formatDate(res.start_datetime)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatTime(res.start_datetime)} - {formatTime(res.end_datetime)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary">{formatCurrency(res.total_cost)}</td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider",
                          statusColors[res.status]
                        )}>
                          {res.status.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {res.status === 'pending_validation' && (
                            <>
                              <Button 
                                size="sm" 
                                className="h-8 bg-green-600 hover:bg-green-700"
                                onClick={() => handleUpdateStatus(res.id, 'approved')}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" /> Aprobar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="h-8"
                                onClick={() => handleUpdateStatus(res.id, 'rejected')}
                              >
                                <XCircle className="w-4 h-4 mr-1" /> Rechazar
                              </Button>
                            </>
                          )}
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
