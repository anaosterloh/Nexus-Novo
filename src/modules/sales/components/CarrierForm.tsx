import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/context/AppContext';
import { Truck, Mail, Phone, MapPin, Building2, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const carrierSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  document: z.string().min(1, 'CNPJ é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.string().length(0)),
  phone: z.string().optional(),
  region: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  contactName: z.string().optional(),
  website: z.string().optional(),
  observations: z.string().optional(),
  status: z.string().min(1, 'Status é obrigatório'),
});

type CarrierFormValues = z.infer<typeof carrierSchema>;

interface CarrierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  carrier?: any;
}

export function CarrierForm({ open, onOpenChange, onSuccess, carrier }: CarrierFormProps) {
  const { currentCompany } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CarrierFormValues>({
    resolver: zodResolver(carrierSchema),
    defaultValues: carrier || {
      name: '',
      document: '',
      email: '',
      phone: '',
      region: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      contactName: '',
      website: '',
      observations: '',
      status: 'Ativo',
    }
  });

  useEffect(() => {
    if (carrier) {
      form.reset(carrier);
    } else {
      form.reset({
        name: '',
        document: '',
        email: '',
        phone: '',
        region: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        contactName: '',
        website: '',
        observations: '',
        status: 'Ativo',
      });
    }
  }, [carrier, open]);

  const onSubmit = async (values: CarrierFormValues) => {
    if (!currentCompany) return;
    
    setIsSubmitting(true);
    try {
      const method = carrier ? 'PUT' : 'POST';
      const url = carrier ? `/api/carriers/${carrier.id}` : '/api/carriers';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          companyId: currentCompany.id,
        }),
      });

      if (response.ok) {
        toast.success(carrier ? 'Transportadora atualizada!' : 'Transportadora cadastrada!');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error('Erro ao salvar transportadora');
      }
    } catch (error) {
      console.error('Erro ao salvar transportadora:', error);
      toast.error('Ocorreu um erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6 border-b bg-zinc-50 dark:bg-zinc-900/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Truck className="h-6 w-6 text-blue-600" />
              {carrier ? 'Editar Transportadora' : 'Nova Transportadora'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulário para {carrier ? 'edição' : 'criação'} de transportadora.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
          <Tabs defaultValue="geral" className="w-full">
            <div className="px-6 border-b bg-white dark:bg-zinc-900">
              <TabsList className="h-12 bg-transparent gap-6">
                <TabsTrigger value="geral" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-12 bg-transparent px-0">Identificação</TabsTrigger>
                <TabsTrigger value="contato" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-12 bg-transparent px-0">Contato & Endereço</TabsTrigger>
                <TabsTrigger value="obs" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none h-12 bg-transparent px-0">Observações</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="geral" className="mt-0 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Razão Social / Nome Fantasia</Label>
                    <Input {...form.register('name')} className="h-10" placeholder="Ex: TransLog Express Ltda" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">CNPJ</Label>
                    <Input {...form.register('document')} className="h-10 font-mono" placeholder="00.000.000/0000-00" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Região de Atuação</Label>
                    <Select onValueChange={(v) => form.setValue('region', v)} defaultValue={form.getValues('region')}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nacional">Nacional</SelectItem>
                        <SelectItem value="Sudeste">Sudeste</SelectItem>
                        <SelectItem value="Sul">Sul</SelectItem>
                        <SelectItem value="Nordeste">Nordeste</SelectItem>
                        <SelectItem value="Centro-Oeste">Centro-Oeste</SelectItem>
                        <SelectItem value="Norte">Norte</SelectItem>
                        <SelectItem value="Internacional">Internacional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contato" className="mt-0 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Pessoa de Contato</Label>
                    <Input {...form.register('contactName')} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Telefone</Label>
                    <Input {...form.register('phone')} className="h-10" placeholder="(00) 0000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">E-mail</Label>
                    <Input {...form.register('email')} className="h-10" placeholder="contato@transportadora.com.br" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Website</Label>
                    <Input {...form.register('website')} className="h-10" placeholder="www.transportadora.com.br" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Endereço Completo</Label>
                    <Input {...form.register('address')} className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500">Cidade</Label>
                    <Input {...form.register('city')} className="h-10" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-zinc-500">UF</Label>
                      <Input {...form.register('state')} className="h-10 uppercase" maxLength={2} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-zinc-500">CEP</Label>
                      <Input {...form.register('zipCode')} className="h-10 font-mono" placeholder="00000-000" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="obs" className="mt-0 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-zinc-500">Observações Internas</Label>
                  <Textarea {...form.register('observations')} className="min-h-[150px]" placeholder="Informações sobre prazos, tabelas de frete, etc." />
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 px-8 h-10 font-bold">
              {isSubmitting ? 'Salvando...' : 'Salvar Transportadora'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
