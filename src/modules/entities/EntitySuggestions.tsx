import React, { useState, useEffect } from 'react';
import { EntitySuggestion } from './types';
import { entityService } from './entityService';
import { AlertCircle, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

type EntitySuggestionsProps = {
  query: string;
  onSelectExisting: (id: string) => void;
  onAllowCreate: (allow: boolean) => void;
};

export const EntitySuggestions: React.FC<EntitySuggestionsProps> = ({ query, onSelectExisting, onAllowCreate }) => {
  const [suggestions, setSuggestions] = useState<EntitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 400); // debounce

    return () => clearTimeout(timer);
  }, [query]);

  const fetchSuggestions = async () => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      onAllowCreate(true);
      return;
    }

    setLoading(true);
    try {
      const data = await entityService.getSuggestions(query);
      setSuggestions(data);
      
      const hasStrong = data.some(d => d.strength === 'strong');
      onAllowCreate(!hasStrong); 
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (query.trim().length < 3) {
    return null;
  }

  if (loading) {
    return <div className="text-sm text-zinc-500 my-2">Buscando cadastros similares...</div>;
  }

  if (suggestions.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600 my-2 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded border border-emerald-100 dark:border-emerald-900/50">
        <UserCheck className="h-4 w-4" />
        Nenhum cadastro similar encontrado. Pode prosseguir.
      </div>
    );
  }

  const hasStrong = suggestions.some(d => d.strength === 'strong');

  return (
    <div className={`my-4 p-3 rounded border text-sm ${hasStrong ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/50' : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/50'}`}>
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className={`h-4 w-4 ${hasStrong ? 'text-red-500' : 'text-amber-500'}`} />
        <strong className={hasStrong ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}>
          Encontramos cadastros parecidos. {hasStrong ? 'Parece ser o mesmo cadastro.' : 'Verifique antes de criar um novo.'}
        </strong>
      </div>
      
      <div className="space-y-2 mt-2">
        {suggestions.map(s => (
          <div key={s.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 bg-white dark:bg-zinc-800 rounded border">
            <div>
              <div className="font-medium text-zinc-900 dark:text-zinc-100">{s.display_name}</div>
              <div className="text-xs text-zinc-500">
                {s.document && <span className="mr-2">Doc: {s.document}</span>}
                {s.email && <span className="mr-2">Email: {s.email}</span>}
                <span className="font-semibold text-amber-600">Motivo: {s.reason}</span>
              </div>
            </div>
            <Button size="sm" variant="outline" className="mt-2 sm:mt-0 shadow-sm" onClick={() => onSelectExisting(s.id)}>
              Usar Este
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
