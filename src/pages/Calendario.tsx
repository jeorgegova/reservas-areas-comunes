import { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, detoxTime, formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
    Filter,
    Calendar,
    DollarSign,
    Bell,
    Users,
    ClipboardCheck,
    BarChart3,
    PieChart,
    Activity,
    Target
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Legend,
    AreaChart,
    Area
} from 'recharts';
import { startOfMonth, endOfMonth, subMonths, format, eachMonthOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

// Colores para gráficos
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function Calendario() {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const location = useLocation();
    const isAdminPage = location.pathname === '/admin';
    // Only show analytics on /admin route, not on /dashboard
    const showAnalytics = isAdminPage;
    const isAdmin = profile?.role === 'admin';

    // Estado para filtros
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
    const [selectedAreaId, setSelectedAreaId] = useState<string>('all');

    // Estado para el dashboard residente
    const [areas, setAreas] = useState<any[]>([]);
    const [reservations, setReservations] = useState<any[]>([]);
    const [notices, setNotices] = useState<any[]>([]);
    const [calendarRange, setCalendarRange] = useState<{ start: string; end: string } | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Estado para datos del admin
    const [adminStats, setAdminStats] = useState({
        totalReservations: 0,
        totalRevenue: 0,
        activeUsers: 0,
        occupancyRate: 0,
        reservationsByStatus: [] as any[],
        reservationsByArea: [] as any[],
        monthlyReservations: [] as any[],
        recentReservations: [] as any[]
    });

    useEffect(() => {
        if (calendarRange) {
            fetchResidentData(calendarRange.start, calendarRange.end);
        } else {
            fetchResidentData();
        }

        if (showAnalytics) {
            fetchAdminData();
        }
    }, [showAnalytics, selectedMonth, selectedAreaId, calendarRange]);

    const fetchResidentData = async (startRange?: string, endRange?: string) => {
        try {
            const { data: areasData } = await supabase
                .from('common_areas')
                .select('*')
                .eq('is_active', true);

            // Fetch reservations within the visible range if provided
            let resQuery = supabase
                .from('reservations')
                .select(`
                    *,
                    common_areas (name)
                `)
                .in('status', ['approved', 'pending_validation', 'pending_payment']);

            if (startRange && endRange) {
                resQuery = resQuery
                    .gte('start_datetime', startRange)
                    .lte('start_datetime', endRange); // Checking start_datetime for the range
            }

            const { data: resData } = await resQuery;

            // Fetch notices for the visible range
            let noticeQuery = supabase
                .from('maintenance_notices')
                .select(`
                    *,
                    common_areas (name)
                `)
                .eq('is_active', true);

            if (startRange && endRange) {
                noticeQuery = noticeQuery
                    .gte('starts_at', startRange)
                    .lte('ends_at', endRange);
            }

            const { data: noticeData } = await noticeQuery;

            setAreas(areasData || []);
            setReservations(resData || []);
            setNotices(noticeData || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const fetchAdminData = async () => {
        try {
            // Obtener reservas del últimos 12 meses
            const twelveMonthsAgo = subMonths(new Date(), 12);
            const { data: allReservations, error } = await supabase
                .from('reservations')
                .select(`
                    *,
                    common_areas (name)
                `)
                .gte('created_at', twelveMonthsAgo.toISOString());

            if (error) throw error;

            // Obtener usuarios activos
            const { data: usersData } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'resident');

            // Obtener áreas
            const { data: areasData } = await supabase
                .from('common_areas')
                .select('*');

            // Procesar datos para gráficos
            const processedData = processAdminData(allReservations || [], areasData || [], usersData?.length || 0);
            setAdminStats(processedData);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        }
    };

    const processAdminData = (reservations: any[], areas: any[], userCount: number) => {
        // Filtrar por mes seleccionado si aplica
        const filteredReservations = selectedAreaId !== 'all'
            ? reservations.filter(r => r.common_area_id === selectedAreaId)
            : reservations;

        // Reservas por estado
        const statusCount: Record<string, number> = {};
        filteredReservations.forEach(res => {
            statusCount[res.status] = (statusCount[res.status] || 0) + 1;
        });
        const reservationsByStatus = Object.entries(statusCount).map(([name, value]) => ({
            name: getStatusLabel(name),
            value
        }));

        // Reservas por área
        const areaCount: Record<string, number> = {};
        filteredReservations.forEach(res => {
            const areaName = res.common_areas?.name || 'Desconocida';
            areaCount[areaName] = (areaCount[areaName] || 0) + 1;
        });
        const reservationsByArea = Object.entries(areaCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        // Reservas por mes (últimos 12 meses)
        const months = eachMonthOfInterval({
            start: subMonths(new Date(), 11),
            end: new Date()
        });

        const monthlyData = months.map(month => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const count = filteredReservations.filter(res => {
                const resDate = new Date(res.created_at);
                return resDate >= monthStart && resDate <= monthEnd;
            }).length;

            // Calcular ingresos del mes
            const monthRevenue = filteredReservations
                .filter(res => {
                    const resDate = new Date(res.created_at);
                    return resDate >= monthStart && resDate <= monthEnd && res.status === 'approved';
                })
                .reduce((sum, res) => sum + (res.total_cost || 0), 0);

            return {
                name: format(month, 'MMM', { locale: es }),
                reservas: count,
                ingresos: monthRevenue
            };
        });

        // Calcular tasa de ocupación (reservas aprobadas / total días del mes seleccionado)
        const [year, month] = selectedMonth.split('-').map(Number);
        const selectedMonthDate = new Date(year, month - 1);
        const daysInMonth = endOfMonth(selectedMonthDate).getDate();
        const approvedReservations = filteredReservations.filter(r => r.status === 'approved').length;
        const totalPossibleReservations = areas.length * daysInMonth * 2; // 2 turnos por día
        const occupancyRate = totalPossibleReservations > 0
            ? Math.round((approvedReservations / totalPossibleReservations) * 100)
            : 0;

        // Reservas recientes
        const recentReservations = filteredReservations
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);

        // Calcular ingresos totales
        const totalRevenue = filteredReservations
            .filter(r => r.status === 'approved')
            .reduce((sum, r) => sum + (r.total_cost || 0), 0);

        return {
            totalReservations: filteredReservations.length,
            totalRevenue,
            activeUsers: userCount,
            occupancyRate,
            reservationsByStatus,
            reservationsByArea,
            monthlyReservations: monthlyData,
            recentReservations
        };
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'approved': 'Aprobada',
            'pending_validation': 'Pendiente Validación',
            'pending_payment': 'Pendiente Pago',
            'rejected': 'Rechazada',
            'cancelled': 'Cancelada'
        };
        return labels[status] || status;
    };

    // Generar opciones de meses para el filtro
    const monthOptions = useMemo(() => {
        const months = eachMonthOfInterval({
            start: subMonths(new Date(), 11),
            end: new Date()
        });
        return months.map(m => ({
            value: format(m, 'yyyy-MM'),
            label: format(m, 'MMMM yyyy', { locale: es })
        })).reverse();
    }, []);

    // Helper functions for calendar events
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return '#10b981';
            case 'pending_validation': return '#f59e0b';
            case 'pending_payment': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#dc2626';
            case 'warning': return '#d97706';
            default: return '#2563eb';
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
            backgroundColor: '#374151',
            borderColor: getSeverityColor(notice.severity),
            textColor: '#ffffff',
            className: 'maintenance-event',
            extendedProps: {
                type: 'maintenance',
                severity: notice.severity,
                area: notice.common_areas?.name || 'General',
                content: notice.content || ''
            }
        }));

    const allEvents = [...reservationEvents, ...maintenanceEvents];

    // Renderizar vista de Admin
    if (showAnalytics) {
        return (
            <div className="space-y-6 animate-fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Panel de Administración
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Estadísticas y métricas del sistema de reservas.
                        </p>
                    </div>

                    {/* Filtros */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="text-sm font-medium bg-transparent border-none focus:ring-0 outline-none text-gray-700 cursor-pointer"
                            >
                                {monthOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                value={selectedAreaId}
                                onChange={(e) => setSelectedAreaId(e.target.value)}
                                className="text-sm font-medium bg-transparent border-none focus:ring-0 outline-none text-gray-700 cursor-pointer"
                            >
                                <option value="all">Todas las áreas</option>
                                {areas.map(area => (
                                    <option key={area.id} value={area.id}>{area.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <h3 className="text-sm font-medium text-indigo-100 uppercase tracking-wider">Total Reservas</h3>
                            <ClipboardCheck className="w-4 h-4 text-indigo-200" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{adminStats.totalReservations}</div>
                            <p className="text-xs text-indigo-200 mt-1">En el período seleccionado</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <h3 className="text-sm font-medium text-emerald-100 uppercase tracking-wider">Ingresos Totales</h3>
                            <DollarSign className="w-4 h-4 text-emerald-200" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{formatCurrency(adminStats.totalRevenue)}</div>
                            <p className="text-xs text-emerald-200 mt-1">Reservas aprobadas</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <h3 className="text-sm font-medium text-amber-100 uppercase tracking-wider">Tasa de Ocupación</h3>
                            <Target className="w-4 h-4 text-amber-200" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{adminStats.occupancyRate}%</div>
                            <p className="text-xs text-amber-200 mt-1">Del mes seleccionado</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-gradient-to-br from-rose-500 to-rose-600 text-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <h3 className="text-sm font-medium text-rose-100 uppercase tracking-wider">Usuarios Activos</h3>
                            <Users className="w-4 h-4 text-rose-200" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{adminStats.activeUsers}</div>
                            <p className="text-xs text-rose-200 mt-1">Residentes registrados</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Reservas por Mes */}
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="border-b border-gray-50 p-4">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-primary" />
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Reservas por Mes</h3>
                                    <p className="text-xs text-gray-500">Evolución de reservas en los últimos 12 meses</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={adminStats.monthlyReservations}>
                                        <defs>
                                            <linearGradient id="colorReservas" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                                        <YAxis stroke="#9ca3af" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="reservas"
                                            stroke="#6366f1"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorReservas)"
                                            name="Reservas"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ingresos por Mes */}
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="border-b border-gray-50 p-4">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-emerald-500" />
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Ingresos por Mes</h3>
                                    <p className="text-xs text-gray-500">Ingresos generados por reservas aprobadas</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={adminStats.monthlyReservations}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                                        <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `$${value / 1000}k`} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}
                                            formatter={(value) => [formatCurrency(Number(value) || 0), 'Ingresos']}
                                        />
                                        <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} name="Ingresos" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Áreas más ocupadas */}
                    <Card className="border-none shadow-sm bg-white lg:col-span-2">
                        <CardHeader className="border-b border-gray-50 p-4">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-amber-500" />
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Áreas Más Occupadas</h3>
                                    <p className="text-xs text-gray-500">Distribución de reservas por área común</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={adminStats.reservationsByArea} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                                        <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={100} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Reservas">
                                            {adminStats.reservationsByArea.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Estado de reservas */}
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="border-b border-gray-50 p-4">
                            <div className="flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-rose-500" />
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Estado de Reservas</h3>
                                    <p className="text-xs text-gray-500">Distribución por estado</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={adminStats.reservationsByStatus}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {adminStats.reservationsByStatus.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}
                                        />
                                        <Legend />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Reservations Table */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="border-b border-gray-50 p-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Reservas Recientes</h3>
                                <p className="text-xs text-gray-500">Últimas reservas realizadas en el sistema</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Área</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hora</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {adminStats.recentReservations.map((res: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                {res.common_areas?.name || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {res.user_id?.substring(0, 8) || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {formatDate(res.start_datetime)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {format(new Date(res.start_datetime), 'HH:mm')} - {format(new Date(res.end_datetime), 'HH:mm')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${res.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    res.status === 'pending_validation' ? 'bg-amber-100 text-amber-800' :
                                                        res.status === 'pending_payment' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {getStatusLabel(res.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                {formatCurrency(res.total_cost || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                    {adminStats.recentReservations.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                                No hay reservas en el período seleccionado
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button asChild className="h-12 rounded-xl shadow-md bg-primary hover:bg-primary/90">
                        <Link to="/admin/reservations">
                            <Calendar className="w-4 h-4 mr-2" />
                            Gestionar Reservas
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-12 rounded-xl shadow-sm">
                        <Link to="/admin/areas">
                            <Activity className="w-4 h-4 mr-2" />
                            Configurar Áreas
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-12 rounded-xl shadow-sm">
                        <Link to="/admin/users">
                            <Users className="w-4 h-4 mr-2" />
                            Administrar Usuarios
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    // Renderizar vista de residente (sin cambios)
    return (
        <div className="space-y-6 animate-fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    {isAdmin ? 'Dashboard del Conjunto' : 'Calendario'}
                </h1>
                <p className="text-gray-500 text-sm">
                    Resumen general y estado de las áreas comunes.
                </p>
            </div>



            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="border-b border-gray-50 p-4 flex flex-row items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Calendario de Actividades</h3>
                                <p className="text-xs text-gray-500">Visualización de disponibilidad por área</p>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-100">
                                <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" />
                                <select
                                    value={selectedAreaId}
                                    onChange={(e) => setSelectedAreaId(e.target.value)}
                                    className="text-[10px] sm:text-xs font-bold bg-transparent border-none focus:ring-0 outline-none text-gray-700 cursor-pointer"
                                >
                                    <option value="all">Todas</option>
                                    {areas.map(area => (
                                        <option key={area.id} value={area.id}>{area.name}</option>
                                    ))}
                                </select>
                            </div>
                        </CardHeader>
                        <CardContent className="p-1 sm:p-2">
                            <div className="calendar-container compact-calendar overflow-hidden">
                                <FullCalendar
                                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                    initialView="dayGridMonth"
                                    headerToolbar={{
                                        left: isMobile ? 'prev,next' : 'prev,next today',
                                        center: 'title',
                                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                                    }}
                                    buttonText={{
                                        today: 'Hoy',
                                        month: 'Mes',
                                        week: 'Sem',
                                        day: 'Día'
                                    }}
                                    height="auto"
                                    aspectRatio={isMobile ? 1.35 : 3}
                                    fixedWeekCount={false}
                                    dayMaxEvents={isMobile ? 3 : 2}
                                    eventContent={(eventInfo) => {
                                        const isReservation = eventInfo.event.extendedProps.type === 'reservation';
                                        const statusColor = isReservation
                                            ? getStatusColor(eventInfo.event.extendedProps.status)
                                            : getSeverityColor(eventInfo.event.extendedProps.severity);

                                        const isMonthView = eventInfo.view.type === 'dayGridMonth';

                                        // Vista mes en móvil: solo punto
                                        if (isMonthView && isMobile) {
                                            return (
                                                <div className="flex items-center justify-center h-full w-full py-0.5">
                                                    <div
                                                        style={{ backgroundColor: statusColor }}
                                                        className="w-1.5 h-1.5 rounded-full shadow-sm hover:scale-125 transition-transform"
                                                    />
                                                </div>
                                            );
                                        }

                                        // Vista mes en PC: punto + hora + título (truncado)
                                        if (isMonthView) {
                                            return (
                                                <div className="flex items-center gap-1 overflow-hidden h-full px-0.5">
                                                    <div style={{ backgroundColor: statusColor }} className="w-1.5 h-1.5 rounded-full flex-shrink-0" />
                                                    <span className="text-[9px] font-bold text-gray-900 whitespace-nowrap">{eventInfo.timeText}</span>
                                                    <span className="truncate text-[9px] font-medium text-gray-600">{eventInfo.event.title}</span>
                                                </div>
                                            );
                                        }

                                        // Vistas de semana y día: contenido completo
                                        return (
                                            <div className="flex flex-col gap-0.5 p-1 h-full border-l-2" style={{ borderLeftColor: statusColor }}>
                                                <span className="text-[10px] font-bold text-gray-900 border-b border-gray-100/50 pb-0.5">
                                                    {eventInfo.timeText}
                                                </span>
                                                <span className="text-[11px] font-medium text-gray-700 leading-tight">
                                                    {eventInfo.event.title}
                                                </span>
                                            </div>
                                        );
                                    }}
                                    dayCellContent={(arg) => {
                                        const now = new Date();
                                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                        const isPast = arg.date < today;
                                        const isBookable = !isPast;

                                        return (
                                            <div
                                                onClick={() => {
                                                    if (isMobile && isBookable) {
                                                        const dateStr = format(arg.date, 'yyyy-MM-dd');
                                                        navigate(`/reservations/new?date=${dateStr}`);
                                                    }
                                                }}
                                                className={cn(
                                                    "relative w-full h-full min-h-[35px] sm:min-h-[40px] p-0.5 flex flex-col justify-between group",
                                                    isMobile && isBookable && "cursor-pointer active:bg-gray-50"
                                                )}
                                            >
                                                <div className="flex justify-end w-full p-0.5">
                                                    <span className={cn(
                                                        "text-[10px] sm:text-xs font-bold text-gray-900 px-1",
                                                        arg.isToday && "bg-primary text-white w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full"
                                                    )}>
                                                        {arg.dayNumberText}
                                                    </span>
                                                </div>

                                                {isBookable && !isMobile && (
                                                    <div className="absolute bottom-0 right-0 p-0.5">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const dateStr = format(arg.date, 'yyyy-MM-dd');
                                                                navigate(`/reservations/new?date=${dateStr}`);
                                                            }}
                                                            className="w-4 h-4 text-gray-300 transition-all opacity-0 group-hover:opacity-100 hover:text-primary"
                                                            title="Agregar reserva"
                                                        >
                                                            <span className="text-xs font-bold">+</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }}
                                    datesSet={(dateInfo) => {
                                        setCalendarRange({
                                            start: dateInfo.startStr,
                                            end: dateInfo.endStr
                                        });
                                    }}
                                    events={allEvents}
                                    eventDidMount={(info) => {
                                        const eventId = info.event.id;

                                        // Eliminar tooltip previo si existe para este evento
                                        const existingTooltip = document.getElementById(`tooltip-${eventId}`);
                                        if (existingTooltip) {
                                            existingTooltip.remove();
                                        }

                                        // Crear tooltip con información del evento
                                        const tooltip = document.createElement('div');
                                        tooltip.id = `tooltip-${eventId}`;
                                        tooltip.className = 'calendar-tooltip';

                                        const props = info.event.extendedProps;
                                        const start = info.event.start;
                                        const end = info.event.end;
                                        const eventTitle = info.event.title;

                                        if (props.type === 'reservation') {
                                            tooltip.innerHTML = `
                                                <div style="padding: 12px; min-width: 200px;">
                                                    <div style="font-weight: 700; font-size: 14px; color: #111827; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                                                        <span style="background: ${getStatusColor(props.status)}; width: 8px; height: 8px; border-radius: 50%;"></span>
                                                        Reserva
                                                    </div>
                                                    <div style="font-size: 13px; color: #374151; margin-bottom: 6px;">
                                                        <strong style="color: #6b7280; font-size: 11px; text-transform: uppercase;">Área</strong><br/> ${eventTitle}
                                                    </div>
                                                    <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">
                                                        <strong style="color: #6b7280; font-size: 11px; text-transform: uppercase;">Estado</strong><br/> ${getStatusLabel(props.status)}
                                                    </div>
                                                    <div style="font-size: 12px; color: #4b5563;">
                                                        <strong style="color: #6b7280; font-size: 11px; text-transform: uppercase;">Horario</strong><br/> ${start ? format(start, 'HH:mm') : ''} - ${end ? format(end, 'HH:mm') : ''}
                                                    </div>
                                                </div>
                                            `;
                                        } else {
                                            const observation = props.content ? `<div style="font-size: 12px; color: #4b5563; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e5e7eb;"><strong>Observación:</strong> ${props.content}</div>` : '';
                                            tooltip.innerHTML = `
                                                <div style="padding: 12px; min-width: 220px;">
                                                    <div style="font-weight: 700; font-size: 14px; color: #111827; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                                                        <span style="background: ${getSeverityColor(props.severity)}; width: 8px; height: 8px; border-radius: 50%;"></span>
                                                        Mantenimiento
                                                    </div>
                                                    <div style="font-size: 12px; color: #374151; margin-bottom: 4px;">
                                                         <strong style="color: #6b7280; font-size: 11px; text-transform: uppercase;">Área</strong><br/> ${props.area}
                                                    </div>
                                                    <div style="font-size: 11px; color: #6b7280;">
                                                         <strong style="color: #6b7280; font-size: 11px; text-transform: uppercase;">Severidad</strong><br/> ${props.severity === 'critical' ? 'Crítica' : props.severity === 'warning' ? 'Advertencia' : 'Normal'}
                                                    </div>
                                                    <div style="font-size: 11px; color: #6b7280;">
                                                         <strong style="color: #6b7280; font-size: 11px; text-transform: uppercase;">Horario</strong><br/> ${start ? format(start, 'HH:mm') : ''} - ${end ? format(end, 'HH:mm') : ''}
                                                    </div>
                                                    ${observation}
                                                </div>
                                            `;
                                        }

                                        tooltip.style.cssText = `
                                            position: fixed;
                                            z-index: 9999;
                                            background: white;
                                            border: 1px solid #e5e7eb;
                                            border-radius: 12px;
                                            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                                            display: none;
                                            pointer-events: none;
                                            border-left: 4px solid ${props.type === 'reservation' ? getStatusColor(props.status) : getSeverityColor(props.severity)};
                                        `;

                                        document.body.appendChild(tooltip);

                                        const updateTooltipPosition = (e: MouseEvent) => {
                                            const padding = 10;

                                            // Get viewport dimensions
                                            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
                                            const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

                                            // Get tooltip dimensions
                                            const rect = tooltip.getBoundingClientRect();
                                            const tw = rect.width || 240;
                                            const th = rect.height || 180;

                                            let left = e.clientX + padding;
                                            let top = e.clientY + padding;

                                            // Check right overflow
                                            if (left + tw > vw - padding) {
                                                left = e.clientX - tw - padding;
                                            }

                                            // Check left overflow (if it's still overflowing left after moving)
                                            if (left < padding) left = padding;

                                            // Check bottom overflow
                                            if (top + th > vh - padding) {
                                                top = e.clientY - th - padding;
                                            }

                                            // Check top overflow
                                            if (top < padding) top = padding;

                                            tooltip.style.left = `${left}px`;
                                            tooltip.style.top = `${top}px`;
                                        };

                                        // Funciones de handler con referencias estables
                                        const handleMouseEnter = (e: MouseEvent) => {
                                            tooltip.style.display = 'block';
                                            updateTooltipPosition(e);
                                        };

                                        const handleMouseMove = (e: MouseEvent) => {
                                            updateTooltipPosition(e);
                                        };

                                        const handleMouseLeave = () => {
                                            tooltip.style.display = 'none';
                                        };

                                        // Agregar los event listeners
                                        info.el.addEventListener('mouseenter', handleMouseEnter);
                                        info.el.addEventListener('mousemove', handleMouseMove);
                                        info.el.addEventListener('mouseleave', handleMouseLeave);
                                    }}
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
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="border-b border-gray-50 p-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Bell className="w-4 h-4 text-primary" /> Avisos
                            </h3>
                        </CardHeader>
                        <CardContent className="p-4">
                            {notices && notices.length > 0 ? (
                                <div className="space-y-3">
                                    {notices.slice(0, 3).map((notice: any) => (
                                        <div key={notice.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                            <p className="text-xs font-medium text-gray-900">
                                                {notice.common_areas?.name || 'General'}
                                            </p>
                                            <p className="text-[11px] leading-relaxed text-gray-600 mt-1">
                                                {notice.title}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {format(new Date(notice.starts_at), 'dd/MM/yyyy HH:mm')} - {format(new Date(notice.ends_at), 'dd/MM/yyyy HH:mm')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <p className="text-[11px] leading-relaxed text-gray-500">
                                        No hay avisos de mantenimiento actualmente.
                                    </p>
                                </div>
                            )}
                            <Button asChild variant="link" className="p-0 h-auto mt-3 text-xs font-bold text-primary">
                                <Link to="/maintenance">Ver todos los avisos →</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl shadow-md">
                        <Link to="/reservations/new">Nueva Reserva</Link>
                    </Button>
                </div>
            </div>

        </div>
    );
}
