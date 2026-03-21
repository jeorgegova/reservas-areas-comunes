import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  Loader2,
  XCircle,
  ShieldPlus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  Users,
  PieChart,
  BarChart3,
  Map as MapIcon,
  Download
} from 'lucide-react';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import { differenceInDays, parseISO, isPast } from 'date-fns';
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
  Legend
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SuperAdminOrganizations() {
  const { profile, setImpersonatedOrgId } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    trial: 0,
    pastDue: 0,
    totalRevenue: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState<'list' | 'reports'>('list');
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contact_email: '',
    phone: '',
    address: '',
    logo_url: '',
    login_photo_url: '',
    subscription_status: 'active',
    subscription_end_date: ''
  });
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch organizations
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;
      if (orgs) setOrganizations(orgs);

      // Fetch stats summary (simulated or real if tables exist)
      const active = orgs?.filter(o => o.subscription_status === 'active').length || 0;
      const trial = orgs?.filter(o => o.subscription_status === 'trial').length || 0;
      const pastDue = orgs?.filter(o => o.subscription_status === 'past_due').length || 0;

      // Intentar obtener conteo de usuarios total
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setStats({
        total: orgs?.length || 0,
        active,
        trial,
        pastDue,
        totalRevenue: active * 50000, // Simulación: 50k por org activa
        totalUsers: usersCount || 0
      });
    } catch (error) {
      console.error('Error fetching super-admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (org: any = null) => {
    if (org) {
      setEditingOrg(org);
      setFormData({
        name: org.name || '',
        slug: org.slug || '',
        contact_email: org.contact_email || '',
        phone: org.phone || '',
        address: org.address || '',
        logo_url: org.logo_url || '',
        login_photo_url: org.login_photo_url || '',
        subscription_status: org.subscription_status || 'active',
        subscription_end_date: org.subscription_end_date ? org.subscription_end_date.split('T')[0] : ''
      });
    } else {
      setEditingOrg(null);
      setFormData({
        name: '',
        slug: '',
        contact_email: '',
        phone: '',
        address: '',
        logo_url: '',
        login_photo_url: '',
        subscription_status: 'active',
        subscription_end_date: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToSave = {
      ...formData,
      subscription_end_date: formData.subscription_end_date || null
    };

    if (editingOrg) {
      const { error } = await supabase
        .from('organizations')
        .update(dataToSave)
        .eq('id', editingOrg.id);
      if (!error) {
        setIsModalOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('organizations')
        .insert([dataToSave]);
      if (!error) {
        setIsModalOpen(false);
        fetchData();
      }
    }
    setLoading(false);
  };

  const deleteOrg = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta organización? Esto afectará a todos sus usuarios y datos.')) {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);
      if (!error) fetchData();
    }
  };

  const handleSupport = (orgId: string) => {
    setImpersonatedOrgId(orgId);
    navigate('/admin');
  };

  const handleOpenLogin = (org: any) => {
    window.open(`/${org.slug}/login`, '_blank');
    setOpenDropdownId(null);
  };

  const handleCopyLink = async (org: any) => {
    const url = `${window.location.origin}/${org.slug}/login`;
    await navigator.clipboard.writeText(url);
    setOpenDropdownId(null);
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Si el click no es en un botón de dropdown o dentro de un dropdown abierto, cerrar todo
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-trigger') && !target.closest('.dropdown-menu')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || org.subscription_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Report Data
  const subscriptionData = [
    { name: 'Activas', value: stats.active },
    { name: 'Prueba', value: stats.trial },
    { name: 'Mora', value: stats.pastDue },
    { name: 'Inactivas', value: stats.total - (stats.active + stats.trial + stats.pastDue) }
  ].filter(d => d.value > 0);

  if (profile?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <XCircle className="w-12 h-12 mb-4 text-red-400" />
        <p className="text-lg font-medium">Acceso no autorizado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <ShieldPlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Panel de Control Global</h1>
            <p className="text-gray-500 text-sm">Visión general y gestión de toda la plataforma.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
            <Button 
              variant={view === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setView('list')}
              className={cn("rounded-lg h-8 text-xs font-bold", view === 'list' && "bg-white shadow-sm")}
            >
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              Organizaciones
            </Button>
            <Button 
              variant={view === 'reports' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setView('reports')}
              className={cn("rounded-lg h-8 text-xs font-bold", view === 'reports' && "bg-white shadow-sm")}
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Informes
            </Button>
          </div>
          <Button
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 h-9 rounded-xl text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Nueva Org
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Orgs</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Activas</p>
              <p className="text-xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Usuarios Totales</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ingresos Est.</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </Card>
      </div>

      {view === 'list' ? (
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-4 bg-gray-50/50 border-b border-gray-100">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, slug o dirección..."
                  className="pl-10 h-10 rounded-xl text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-600 bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activas</option>
                  <option value="trial">En prueba</option>
                  <option value="past_due">En mora</option>
                  <option value="inactive">Inactivas</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/30 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Organización</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ubicación / Contacto</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Suscripción</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={4} className="px-6 py-6">
                          <div className="h-4 bg-gray-100 rounded-full w-full" />
                        </td>
                      </tr>
                    ))
                  ) : filteredOrgs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                        No se encontraron organizaciones con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredOrgs.map((org) => {
                      const daysUntilRenewal = org.subscription_end_date 
                        ? differenceInDays(parseISO(org.subscription_end_date), new Date()) 
                        : null;
                      const isExpired = org.subscription_end_date ? isPast(parseISO(org.subscription_end_date)) : false;
                      const isWarning = daysUntilRenewal !== null && daysUntilRenewal <= 7 && daysUntilRenewal > 0;

                      return (
                      <tr key={org.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {org.logo_url ? (
                              <img src={org.logo_url} className="w-10 h-10 rounded-xl object-contain bg-white border border-gray-100 p-1.5 shadow-sm" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-50">
                                <Building2 className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-gray-900">{org.name}</div>
                              <div className="text-[10px] text-indigo-600 font-mono tracking-tighter">/{org.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center text-gray-700 font-medium">
                              <MapPin className="w-3 h-3 mr-1.5 text-gray-400" />
                              {org.address || 'Sin dirección'}
                            </div>
                            <div className="text-[10px] text-gray-400 flex items-center">
                              <span className="font-bold text-gray-500 mr-2">{org.contact_email}</span>
                              {org.phone && <span>• {org.phone}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <div className={cn(
                              "inline-flex items-center w-fit rounded-full px-2 py-0.5 text-[10px] font-bold border uppercase",
                              org.subscription_status === 'active'
                                ? "bg-green-50 text-green-700 border-green-100"
                                : org.subscription_status === 'past_due'
                                ? "bg-red-50 text-red-700 border-red-100"
                                : "bg-gray-50 text-gray-500 border-gray-100"
                            )}>
                              {org.subscription_status === 'active' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {org.subscription_status === 'past_due' && <AlertCircle className="w-3 h-3 mr-1" />}
                              {org.subscription_status}
                            </div>
                            
                            {org.subscription_end_date ? (
                              <div className={cn(
                                "flex items-center text-[10px] font-medium",
                                isExpired ? "text-red-600" : isWarning ? "text-amber-600" : "text-gray-500"
                              )}>
                                {isExpired ? (
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                ) : isWarning ? (
                                  <Clock className="w-3 h-3 mr-1" />
                                ) : (
                                  <Calendar className="w-3 h-3 mr-1" />
                                )}
                                {formatDate(org.subscription_end_date)}
                                {isWarning && !isExpired && ` (En ${daysUntilRenewal}d)`}
                                {isExpired && " (Vencido)"}
                              </div>
                            ) : (
                              <div className="text-[10px] text-gray-400 italic">No asignada</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5 overflow-visible">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              onClick={() => handleSupport(org.id)}
                              title="Entrar en modo soporte"
                            >
                              <ShieldPlus className="w-4 h-4" />
                            </Button>
                            
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 relative dropdown-trigger rounded-lg",
                                  openDropdownId === org.id && "bg-gray-100 text-indigo-600"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(openDropdownId === org.id ? null : org.id);
                                }}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              {openDropdownId === org.id && (
                                <div 
                                  className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1.5 min-w-[160px] dropdown-menu animate-in fade-in zoom-in-95 duration-200"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => handleOpenLogin(org)}
                                    className="w-full px-4 py-2 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                                    Abrir Login
                                  </button>
                                  <button
                                    onClick={() => handleCopyLink(org)}
                                    className="w-full px-4 py-2 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                                  >
                                    <Download className="w-3.5 h-3.5 text-gray-400 rotate-[-90deg]" />
                                    Copiar Link
                                  </button>
                                </div>
                              )}
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg"
                              onClick={() => handleOpenModal(org)}
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                              onClick={() => deleteOrg(org.id)}
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Reports View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none shadow-sm bg-white p-6">
            <CardHeader className="p-0 pb-6">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-500" />
                Distribución de Suscripciones
              </CardTitle>
            </CardHeader>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {subscriptionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="border-none shadow-sm bg-white p-6">
            <CardHeader className="p-0 pb-6">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-indigo-500" />
                Ubicaciones por Organización
              </CardTitle>
            </CardHeader>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {organizations.filter(o => o.address).map((org, i) => (
                <div key={org.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[10px] font-bold text-indigo-600 shadow-sm border border-gray-100">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{org.name}</div>
                      <div className="text-[10px] text-gray-500 flex items-center">
                        <MapPin className="w-2.5 h-2.5 mr-1" />
                        {org.address}
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border",
                    org.subscription_status === 'active' ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
                  )}>
                    {org.subscription_status}
                  </div>
                </div>
              ))}
              {organizations.filter(o => o.address).length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No hay direcciones registradas para las organizaciones.
                </div>
              )}
            </div>
          </Card>

          <Card className="border-none shadow-sm bg-white p-6 md:col-span-2">
            <CardHeader className="p-0 pb-6 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Crecimiento de Plataforma (Mes Actual)
              </CardTitle>
              <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                Proyección: +15% vs Mes Anterior
              </div>
            </CardHeader>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Total Orgs', value: stats.total },
                  { name: 'Activas', value: stats.active },
                  { name: 'En Mora', value: stats.pastDue },
                  { name: 'En Prueba', value: stats.trial }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#64748b'}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    { [0,1,2,3].map((index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editingOrg ? 'Editar Organización' : 'Nueva Organización'}</h2>
                <p className="text-gray-500 text-xs">Completa los datos para configurar el conjunto residencial.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <XCircle className="w-5 h-5 text-gray-400" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Nombre del Conjunto</Label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Residencial Los Olivos"
                    required
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">URL / Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="los-olivos"
                    required
                    className="h-11 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Dirección Física</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Calle 123 # 45 - 67, Ciudad"
                    className="h-11 rounded-xl pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Email de Contacto</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="admin@olivos.com"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Estado Suscripción</Label>
                  <select
                    value={formData.subscription_status}
                    onChange={e => setFormData({ ...formData, subscription_status: e.target.value })}
                    className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  >
                    <option value="active">Activa</option>
                    <option value="inactive">Inactiva</option>
                    <option value="trial">Prueba</option>
                    <option value="past_due">Mora (Pendiente Pago)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Fecha de Renovación</Label>
                  <Input
                    type="date"
                    value={formData.subscription_end_date}
                    onChange={e => setFormData({ ...formData, subscription_end_date: e.target.value })}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Teléfono</Label>
                  <Input
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="300..."
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">URL del Logo (Icono)</Label>
                  <Input
                    value={formData.logo_url}
                    onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://..."
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">URL Fondo de Login</Label>
                  <Input
                    value={formData.login_photo_url}
                    onChange={e => setFormData({ ...formData, login_photo_url: e.target.value })}
                    placeholder="https://..."
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl font-bold">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px] rounded-xl font-bold shadow-lg shadow-indigo-500/20"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingOrg ? 'Guardar Cambios' : 'Crear Conjunto')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
