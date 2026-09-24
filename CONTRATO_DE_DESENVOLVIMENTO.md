# Contrato de Desenvolvimento - Regras Obrigatórias

Para evitar quebras futuras no sistema e garantir que ele cresça focado na escalabilidade, multiusuário, multiempresa e segurança:

1. **Nunca apagar módulo sem autorização.**
2. **Nunca reescrever tela inteira se for possível evoluir por partes.**
3. **Nunca alterar visual global sem autorização.** (Preservar paleta e estilo Tailwind, ui/components como Cards, Badges, Botões).
4. **Nunca ativar IA sem autorização.**
5. **Nunca colocar chave de API no frontend.** O acesso à IA e integrações deve sempre vir a partir do Node.js Backend.
6. **Sempre preservar dados existentes** (manter Tabelas do DB intactas e fluxos funcionais atuantes no banco).
7. **Sempre manter compatibilidade multiempresa.** Rotas do backend exigem o envio passivo de context (`company_id`, etc), use-o em query/body.
8. **Sempre criar banco/API antes de dizer que um módulo é real.**
9. **Sempre diferenciar mock de dado real.** Usar o `ModuleStatusBadge` em telas que parecem muito completas, mas não salvam.
10. **Sempre testar `npm run dev` após mudanças**, validando se as telas abrem, carregam e botões essenciais respondem sem crashes ou erros no console.
11. **Sempre listar arquivos alterados.** Antes de alterar explicar o porquê.
12. **Sempre explicar como testar.** Pós-alterações, indicar quais cliques usar para validar a funcionalidade.
