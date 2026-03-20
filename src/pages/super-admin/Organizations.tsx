import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  Loader2,
  XCircle,
  ShieldPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SuperAdminOrganizations() {
  const { profile, setImpersonatedOrgId } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contact_email: '',
    phone: '',
    address: '',
    logo_url: '',
    login_photo_url: '',
    subscription_status: 'active'
  });
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchOrganizations();
    }
  }, [profile]);

  const fetchOrganizations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setOrganizations(data);
    setLoading(false);
  };

  const handleOpenModal = (org: any = null) => {
    if (org) {
      setEditingOrg(org);
      setFormData({
        name: org.name || '',
        slug: org.slug || '',
        contact_email: org.contact_email || '',
        phone: org.phone || '',
        address: org.address || '',
        logo_url: org.logo_url || '',
        login_photo_url: org.login_photo_url || '',
        subscription_status: org.subscription_status || 'active'
      });
    } else {
      setEditingOrg(null);
      setFormData({
        name: '',
        slug: '',
        contact_email: '',
        phone: '',
        address: '',
        logo_url: '',
        login_photo_url: '',
        subscription_status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingOrg) {
      const { error } = await supabase
        .from('organizations')
        .update(formData)
        .eq('id', editingOrg.id);
      if (!error) {
        setIsModalOpen(false);
        fetchOrganizations();
      }
    } else {
      const { error } = await supabase
        .from('organizations')
        .insert([formData]);
      if (!error) {
        setIsModalOpen(false);
        fetchOrganizations();
      }
    }
    setLoading(false);
  };

  const deleteOrg = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta organización? Esto afectará a todos sus usuarios y datos.')) {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);
      if (!error) fetchOrganizations();
    }
  };

  const handleSupport = (orgId: string) => {
    setImpersonatedOrgId(orgId);
    navigate('/admin');
  };

  const handleOpenLogin = (org: any) => {
    window.open(`/${org.slug}/login`, '_blank');
    setOpenDropdownId(null);
  };

  const handleCopyLink = async (org: any) => {
    const url = `${window.location.origin}/${org.slug}/login`;
    await navigator.clipboard.writeText(url);
    setOpenDropdownId(null);
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOrgs = organizations.filter(org =>
    org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (profile?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <XCircle className="w-12 h-12 mb-4 text-red-400" />
        <p className="text-lg font-medium">Acceso no autorizado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Organizaciones</h1>
            <p className="text-gray-500 text-sm">Gestiona todos los conjuntos residenciales de la plataforma.</p>
          </div>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Organización
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-4 bg-gray-50/50 border-b border-gray-100">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar organización o slug..."
              className="pl-10 h-10 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-visible">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50/30 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nombre / Slug</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-6">
                        <div className="h-4 bg-gray-100 rounded-full w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      No se encontraron organizaciones.
                    </td>
                  </tr>
                ) : (
                  filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {org.logo_url ? (
                            <img src={org.logo_url} className="w-8 h-8 rounded-lg object-contain bg-white border border-gray-100 p-1" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-gray-900">{org.name}</div>
                            <div className="text-[10px] text-indigo-600 font-mono tracking-tighter">/{org.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-700 font-medium">{org.contact_email || '--'}</div>
                        <div className="text-[10px] text-gray-400">{org.phone || '--'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border uppercase",
                          org.subscription_status === 'active'
                            ? "bg-green-50 text-green-700 border-green-100"
                            : "bg-gray-50 text-gray-500 border-gray-100"
                        )}>
                          {org.subscription_status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 overflow-visible" ref={dropdownRef}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => handleSupport(org.id)}
                          >
                            <span title="Entrar en modo soporte para gestionar esta organización como su administrador">
                              <ShieldPlus className="w-4 h-4" />
                            </span>
                          </Button>
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 relative"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === org.id ? null : org.id);
                              }}
                              aria-label="Opciones de enlace de login"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            {openDropdownId === org.id && (
                              <div className="absolute right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[160px]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenLogin(org);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Abrir enlace
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyLink(org);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  Copiar link
                                </button>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-amber-500 hover:bg-amber-50"
                            onClick={() => handleOpenModal(org)}
                          >
                            <span title="Editar los datos de esta organización">
                              <Edit2 className="w-4 h-4" />
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                            onClick={() => deleteOrg(org.id)}
                          >
                            <span title="Eliminar esta organización (acción irreversible)">
                              <Trash2 className="w-4 h-4" />
                            </span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editingOrg ? 'Editar Organización' : 'Nueva Organización'}</h2>
                <p className="text-gray-500 text-xs">Completa los datos para configurar el conjunto residencial.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <XCircle className="w-5 h-5 text-gray-400" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Nombre del Conjunto</Label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Residencial Los Olivos"
                    required
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">URL / Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="los-olivos"
                    required
                    className="h-11 rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Email de Contacto</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="admin@olivos.com"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Estado Suscripción</Label>
                  <select
                    value={formData.subscription_status}
                    onChange={e => setFormData({ ...formData, subscription_status: e.target.value })}
                    className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm"
                  >
                    <option value="active">Activa</option>
                    <option value="inactive">Inactiva</option>
                    <option value="trial">Prueba</option>
                    <option value="past_due">Mora</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">URL del Logo (Icono)</Label>
                <Input
                  value={formData.logo_url}
                  onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://..."
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-gray-400 ml-1">URL Fondo de Login</Label>
                <Input
                  value={formData.login_photo_url}
                  onChange={e => setFormData({ ...formData, login_photo_url: e.target.value })}
                  placeholder="https://..."
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingOrg ? 'Guardar Cambios' : 'Crear Conjunto')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
