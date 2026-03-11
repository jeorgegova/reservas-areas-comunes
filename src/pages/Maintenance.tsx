import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  Info, 
  AlertTriangle, 
  Calendar, 
  Plus, 
  Trash2, 
  X,
  MapPin
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatDate, cn } from '@/lib/utils';

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
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este aviso?')) return;
    await supabase.from('maintenance_notices').delete().eq('id', id);
    fetchNotices();
  };

  const severityStyles: any = {
    'info': 'bg-blue-50 text-blue-700 border-blue-200',
    'warning': 'bg-amber-50 text-amber-700 border-amber-200',
    'critical': 'bg-red-50 text-red-700 border-red-200',
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mantenimiento y Avisos</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin 
              ? "Informa a los residentes sobre cierres o novedades." 
              : "Mantente informado sobre las novedades y mantenimientos de las zonas comunes."}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Aviso
          </Button>
        )}
      </div>

      {isAdmin && isAdding && (
        <Card className="border-none shadow-xl bg-white animate-in slide-in-from-top duration-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Nuevo Comunicado</CardTitle>
              <CardDescription>Publica una noticia para todos los residentes.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)}>
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <Label>Título</Label>
                  <Input 
                    value={newNotice.title} 
                    onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Área Afectada</Label>
                  <select 
                    className="h-11 w-full rounded-md border border-input px-3 bg-background"
                    value={newNotice.common_area_id}
                    onChange={e => setNewNotice({...newNotice, common_area_id: e.target.value})}
                    required
                  >
                    <option value="">Selecciona un área...</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Severidad</Label>
                  <select 
                    className="h-11 w-full rounded-md border border-input px-3 bg-background"
                    value={newNotice.severity}
                    onChange={e => setNewNotice({...newNotice, severity: e.target.value as any})}
                  >
                    <option value="info">Informativo</option>
                    <option value="warning">Advertencia</option>
                    <option value="critical">Crítico / Cierre</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contenido</Label>
                <textarea 
                   className="w-full min-h-[100px] rounded-md border border-input p-3 outline-none focus:ring-2 focus:ring-primary/20"
                   value={newNotice.content}
                   onChange={e => setNewNotice({...newNotice, content: e.target.value})}
                   required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Inicio</Label>
                  <Input 
                    type="datetime-local"
                    value={newNotice.starts_at} 
                    onChange={e => setNewNotice({...newNotice, starts_at: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                   <Label>Fecha Fin</Label>
                   <Input 
                    type="datetime-local"
                    value={newNotice.ends_at} 
                    onChange={e => setNewNotice({...newNotice, ends_at: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t gap-3">
                 <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
                 <Button type="submit">Publicar Aviso</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />)
        ) : notices.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed text-muted-foreground">
             <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p>No hay avisos publicados actualmente.</p>
          </div>
        ) : (
          notices.map(notice => {
            const style = severityStyles[notice.severity] || severityStyles.info;
            return (
              <Card key={notice.id} className={cn(
                "border-l-4 shadow-sm group hover:shadow-md transition-all overflow-hidden bg-white",
                style.split(' ')[2]
              )}>
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className={cn(
                      "p-6 flex items-start justify-between gap-4",
                      style.split(' ')[0]
                    )}>
                      <div className="p-3 bg-white/80 rounded-xl shadow-sm">
                        {notice.severity === 'critical' ? <AlertTriangle className="w-6 h-6 text-red-600" /> : 
                         notice.severity === 'warning' ? <AlertTriangle className="w-6 h-6 text-amber-600" /> : 
                         <Info className="w-6 h-6 text-blue-600" />}
                      </div>
                      {isAdmin && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="md:hidden text-destructive"
                          onClick={() => handleDelete(notice.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                    <div className="p-6 space-y-2 flex-1 relative">
                       {isAdmin && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="hidden md:flex absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          onClick={() => handleDelete(notice.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      )}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <h3 className="font-bold text-xl pr-10">{notice.title}</h3>
                          {notice.common_areas && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-primary/70 uppercase tracking-wider">
                              <MapPin className="w-3.5 h-3.5" />
                              {notice.common_areas.name}
                            </div>
                          )}
                        </div>
                        <span className={cn(
                          "text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full w-fit h-fit",
                          style
                        )}>
                          {notice.severity === 'critical' ? 'Crítico' : 
                           notice.severity === 'warning' ? 'Importante' : 'Informativo'}
                        </span>
                      </div>
                      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{notice.content}</p>
                      
                      {notice.starts_at && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 pt-3 mt-4 border-t border-gray-100">
                           <Calendar className="w-4 h-4" />
                           <span>
                             Desde {formatDate(notice.starts_at)} 
                             {notice.ends_at && ` hasta ${formatDate(notice.ends_at)}`}
                           </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
