# Roadmap de Evolução - Nexus ERP

Este plano foi criado para transformar o Nexus ERP em um "programa dos sonhos", completo, sem apagar base ou simplificar o conceito do negócio. Garantimos escalabilidade multiusuário e multiempresa.

## Fase 1 - Organização estrutural
**Status: ATUAL (Em Progresso)**
- Documentar o estado atual.
- Limpar telas duplicadas aproveitando as rotas atuais (props/tabs).
- Criar indicativo de "Status do Módulo" (ex: "Em Construção", "Operacional", "Visual").
- Manter regras visuais, garantindo que o programa abra e navegue de forma segura.

## Fase 2 - Equipamentos reais
**Status: ATUAL (Concluída Fase 2C - Frontend)**
- [x] Planejamento de negócio e estrutura (Fase 2A).
- [x] Criar Entidade e tabelas no SQLite para Equipamentos, histórico e locais.
- [x] Criar API robusta com rotas, validações e diferenciação entre equipamento próprio x do cliente.
- [x] Criar frontend real consumindo as APIs de equipamentos (Etapa 2C concluída).

## Fase 3 - Ordens de Serviço reais
- Criar a API e Tabelas para Ordens de Serviço (OS).
- Relacionar OS <-> Equipamento.
- Workflow da OS, status e aprovações e vínculo do Técnico.

## Fase 4 - Checklists e Laudos reais
- Atrelar os checklists estruturados diretamente à OS.
- Utilizar os templates do "Gerador de Relatório" com os dados do cliente, equipamento e serviços realizados.
- Exportação verdadeira final com PDF integrado.

## Fase 5 - Estoque conectado com OS
- Controlar retirada de peças do estoque e aplicar na Ordem de Serviço.
- Baixa automática dos insumos.
- Atualização do log de movimentações ('stock_movements').

## Fase 6 - Financeiro conectado com OS, vendas e compras
- Venda ou OS finalizada geram previsões atômicas no "Contas a Receber".
- Compras concluídas entram para "Contas a Pagar".
- Previsão de Fluxo de Caixa derivando do faturamento planejado e de custos futuros.

## Fase 7 - Documentos e alertas
- Controle de validade de calibragem/instrumentos do cliente.
- Alertas de vencimento para revisão.

## Fase 8 - Fiscal e XML
- Estruturação do "Fiscal Dashboard".
- Integração padrão com prefeituras (ISS) e SEFAZ (ICMS) – NF-e e NFS-e.
- Geração ou guarda dos XMLs.

## Fase 9 - Logística
- Conectar rotas de envio com Ordens de Coleta/Frete no Logistic Map.

## Fase 10 - Multiempresa, permissões e auditoria
- Implementar as diretrizes de tenant separation (`company_id`) com JWT, Login real e validação de permissões estritas no backend.
- Gravar eventos reais na tabela de log, permitindo painel de Auditoria efetivo.

## Fase 11 - Integrações
- APIs via webhooks ou integrador terceiro.

## Fase 12 - IA opcional pelo backend
- Ativar Google Gen AI (LLM) direto no server/Express com rotas privadas para apoiar extração de dados da OS, resumos corporativos, ou criação de laudos com supervisão.
