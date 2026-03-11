import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function PaymentMockPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchReservation();
  }, [id]);

  const fetchReservation = async () => {
    const { data } = await supabase
      .from('reservations')
      .select(`
        *,
        common_areas (name)
      `)
      .eq('id', id)
      .single();
    
    setReservation(data);
    setLoading(false);
  };

  const handlePayment = async () => {
    setProcessing(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { error } = await supabase
      .from('reservations')
      .update({ status: 'pending_validation' })
      .eq('id', id);

    if (!error) {
      setSuccess(true);
      setTimeout(() => navigate('/reservations/my'), 3000);
    }
    setProcessing(false);
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  if (!reservation) return <div>Reserva no encontrada.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
        {!success ? (
          <Card className="border-none shadow-2xl overflow-hidden">
            <div className="bg-primary p-8 text-white text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <CreditCard className="w-10 h-10" />
                </div>
              </div>
              <h2 className="text-2xl font-bold">Pasarela de Pagos</h2>
              <p className="opacity-80">Seguro • Rápido • Confiable</p>
            </div>
            
            <CardHeader>
               <div className="flex justify-between items-center mb-2">
                 <span className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Concepto</span>
                 <span className="font-bold text-primary">{reservation.common_areas?.name}</span>
               </div>
               <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border">
                 <div className="text-sm text-muted-foreground">Total a pagar</div>
                 <div className="text-2xl font-black">{formatCurrency(reservation.total_cost)}</div>
               </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-3">
                 <div className="flex items-center gap-3 text-sm p-3 border rounded-lg bg-white">
                   <ShieldCheck className="w-5 h-5 text-green-500" />
                   <span>Transacción cifrada con SSL de 256 bits</span>
                 </div>
                 <div className="flex items-center gap-3 text-sm p-3 border rounded-lg bg-white">
                   <Lock className="w-5 h-5 text-gray-400" />
                   <span>No guardamos los datos de tus tarjetas</span>
                 </div>
              </div>

              <div className="pt-4">
                <p className="text-[10px] text-center text-muted-foreground uppercase font-bold mb-4 tracking-tighter">Este es un entorno de simulación</p>
                <Button 
                  className="w-full h-14 text-lg" 
                  onClick={handlePayment}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : "Pagar con mi Tarjeta / PSE"}
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex justify-center border-t py-4">
               <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                 <ArrowLeft className="w-4 h-4 mr-2" /> Volver atrás
               </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">¡Pago Exitoso!</h2>
              <p className="text-muted-foreground">Tu pago por {formatCurrency(reservation.total_cost)} ha sido procesado.</p>
            </div>
            <div className="p-4 bg-white rounded-xl shadow-sm border space-y-2">
               <p className="text-sm text-muted-foreground">La administración validará tu reserva en las próximas horas.</p>
               <p className="text-xs font-mono text-gray-400">Ref: {reservation.id.substring(0, 16).toUpperCase()}</p>
            </div>
            <Button className="w-full h-12" onClick={() => navigate('/reservations/my')}>
              Ver mis reservas
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
