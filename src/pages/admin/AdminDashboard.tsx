import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart,
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  ClipboardCheck,
  TrendingUp
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalReservations: 0,
    pendingValidation: 0,
    monthlyIncome: 0,
    activeUsers: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 1. Total Reservations this month
      const start = startOfMonth(new Date()).toISOString();
      const end = endOfMonth(new Date()).toISOString();

      const { count: totalCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start)
        .lte('created_at', end);

      // 2. Pending validation count
      const { count: pendingCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_validation');

      // 3. Monthly Income (Approved only)
      const { data: incomeData } = await supabase
        .from('reservations')
        .select('total_cost')
        .eq('status', 'approved')
        .gte('start_datetime', start)
        .lte('start_datetime', end);
      
      const totalIncome = incomeData?.reduce((sum, res) => sum + Number(res.total_cost), 0) || 0;

      // 4. Active Users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalReservations: totalCount || 0,
        pendingValidation: pendingCount || 0,
        monthlyIncome: totalIncome,
        activeUsers: userCount || 0
      });

      // 5. Chart Data (Reservations per Area)
      const { data: areaStats } = await supabase
        .from('reservations')
        .select(`
          common_areas (name)
        `);
      
      const areaCounts: Record<string, number> = {};
      areaStats?.forEach((res: any) => {
        const name = res.common_areas.name;
        areaCounts[name] = (areaCounts[name] || 0) + 1;
      });

      const formattedChartData = Object.entries(areaCounts).map(([name, count]) => ({
        name,
        reservas: count
      }));

      setChartData(formattedChartData);

    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Reservas del Mes', value: stats.totalReservations, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Pendientes de Validación', value: stats.pendingValidation, icon: ClipboardCheck, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Ingresos del Mes', value: formatCurrency(stats.monthlyIncome), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Usuarios Registrados', value: stats.activeUsers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
          <p className="text-muted-foreground mt-1">Resumen general y estadísticas del conjunto.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border shadow-sm text-sm font-medium">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>Actualizado ahora</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">Cargando estadísticas...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card, i) => (
              <Card key={i} className="border-none shadow-md overflow-hidden group hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                      <h3 className="text-2xl font-bold mt-1 tracking-tight">{card.value}</h3>
                    </div>
                    <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", card.bg, card.color)}>
                      <card.icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle>Reservas por Área Común</CardTitle>
                <CardDescription>Distribución histórica de usos registrados.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip 
                        cursor={{fill: 'rgba(0,0,0,0.05)'}}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                      />
                      <Bar dataKey="reservas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
               <CardHeader>
                <CardTitle>Ingresos Estimados</CardTitle>
                <CardDescription>Tendencia de ingresos por mes (Concepto de ejemplo).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full mt-4 flex items-center justify-center bg-gray-50/50 rounded-xl border border-dashed">
                   <div className="text-center space-y-2">
                     <LineChart width={400} height={250} data={[
                       {m: 'Ene', i: 400000},
                       {m: 'Feb', i: 600000},
                       {m: 'Mar', i: stats.monthlyIncome}
                     ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="m" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="i" stroke="hsl(var(--primary))" strokeWidth={3} />
                     </LineChart>
                     <p className="text-sm font-medium text-muted-foreground mt-4">Gráfico interactivo de tendencia financiera</p>
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
