import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  Plus, 
  Edit2, 
  CheckCircle, 
  XCircle
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

export default function AdminAreasPage() {
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentArea, setCurrentArea] = useState<any>({
    name: '',
    description: '',
    max_hours_per_reservation: 4,
    cost_per_hour: 0,
    image_url: '',
    is_active: true
  });

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    setLoading(true);
    const { data } = await supabase.from('common_areas').select('*').order('created_at', { ascending: false });
    setAreas(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentArea.id) {
      await supabase.from('common_areas').update(currentArea).eq('id', currentArea.id);
    } else {
      await supabase.from('common_areas').insert(currentArea);
    }
    setIsEditing(false);
    fetchAreas();
  };

  const handleEdit = (area: any) => {
    setCurrentArea(area);
    setIsEditing(true);
  };

  const handleToggleActive = async (area: any) => {
    await supabase.from('common_areas').update({ is_active: !area.is_active }).eq('id', area.id);
    fetchAreas();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Áreas Comunes</h1>
          <p className="text-muted-foreground mt-1">Configura los espacios disponibles para reserva.</p>
        </div>
        <Button onClick={() => {
          setCurrentArea({ name: '', description: '', max_hours_per_reservation: 4, cost_per_hour: 0, image_url: '', is_active: true });
          setIsEditing(true);
        }}>
          <Plus className="w-4 h-4 mr-2" /> Nueva Área
        </Button>
      </div>

      {isEditing && (
        <Card className="border-none shadow-xl bg-white animate-in slide-in-from-top duration-300">
          <CardHeader>
            <CardTitle>{currentArea.id ? 'Editar Área' : 'Crear Nueva Área'}</CardTitle>
            <CardDescription>Completa los detalles del espacio.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre de la Área</Label>
                    <Input 
                      value={currentArea.name} 
                      onChange={e => setCurrentArea({...currentArea, name: e.target.value})}
                      placeholder="Ej: Salón Comunal"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Input 
                      value={currentArea.description} 
                      onChange={e => setCurrentArea({...currentArea, description: e.target.value})}
                      placeholder="Breve descripción del espacio"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL de Imagen</Label>
                    <Input 
                      value={currentArea.image_url} 
                      onChange={e => setCurrentArea({...currentArea, image_url: e.target.value})}
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Horas Máximas por Reserva</Label>
                    <Input 
                      type="number"
                      value={currentArea.max_hours_per_reservation} 
                      onChange={e => setCurrentArea({...currentArea, max_hours_per_reservation: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Costo por Hora (COP)</Label>
                    <Input 
                      type="number"
                      value={currentArea.cost_per_hour} 
                      onChange={e => setCurrentArea({...currentArea, cost_per_hour: parseFloat(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-8">
                     <input 
                       type="checkbox" 
                       id="active"
                       checked={currentArea.is_active}
                       onChange={e => setCurrentArea({...currentArea, is_active: e.target.checked})}
                       className="w-4 h-4 text-primary rounded"
                     />
                     <Label htmlFor="active">Espacio activo y visible</Label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                <Button type="submit">Guardar Cambios</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl" />)
        ) : (
          areas.map(area => (
            <Card key={area.id} className={cn(
              "overflow-hidden border-none shadow-md transition-all",
              !area.is_active && "opacity-60 grayscale"
            )}>
              <div className="h-40 bg-gray-100 relative group">
                {area.image_url ? (
                  <img src={area.image_url} alt={area.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary/20">
                    <Building2 className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" onClick={() => handleEdit(area)}>
                    <Edit2 className="w-4 h-4 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant={area.is_active ? "destructive" : "default"} onClick={() => handleToggleActive(area)}>
                    {area.is_active ? <XCircle className="w-4 h-4 mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                    {area.is_active ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </div>
              <CardHeader className="p-5 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{area.name}</CardTitle>
                  <div className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border",
                    area.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"
                  )}>
                    {area.is_active ? 'Activo' : 'Inactivo'}
                  </div>
                </div>
                <CardDescription className="line-clamp-1">{area.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                 <div className="flex justify-between text-sm py-2 border-b">
                   <span className="text-muted-foreground">Costo/Hora</span>
                   <span className="font-bold">{formatCurrency(area.cost_per_hour)}</span>
                 </div>
                 <div className="flex justify-between text-sm py-2 border-b">
                   <span className="text-muted-foreground">Máx. Horas</span>
                   <span className="font-bold">{area.max_hours_per_reservation}h</span>
                 </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
