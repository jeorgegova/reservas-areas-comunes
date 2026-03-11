import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Calendar, 
  History, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Building2,
  Bell
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Reservar', path: '/reservations/new', icon: Calendar },
    { name: 'Mis Reservas', path: '/reservations/my', icon: History },
    { name: 'Mantenimientos', path: '/maintenance', icon: Bell },
    { name: 'Mi Perfil', path: '/profile', icon: User },
  ];

  if (profile?.role === 'admin') {
    navItems.splice(1, 0, { name: 'Gestión Reservas', path: '/admin/reservations', icon: Calendar });
    navItems.splice(2, 0, { name: 'Usuarios', path: '/admin/users', icon: User });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r shadow-sm">
        <div className="p-6 flex items-center gap-3 border-b">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="font-bold text-lg text-gray-800 tracking-tight">Residencial</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-4 py-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.role === 'admin' ? 'Administrador' : 'Residente'}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">Residencial</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-6 flex items-center justify-between border-b">
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary" />
                <span className="font-bold text-lg">Residencial</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-6 h-6" />
              </Button>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium transition-all",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="w-6 h-6" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
            <div className="p-6 border-t bg-gray-50/50">
               <Button 
                variant="destructive" 
                className="w-full h-12 rounded-xl"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Cerrar Sesión
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
