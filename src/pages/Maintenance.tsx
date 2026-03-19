import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Info,
  AlertTriangle,
  Calendar,
  Plus,
  Trash2,
  MapPin,
  Clock,
  X,
  Wrench
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Notice {
  id: string;
  title: string;
  content: string;
  severity: 'info' | 'warning' | 'critical';
  starts_at: string;
  ends_at: string;
  common_area_id: string | null;
  common_areas?: {
    name: string;
  };
  created_at: string;
}

export default function MaintenancePage() {
  const { profile } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    severity: 'info',
    starts_at: '',
    ends_at: '',
    common_area_id: ''
  });

  useEffect(() => {
    fetchNotices();
    fetchAreas();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance_notices')
        .select(`
          *,
          common_areas (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error) {
      console.error('Error fetching maintenance notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    const { data } = await supabase
      .from('common_areas')
      .select('id, name')
      .eq('is_active', true);
    setAreas(data || []);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await supabase.from('maintenance_notices').insert(newNotice);
    if (!error) {
      setIsAdding(false);
      fetchNotices();
      setNewNotice({
        title: '',
        content: '',
        severity: 'info',
        starts_at: '',
        ends_at: '',
        common_area_id: ''
      });
    } else {
      console.error('Error creating notice:', error);
    }
    setIsSubmitting(false);
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-100',
          icon: 'bg-red-100 text-red-600',
          badge: 'bg-red-100 text-red-700',
          text: 'text-red-800'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-100',
          icon: 'bg-amber-100 text-amber-600',
          badge: 'bg-amber-100 text-amber-700',
          text: 'text-amber-800'
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-100',
          icon: 'bg-blue-100 text-blue-600',
          badge: 'bg-blue-100 text-blue-700',
          text: 'text-blue-800'
        };
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'Crítico';
      case 'warning':
        return 'Advertencia';
      default:
        return 'Informativo';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este aviso?')) return;
    await supabase.from('maintenance_notices').delete().eq('id', id);
    fetchNotices();
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary rounded-xl shadow-lg shadow-primary/20">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mantenimiento y Avisos</h1>
          </div>
          <p className="text-gray-500 text-sm ml-1">
            {isAdmin
              ? "Informa a los residentes sobre cierres o novedades."
              : "Mantente informado sobre las novedades y mantenimientos de las zonas comunes."}
          </p>
        </div>
        {isAdmin && (
          <Button 
            onClick={() => setIsAdding(true)} 
            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 px-5 rounded-xl shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="mr-2 h-4 w-4" /> Nuevo Aviso
          </Button>
        )}
      </div>

      {/* Form Section */}
      {isAdmin && isAdding && (
        <Card className="border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Nuevo Comunicado</h2>
                <p className="mt-0.5 text-sm text-gray-500">Publica una noticia para todos los residentes</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsAdding(false)} 
                className="h-8 w-8 rounded-full hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Título del aviso
                  </Label>
                  <Input
                    id="title"
                    value={newNotice.title}
                    onChange={e => setNewNotice({ ...newNotice, title: e.target.value })}
                    required
                    placeholder="Ej: Mantenimiento Piscina"
                    className="h-11 bg-gray-50 border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area" className="text-sm font-medium text-gray-700">
                    Área Afectada
                  </Label>
                  <select
                    id="area"
                    className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    value={newNotice.common_area_id}
                    onChange={e => setNewNotice({ ...newNotice, common_area_id: e.target.value })}
                    required
                  >
                    <option value="">Selecciona un área...</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity" className="text-sm font-medium text-gray-700">
                  Nivel de severidad
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {['info', 'warning', 'critical'].map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setNewNotice({ ...newNotice, severity: sev })}
                      className={`
                        h-11 px-4 rounded-lg border-2 font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2
                        ${newNotice.severity === sev 
                          ? getSeverityStyles(sev).border + ' ' + getSeverityStyles(sev).bg
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      {sev === 'critical' && <AlertTriangle className="h-4 w-4" />}
                      {sev === 'warning' && <AlertTriangle className="h-4 w-4" />}
                      {sev === 'info' && <Info className="h-4 w-4" />}
                      {getSeverityLabel(sev)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-sm font-medium text-gray-700">
                  Descripción del aviso
                </Label>
                <textarea
                  id="content"
                  className="w-full min-h-[120px] p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 resize-none"
                  value={newNotice.content}
                  onChange={e => setNewNotice({ ...newNotice, content: e.target.value })}
                  required
                  placeholder="Describe los detalles del aviso aquí..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="startsAt" className="text-sm font-medium text-gray-700">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Fecha de inicio
                  </Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={newNotice.starts_at}
                    onChange={e => setNewNotice({ ...newNotice, starts_at: e.target.value })}
                    required
                    className="h-11 bg-gray-50 border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endsAt" className="text-sm font-medium text-gray-700">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Fecha de fin
                  </Label>
                  <Input
                    id="endsAt"
                    type="datetime-local"
                    value={newNotice.ends_at}
                    onChange={e => setNewNotice({ ...newNotice, ends_at: e.target.value })}
                    required
                    className="h-11 bg-gray-50 border-gray-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAdding(false)} 
                  className="h-11 px-5 font-medium rounded-xl border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="h-11 px-6 font-semibold rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 text-primary-foreground transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Publicar Aviso
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Notices Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 px-1">
          {notices.length > 0 ? `(${notices.length}) Avisos Recientes` : 'Avisos Recientes'}
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-blue-200 border-t-blue-600" />
              <p className="text-sm text-gray-500">Cargando avisos...</p>
            </div>
          </div>
        ) : notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Info className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No hay avisos publicados</h3>
            <p className="text-sm text-gray-500 text-center max-w-sm">
              {isAdmin 
                ? "Crea el primer aviso para informar a los residentes sobre mantenimientos o cierres."
                : "No hay avisos de mantenimiento activos en este momento."}
            </p>
            {isAdmin && (
              <Button 
                onClick={() => setIsAdding(true)} 
                className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-10 px-5 rounded-xl shadow-lg shadow-primary/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="mr-2 h-4 w-4" /> Crear Primer Aviso
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notices.map((notice) => {
              const styles = getSeverityStyles(notice.severity);
              return (
                <Card 
                  key={notice.id} 
                  className={`group border-none shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
                >
                  {/* Severity Indicator Bar */}
                  <div className={`h-1.5 w-full ${notice.severity === 'critical' ? 'bg-red-500' : notice.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2.5 rounded-xl ${styles.icon} transition-transform duration-200 group-hover:scale-110`}>
                          {notice.severity === 'critical' ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : notice.severity === 'warning' ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <Info className="w-4 h-4" />
                          )}
                        </div>
                        <div className="space-y-2 flex-1 min-w-0">
                          <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-2">
                            {notice.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            {notice.common_areas && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
                                <MapPin className="h-3 w-3" />
                                {notice.common_areas.name}
                              </span>
                            )}
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${styles.badge}`}>
                              {getSeverityLabel(notice.severity)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isAdmin && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(notice.id)}
                          className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 text-red-500 hover:text-red-600" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-3">
                      {notice.content}
                    </p>
                    {notice.starts_at && (
                      <div className={`flex items-center gap-2 text-xs ${styles.text} bg-gray-50 rounded-lg px-3 py-2`}>
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="font-medium">
                          {formatDate(notice.starts_at)}
                          {notice.ends_at && <span className="mx-1.5">→</span>}
                          {notice.ends_at && formatDate(notice.ends_at)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
