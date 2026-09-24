# Status dos Módulos - Nexus ERP

O sistema possui uma estrutura robusta visível, mas os bastidores (APIs e Banco de Dados) estão em estágios variados.

**Legenda de Status:**
- `[Operacional]`: Módulo com tabelas de banco, rotas na API e integração completa (ou bem próxima ao completo real).
- `[Parcial]`: Partes funcionam reais, outras não.
- `[Visual pronto]`: Interface montada, mockada, botões visíveis, porém não salva permanentemente no banco.
- `[Em construção]`: Falta de dados e componentes incompletos.
- `[Planejado]`: Funcionalidade prevista, mock inicial ou placeholder.
- `[Requer integração]`: Depende de API terceira (ex: emissão NF-e).
- `[Requer configuração]`: Depende de ajustes finos de regras multiempresa ou de sistema.

## Módulos de Base
- Dashboard: `[Parcial]` (Lê de dados do DB, mas precisa unificar com outras áreas)
- Clientes: `[Operacional]`
- Fornecedores: `[Operacional]`
- Produtos e Serviços: `[Operacional]`
- Transportadoras: `[Operacional]`
- Empresas / Filiais: `[Parcial]`
- Usuários: `[Parcial]`
- Permissões: `[Visual pronto]`

## Módulos de Operação e Comercial
- Agenda: `[Visual pronto]`
- Vendas / Pedidos: `[Operacional]`
- Compras e Solicitações: `[Operacional]`
- CRM: `[Visual pronto]`
- Configuração de Preços: `[Visual pronto]`

## Técnica e Manutenção
- Equipamentos: `[Operacional]` (Banco de dados, API real e Frontend operacionais. Fase 2C concluída)
- Ordens de Serviço: `[Visual pronto]`
- Laudos / Relatórios: `[Visual pronto]` (Gerador operacional localmente, dados não fixados globalmente)
- Checklists: `[Visual pronto]`

## Estoque
- Saldo: `[Parcial]`
- Movimentações / Entradas / Inventário: `[Planejado] / [Visual pronto]`

## Financeiro e Fiscal
- Contas Pagar/Receber: `[Operacional]` (Simples)
- Fluxo de Caixa: `[Visual pronto]`
- Conciliação Bancária: `[Planejado]`
- Fiscal (NF-e, Impostos, XML): `[Visual pronto] / [Requer integração]`

## Outros
- Documentos: `[Visual pronto]`
- Logística e Frotas: `[Visual pronto]`
- Auditoria: `[Visual pronto]`
- Comunicações (Chat, Avisos): `[Visual pronto]`
- Configurações do Sistema: `[Visual pronto]`
- APIs / Integrações: `[Planejado]`
- IA (Inteligência Artificial): `[Desativado temporariamente]`
