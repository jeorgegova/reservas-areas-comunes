import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Info, AlertTriangle, Calendar } from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';

export default function MaintenancePage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance_notices')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error) {
      console.error('Error fetching maintenance notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const severityStyles: any = {
    'info': 'bg-blue-50 text-blue-700 border-blue-200',
    'warning': 'bg-amber-50 text-amber-700 border-amber-200',
    'critical': 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mantenimiento y Avisos</h1>
        <p className="text-muted-foreground mt-1">Mantente informado sobre las novedades y mantenimientos de las zonas comunes.</p>
      </div>

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
                "border-l-4 shadow-sm hover:shadow-md transition-all overflow-hidden",
                style.split(' ')[2] // Access the border color part
              )}>
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className={cn(
                      "p-6 flex items-start gap-4",
                      style.split(' ')[0] // Access the bg color part
                    )}>
                      <div className="p-3 bg-white/80 rounded-xl shadow-sm">
                        {notice.severity === 'critical' ? <AlertTriangle className="w-6 h-6 text-red-600" /> : 
                         notice.severity === 'warning' ? <AlertTriangle className="w-6 h-6 text-amber-600" /> : 
                         <Info className="w-6 h-6 text-blue-600" />}
                      </div>
                    </div>
                    <div className="p-6 space-y-2 flex-1">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <h3 className="font-bold text-xl">{notice.title}</h3>
                        <span className={cn(
                          "text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full w-fit",
                          style
                        )}>
                          {notice.severity === 'critical' ? 'Crítico' : 
                           notice.severity === 'warning' ? 'Importante' : 'Informativo'}
                        </span>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{notice.description || notice.content}</p>
                      
                      {notice.start_date && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 pt-3 mt-4 border-t border-gray-100">
                           <Calendar className="w-4 h-4" />
                           <span>
                             {formatDate(notice.start_date)} 
                             {notice.end_date && ` — ${formatDate(notice.end_date)}`}
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
