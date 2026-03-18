import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, cn, detoxTime } from '@/lib/utils';
import {
  Clock,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  Building2,
  Hammer,
  ClipboardCheck,
  Sun,
  Moon,
  Calendar
} from 'lucide-react';
import { format, addHours, parseISO } from 'date-fns';

export default function NewReservationPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === 'admin';

  const [step, setStep] = useState(1);
  const [areas, setAreas] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(1);
  // Tipo de jornada seleccionada: 'diurna' | 'nocturna' | 'ambos' | null
  const [selectedJornada, setSelectedJornada] = useState<'diurna' | 'nocturna' | 'ambos' | null>(null);
  const [existingReservations, setExistingReservations] = useState<any[]>([]);
  const [activeMaintenances, setActiveMaintenances] = useState<any[]>([]);

  // Para admins: seleccionar usuario para la reserva
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [blockingError, setBlockingError] = useState<string | null>(null);

  useEffect(() => {
    checkPendingReservations();
    fetchAreas();
    if (isAdmin) {
      fetchUsers();
    }
  }, [profile]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, apartment')
      .eq('role', 'user')
      .order('full_name');

    if (data) {
      setUsers(data);
      // Por defecto, seleccionar el primer usuario
      if (data.length > 0) {
        setSelectedUserId(data[0].id);
      }
    }
  };

  const checkPendingReservations = async () => {
    if (!profile) return;

    const { data } = await supabase
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

  const fetchBusySlots = async (areaId: string) => {
    // Fetch reservations
    const { data: resData } = await supabase
      .from('reservations')
      .select('start_datetime, end_datetime')
      .eq('common_area_id', areaId)
      .in('status', ['approved', 'pending_validation', 'pending_payment']);

    setExistingReservations(resData || []);

    // Fetch maintenance notices for this area or general notices
    const { data: maintData } = await supabase
      .from('maintenance_notices')
      .select('starts_at, ends_at, severity, title, content')
      .or(`common_area_id.eq.${areaId},common_area_id.is.null`)
      .eq('is_active', true);

    setActiveMaintenances(maintData || []);
  };

  const handleAreaSelect = (area: any) => {
    setSelectedArea(area);
    setSelectedJornada(null); // Reset jornada selection
    setStep(2);
    fetchBusySlots(area.id);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (selectedArea) {
      fetchBusySlots(selectedArea.id);
    }
  };

  // Generate slots from 08:00 to 22:00
  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const getSlotStatus = (time: string) => {
    const slotStart = parseISO(`${selectedDate}T${time}:00`);
    const slotEnd = addHours(slotStart, duration);

    // Check reservations
    const isReserved = existingReservations.some(res => {
      const resStart = parseISO(detoxTime(res.start_datetime));
      const resEnd = parseISO(detoxTime(res.end_datetime));
      return (slotStart < resEnd && slotEnd > resStart);
    });

    if (isReserved) return { status: 'reserved' };

    // Check maintenance
    const maintenance = activeMaintenances.find(maint => {
      const maintStart = parseISO(detoxTime(maint.starts_at));
      const maintEnd = parseISO(detoxTime(maint.ends_at));
      return (slotStart < maintEnd && slotEnd > maintStart);
    });

    if (maintenance) return { status: 'maintenance', reason: maintenance.title };

    return { status: 'available' };
  };

  // Calcular el costo total según el tipo de precio
  const calculateTotalCost = () => {
    if (!selectedArea) return 0;

    if (selectedArea.pricing_type === 'jornada') {
      if (selectedJornada === 'diurna') return selectedArea.cost_jornada_diurna || 0;
      if (selectedJornada === 'nocturna') return selectedArea.cost_jornada_nocturna || 0;
      if (selectedJornada === 'ambos') return selectedArea.cost_jornada_ambos || 0;
      return 0;
    }
    return selectedArea.cost_per_hour * duration;
  };

  // Obtener las horas de la jornada seleccionada
  const getJornadaHours = () => {
    if (!selectedArea) return 0;
    if (selectedJornada === 'diurna') return selectedArea.jornada_hours_diurna || 10;
    if (selectedJornada === 'nocturna') return selectedArea.jornada_hours_nocturna || 6;
    if (selectedJornada === 'ambos') return (selectedArea.jornada_hours_diurna || 10) + (selectedArea.jornada_hours_nocturna || 6);
    return 0;
  };

  // Determinar la hora de fin según el tipo de precio
  const getEndTime = () => {
    if (!selectedArea || !selectedStartTime) return '';

    if (selectedArea.pricing_type === 'jornada') {
      const hours = getJornadaHours();
      return format(addHours(parseISO(`${selectedDate}T${selectedStartTime}:00`), hours), "yyyy-MM-dd'T'HH:mm:ss");
    }
    return format(addHours(parseISO(`${selectedDate}T${selectedStartTime}:00`), duration), "yyyy-MM-dd'T'HH:mm:ss");
  };

  const handleReserve = async () => {
    if (!profile || !selectedArea || !selectedStartTime) return;

    // Para áreas por jornada, validar que se haya seleccionado una jornada
    if (selectedArea.pricing_type === 'jornada' && !selectedJornada) {
      setBlockingError('Por favor selecciona una jornada (diurna, nocturna o completo)');
      setLoading(false);
      return;
    }

    // Limpiar errores anteriores
    setBlockingError(null);

    setLoading(true);
    const start = `${selectedDate}T${selectedStartTime}:00`;
    const end = getEndTime();
    const totalCost = calculateTotalCost();

    // Verificar que el usuario ha seleccionado un usuario
    if (isAdmin && (!selectedUserId || selectedUserId.length === 0)) {
      setBlockingError('Por favor selecciona un usuario para la reserva');
      setLoading(false);
      return;
    }

    // Para admins: usar el usuario seleccionado, para usuarios normales: usar su propio perfil
    const reservationUserId = (isAdmin && selectedUserId && selectedUserId.length > 0) ? selectedUserId : profile.id;

    try {
      const { data, error } = await supabase
        .from('reservations')
        .insert({
          user_id: reservationUserId,
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
        <Card className="border-none shadow-sm bg-white text-center p-8 max-w-md">
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nueva Reserva</h1>
          <p className="text-gray-500 text-sm">Sigue los pasos para asegurar tu espacio.</p>
        </div>
        <div className="flex items-center gap-3">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-2.5 rounded-full transition-all duration-500",
                step === s ? "w-12 bg-primary" :
                  step > s ? "w-8 bg-emerald-500" : "w-8 bg-gray-200"
              )}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <>
          {/* Selector de usuario para admin */}
          {isAdmin && users.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Reservar para usuario:
              </Label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg bg-white text-gray-900"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.email} {user.apartment ? `- Apt ${user.apartment}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((area) => (
              <Card
                key={area.id}
                className="border-none shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                onClick={() => handleAreaSelect(area)}
              >
                <div className="relative h-40 overflow-hidden">
                  {area.image_url ? (
                    <img src={area.image_url} alt={area.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-primary px-3 py-1 rounded-full text-xs font-bold text-white">
                    {area.pricing_type === 'jornada'
                      ? 'Por Jornada'
                      : `${formatCurrency(area.cost_per_hour)}/h`}
                  </div>
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg font-bold text-gray-900">{area.name}</CardTitle>
                  <CardDescription className="text-gray-500 text-sm line-clamp-2 mt-1">
                    {area.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    {area.pricing_type === 'jornada' ? (
                      <>
                        <Calendar className="w-3 h-3" />
                        <span>Jornada Completa</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        <span>Máx. {area.max_hours_per_reservation}h por reserva</span>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-2">
                  <Button className="w-full">
                    Seleccionar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}

      {step === 2 && selectedArea && (
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-4 p-4 border-b">
            <Button variant="ghost" size="icon" onClick={() => setStep(1)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <CardTitle className="text-xl font-bold">{selectedArea.name}</CardTitle>
              <CardDescription>Configura tu horario</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fecha de la reserva</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className=""
                  />
                </div>

                <div className="space-y-2">
                  {selectedArea.pricing_type === 'jornada' ? (
                    <>
                      <Label className="text-sm font-medium">Seleccionar Jornada</Label>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant={selectedJornada === 'diurna' ? "default" : "outline"}
                          className={cn(
                            "w-full h-14 justify-start gap-3",
                            selectedJornada === 'diurna' && "bg-amber-500 hover:bg-amber-600 border-amber-500"
                          )}
                          onClick={() => setSelectedJornada('diurna')}
                        >
                          <Sun className="w-5 h-5" />
                          <div className="text-left">
                            <div className="font-medium">Diurna</div>
                            <div className="text-xs opacity-80">8:00 AM - 6:00 PM</div>
                          </div>
                          <div className="ml-auto font-bold">
                            {formatCurrency(selectedArea.cost_jornada_diurna || 0)}
                          </div>
                        </Button>

                        <Button
                          variant={selectedJornada === 'nocturna' ? "default" : "outline"}
                          className={cn(
                            "w-full h-14 justify-start gap-3",
                            selectedJornada === 'nocturna' && "bg-indigo-500 hover:bg-indigo-600 border-indigo-500"
                          )}
                          onClick={() => setSelectedJornada('nocturna')}
                        >
                          <Moon className="w-5 h-5" />
                          <div className="text-left">
                            <div className="font-medium">Nocturna</div>
                            <div className="text-xs opacity-80">6:00 PM - 12:00 AM</div>
                          </div>
                          <div className="ml-auto font-bold">
                            {formatCurrency(selectedArea.cost_jornada_nocturna || 0)}
                          </div>
                        </Button>

                        <Button
                          variant={selectedJornada === 'ambos' ? "default" : "outline"}
                          className={cn(
                            "w-full h-14 justify-start gap-3",
                            selectedJornada === 'ambos' && "bg-green-500 hover:bg-green-600 border-green-500"
                          )}
                          onClick={() => setSelectedJornada('ambos')}
                        >
                          <Calendar className="w-5 h-5" />
                          <div className="text-left">
                            <div className="font-medium">Completo</div>
                            <div className="text-xs opacity-80">Día completo</div>
                          </div>
                          <div className="ml-auto font-bold">
                            {formatCurrency(selectedArea.cost_jornada_ambos || 0)}
                          </div>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Label className="text-sm font-medium">Duración (horas)</Label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4].filter(h => h <= selectedArea.max_hours_per_reservation).map(h => (
                          <Button
                            key={h}
                            variant={duration === h ? "default" : "outline"}
                            className="flex-1"
                            onClick={() => setDuration(h)}
                          >
                            {h}h
                          </Button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      {selectedArea.pricing_type === 'jornada' ? (
                        <Calendar className="w-5 h-5 text-primary" />
                      ) : (
                        <Clock className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Inversión total</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(calculateTotalCost())}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">Horas disponibles</Label>
                <div className="grid grid-cols-4 gap-3">
                  {timeSlots.map(time => {
                    const info = getSlotStatus(time);
                    const isOccupied = info.status !== 'available';

                    return (
                      <div key={time} className="relative group">
                        <Button
                          variant="outline"
                          disabled={isOccupied}
                          onClick={() => setSelectedStartTime(time)}
                          className={cn(
                            "w-full h-12 text-sm font-medium rounded-lg transition-colors",
                            selectedStartTime === time
                              ? "bg-primary text-white border-primary hover:bg-primary/90"
                              : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300",
                            info.status === 'reserved' && "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed",
                            info.status === 'maintenance' && "bg-red-50 text-red-400 border-red-200 cursor-not-allowed hover:bg-red-50 hover:border-red-200"
                          )}
                        >
                          {time}
                          {info.status === 'maintenance' && (
                            <Hammer className="w-3 h-3 ml-1.5" />
                          )}
                        </Button>

                        {isOccupied && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 whitespace-nowrap">
                            {info.status === 'maintenance' ? info.reason : 'Horario no disponible'}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 pt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-white border border-gray-200" />
                    <span>Disponible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-gray-50 border border-gray-100" />
                    <span>Ocupado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-50 border border-red-200" />
                    <span>Mantenimiento</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <Button
                size="lg"
                className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-white rounded-lg shadow-sm transition-colors"
                disabled={!selectedStartTime || (selectedArea.pricing_type === 'jornada' && !selectedJornada)}
                onClick={() => setStep(3)}
              >
                Continuar reserva <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && selectedArea && (
        <Card className="border-none shadow-sm bg-white overflow-hidden max-w-2xl mx-auto">
          <CardHeader className="pb-4 text-center border-b">
            <ClipboardCheck className="w-8 h-8 text-primary mx-auto mb-2" />
            <CardTitle className="text-xl font-bold">Confirmación Final</CardTitle>
            <CardDescription>Revisa los detalles antes del pago</CardDescription>
          </CardHeader>
          <CardContent className="py-4 space-y-4">
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-500">Espacio</span>
                <span className="font-medium">{selectedArea.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-500">Fecha</span>
                <span className="font-medium">{selectedDate}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-500">
                  {selectedArea.pricing_type === 'jornada' ? 'Jornada' : 'Horario'}
                </span>
                <span className="font-medium">
                  {selectedArea.pricing_type === 'jornada'
                    ? selectedJornada === 'diurna' ? 'Diurna (8am - 6pm)'
                      : selectedJornada === 'nocturna' ? 'Nocturna (6pm - 12am)'
                        : selectedJornada === 'ambos' ? 'Completo (Día completo)'
                          : ''
                    : `${selectedStartTime} - ${format(addHours(new Date(`${selectedDate}T${selectedStartTime}:00`), duration), 'HH:mm')}`
                  }
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-gray-500">Hora de entrada</span>
                <span className="font-medium">{selectedStartTime}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-medium">Total a pagar</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(calculateTotalCost())}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm text-gray-600">
                Al confirmar, se generará una solicitud pendiente de validación. Tienes 15 minutos para completar la transacción.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full" onClick={handleReserve} disabled={loading}>
              {loading ? "Procesando..." : "Confirmar y proceder al pago"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep(2)}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Modificar datos
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
