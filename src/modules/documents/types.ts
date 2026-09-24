
export type DocumentType = 'Laudo Técnico' | 'Carta Comercial' | 'Contrato' | 'POP' | 'Alvará' | 'Checklist' | 'Termo de Garantia' | 'Documento de Cliente' | 'Procedimento Interno';

export type DocumentStatus = 'Rascunho' | 'Em Revisão' | 'Vigente' | 'Vencido' | 'Obsoleto' | 'Cancelado';

export type POPStatus = 'Em Elaboração' | 'Em Revisão' | 'Ativo' | 'Obsoleto';

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentType;
  category: string; // e.g., 'Técnica', 'Comercial', 'Jurídico', 'Financeiro'
  content: string; // HTML
  headerContent?: string; // HTML
  footerContent?: string; // HTML
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isSystem?: boolean;
}

export interface ContractDetails {
  valorTotal?: number;
  saldoServicos?: number;
  limiteMensal?: number;
  diaFaturamento?: number;
  renovacaoAutomatica?: boolean;
  escopo?: string;
}

export interface Document {
  id: string;
  templateId?: string;
  title: string;
  type: DocumentType;
  category: string;
  status: DocumentStatus;
  content: string; 
  headerContent?: string;
  footerContent?: string;
  fieldValues?: Record<string, any>; 
  
  // Context & Links (Polymorphic)
  clientId?: string;
  osId?: string;
  equipmentId?: string;
  contractId?: string;
  
  // Validity & Compliance
  validFrom?: string;
  validUntil?: string;
  requiresReview?: boolean;
  nextReviewDate?: string;
  
  // Contract Specifics
  contractDetails?: ContractDetails;

  // Workflow
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Approval & Emission
  approvedBy?: string;
  approvedAt?: string;
  issuedBy?: string;
  issuedAt?: string;
  hash?: string;
  
  // Versioning
  version: string; // e.g., "1.0", "1.1", "2.0"
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: string;
  content: string;
  createdAt: string;
  createdBy: string;
  comment?: string;
  hash?: string;
}

export interface Placeholder {
  key: string;
  label: string;
  category: string;
  description?: string;
}

export const AVAILABLE_PLACEHOLDERS: Placeholder[] = [
  { key: 'Cliente.Nome', label: 'Nome do Cliente', category: 'Cliente' },
  { key: 'Cliente.Documento', label: 'CPF/CNPJ do Cliente', category: 'Cliente' },
  { key: 'Cliente.Endereco', label: 'Endereço do Cliente', category: 'Cliente' },
  { key: 'Equipamento.Marca', label: 'Marca do Equipamento', category: 'Equipamento' },
  { key: 'Equipamento.Modelo', label: 'Modelo do Equipamento', category: 'Equipamento' },
  { key: 'Equipamento.Serial', label: 'Serial do Equipamento', category: 'Equipamento' },
  { key: 'OS.Numero', label: 'Número da OS', category: 'OS' },
  { key: 'OS.DataAbertura', label: 'Data de Abertura da OS', category: 'OS' },
  { key: 'OS.Defeito', label: 'Defeito Relatado', category: 'OS' },
  { key: 'Empresa.Nome', label: 'Nome da Empresa', category: 'Empresa' },
  { key: 'DataAtual', label: 'Data Atual', category: 'Geral' },
  // Inspiration from user's link (Financeiro/Contrato)
  { key: 'VW_CONTRATO.ValorGlobal', label: 'Valor Global do Contrato', category: 'Financeiro' },
  { key: 'VW_CONTRATO.QuantidadeParcelas', label: 'Quantidade de Parcelas', category: 'Financeiro' },
  { key: 'VW_CONTRATO.ValorParcela', label: 'Valor da Parcela', category: 'Financeiro' },
  { key: 'VW_CONTRATO.Nome_Aluno', label: 'Nome do Aluno/Cliente', category: 'Cliente' },
  { key: 'VW_CONTRATO.CPF_Aluno', label: 'CPF do Aluno/Cliente', category: 'Cliente' },
];
