import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatTime, cn } from '@/lib/utils';
import { Calendar, Clock, XCircle, History as HistoryIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyReservationsPage() {
  const { profile } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) fetchReservations();
  }, [profile]);

  const fetchReservations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reservations')
      .select(`
        *,
        common_areas (name, image_url)
      `)
      .eq('user_id', profile?.id)
      .order('created_at', { ascending: false });
    
    setReservations(data || []);
    setLoading(false);
  };

  const handleCancel = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (!error) fetchReservations();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mis Reservas</h1>
          <p className="text-gray-500 text-sm">Historial y estado de tus solicitudes.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 shadow-sm">
          <Link to="/reservations/new">Nueva Reserva</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
          ))
        ) : reservations.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex flex-col items-center">
              <HistoryIcon className="w-12 h-12 text-gray-200 mb-4" />
              <p className="text-lg font-bold text-gray-400">Aún no tienes reservas.</p>
              <Button asChild variant="link" className="mt-2 text-primary">
                <Link to="/reservations/new">Haz tu primera reserva aquí</Link>
              </Button>
            </div>
          </div>
        ) : (
          reservations.map((res) => (
            <Card key={res.id} className="border-none shadow-sm bg-white overflow-hidden hover:shadow-md transition-shadow">
              <div className={cn(
                "h-1",
                res.status === 'approved' ? 'bg-green-500' :
                res.status === 'pending_validation' ? 'bg-amber-500' :
                res.status === 'pending_payment' ? 'bg-red-500' : 'bg-gray-400'
              )} />
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 truncate pr-2">{res.common_areas?.name}</h3>
                  <div className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border whitespace-nowrap",
                    res.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                    res.status === 'pending_validation' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    res.status === 'pending_payment' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-700 border-gray-100'
                  )}>
                    {res.status.replace('_', ' ')}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{formatDate(res.start_datetime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{formatTime(res.start_datetime)} - {formatTime(res.end_datetime)}</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-medium">Costo</span>
                    <span className="font-bold text-primary">{formatCurrency(res.total_cost)}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    {res.status === 'pending_payment' && (
                      <Button size="sm" className="h-8 bg-red-600 hover:bg-red-700 text-xs px-3" onClick={() => window.location.href = `/payment/${res.id}`}>
                        Pagar
                      </Button>
                    )}
                    {['pending_payment', 'pending_validation'].includes(res.status) && (
                      <Button size="sm" variant="ghost" className="h-8 text-gray-400 hover:text-red-500 hover:bg-red-50 text-xs" onClick={() => handleCancel(res.id)}>
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
