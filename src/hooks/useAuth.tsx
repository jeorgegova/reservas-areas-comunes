import { useState, useEffect, createContext, useContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  apartment: string | null;
  role: 'user' | 'admin' | 'super_admin';
  organization_id: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  impersonatedOrgId: string | null;
  setImpersonatedOrgId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Persistir impersonatedOrgId en localStorage para mantener el modo soporte entre recargas
  const [impersonatedOrgId, setImpersonatedOrgId] = useState<string | null>(() => {
    const saved = localStorage.getItem('impersonatedOrgId');
    return saved || null;
  });

  // Función para actualizar impersonatedOrgId y persistir en localStorage
  const handleSetImpersonatedOrgId = (id: string | null) => {
    if (id) {
      localStorage.setItem('impersonatedOrgId', id);
    } else {
      localStorage.removeItem('impersonatedOrgId');
    }
    setImpersonatedOrgId(id);
  };

  const fetchProfile = async (userId: string) => {
    console.log('useAuth: fetchProfile iniciando para:', userId);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('useAuth: Error en consulta de perfil:', error);
        throw error;
      }
      console.log('useAuth: Perfil obtenido exitosamente:', data);
      setProfile(data);
    } catch (error) {
      console.error('useAuth: Error fetching profile (catch):', error);
    } finally {
      console.log('useAuth: Finalizando loading del perfil');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useAuth: useEffect inicial disparado');
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('useAuth: Sesión inicial obtenida:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        console.log('useAuth: No hay sesión inicial, loading false');
        setLoading(false);
      }
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('useAuth: onAuthStateChange disparado:', event, session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Usamos setTimeout para desacoplar completamente la carga del perfil
        // del hilo de ejecución de onAuthStateChange
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      } else {
        console.log('useAuth: Cambio de estado sin sesión, profile null, loading false');
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      console.log('useAuth: Cleanup useEffect (unsubscribe)');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const contextFetchProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  // Profile override for super_admin impersonation
  const effectiveProfile = profile && profile.role === 'super_admin' && impersonatedOrgId
    ? { ...profile, organization_id: impersonatedOrgId }
    : profile;

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile: effectiveProfile, 
      session, 
      loading, 
      signOut, 
      fetchProfile: contextFetchProfile,
      impersonatedOrgId,
      setImpersonatedOrgId: handleSetImpersonatedOrgId
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
