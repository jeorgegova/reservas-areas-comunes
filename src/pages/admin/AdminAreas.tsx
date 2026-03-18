import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Building2,
  Edit2,
  Clock,
  Sun,
  Moon,
  Calendar
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
    pricing_type: 'hourly',
    cost_jornada_diurna: 0,
    cost_jornada_nocturna: 0,
    cost_jornada_ambos: 0,
    jornada_hours_diurna: 10,
    jornada_hours_nocturna: 6,
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Áreas Comunes</h1>
          <p className="text-gray-500 text-sm">Configura los espacios disponibles para reserva.</p>
        </div>
        <Button onClick={() => {
          setCurrentArea({
            name: '', description: '', max_hours_per_reservation: 4, cost_per_hour: 0,
            pricing_type: 'hourly', cost_jornada_diurna: 0, cost_jornada_nocturna: 0,
            cost_jornada_ambos: 0, jornada_hours_diurna: 10, jornada_hours_nocturna: 6,
            image_url: '', is_active: true
          });
          setIsEditing(true);
        }} className="bg-primary hover:bg-primary/90 shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Nueva Área
        </Button>
      </div>

      {isEditing && (
        <Card className="border-none shadow-md bg-white overflow-hidden">
          <CardHeader className="p-6 bg-gray-50/50">
            <CardTitle className="text-lg font-bold text-gray-900">{currentArea.id ? 'Editar Área' : 'Crear Nueva Área'}</CardTitle>
            <CardDescription className="text-xs">Completa los detalles del espacio</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-gray-400">Nombre</Label>
                    <Input
                      value={currentArea.name}
                      onChange={e => setCurrentArea({ ...currentArea, name: e.target.value })}
                      placeholder="Ej: Salón Comunal"
                      required
                      className="h-10 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-gray-400">Descripción</Label>
                    <Input
                      value={currentArea.description}
                      onChange={e => setCurrentArea({ ...currentArea, description: e.target.value })}
                      placeholder="Breve descripción"
                      className="h-10 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-gray-400">URL Imagen</Label>
                    <Input
                      value={currentArea.image_url}
                      onChange={e => setCurrentArea({ ...currentArea, image_url: e.target.value })}
                      placeholder="https://..."
                      className="h-10 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-gray-400">Tipo de Precio</Label>
                    <select
                      value={currentArea.pricing_type}
                      onChange={e => setCurrentArea({ ...currentArea, pricing_type: e.target.value })}
                      className="w-full h-10 rounded-lg text-sm border border-gray-200 bg-white px-3"
                    >
                      <option value="hourly">Por Hora</option>
                      <option value="jornada">Por Jornada (Día/Noche)</option>
                    </select>
                  </div>

                  {currentArea.pricing_type === 'hourly' ? (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-gray-400">Máx. Horas</Label>
                        <Input
                          type="number"
                          value={currentArea.max_hours_per_reservation}
                          onChange={e => setCurrentArea({ ...currentArea, max_hours_per_reservation: parseInt(e.target.value) })}
                          required
                          className="h-10 rounded-lg text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-gray-400">Costo Hora (COP)</Label>
                        <Input
                          type="number"
                          value={currentArea.cost_per_hour}
                          onChange={e => setCurrentArea({ ...currentArea, cost_per_hour: parseFloat(e.target.value) })}
                          required
                          className="h-10 rounded-lg text-sm"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg space-y-3">
                        <div className="flex items-center gap-2 text-amber-700">
                          <Sun className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase">Jornada Diurna (8am - 6pm)</span>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase font-bold text-gray-400">Costo Diurna</Label>
                          <Input
                            type="number"
                            value={currentArea.cost_jornada_diurna}
                            onChange={e => setCurrentArea({ ...currentArea, cost_jornada_diurna: parseFloat(e.target.value) })}
                            className="h-10 rounded-lg text-sm"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg space-y-3">
                        <div className="flex items-center gap-2 text-indigo-700">
                          <Moon className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase">Jornada Nocturna (6pm - 12am)</span>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase font-bold text-gray-400">Costo Nocturna</Label>
                          <Input
                            type="number"
                            value={currentArea.cost_jornada_nocturna}
                            onChange={e => setCurrentArea({ ...currentArea, cost_jornada_nocturna: parseFloat(e.target.value) })}
                            className="h-10 rounded-lg text-sm"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-green-50 border border-green-100 rounded-lg space-y-3">
                        <div className="flex items-center gap-2 text-green-700">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase">Día Completo (Diurna + Nocturna)</span>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase font-bold text-gray-400">Costo Completo</Label>
                          <Input
                            type="number"
                            value={currentArea.cost_jornada_ambos}
                            onChange={e => setCurrentArea({ ...currentArea, cost_jornada_ambos: parseFloat(e.target.value) })}
                            className="h-10 rounded-lg text-sm"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-3 pt-4">
                    <input
                      type="checkbox"
                      id="active"
                      checked={currentArea.is_active}
                      onChange={e => setCurrentArea({ ...currentArea, is_active: e.target.checked })}
                      className="w-4 h-4 text-primary rounded border-gray-300"
                    />
                    <Label htmlFor="active" className="text-sm text-gray-600 cursor-pointer">Espacio activo</Label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="h-10 px-6 font-bold text-gray-400">Cancelar</Button>
                <Button type="submit" className="h-10 px-6 font-bold">Guardar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl" />)
        ) : (
          areas.map((area) => (
            <Card key={area.id}
              className={cn(
                "overflow-hidden border-none shadow-sm bg-white transition-all hover:shadow-md",
                !area.is_active && "opacity-60 grayscale"
              )}
            >
              <div className="h-40 relative overflow-hidden group">
                {area.image_url ? (
                  <img src={area.image_url} alt={area.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                    <Building2 className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <Button size="sm" onClick={() => handleEdit(area)} className="bg-white text-gray-900 hover:bg-gray-100">
                    <Edit2 className="w-3.5 h-3.5 mr-2" /> Editar
                  </Button>
                  <Button size="sm" variant={area.is_active ? "destructive" : "default"} onClick={() => handleToggleActive(area)}>
                    {area.is_active ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 truncate pr-2">{area.name}</h3>
                  <div className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                    area.is_active ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-400 border-gray-200"
                  )}>
                    {area.is_active ? 'Activo' : 'Inactivo'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-3">
                <p className="text-xs text-gray-500 line-clamp-1">{area.description}</p>
                <div className="pt-2 flex justify-between items-center text-xs border-t border-gray-50">
                  {area.pricing_type === 'jornada' ? (
                    <div className="flex flex-col w-full">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-gray-400 uppercase">Diurna</span>
                        <span className="font-bold text-amber-600">{formatCurrency(area.cost_jornada_diurna)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-gray-400 uppercase">Nocturna</span>
                        <span className="font-bold text-indigo-600">{formatCurrency(area.cost_jornada_nocturna)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 uppercase">Completo</span>
                        <span className="font-bold text-green-600">{formatCurrency(area.cost_jornada_ambos)}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase">Costo Hora</span>
                        <span className="font-bold text-gray-900">{formatCurrency(area.cost_per_hour)}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] text-gray-400 uppercase">Máximo</span>
                        <span className="font-bold text-gray-600">{area.max_hours_per_reservation}h</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
