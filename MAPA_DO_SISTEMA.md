# Mapa do Sistema - Nexus ERP

Este documento lista todos os módulos do sistema, suas rotas, componentes principais e a situação atual (Backend Real, Mock, Placeholder, etc).

## 1. Dashboard e Geral
- **Rota:** `/`
- **Componente:** `Dashboard` (em `src/modules/dashboard/components/Dashboard.tsx`)
- **Status Atual:** **Parcial** (Exibe métricas buscando dados reais como inventory/items, purchase-requests, sales/orders, finance, mas parte das visualizações podem estar complementadas com dados calculados na hora).

## 2. Agenda e Contatos
- **Rota:** `/agenda` -> `CalendarView` (Mock visual)
- **Rota:** `/agenda/contatos` -> `ContactDirectory` (Mock visual)
- **Status Atual:** **Mock visual**. Próxima melhoria: Conectar com banco de dados para agendamentos e calendário.

## 3. Cadastros Gerais
- **Rota:** `/cadastros/geral` -> `CustomerList` + `SupplierList` (Reais via DB)
- **Rota:** `/cadastros/produtos` -> `InventoryList` (Real via DB)
- **Rota:** `/cadastros/transportadoras` -> `CarrierList` (Real via DB)
- **Rota:** `/cadastros/tabelas` -> `TabelaList` (Provavelmente mock)
- **Rota:** `/cadastros/veiculos` -> `VehicleList` (Provavelmente mock)
- **Rota:** `/cadastros/checklists` -> `ChecklistManager` (Mock visual)
- **Rota:** `/cadastros/estudos` -> `ProductStudiesDashboard` (Mock visual)

## 4. Comercial e Vendas
- **Rota:** `/comercial/pedidos` -> `SalesOrderList` (Real via DB)
- **Rota:** `/comercial/crm` -> `SalesFunnel` (Mock visual)
- **Rota:** `/comercial/faturamento` -> `BillingDashboard` (Mock visual)
- **Rota:** `/comercial/comissoes` -> `CommissionDashboard` (Mock visual)
- **Rota:** `/vendas/conferencia` -> `SalesConference` (Mock visual)
- **Rota:** `/comercial/precos` -> `PriceTableList` (Mock visual)
- **Rota:** `/comercial/cartas` -> `CommercialLetters` (Mock visual/Placeholder)

## 5. Estoque e Compras
- **Rota:** `/estoque/dashboard` -> `StockDashboard` (Parcial - visual)
- **Rota:** `/estoque/saldo` -> `StockBalance` (Parcial - DB/visual)
- **Rota:** `/estoque/entradas` -> `StockEntries` (Placeholder)
- **Rota:** `/estoque/compras` -> `PurchaseOrderList` (Real via DB)
- **Rota:** `/estoque/solicitacoes` -> `PurchaseRequestList` (Real via DB)
- **Rota:** `/estoque/movimentacoes` -> `StockMovements` (Parcial)
- **Rota:** `/estoque/inventario` -> `StockInventory` (Parcial)

## 6. Financeiro
- **Rota:** `/financeiro/movimento` -> `FinanceDashboard` (Real via DB - Contas a Pagar e Receber)
- **Rota:** `/financeiro/pagar` -> `AccountsPayable` (Real via DB)
- **Rota:** `/financeiro/receber` -> `AccountsReceivable` (Real via DB)
- **Rota:** `/financeiro/fluxo` -> `CashFlow` (Mock visual)
- **Rota:** `/financeiro/bancos` -> `BankAccounts` (Mock visual)
- **Rota:** `/financeiro/conciliacao` -> `BankReconciliation` (Mock/Placeholder)

## 7. Técnica (Ordens de Serviço e Laudos)
- **Rota:** `/tecnica/equipamentos` -> `EquipmentList` (Real via DB e API)
- **Rota:** `/tecnica/equipamentos/:id` -> `EquipmentDetails` (Real via DB e API)
- **Rota:** `/tecnica/os` -> `ServiceOrderList` (Mock visual)
- **Rota:** `/tecnica/laudos` -> Visualização de Laudos (Parcial/Mock)
- **Status Atual:** Banco de dados, API e Frontend de Equipamentos operacionais (Fase 2C). Histórico integrado. OS, documentos e alertas integrados aos equipamentos ainda estão em construção.

## 8. Logística
- **Rota:** `/logistica/coletas` -> `LogisticsDashboard(tab='coletas')`
- **Rota:** `/logistica/mapa` -> `LogisticsMap`
- **Rota:** `/logistica/fretes` -> `LogisticsDashboard(tab='fretes')`
- **Status Atual:** **Mock visual**. 

## 9. Fiscal
- **Rota:** `/fiscal/notas` -> `FiscalDashboard(tab='notas')`
- **Rota:** `/fiscal/impostos` -> `FiscalDashboard(tab='impostos')`
- **Rota:** `/fiscal/config` -> `FiscalDashboard(tab='configuracoes')`
- **Status Atual:** **Mock visual**.

## 10. Auditoria e Segurança
- **Rota:** `/auditoria/logs` -> `AuditDashboard(tab='logs')`
- **Rota:** `/auditoria/acessos` -> `AuditDashboard(tab='acessos')`
- **Status Atual:** **Mock visual**.

## 11. Relatórios e Documentos
- **Rota:** `/relatorios` -> `ReportGenerator` (Operacional/Interface complexa)
- **Rota:** `/documentos/gerador` -> `DocumentDashboard(tab='gerador')`
- **Rota:** `/documentos/modelos` -> `DocumentDashboard(tab='modelos')`
- **Status Atual:** Editor Visual avançado + Mock de laudos/arquivos.

## 12. Comunicações
- **Rota:** `/comunicacoes/avisos` -> `NotificationCenter` (Mock visual)
- **Rota:** `/comunicacoes/chat` -> `ChatModule` (Mock visual)

## 13. Configurações
- **Rota:** `/configuracoes` -> `SettingsDashboard` (Mock visual / LocalState)
- **Rota:** `/configuracoes/apis` -> `APIManagement` (Mock visual)
