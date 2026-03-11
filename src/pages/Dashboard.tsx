import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, detoxTime } from '@/lib/utils';
import { Filter, Info, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ResidentDashboard() {
  const [areas, setAreas] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('all');
  const [, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: areasData } = await supabase
        .from('common_areas')
        .select('*')
        .eq('is_active', true);
      
      const { data: resData } = await supabase
        .from('reservations')
        .select(`
          *,
          common_areas (name)
        `)
        .in('status', ['approved', 'pending_validation', 'pending_payment']);

      const { data: noticeData } = await supabase
        .from('maintenance_notices')
        .select(`
          *,
          common_areas (name)
        `)
        .eq('is_active', true);

      setAreas(areasData || []);
      setReservations(resData || []);
      setNotices(noticeData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const reservationEvents = reservations
    .filter(res => selectedAreaId === 'all' || res.common_area_id === selectedAreaId)
    .map(res => ({
      id: res.id,
      title: `${res.common_areas.name}`,
      start: detoxTime(res.start_datetime),
      end: detoxTime(res.end_datetime),
      backgroundColor: getStatusColor(res.status),
      borderColor: getStatusColor(res.status),
      extendedProps: {
        type: 'reservation',
        status: res.status,
        area: res.common_areas.name
      }
    }));

  const maintenanceEvents = notices
    .filter(notice => selectedAreaId === 'all' || notice.common_area_id === selectedAreaId || notice.common_area_id === null)
    .map(notice => ({
      id: notice.id,
      title: `[MANTENIMIENTO] ${notice.common_areas?.name || 'General'}: ${notice.title}`,
      start: detoxTime(notice.starts_at),
      end: detoxTime(notice.ends_at),
      backgroundColor: '#374151', // gray-700
      borderColor: getSeverityColor(notice.severity),
      textColor: '#ffffff',
      className: 'maintenance-event',
      extendedProps: {
        type: 'maintenance',
        severity: notice.severity,
        area: notice.common_areas?.name || 'General'
      }
    }));

  const allEvents = [...reservationEvents, ...maintenanceEvents];

  function getStatusColor(status: string) {
    switch (status) {
      case 'approved': return '#10b981'; // green-500
      case 'pending_validation': return '#f59e0b'; // amber-500
      case 'pending_payment': return '#ef4444'; // red-500
      default: return '#6b7280'; // gray-500
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'critical': return '#dc2626'; // red-600
      case 'warning': return '#d97706'; // amber-600
      default: return '#2563eb'; // blue-600
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard de Reservas</h1>
          <p className="text-muted-foreground mt-1">Consulta la disponibilidad y gestiona tus reservas de áreas comunes.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border shadow-sm">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select 
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="text-sm font-medium bg-transparent border-none focus:ring-0 outline-none"
            >
              <option value="all">Todas las áreas</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>
          <Button asChild>
            <Link to="/reservations/new">Nueva Reserva</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-md overflow-hidden">
            <div className="h-2 bg-primary" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Información útil
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>Puedes reservar áreas comunes hasta con 30 días de anticipación.</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                  <span>Aprobada</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium">
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                  <span>Pendiente Validación</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                  <span>Pendiente Pago</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium">
                  <div className="w-3 h-3 rounded-full bg-[#374151] border-2 border-red-600" />
                  <span className="flex items-center gap-1">
                    Mantenimiento <AlertTriangle className="w-3 h-3 text-red-600" />
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-primary/5 to-primary/10">
             <CardHeader className="pb-2">
              <CardTitle className="text-lg">Tarifas actuales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {areas.map(area => (
                  <div key={area.id} className="flex justify-between items-center text-sm border-b border-primary/10 pb-2 last:border-0">
                    <span className="font-medium">{area.name}</span>
                    <span className="text-primary font-bold">{formatCurrency(area.cost_per_hour)}/h</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-3 border-none shadow-md p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={allEvents}
            height="auto"
            locale="es"
            timeZone="local"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            slotMinTime="08:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            eventDidMount={(info) => {
              if (info.event.extendedProps && info.event.extendedProps.type === 'maintenance') {
                info.el.style.opacity = '0.9';
                info.el.title = `Mantenimiento: ${info.event.title}`;
              }
            }}
          />
        </Card>
      </div>
    </div>
  );
}
