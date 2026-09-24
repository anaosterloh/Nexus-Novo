import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, X, Download, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Installment {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending';
  receiptUrl?: string;
}

interface PaymentTrackingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  totalAmount?: number;
  installments?: Installment[];
}

export function PaymentTrackingModal({
  open,
  onOpenChange,
  title = 'ROTEIRO #127439',
  totalAmount = 2360000.00,
  installments = [
    { id: '1', date: '22/12/2025', amount: 336000.00, status: 'paid', receiptUrl: '#' },
    { id: '2', date: '22/12/2025', amount: 336000.00, status: 'paid', receiptUrl: '#' },
    { id: '3', date: '29/12/2025', amount: 120000.00, status: 'pending', receiptUrl: '#' },
  ]
}: PaymentTrackingModalProps) {
  const [activeTab, setActiveTab] = useState<'roteiro' | 'financeiro'>('financeiro');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  const totalPaid = installments.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const balanceToPay = totalAmount - totalPaid;

  const formatCurrency = (value: number) => {
    return `$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-[#faf9f6] border-none shadow-2xl">
          <div className="p-8">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-4xl font-serif font-normal tracking-wide text-zinc-900">
                {title.split(' ')[0]} <span className="text-zinc-400 font-light">{title.split(' ')[1]}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="flex gap-2 mb-8">
              <button
                onClick={() => setActiveTab('roteiro')}
                className={cn(
                  "px-6 py-2 text-xs font-bold tracking-wider uppercase transition-colors rounded-sm",
                  activeTab === 'roteiro' ? "bg-[#e8e6e1] text-zinc-900" : "bg-transparent text-zinc-500 hover:bg-[#f0eee9]"
                )}
              >
                Roteiro de Atividades
              </button>
              <button
                onClick={() => setActiveTab('financeiro')}
                className={cn(
                  "px-6 py-2 text-xs font-bold tracking-wider uppercase transition-colors rounded-sm",
                  activeTab === 'financeiro' ? "bg-[#e8e6e1] text-zinc-900" : "bg-transparent text-zinc-500 hover:bg-[#f0eee9]"
                )}
              >
                Financeiro
              </button>
            </div>

            {activeTab === 'financeiro' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-3xl font-serif text-zinc-900">CLP</h2>

                {/* Total Section */}
                <div className="bg-[#f0eee9] rounded-md p-6 space-y-4">
                  <div className="flex items-center justify-between text-zinc-700">
                    <span>Valor das atividades</span>
                    <div className="flex-1 mx-4 border-b-2 border-dotted border-zinc-300"></div>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-[#3b7b8e] text-lg">
                    <span>TOTAL</span>
                    <div className="flex-1 mx-4 border-b-2 border-dotted border-[#3b7b8e]/30"></div>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {/* Installments Section */}
                <div>
                  <h3 className="text-xl font-serif text-zinc-900 mb-4 uppercase tracking-wider">Pagos e a pagar</h3>
                  <div className="bg-[#f0eee9] rounded-md p-6 space-y-4">
                    {installments.map((inst) => (
                      <div key={inst.id} className="flex items-center justify-between text-[#3b7b8e] font-medium group">
                        <span>{inst.date}</span>
                        <div className="flex-1 mx-4 border-b-2 border-dotted border-[#3b7b8e]/30"></div>
                        <div className="flex items-center gap-4">
                          <span>{formatCurrency(inst.amount)}</span>
                          <button 
                            onClick={() => setSelectedReceipt(inst.receiptUrl || null)}
                            className="p-1.5 rounded-full hover:bg-[#3b7b8e]/10 transition-colors relative"
                            title="Visualizar comprovante"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Balance Section */}
                <div className="bg-[#f0eee9] rounded-md p-6">
                  <div className="flex items-center justify-between font-bold text-[#9c6644] text-lg">
                    <span>SALDO A PAGAR</span>
                    <div className="flex-1 mx-4 border-b-2 border-dotted border-[#9c6644]/30"></div>
                    <span>{formatCurrency(balanceToPay)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'roteiro' && (
              <div className="flex items-center justify-center h-64 text-zinc-500 font-serif italic">
                Detalhes do roteiro de atividades...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Viewer Modal */}
      <Dialog open={!!selectedReceipt} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-zinc-950 border-zinc-800">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
            <div className="flex items-center gap-2 text-zinc-100">
              <FileText className="w-5 h-5" />
              <h3 className="font-medium">Comprovante de Pagamento</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={() => setSelectedReceipt(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-8 flex items-center justify-center bg-zinc-950 min-h-[400px]">
            {/* Placeholder for actual receipt image/pdf */}
            <div className="flex flex-col items-center justify-center text-zinc-500 space-y-4">
              <FileText className="w-16 h-16 opacity-20" />
              <p>Visualização do Comprovante</p>
              <p className="text-xs opacity-50">(Simulação de arquivo anexo)</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
