import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (profile && !authLoading) {
      console.log('LoginPage: Perfil detectado, redirigiendo a /dashboard');
      navigate('/dashboard');
    }
  }, [profile, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('LoginPage: Llamando a signInWithPassword...', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Error de Supabase Auth:', error);
        throw error;
      }

      console.log('Inicio de sesión exitoso, usuario:', data.user?.id);
      console.log('Navegando a /dashboard...');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Captura de error en Login.tsx:', err);
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat animate-slow-zoom"
        style={{
          backgroundImage: 'url("https://i.imgur.com/qjreDpV.jpeg")',
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <Card className="relative z-10 w-full max-w-md border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden animate-in fade-in zoom-in duration-500">
        <CardHeader className="space-y-1 text-center pb-8 pt-10">
          <div className="flex justify-center mb-8">
            <img
              src="https://i.imgur.com/BRcipLC.png"
              alt="Logo"
              className="w-48 h-auto object-contain animate-in fade-in slide-in-from-top-6 duration-1000"
            />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-white drop-shadow-md text-center pb-2">
            Iniciar Sesión
          </CardTitle>
        </CardHeader>

        <CardContent className="px-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-destructive/20 text-white text-sm p-3 rounded-xl border border-destructive/30 backdrop-blur-md animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium ml-1">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-2xl focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-white font-medium">Contraseña</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-blue-200 hover:text-white hover:underline transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 rounded-2xl focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 mt-2 text-base font-semibold bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Iniciando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Iniciar Sesión
                </div>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pb-10 px-8">
          <div className="w-full flex items-center justify-center gap-4 py-2">
            <div className="h-px bg-white/20 flex-1"></div>
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">o</span>
            <div className="h-px bg-white/20 flex-1"></div>
          </div>
          <div className="text-sm text-center text-blue-100/80">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="text-white font-bold hover:underline decoration-2 underline-offset-4 decoration-primary/50 transition-all">
              Regístrate ahora
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
