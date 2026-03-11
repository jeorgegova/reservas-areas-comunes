import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, formatTime, cn } from '@/lib/utils';
import { Calendar, Clock, MapPin, AlertCircle, XCircle, CheckCircle2, Info, History as HistoryIcon } from 'lucide-react';

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

  const statusMap: Record<string, { label: string, color: string, icon: any }> = {
    'approved': { label: 'Aprobada', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
    'pending_payment': { label: 'Pendiente de Pago', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle },
    'pending_validation': { label: 'Pendiente Validación', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
    'rejected': { label: 'Rechazada', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle },
    'cancelled': { label: 'Cancelada', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle },
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Reservas</h1>
          <p className="text-muted-foreground mt-1">Historial y estado de tus solicitudes.</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
      ) : reservations.length === 0 ? (
        <Card className="border-dashed border-2 py-12 text-center">
          <CardContent>
            <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-xl font-medium text-muted-foreground">No tienes reservas registradas</p>
            <Button className="mt-4" onClick={() => window.location.href = '/reservations/new'}>Hacer mi primera reserva</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reservations.map(res => {
            const status = statusMap[res.status] || { label: res.status, color: 'bg-gray-100', icon: Info };
            return (
              <Card key={res.id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all group">
                <div className="flex h-full">
                  <div className="w-32 sm:w-40 shrink-0 relative overflow-hidden hidden sm:block">
                     {res.common_areas?.image_url ? (
                      <img src={res.common_areas.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-primary/5 flex items-center justify-center text-primary/20">
                         <MapPin className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-lg leading-tight">{res.common_areas?.name}</h3>
                        <div className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 shrink-0", status.color)}>
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(res.start_datetime)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(res.start_datetime)} - {formatTime(res.end_datetime)}</span>
                        </div>
                        <div className="text-primary font-bold text-lg mt-2">
                          {formatCurrency(res.total_cost)}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex gap-2">
                      {res.status === 'pending_payment' && (
                        <Button 
                          className="flex-1 bg-red-600 hover:bg-red-700"
                          onClick={() => window.location.href = `/payment/${res.id}`}
                        >
                          Pagar ahora
                        </Button>
                      )}
                      {['pending_payment', 'pending_validation'].includes(res.status) && (
                        <Button variant="outline" className="flex-1" onClick={() => handleCancel(res.id)}>Cancelar</Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
