import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Info, 
  Calendar,
  X
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';

export default function MaintenanceNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    severity: 'info',
    starts_at: '',
    ends_at: ''
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('maintenance_notices')
      .select('*')
      .order('created_at', { ascending: false });
    setNotices(data || []);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('maintenance_notices').insert(newNotice);
    if (!error) {
      setIsAdding(false);
      fetchNotices();
      setNewNotice({ title: '', content: '', severity: 'info', starts_at: '', ends_at: '' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este aviso?')) return;
    await supabase.from('maintenance_notices').delete().eq('id', id);
    fetchNotices();
  };

  const severityStyles: any = {
    'info': 'bg-blue-50 text-blue-700 border-blue-200 icon-blue-500',
    'warning': 'bg-amber-50 text-amber-700 border-amber-200 icon-amber-500',
    'critical': 'bg-red-50 text-red-700 border-red-200 icon-red-500',
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comunicados y Mantenimiento</h1>
          <p className="text-muted-foreground mt-1">Informa a los residentes sobre cierres o novedades.</p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Aviso
        </Button>
      </div>

      {isAdding && (
        <Card className="border-none shadow-xl">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input 
                    value={newNotice.title} 
                    onChange={e => setNewNotice({...newNotice, title: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Severidad</Label>
                  <select 
                    className="h-11 w-full rounded-md border border-input px-3"
                    value={newNotice.severity}
                    onChange={e => setNewNotice({...newNotice, severity: e.target.value})}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Fin (Opcional)</Label>
                  <Input 
                    type="datetime-local"
                    value={newNotice.ends_at} 
                    onChange={e => setNewNotice({...newNotice, ends_at: e.target.value})}
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

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          [1, 2].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />)
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
                "border-l-4 shadow-sm group hover:shadow-md transition-all",
                style.split(' ')[2] // Access the border color part
              )}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className={cn(
                         "p-3 rounded-xl shrink-0",
                         style.split(' ')[0] // Access the bg color part
                      )}>
                        {notice.severity === 'critical' ? <AlertTriangle className="w-6 h-6 text-red-600" /> : 
                         notice.severity === 'warning' ? <AlertTriangle className="w-6 h-6 text-amber-600" /> : 
                         <Info className="w-6 h-6 text-blue-600" />}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg">{notice.title}</h3>
                        <p className="text-muted-foreground">{notice.content}</p>
                        {notice.starts_at && (
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 pt-2">
                             <Calendar className="w-3.5 h-3.5" />
                             <span>Desde {formatDate(notice.starts_at)} {notice.ends_at && `hasta ${formatDate(notice.ends_at)}`}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => handleDelete(notice.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
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
