import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Mail, 
  Smartphone, 
  MapPin, 
  Save, 
  Shield,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { profile, fetchProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    apartment: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        apartment: profile.apartment || ''
      });
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    setMessage(null);

    const { error } = await supabase
      .from('profiles')
      .update({
        ...formData,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (error) {
      setMessage({ type: 'error', text: 'Error al actualizar el perfil: ' + error.message });
    } else {
      await fetchProfile();
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
    }
    setLoading(false);
  };

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">Gestiona tu información personal y de contacto.</p>
      </div>

      <Card className="border-none shadow-xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5 flex items-end justify-center pb-6">
           <div className="w-24 h-24 rounded-full bg-white shadow-lg border-4 border-white flex items-center justify-center text-primary relative translate-y-12">
              <User className="w-12 h-12" />
              <div className="absolute bottom-0 right-0 p-1 bg-green-500 rounded-full border-2 border-white" />
           </div>
        </div>
        
        <CardHeader className="pt-16 text-center">
          <CardTitle className="text-2xl font-bold">{profile.full_name}</CardTitle>
          <CardDescription className="flex items-center justify-center gap-1.5 mt-1">
            <Shield className="w-3.5 h-3.5" />
            Rol: {profile.role} • Residente de {profile.apartment || 'N/A'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {message && (
            <div className={cn(
              "p-4 rounded-lg text-sm font-medium animate-in zoom-in-95 duration-200",
              message.type === 'success' ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
            )}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Nombre Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  className="pl-10 h-12"
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    className="pl-10 h-12 bg-gray-50 opacity-70"
                    value={profile.email}
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Teléfono</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    className="pl-10 h-12"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="Ej: 300 123 4567"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Apartamento / Torre</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  className="pl-10 h-12"
                  value={formData.apartment}
                  onChange={e => setFormData({...formData, apartment: e.target.value})}
                  placeholder="Ej: Torre 1 - Apto 101"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-lg shadow-lg shadow-primary/20" 
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              Guardar Cambios
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="bg-gray-50 p-6 flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg border">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground">
            Tus datos están protegidos por la política de privacidad del conjunto residencial. Si necesitas cambiar tu rol, contacta a un administrador.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
