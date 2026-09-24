import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Phone, Mail, MapPin, Building2, Calendar, Clock, User, Building, Star, StarOff } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
}

interface Interaction {
  id: string;
  date: string;
  contactId: string;
  note: string;
  productOfInterest?: string;
  priceDiscussed?: string;
}

interface Company {
  id: string;
  name: string;
  type: 'Cliente' | 'Fornecedor' | 'Transportadora' | 'Prospect';
  isFavorite: boolean;
  contacts: Contact[];
  interactions: Interaction[];
}

const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Tech Solutions Ltda',
    type: 'Prospect',
    isFavorite: true,
    contacts: [
      { id: 'c1', name: 'Carlos Silva', role: 'Comprador', phone: '(11) 98888-7777', email: 'carlos@techsolutions.com' },
      { id: 'c2', name: 'Ana Paula', role: 'Diretora', phone: '(11) 99999-8888', email: 'ana@techsolutions.com' }
    ],
    interactions: [
      { id: 'i1', date: '2024-03-15T10:30:00', contactId: 'c1', note: 'Empresa interessada em fechar contrato anual.', productOfInterest: 'Placa Principal Raio-X GE', priceDiscussed: 'R$ 2.400,00' },
      { id: 'i2', date: '2024-03-10T14:00:00', contactId: 'c2', note: 'Apresentação inicial do portfólio.' }
    ]
  },
  {
    id: '2',
    name: 'Logística Brasil S/A',
    type: 'Transportadora',
    isFavorite: false,
    contacts: [
      { id: 'c3', name: 'Roberto Gomes', role: 'Gerente de Contas', phone: '(41) 97777-6666', email: 'roberto@logbrasil.com' }
    ],
    interactions: [
      { id: 'i3', date: '2024-02-28T09:15:00', contactId: 'c3', note: 'Negociação de tabela de frete para região Sul.' }
    ]
  }
];

export function ContactDirectory() {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(mockCompanies[0].id);
  const [newNote, setNewNote] = useState('');

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contacts.some(contact => contact.name.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return a.name.localeCompare(b.name);
  });

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompanies(companies.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !selectedCompany) return;

    const newInteraction: Interaction = {
      id: `i${Date.now()}`,
      date: new Date().toISOString(),
      contactId: selectedCompany.contacts[0]?.id || '', // Default to first contact for now
      note: newNote,
    };

    setCompanies(companies.map(c => {
      if (c.id === selectedCompany.id) {
        return { ...c, interactions: [newInteraction, ...c.interactions] };
      }
      return c;
    }));

    setNewNote('');
    toast.success('Anotação salva com sucesso!');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Cliente': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Fornecedor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Transportadora': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Prospect': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-zinc-100 text-zinc-800 border-zinc-200';
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6">
      {/* Left Pane: Company List */}
      <Card className="w-1/3 flex flex-col h-full border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Empresas
            </h2>
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <Plus className="h-4 w-4" /> Nova
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Buscar empresa ou contato..."
              className="pl-8 bg-zinc-50 dark:bg-zinc-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredCompanies.map(company => (
              <div
                key={company.id}
                onClick={() => setSelectedCompanyId(company.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                  selectedCompanyId === company.id 
                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' 
                    : 'bg-white border-transparent hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm truncate pr-2">{company.name}</span>
                  <button onClick={(e) => toggleFavorite(company.id, e)} className="text-zinc-400 hover:text-amber-500 shrink-0">
                    {company.isFavorite ? <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> : <StarOff className="h-4 w-4" />}
                  </button>
                </div>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getTypeColor(company.type)}`}>
                  {company.type}
                </Badge>
              </div>
            ))}
            {filteredCompanies.length === 0 && (
              <div className="text-center p-4 text-zinc-500 text-sm">Nenhuma empresa encontrada.</div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Right Pane: Details & Interactions */}
      <Card className="flex-1 flex flex-col h-full border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {selectedCompany ? (
          <>
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold">{selectedCompany.name}</h1>
                    <Badge variant="outline" className={getTypeColor(selectedCompany.type)}>{selectedCompany.type}</Badge>
                  </div>
                  <p className="text-sm text-zinc-500 flex items-center gap-1">
                    <Building className="h-4 w-4" /> Cadastrada desde 2023
                  </p>
                </div>
                <Button variant="outline" size="sm">Editar Empresa</Button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Contacts Column */}
              <div className="w-1/3 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-950">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/20">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-500">Contatos</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6"><Plus className="h-4 w-4" /></Button>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedCompany.contacts.map(contact => (
                      <div key={contact.id} className="p-3 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                        <p className="font-bold text-sm flex items-center gap-2">
                          <User className="h-4 w-4 text-emerald-600" /> {contact.name}
                        </p>
                        <p className="text-xs text-zinc-500 mb-2">{contact.role}</p>
                        <div className="space-y-1">
                          <p className="text-xs flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                            <Phone className="h-3 w-3" /> {contact.phone}
                          </p>
                          <p className="text-xs flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                            <Mail className="h-3 w-3" /> {contact.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Interactions Column */}
              <div className="flex-1 flex flex-col bg-zinc-50/30 dark:bg-zinc-900/10">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-500 mb-3">Nova Anotação / Histórico</h3>
                  <div className="space-y-3">
                    <Textarea 
                      placeholder="Ex: Falei com o Carlos sobre o produto X. Preço negociado: R$ 1.500."
                      className="min-h-[80px] resize-none text-sm"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button size="sm" onClick={handleAddNote} className="bg-emerald-600 hover:bg-emerald-700">
                        Salvar Anotação
                      </Button>
                    </div>
                  </div>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {selectedCompany.interactions.map(interaction => {
                      const contact = selectedCompany.contacts.find(c => c.id === interaction.contactId);
                      return (
                        <div key={interaction.id} className="p-4 border rounded-lg bg-white dark:bg-zinc-950 shadow-sm relative">
                          <div className="absolute left-0 top-6 w-1 h-10 bg-emerald-500 rounded-r"></div>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                              <Calendar className="h-3 w-3" />
                              {new Date(interaction.date).toLocaleDateString('pt-BR')} às {new Date(interaction.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <Badge variant="secondary" className="text-[10px] bg-zinc-100 dark:bg-zinc-800">
                              <User className="h-3 w-3 mr-1" /> {contact?.name || 'Desconhecido'}
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">{interaction.note}</p>
                          
                          {(interaction.productOfInterest || interaction.priceDiscussed) && (
                            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-4">
                              {interaction.productOfInterest && (
                                <div className="text-xs">
                                  <span className="text-zinc-500 uppercase font-bold text-[9px] block">Produto de Interesse</span>
                                  <span className="font-medium text-emerald-700 dark:text-emerald-400">{interaction.productOfInterest}</span>
                                </div>
                              )}
                              {interaction.priceDiscussed && (
                                <div className="text-xs">
                                  <span className="text-zinc-500 uppercase font-bold text-[9px] block">Preço Discutido</span>
                                  <span className="font-medium text-blue-700 dark:text-blue-400">{interaction.priceDiscussed}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {selectedCompany.interactions.length === 0 && (
                      <div className="text-center p-8 text-zinc-400 text-sm border-2 border-dashed rounded-lg">
                        Nenhum histórico de interação com esta empresa.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-400 flex-col gap-4">
            <Building2 className="h-16 w-16 text-zinc-200 dark:text-zinc-800" />
            <p>Selecione uma empresa para ver os detalhes e contatos.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
