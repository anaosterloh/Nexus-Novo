// src/modules/settings/components/reportVariables.ts
export type VariableSourceType = 'system_entity' | 'manual_field' | 'fixed_value' | 'calculated' | 'image' | 'list';

export interface ReportVariable {
  key: string;            // The key used in template e.g., 'cliente.nome'
  label: string;          // Friendly name e.g., 'Nome do Cliente'
  description: string;    // Tooltip or helper description
  example: string;        // Render example constraint
  
  // New details
  sourceType: VariableSourceType;
  
  // Specific to 'system_entity'
  entity?: string;        // 'cliente', 'os', 'empresa', etc. Alias
  entityField?: string;   // 'nome', 'marca', etc.
  
  // Specific to 'manual_field'
  manualQuestion?: string; // String to prompt the user
  manualType?: string;     // 'texto', 'numero', 'data'
  
  // Specific to 'fixed_value'
  fixedValue?: string;
  
  // Specific to 'list'
  listEntity?: string;
  
  type?: string;          // Visual type hint
  isRequired?: boolean;
}

export const DEFAULT_REPORT_VARIABLES: ReportVariable[] = [
  { key: 'cliente.nome', label: 'Nome do Cliente', sourceType: 'system_entity', entity: 'cliente', entityField: 'nome', description: 'Nome completo do cliente selecionado', example: 'João da Silva', type: 'texto', isRequired: true },
  { key: 'cliente.endereco', label: 'Endereço', sourceType: 'system_entity', entity: 'cliente', entityField: 'endereco', description: 'Endereço do cliente selecionado', example: 'Rua das Flores, 123', type: 'texto' },
  { key: 'cliente.telefone', label: 'Telefone', sourceType: 'system_entity', entity: 'cliente', entityField: 'telefone', description: 'Telefone principal do cliente', example: '(11) 99999-9999', type: 'texto' },
  { key: 'cliente.documento', label: 'CPF/CNPJ', sourceType: 'system_entity', entity: 'cliente', entityField: 'documento', description: 'Documento do cliente', example: '123.456.789-00', type: 'texto' },
  
  { key: 'os.numero', label: 'Número da OS', sourceType: 'system_entity', entity: 'os', entityField: 'numero', description: 'Identificador único da Ordem de Serviço', example: 'OS-00045', type: 'texto' },
  { key: 'os.data_abertura', label: 'Data de Abertura', sourceType: 'system_entity', entity: 'os', entityField: 'data_abertura', description: 'Data em que a OS foi criada', example: '12/05/2026', type: 'data' },
  { key: 'os.marca', label: 'Marca do Equip.', sourceType: 'system_entity', entity: 'os', entityField: 'marca', description: 'Marca do equipamento em manutenção', example: 'Samsung', type: 'texto' },
  { key: 'os.modelo', label: 'Modelo do Equip.', sourceType: 'system_entity', entity: 'os', entityField: 'modelo', description: 'Modelo do equipamento em manutenção', example: 'Galaxy S23', type: 'texto' },
  { key: 'os.defeito', label: 'Defeito Informado', sourceType: 'system_entity', entity: 'os', entityField: 'defeito', description: 'Defeito relatado pelo cliente', example: 'Tela quebrada e bateria não carrega', type: 'texto' },
  { key: 'os.tecnico', label: 'Técnico Responsável', sourceType: 'system_entity', entity: 'os', entityField: 'tecnico', description: 'Nome do técnico designado', example: 'Carlos Almeida', type: 'texto' },
  
  { key: 'empresa.nome', label: 'Nome da Empresa', sourceType: 'system_entity', entity: 'empresa', entityField: 'nome', description: 'Nome da filial logada', example: 'Nexus Tecnologia', type: 'texto' },
  { key: 'empresa.cnpj', label: 'CNPJ da Empresa', sourceType: 'system_entity', entity: 'empresa', entityField: 'cnpj', description: 'Documento da filial logada', example: '00.000.000/0001-00', type: 'texto' },
  { key: 'empresa.telefone', label: 'Telefone da Empresa', sourceType: 'system_entity', entity: 'empresa', entityField: 'telefone', description: 'Telefone de contato da empresa', example: '(11) 4000-0000', type: 'texto' },
  { key: 'empresa.endereco', label: 'Endereço da Empresa', sourceType: 'system_entity', entity: 'empresa', entityField: 'endereco', description: 'Endereço completo da filial', example: 'Av. Paulista, 1000', type: 'texto' },
];

export function resolveVariables(content: string, selectedEntities: Record<string, boolean>, variables: ReportVariable[] = DEFAULT_REPORT_VARIABLES): string {
  let resolvedContent = content;
  
  variables.forEach(variable => {
    const regex = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
    let replacement = `[${variable.label}]`;
    
    if (variable.sourceType === 'system_entity') {
       if (variable.entity && selectedEntities[variable.entity]) {
         replacement = variable.example || replacement;
       } else {
         replacement = `[${variable.entity} não selecionado]`;
       }
    } else if (variable.sourceType === 'manual_field') {
       replacement = variable.example || `[🖊️ ${variable.manualQuestion}]`;
    } else if (variable.sourceType === 'fixed_value') {
       replacement = variable.fixedValue || '';
    } else {
       replacement = variable.example || replacement;
    }
    
    // For images or blocks we can add special logic here in the future
    if (variable.type === 'imagem') {
      replacement = `<img src="https://placehold.co/200x100?text=Imagem+${encodeURIComponent(variable.label)}" alt="${variable.label}" style="max-width: 100%; height: auto;" />`;
    }
    
    resolvedContent = resolvedContent.replace(regex, replacement);
  });

  // Handle #each blocks for basic preview simulating
  resolvedContent = resolvedContent.replace(/\{\{#each ([^}]+)\}\}(.*?)\{\{\/each\}\}/gs, (match, entity, blockContent) => {
    // For preview, we simulate 2 items
    return blockContent.replace(/\{\{([^}]+)\}\}/g, `[Item $1]`) + "<hr/>" + blockContent.replace(/\{\{([^}]+)\}\}/g, `[Item $1]`);
  });

  return resolvedContent;
}

export function getRequiredEntities(content: string, variables: ReportVariable[] = DEFAULT_REPORT_VARIABLES): string[] {
  const required = new Set<string>();
  variables.forEach(variable => {
    if (content.includes(`{{${variable.key}}}`)) {
      if (variable.sourceType === 'system_entity' && variable.entity) {
        required.add(variable.entity);
      }
    }
  });
  return Array.from(required);
}

export function getInvalidVariables(content: string, variables: ReportVariable[] = DEFAULT_REPORT_VARIABLES): string[] {
  const invalid = new Set<string>();
  // Match simple keys
  const matches = content.match(/\{\{([^}#\/]+)\}\}/g);
  if (matches) {
    const validKeys = variables.map(v => v.key);
    matches.forEach(match => {
      const key = match.replace(/[{}]/g, '').trim();
      if (!validKeys.includes(key) && !key.includes(' ')) {
        invalid.add(key);
      }
    });
  }
  return Array.from(invalid);
}
