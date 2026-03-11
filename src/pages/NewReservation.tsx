import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, cn } from '@/lib/utils';
import { 
  Clock, 
  AlertCircle, 
  ArrowRight,
  ChevronLeft,
  Building2
} from 'lucide-react';
import { format, addHours } from 'date-fns';

export default function NewReservationPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [areas, setAreas] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(1);
  const [existingReservations, setExistingReservations] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [blockingError, setBlockingError] = useState<string | null>(null);

  useEffect(() => {
    checkPendingReservations();
    fetchAreas();
  }, []);

  const checkPendingReservations = async () => {
    if (!profile) return;
    
    const { data, error } = await supabase
      .from('reservations')
      .select('id')
      .eq('user_id', profile.id)
      .eq('status', 'pending_payment');

    if (data && data.length > 0) {
      setBlockingError('Tiene una reserva pendiente de pago. Debe completar el pago antes de hacer una nueva reserva.');
    }
  };

  const fetchAreas = async () => {
    const { data } = await supabase.from('common_areas').select('*').eq('is_active', true);
    setAreas(data || []);
  };

  const fetchExistingReservations = async (areaId: string, date: string) => {
    const { data } = await supabase
      .from('reservations')
      .select('start_datetime, end_datetime')
      .eq('common_area_id', areaId)
      .in('status', ['approved', 'pending_validation', 'pending_payment']);
    
    setExistingReservations(data || []);
  };

  const handleAreaSelect = (area: any) => {
    setSelectedArea(area);
    setStep(2);
    fetchExistingReservations(area.id, selectedDate);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (selectedArea) {
      fetchExistingReservations(selectedArea.id, date);
    }
  };

  // Generate slots from 08:00 to 22:00
  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const isSlotOccupied = (time: string) => {
    const slotStart = new Date(`${selectedDate}T${time}:00`);
    const slotEnd = addHours(slotStart, duration);

    return existingReservations.some(res => {
      const resStart = new Date(res.start_datetime);
      const resEnd = new Date(res.end_datetime);
      
      return (slotStart < resEnd && slotEnd > resStart);
    });
  };

  const handleReserve = async () => {
    if (!profile || !selectedArea || !selectedStartTime) return;
    
    setLoading(true);
    const start = new Date(`${selectedDate}T${selectedStartTime}:00`).toISOString();
    const end = addHours(new Date(`${selectedDate}T${selectedStartTime}:00`), duration).toISOString();
    const totalCost = selectedArea.cost_per_hour * duration;

    try {
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          user_id: profile.id,
          common_area_id: selectedArea.id,
          start_datetime: start,
          end_datetime: end,
          total_cost: totalCost,
          status: 'pending_payment'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Redirect to specific payment mock page
      navigate(`/payment/${data.id}`);
    } catch (error: any) {
      alert('Error al crear la reserva: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (blockingError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md border-none shadow-lg text-center p-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-destructive/10 rounded-full text-destructive">
              <AlertCircle className="w-12 h-12" />
            </div>
          </div>
          <CardTitle className="text-xl mb-4">Acceso Bloqueado</CardTitle>
          <CardDescription className="text-base mb-6">
            {blockingError}
          </CardDescription>
          <Button onClick={() => navigate('/reservations/my')}>
            Ver mis reservas
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Reserva</h1>
          <p className="text-muted-foreground mt-1">Sigue los pasos para reservar un área común.</p>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={cn(
                "w-10 h-2 rounded-full transition-all duration-300",
                step >= s ? "bg-primary" : "bg-gray-200"
              )}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map(area => (
            <Card 
              key={area.id} 
              className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => handleAreaSelect(area)}
            >
              {area.image_url ? (
                <img src={area.image_url} alt={area.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-40 bg-primary/5 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-primary/20" />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{area.name}</CardTitle>
                <CardDescription className="line-clamp-2">{area.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm font-medium">Costo por hora</span>
                  <span className="text-primary font-bold">{formatCurrency(area.cost_per_hour)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full group-hover:translate-x-1 transition-transform">
                  Seleccionar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {step === 2 && selectedArea && (
        <Card className="border-none shadow-xl">
          <CardHeader className="flex flex-row items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setStep(1)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <CardTitle>Configurar horario: {selectedArea.name}</CardTitle>
              <CardDescription>Selecciona la fecha y el bloque de tiempo.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-base">Selecciona el día</Label>
                <Input 
                  type="date" 
                  value={selectedDate} 
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="h-12 text-lg"
                />
                
                <Label className="text-base block pt-4">Duración (máx. {selectedArea.max_hours_per_reservation}h)</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].filter(h => h <= selectedArea.max_hours_per_reservation).map(h => (
                    <Button
                      key={h}
                      variant={duration === h ? "default" : "outline"}
                      className="flex-1 h-12 text-lg"
                      onClick={() => setDuration(h)}
                    >
                      {h}h
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base">Horas disponibles</Label>
                <div className="grid grid-cols-3 gap-2 max-h-[250px] overflow-y-auto p-1">
                  {timeSlots.map(time => {
                    const occupied = isSlotOccupied(time);
                    return (
                      <Button
                        key={time}
                        variant={selectedStartTime === time ? "default" : "outline"}
                        disabled={occupied}
                        onClick={() => setSelectedStartTime(time)}
                        className={cn(
                          "h-10 text-sm",
                          occupied && "opacity-40 cursor-not-allowed bg-gray-100"
                        )}
                      >
                        {time}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-primary/5 p-6 rounded-xl border border-primary/10 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Resumen de costos</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedArea.cost_per_hour * duration)} <span className="text-sm font-normal text-muted-foreground">por {duration} hora(s)</span></p>
                </div>
              </div>
              <Button 
                size="lg" 
                className="h-14 px-8 text-lg" 
                disabled={!selectedStartTime}
                onClick={() => setStep(3)}
              >
                Continuar reserva
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && selectedArea && (
        <Card className="border-none shadow-xl max-w-2xl mx-auto overflow-hidden">
          <div className="h-2 bg-primary" />
          <CardHeader>
            <CardTitle className="text-2xl">Confirmación Final</CardTitle>
            <CardDescription>Revisa los detalles antes de proceder al pago.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 p-6 bg-gray-50 rounded-xl">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-muted-foreground">Área Común</span>
                <span className="font-bold">{selectedArea.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-muted-foreground">Fecha</span>
                <span className="font-bold uppercase">{selectedDate}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-muted-foreground">Horario</span>
                <span className="font-bold">{selectedStartTime} - {format(addHours(new Date(`${selectedDate}T${selectedStartTime}:00`), duration), 'HH:mm')}</span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="text-lg font-semibold">Total a pagar</span>
                <span className="text-3xl font-extrabold text-primary">{formatCurrency(selectedArea.cost_per_hour * duration)}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                Al confirmar, serás redirigido a la pasarela de pagos. Tu reserva quedará pendiente hasta que el pago sea validado.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full h-14 text-lg" onClick={handleReserve} disabled={loading}>
              {loading ? "Procesando..." : "Confirmar y pagar ahora"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep(2)}>
              Modificar datos
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
