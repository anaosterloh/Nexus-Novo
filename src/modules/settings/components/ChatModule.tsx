import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Send, 
  Paperclip, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Info,
  MessageSquare,
  User,
  FileText,
  Clock,
  Lock,
  History
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { aiService } from '@/services/aiService';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  type: 'text' | 'file';
  fileName?: string;
  fileSize?: string;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'offline' | 'away';
  lastMessage?: string;
  unreadCount?: number;
  avatar?: string;
}

const mockContacts: Contact[] = [
  { id: 'ai', name: 'Nexus AI', role: 'Assistente Inteligente', status: 'online', lastMessage: 'Olá! Como posso ajudar hoje?', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=nexus' },
  { id: '1', name: 'Ana (Gerente)', role: 'Gerência', status: 'online', lastMessage: 'Como está a OS #452?', unreadCount: 2 },
  { id: '2', name: 'Carlos (Vendas)', role: 'Comercial', status: 'away', lastMessage: 'O cliente aprovou o orçamento.' },
  { id: '3', name: 'Suporte Técnico', role: 'TI', status: 'online', lastMessage: 'Servidor reiniciado.' },
  { id: '4', name: 'João (Logística)', role: 'Expedição', status: 'offline', lastMessage: 'Carga saiu para entrega.' },
];

const mockMessages: Record<string, Message[]> = {
  'ai': [
    { id: 'ai1', senderId: 'ai', senderName: 'Nexus AI', text: 'Olá! Eu sou o Nexus AI, seu assistente inteligente. Posso ajudar você a analisar dados, criar relatórios ou tirar dúvidas sobre o sistema. O que deseja fazer hoje?', timestamp: '08:00', type: 'text' },
  ],
  '1': [
    { id: 'm1', senderId: '1', senderName: 'Ana', text: 'Bom dia! Alguma novidade sobre a OS #452?', timestamp: '09:00', type: 'text' },
    { id: 'm2', senderId: 'me', senderName: 'Admin', text: 'Bom dia Ana, estou aguardando a peça chegar.', timestamp: '09:05', type: 'text' },
    { id: 'm3', senderId: '1', senderName: 'Ana', text: 'Certo, me avise assim que chegar.', timestamp: '09:10', type: 'text' },
    { id: 'm4', senderId: '1', senderName: 'Ana', text: 'Segue o anexo do pedido da peça.', timestamp: '09:12', type: 'file', fileName: 'pedido_peca_452.pdf', fileSize: '1.2 MB' },
  ]
};

export function ChatModule() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(mockContacts[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedContact) {
      setMessages(mockMessages[selectedContact.id] || []);
    }
  }, [selectedContact]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      senderName: 'Admin',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setNewMessage('');
    
    // If talking to AI
    if (selectedContact.id === 'ai') {
      const aiResponseText = await aiService.generateResponse(newMessage);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        senderId: 'ai',
        senderName: 'Nexus AI',
        text: aiResponseText || '...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      };
      
      setMessages([...updatedMessages, aiMsg]);
    }

    // Audit log simulation
    console.log(`[AUDIT LOG] Message sent to ${selectedContact.name}: ${newMessage}`);
  };

  const handleFileUpload = () => {
    toast.info('Funcionalidade de upload de arquivos em desenvolvimento.');
  };

  const filteredContacts = mockContacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 overflow-hidden">
      {/* Contacts List */}
      <Card className="w-80 flex flex-col overflow-hidden">
        <CardHeader className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">Bate-papo</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => toast.info('Histórico de conversas auditadas')}
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Buscar contatos..." 
              className="pl-8 h-9 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                  selectedContact?.id === contact.id 
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800" 
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                )}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback className="bg-zinc-100 text-zinc-600 font-bold">
                      {contact.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-zinc-950",
                    contact.status === 'online' ? "bg-emerald-500" : 
                    contact.status === 'away' ? "bg-amber-500" : "bg-zinc-400"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold truncate">{contact.name}</span>
                    {contact.unreadCount && (
                      <Badge className="h-4 min-w-[16px] px-1 bg-emerald-600 text-[10px]">
                        {contact.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 truncate">{contact.role}</p>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{contact.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        {selectedContact ? (
          <>
            <CardHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedContact.avatar} />
                  <AvatarFallback className="bg-zinc-100 text-zinc-600 font-bold">
                    {selectedContact.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-sm font-bold">{selectedContact.name}</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      selectedContact.status === 'online' ? "bg-emerald-500" : 
                      selectedContact.status === 'away' ? "bg-amber-500" : "bg-zinc-400"
                    )} />
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                      {selectedContact.status === 'online' ? 'Online' : 
                       selectedContact.status === 'away' ? 'Ausente' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-zinc-500"
                  onClick={() => toast.info('Iniciando chamada de voz...')}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-zinc-500"
                  onClick={() => toast.info('Iniciando chamada de vídeo...')}
                >
                  <Video className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-zinc-500"
                  onClick={() => toast.info('Informações do contato')}
                >
                  <Info className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-zinc-500"
                  onClick={() => toast.info('Mais opções')}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                <div className="flex justify-center my-4">
                  <Badge variant="outline" className="text-[10px] uppercase bg-zinc-50 dark:bg-zinc-900 font-bold tracking-widest text-zinc-400 border-zinc-200 dark:border-zinc-800">
                    Hoje
                  </Badge>
                </div>
                
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "flex flex-col max-w-[80%]",
                      msg.senderId === 'me' ? "ml-auto items-end" : "items-start"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-2xl text-sm leading-relaxed",
                      msg.senderId === 'me' 
                        ? "bg-emerald-600 text-white rounded-tr-none" 
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-none"
                    )}>
                      {msg.type === 'file' ? (
                        <div className="flex items-center gap-3 p-1">
                          <div className="h-10 w-10 rounded bg-white/20 flex items-center justify-center">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs truncate">{msg.fileName}</p>
                            <p className="text-[10px] opacity-70">{msg.fileSize}</p>
                          </div>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-[10px] text-zinc-400 font-mono">{msg.timestamp}</span>
                      {msg.senderId === 'me' && (
                        <Badge variant="outline" className="text-[8px] py-0 px-1 border-none text-zinc-400">
                          Auditado
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-zinc-50/50 dark:bg-zinc-900/20">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 text-zinc-500 shrink-0"
                  onClick={handleFileUpload}
                >
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input 
                  placeholder="Digite sua mensagem..." 
                  className="flex-1 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 h-10 w-10 p-0 shrink-0"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <Lock className="h-3 w-3 text-zinc-400" />
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
                  Mensagens auditadas e não editáveis
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-20 w-20 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
              <MessageSquare className="h-10 w-10 text-zinc-300" />
            </div>
            <h3 className="text-lg font-bold">Selecione um contato</h3>
            <p className="text-sm text-zinc-500 max-w-xs mt-2">
              Escolha um usuário da lista ao lado para iniciar uma conversa auditada.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
