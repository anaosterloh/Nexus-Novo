import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Bell, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

const ENABLE_DEMO_URGENT_ALERT = false; // Disable demo alert globally

// This would normally come from a global state or socket
export function UrgentAlertOverlay() {
  const [alert, setAlert] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const { user } = useAuth();
  const location = useLocation();

  // Simulate receiving an urgent alert after 10 seconds for demo purposes
  useEffect(() => {
    // Only schedule if user is authenticated and demo is enabled
    if (!user || !ENABLE_DEMO_URGENT_ALERT) return;
    
    const timer = setTimeout(() => {
      setAlert({
        id: 'urgent-1',
        sender: 'Admin',
        title: 'ALERTA DE SEGURANÇA',
        message: 'Detectamos uma tentativa de acesso não autorizada em sua conta. Por favor, confirme se foi você ou altere sua senha imediatamente.',
        type: 'urgent',
        requireAction: 'feedback', // feedback, ok, agree_disagree
        date: new Date().toLocaleString()
      });
    }, 15000);

    return () => clearTimeout(timer);
  }, [user]);

  // Always hide if not logged in or on login page
  if (!user || !alert || location.pathname === '/login') return null;

  const handleAction = (action: string) => {
    console.log(`Action taken: ${action}, Feedback: ${feedback}`);
    setAlert(null);
    setFeedback('');
  };

  return (
    <Dialog open={!!alert} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px] border-4 border-red-600 shadow-2xl p-0 overflow-hidden bg-white dark:bg-zinc-950">
        <VisuallyHidden>
          <DialogTitle>{alert.title}</DialogTitle>
          <DialogDescription>Urgent security alert notification</DialogDescription>
        </VisuallyHidden>
        <div className="bg-red-600 p-4 flex items-center gap-3 text-white">
          <AlertTriangle className="h-8 w-8 animate-bounce" />
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter">{alert.title}</h2>
            <p className="text-[10px] opacity-80 font-mono">{alert.date} | Enviado por: {alert.sender}</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
            <p className="text-base font-medium text-red-900 dark:text-red-100 leading-relaxed">
              {alert.message}
            </p>
          </div>

          {alert.requireAction === 'feedback' && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-zinc-500">Sua Resposta / Observação</label>
              <Textarea 
                placeholder="Digite sua resposta aqui..." 
                className="min-h-[100px] border-red-200 focus-visible:ring-red-500"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {alert.requireAction === 'ok' && (
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 h-12 text-lg font-bold"
                onClick={() => handleAction('ok')}
              >
                ESTOU CIENTE
              </Button>
            )}

            {alert.requireAction === 'agree_disagree' && (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-12 border-red-600 text-red-600 hover:bg-red-50 font-bold"
                  onClick={() => handleAction('disagree')}
                >
                  NÃO CONCORDO
                </Button>
                <Button 
                  className="h-12 bg-red-600 hover:bg-red-700 font-bold"
                  onClick={() => handleAction('agree')}
                >
                  CONCORDO
                </Button>
              </div>
            )}

            {alert.requireAction === 'feedback' && (
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 h-12 text-lg font-bold"
                onClick={() => handleAction('submit_feedback')}
                disabled={!feedback.trim()}
              >
                ENVIAR RESPOSTA
              </Button>
            )}
          </div>
        </div>

        <div className="bg-zinc-100 dark:bg-zinc-900 p-3 text-center">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
            Esta mensagem requer sua atenção imediata para continuar operando o sistema.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
