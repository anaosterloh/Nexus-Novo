import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, X, MessageSquare, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { aiService } from '@/services/aiService';
import { motion, AnimatePresence } from 'motion/react';

export function NexusWidget() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [insight, setInsight] = useState<string>('Analisando dados...');

  useEffect(() => {
    // Generate a quick insight
    aiService.generateResponse("Gere um insight curto (máximo 1 frase) sobre o status do ERP hoje.")
      .then(res => setInsight(res || 'Sistema operando normalmente.'));
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[calc(100vw-3rem)] sm:w-[350px]"
          >
            <Card className="border-none shadow-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white overflow-hidden">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-200" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-indigo-100">Nexus AI</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-indigo-200 hover:text-white hover:bg-white/10"
                  onClick={() => setIsOpen(false)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium leading-relaxed text-indigo-50 mb-4">
                  "{insight}"
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="bg-white/20 hover:bg-white/30 border-none text-white text-xs font-bold w-full"
                    onClick={() => navigate('/comunicacoes/chat')}
                  >
                    <MessageSquare className="mr-2 h-3 w-3" />
                    Chat Completo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl flex items-center justify-center hover:shadow-2xl hover:shadow-indigo-500/30 transition-all"
        >
          <Sparkles className="h-6 w-6" />
        </motion.button>
      )}
    </div>
  );
}
