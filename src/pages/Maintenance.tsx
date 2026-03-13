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
  MapPin
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

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mantenimiento y Avisos</h1>
          <p className="text-gray-500 text-sm">
            {isAdmin
              ? "Informa a los residentes sobre cierres o novedades."
              : "Mantente informado sobre las novedades y mantenimientos de las zonas comunes."}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsAdding(true)} className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl shadow-md">
            <Plus className="mr-3 h-4 w-4" /> Nuevo Aviso
          </Button>
        )}
      </div>

      {isAdmin && isAdding && (
        <Card className="border-none shadow-sm">
          <CardHeader className="p-6">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Nuevo Comunicado</h2>
            <p className="mt-2 text-sm text-gray-600">Publica una noticia para todos los residentes</p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="title" className="mb-2 text-sm font-medium text-gray-700 block">
                  Título
                </Label>
                <Input
                  id="title"
                  value={newNotice.title}
                  onChange={e => setNewNotice({ ...newNotice, title: e.target.value })}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="area" className="mb-2 text-sm font-medium text-gray-700 block">
                  Área Afectada
                </Label>
                <select
                  id="area"
                  className="w-full"
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

              <div className="space-y-3">
                <Label htmlFor="severity" className="mb-2 text-sm font-medium text-gray-700 block">
                  Severidad
                </Label>
                <select
                  id="severity"
                  className="w-full"
                  value={newNotice.severity}
                  onChange={e => setNewNotice({ ...newNotice, severity: e.target.value as any })}
                >
                  <option value="info">Informativo</option>
                  <option value="warning">Advertencia</option>
                  <option value="critical">Crítico / Cierre</option>
                </select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="content" className="mb-2 text-sm font-medium text-gray-700 block">
                  Contenido
                </Label>
                <textarea
                  id="content"
                  className="w-full min-h-[96px]"
                  value={newNotice.content}
                  onChange={e => setNewNotice({ ...newNotice, content: e.target.value })}
                  required
                  placeholder="Describe los detalles del aviso aquí..."
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="startsAt" className="mb-2 text-sm font-medium text-gray-700 block">
                  Fecha Inicio
                </Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={newNotice.starts_at}
                  onChange={e => setNewNotice({ ...newNotice, starts_at: e.target.value })}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="endsAt" className="mb-2 text-sm font-medium text-gray-700 block">
                  Fecha Fin
                </Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={newNotice.ends_at}
                  onChange={e => setNewNotice({ ...newNotice, ends_at: e.target.value })}
                  required
                  className="w-full"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <Button variant="ghost" onClick={() => setIsAdding(false)} className="text-sm font-medium">
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white font-bold h-10 px-4 rounded-md">
                  Publicar Aviso
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay avisos publicados actualmente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notices.map((notice) => (
              <Card key={notice.id} className="border-none shadow-sm">
                <CardHeader className="p-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    {notice.severity === 'critical' ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : notice.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-500" />
                    )}
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-gray-900">{notice.title}</h3>
                      <p className="text-sm text-gray-500">
                        {notice.common_areas && (
                          <span className="text-xs font-medium text-primary">
                            <MapPin className="mr-1 h-3 w-3" /> {notice.common_areas.name}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(notice.id)}>
                      <Trash2 className="w-4 h-4 text-red-500 hover:text-red-600" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  <p className="mb-2 text-gray-600">{notice.content}</p>
                  {notice.starts_at && (
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-2">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Desde {formatDate(notice.starts_at)}
                        {notice.ends_at && <span className="mx-1">|</span>}
                        {notice.ends_at && `Hasta ${formatDate(notice.ends_at)}`}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
