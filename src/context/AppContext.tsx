import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Company {
  id: string;
  name: string;
  cnpj: string;
}

interface Branch {
  id: string;
  companyId: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  role: string;
  permissions?: any;
}

interface AppContextType {
  currentCompany: Company | null;
  currentBranch: Branch | null;
  user: User | null;
  companies: Company[];
  branches: Branch[];
  setCompany: (company: Company) => void;
  setBranch: (branch: Branch) => void;
  setUserRole: (role: string) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>({
    id: 'user_1',
    name: 'Admin Nexus',
    role: 'admin',
    permissions: {
      modules: {
        sales: { view: true, create: true, edit: true, approve: true },
        inventory: { view: true, create: true, edit: true, approve: true },
        finance: { view: true, create: true, edit: true, approve: true },
        technical: { view: true, create: true, edit: true, approve: true },
        reports: { view: true, create: true, edit: true, approve: true },
        settings: { view: true, create: true, edit: true, approve: true },
      }
    }
  });

  useEffect(() => {
    // Initial load of companies
    fetch('/api/context/companies')
      .then(res => res.json())
      .then(data => {
        setCompanies(data);
        if (data.length > 0) {
          const savedCompanyId = localStorage.getItem('nexus_company_id');
          const company = data.find((c: Company) => c.id === savedCompanyId) || data[0];
          setCurrentCompany(company);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (currentCompany) {
      localStorage.setItem('nexus_company_id', currentCompany.id);
      fetch(`/api/context/branches/${currentCompany.id}`)
        .then(res => res.json())
        .then(data => {
          setBranches(data);
          if (data.length > 0) {
            const savedBranchId = localStorage.getItem('nexus_branch_id');
            const branch = data.find((b: Branch) => b.id === savedBranchId) || data[0];
            setCurrentBranch(branch);
          } else {
            setCurrentBranch(null);
          }
        });
    }
  }, [currentCompany]);

  useEffect(() => {
    if (currentBranch) {
      localStorage.setItem('nexus_branch_id', currentBranch.id);
    }
  }, [currentBranch]);

  const setCompany = (company: Company) => setCurrentCompany(company);
  const setBranch = (branch: Branch) => setCurrentBranch(branch);
  const setUserRole = (role: string) => {
    setUser(prev => prev ? { ...prev, role } : null);
  };

  return (
    <AppContext.Provider value={{ 
      currentCompany, 
      currentBranch, 
      user, 
      companies, 
      branches, 
      setCompany, 
      setBranch,
      setUserRole,
      loading 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
