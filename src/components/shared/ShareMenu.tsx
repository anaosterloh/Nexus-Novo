import { 
  Share2, 
  Copy, 
  Printer, 
  MessageCircle, 
  Mail, 
  FileText,
  Check
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

type ShareType = 'os' | 'pedido' | 'cliente' | 'produto' | 'generico';

interface ShareMenuProps {
  data: any;
  type: ShareType;
  onPrint?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string; // Optional label for the button
}

export function ShareMenu({ 
  data, 
  type, 
  onPrint, 
  className, 
  variant = "outline", 
  size = "default",
  label
}: ShareMenuProps) {
  const [copied, setCopied] = useState(false);

  const formatSingleItem = (item: any) => {
    let text = '';
    const date = new Date().toLocaleDateString('pt-BR');

    switch (type) {
      case 'os':
        text = `*ORDEM DE SERVIÇO #${item.id || 'N/A'}*\n` +
               `📅 Data: ${item.date ? new Date(item.date).toLocaleDateString('pt-BR') : date}\n` +
               `👤 Cliente: ${item.customer || 'N/A'}\n` +
               `🔧 Equipamento: ${item.equipment || 'N/A'}\n` +
               `⚠️ Prioridade: ${item.priority || 'Normal'}\n` +
               `📊 Status: ${item.status || 'Em Aberto'}\n` +
               `👨‍🔧 Técnico: ${item.technician || 'N/A'}\n`;
        if (item.description) text += `\n📝 Descrição: ${item.description}\n`;
        break;

      case 'pedido':
        text = `*PEDIDO DE VENDA #${item.id || 'N/A'}*\n` +
               `📅 Data: ${item.date ? new Date(item.date).toLocaleDateString('pt-BR') : date}\n` +
               `👤 Cliente: ${item.customer || 'N/A'}\n` +
               `💰 Valor Total: ${item.total ? item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}\n` +
               `📊 Status: ${item.status || 'Em Aberto'}\n`;
        break;

      case 'cliente':
        text = `*DADOS DO CLIENTE*\n` +
               `👤 Nome: ${item.name || item.customer || 'N/A'}\n` +
               `🆔 Documento: ${item.document || 'N/A'}\n` +
               `📞 Telefone: ${item.phone || 'N/A'}\n` +
               `📧 Email: ${item.email || 'N/A'}\n` +
               `📍 Endereço: ${item.address || 'N/A'}\n`;
        break;
      
      case 'produto':
        text = `*PRODUTO: ${item.name || 'N/A'}*\n` +
               `📦 Código: ${item.code || 'N/A'}\n` +
               `💰 Preço: ${item.price ? item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}\n` +
               `📊 Estoque: ${item.stock || 0} un.\n`;
        break;

      default:
        text = JSON.stringify(item, null, 2);
    }
    return text;
  };

  const formatData = () => {
    if (!data) return '';
    
    if (Array.isArray(data)) {
      return data.map(item => formatSingleItem(item)).join('\n\n--------------------------------\n\n');
    }

    return formatSingleItem(data);
  };

  const handleCopy = async () => {
    const text = formatData();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copiado para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Erro ao copiar.");
    }
  };

  const handleWhatsApp = () => {
    const text = formatData();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleEmail = () => {
    const text = formatData();
    const subject = type === 'os' ? `Ordem de Serviço #${data.id}` : 
                    type === 'pedido' ? `Pedido #${data.id}` : 
                    'Informações Compartilhadas';
    const body = encodeURIComponent(text);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          {label || "Compartilhar"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Opções de Compartilhamento</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleCopy} className="cursor-pointer gap-2">
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          <span>Copiar Texto</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleWhatsApp} className="cursor-pointer gap-2 text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950/20">
          <MessageCircle className="h-4 w-4" />
          <span>Enviar no WhatsApp</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleEmail} className="cursor-pointer gap-2">
          <Mail className="h-4 w-4" />
          <span>Enviar por E-mail</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handlePrint} className="cursor-pointer gap-2">
          <Printer className="h-4 w-4" />
          <span>Imprimir</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
