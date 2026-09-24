import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/modules/dashboard/components/Dashboard';
import { InventoryList } from '@/modules/inventory/components/InventoryList';
import { EntityList } from '@/modules/entities/EntityList';
import { EntityReviewPanel } from '@/modules/entities/EntityReviewPanel';
import { PurchaseRequestList } from '@/modules/inventory/components/PurchaseRequestList';
import { PurchaseOrderList } from '@/modules/inventory/components/PurchaseOrderList';
import { SalesOrderList } from '@/modules/sales/components/SalesOrderList';
import { BillingDashboard } from '@/modules/sales/components/BillingDashboard';
import { CarrierList } from '@/modules/sales/components/CarrierList';
import { FinanceDashboard } from '@/modules/finance/components/FinanceDashboard';
import { AccountsPayable } from '@/modules/finance/components/AccountsPayable';
import { AccountsReceivable } from '@/modules/finance/components/AccountsReceivable';
import { CashFlow } from '@/modules/finance/components/CashFlow';
import { BankAccounts } from '@/modules/finance/components/BankAccounts';
import { BankReconciliation } from '@/modules/finance/components/BankReconciliation';
import { TaskControlTable } from '@/modules/dashboard/components/TaskControlTable';
import { ServiceOrderList } from '@/modules/technical/components/ServiceOrderList';
import { ChecklistManager } from '@/modules/technical/components/ChecklistManager';
import { APIManagement } from '@/modules/settings/components/APIManagement';
import { CalendarView } from '@/modules/agenda/components/CalendarView';
import { LogisticsDashboard } from '@/modules/logistics/components/LogisticsDashboard';
import { LogisticsMap } from '@/modules/logistics/components/LogisticsMap';
import { VehicleList } from '@/modules/logistics/components/VehicleList';
import { FiscalDashboard } from '@/modules/fiscal/components/FiscalDashboard';
import { AuditDashboard } from '@/modules/audit/components/AuditDashboard';
import { DocumentDashboard } from '@/modules/documents/components/DocumentDashboard';
import { CommissionDashboard } from '@/modules/sales/components/CommissionDashboard';
import { SalesConference } from '@/modules/sales/components/SalesConference';
import { PriceTableList } from '@/modules/sales/components/PriceTableList';
import { SalesFunnel } from '@/modules/sales/components/SalesFunnel';
import { StockDashboard } from '@/modules/inventory/components/StockDashboard';
import { StockBalance } from '@/modules/inventory/components/StockBalance';
import { StockEntries } from '@/modules/inventory/components/StockEntries';
import { StockMovements } from '@/modules/inventory/components/StockMovements';
import { StockInventory } from '@/modules/inventory/components/StockInventory';
import { TabelaList } from '@/modules/settings/components/TabelaList';
import EquipmentList from '@/modules/technical/equipments/EquipmentList';
import EquipmentDetails from '@/modules/technical/equipments/EquipmentDetails';
import { SettingsDashboard } from '@/modules/settings/components/SettingsDashboard';
import { ReportGenerator } from '@/modules/settings/components/ReportGenerator';
import { NotificationCenter } from '@/modules/notifications/NotificationCenter';
import { ChatModule } from '@/modules/settings/components/ChatModule';
import { ProductStudiesDashboard } from '@/modules/studies/components/ProductStudiesDashboard';
import { UrgentAlertOverlay } from '@/components/ui/UrgentAlertOverlay';
import { AppProvider } from '@/context/AppContext';
import { PrivacyProvider } from '@/context/PrivacyContext';
import { PermissionsProvider } from '@/context/PermissionsContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LoginPage } from '@/modules/auth/LoginPage';
import { UserManagement } from '@/modules/auth/UserManagement';
import { Toaster } from 'sonner';
import { Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { CommercialLetters } from '@/modules/sales/components/CommercialLetters';

import { ContactDirectory } from '@/modules/agenda/components/ContactDirectory';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando Nexus ERP...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const CatchAllRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <PrivacyProvider>
          <PermissionsProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="agenda" element={<CalendarView />} />
                    <Route path="agenda/contatos" element={<ContactDirectory />} />
                    
                    {/* Cadastros */}
                    <Route path="cadastros/revisao" element={<EntityReviewPanel />} />
                    <Route path="cadastros/geral" element={<EntityList viewRole="all" title="Geral (Compatibilidade)" />} />
                    <Route path="cadastros/entidades" element={<EntityList viewRole="all" />} />
                    <Route path="cadastros/clientes" element={<EntityList viewRole="customer" />} />
                    <Route path="cadastros/fornecedores" element={<EntityList viewRole="supplier" />} />
                    
                    <Route path="cadastros/produtos" element={<InventoryList />} />
                    <Route path="cadastros/transportadoras" element={<CarrierList />} />
                    <Route path="cadastros/tabelas" element={<TabelaList />} />
                    <Route path="cadastros/veiculos" element={<VehicleList />} />
                    <Route path="cadastros/checklists" element={<ChecklistManager />} />
                    <Route path="cadastros/estudos" element={<ProductStudiesDashboard />} />
                    <Route path="configuracoes/apis" element={<APIManagement />} />
                    <Route path="configuracoes/usuarios" element={<UserManagement />} />
                    
                    {/* Comercial */}
                    <Route path="comercial/pedidos" element={<SalesOrderList />} />
                    <Route path="comercial/crm" element={<SalesFunnel />} />
                    <Route path="comercial/faturamento" element={<BillingDashboard />} />
                    <Route path="comercial/comissoes" element={<CommissionDashboard />} />
                    <Route path="vendas/conferencia" element={<SalesConference />} />
                    <Route path="comercial/precos" element={<PriceTableList />} />
                    <Route path="comercial/cartas" element={<CommercialLetters />} />
                    
                    {/* Estoque */}
                    <Route path="estoque/dashboard" element={<StockDashboard />} />
                    <Route path="estoque/saldo" element={<StockBalance />} />
                    <Route path="estoque/entradas" element={<StockEntries />} />
                    <Route path="estoque/compras" element={<PurchaseOrderList />} />
                    <Route path="estoque/solicitacoes" element={<PurchaseRequestList />} />
                    <Route path="estoque/movimentacoes" element={<StockMovements />} />
                    <Route path="estoque/inventario" element={<StockInventory />} />
                    
                    {/* Financeiro */}
                    <Route path="financeiro/movimento" element={<FinanceDashboard />} />
                    <Route path="financeiro/pagar" element={<AccountsPayable />} />
                    <Route path="financeiro/receber" element={<AccountsReceivable />} />
                    <Route path="financeiro/fluxo" element={<CashFlow />} />
                    <Route path="financeiro/bancos" element={<BankAccounts />} />
                    <Route path="financeiro/conciliacao" element={<BankReconciliation />} />
                    
                    {/* Processos */}
                    <Route path="processos/controle" element={<TaskControlTable />} />
                    
                    {/* Técnica */}
                    <Route path="tecnica/equipamentos" element={<EquipmentList />} />
                    <Route path="tecnica/equipamentos/:id" element={<EquipmentDetails />} />
                    <Route path="tecnica/os" element={<ServiceOrderList />} />
                    <Route path="tecnica/laudos" element={<DocumentDashboard />} />
                    
                    {/* Logística */}
                    <Route path="logistica/coletas" element={<LogisticsDashboard defaultTab="coletas" />} />
                    <Route path="logistica/mapa" element={<LogisticsMap />} />
                    <Route path="logistica/fretes" element={<LogisticsDashboard defaultTab="fretes" />} />
                    
                    {/* Fiscal */}
                    <Route path="fiscal/notas" element={<FiscalDashboard defaultTab="notas" />} />
                    <Route path="fiscal/impostos" element={<FiscalDashboard defaultTab="impostos" />} />
                    <Route path="fiscal/config" element={<FiscalDashboard defaultTab="configuracoes" />} />
                    
                    {/* Auditoria */}
                    <Route path="auditoria/logs" element={<AuditDashboard defaultTab="logs" />} />
                    <Route path="auditoria/seguranca" element={<AuditDashboard defaultTab="seguranca" />} />
                    <Route path="auditoria/acessos" element={<AuditDashboard defaultTab="acessos" />} />
                    
                    {/* Outros */}
                    <Route path="relatorios" element={<ReportGenerator />} />
                    <Route path="documentos/gerador" element={<DocumentDashboard defaultTab="gerador" />} />
                    <Route path="documentos/modelos" element={<DocumentDashboard defaultTab="modelos" />} />
                    <Route path="comunicacoes/mural" element={<NotificationCenter />} />
                    <Route path="comunicacoes/chat" element={<ChatModule />} />
                    <Route path="configuracoes" element={<SettingsDashboard />} />
                  </Route>

                  <Route path="*" element={<CatchAllRedirect />} />
                </Route>
              </Routes>
              <Toaster position="top-right" richColors closeButton />
              <UrgentAlertOverlay />
            </BrowserRouter>
          </PermissionsProvider>
        </PrivacyProvider>
      </AppProvider>
    </AuthProvider>
  );
}
