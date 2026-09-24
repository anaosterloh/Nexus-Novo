import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);
  const { login, user, loading } = useAuth();

  // If already logged in, redirect to home
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoadingLogin(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          login: loginInput.trim(),
          email: loginInput.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      login(data.user, data.session, data.permissions);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingLogin(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-3 rounded-xl shadow-lg">
            <Shield className="w-8 h-8" />
          </div>
        </div>
        <Card className="border-0 shadow-xl shadow-zinc-200/50 dark:shadow-none">
          <CardHeader className="space-y-2 text-center pb-8">
            <CardTitle className="text-2xl font-bold tracking-tight">Acesse sua conta</CardTitle>
            <CardDescription>
              Insira suas credenciais para entrar no Nexus ERP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm text-center border border-red-100">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Usuário ou e-mail</label>
                <Input 
                  type="text" 
                  value={loginInput} 
                  onChange={e => setLoginInput(e.target.value)}
                  placeholder="admin ou admin@nexus.local" 
                  required 
                  className="bg-zinc-50/50"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Senha</label>
                </div>
                <Input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required 
                  className="bg-zinc-50/50"
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loadingLogin}>
                {loadingLogin ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col border-t bg-zinc-50/50 dark:bg-zinc-900/50 p-6">
             <div className="text-xs text-zinc-500 mb-4 font-semibold uppercase tracking-wider text-center">Contas de Teste</div>
              <div className="grid grid-cols-2 gap-3 text-xs text-zinc-600 dark:text-zinc-400 w-full text-center">
               <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-md border flex flex-col space-y-1">
                 <span className="font-bold text-zinc-800 dark:text-zinc-200">Admin</span>
                 <span>admin / admin123</span>
               </div>
               <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-md border flex flex-col space-y-1">
                 <span className="font-bold text-zinc-800 dark:text-zinc-200">Vendas</span>
                 <span>vendas / vendas123</span>
               </div>
               <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-md border flex flex-col space-y-1">
                 <span className="font-bold text-zinc-800 dark:text-zinc-200">Financeiro</span>
                 <span>financeiro / financeiro123</span>
               </div>
               <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-md border flex flex-col space-y-1">
                 <span className="font-bold text-zinc-800 dark:text-zinc-200">Técnico</span>
                 <span>tecnico / tecnico123</span>
               </div>
             </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
