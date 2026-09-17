# Escopo Pátria — Módulo Proprietário: o que temos, o que adaptar, o que criar

Levantamento feito sobre o código atual (páginas do Proprietário, bibliotecas de dados,
serviços de exportação PDF/Excel). Abaixo, cada item da reunião classificado em
**Manter**, **Adaptar** ou **Criar**, mais o que fica **fora do escopo inicial**.

---

## 1. Portfólio

**Já existe e mantemos**
- Seleção de Ativos/Fundos (grade Tijolo/Papel, HGRE11 padrão) e Big Numbers.
- Distribuição geográfica + Mapa de Ativos.
- Filtro por competência mensal (snapshot congelado por mês).
- Análise de Leakage.
- Análise do Portfólio: receita por ativo, timeline de vencimentos, comparativo R$/m².
- Alertas de contrato e documento; visão de locatários.

**Adaptar**
- Card do mapa: exibir nome, endereço, m² construído, aluguel mensal total, ocupação física e alertas ativos em um mesmo balão/painel.
- Filtro de competência: acrescentar janelas rápidas (3, 6, 12 meses) e período personalizado, hoje só mês a mês.
- Alertas e visão de locatários: filtros combinados por ativo + locatário + status, com R$ e receita mensal total.

**Criar**
- Exportação da tela como "visualização personalizada Pátria": seleção de quais blocos entram no PDF (usa o serviço de PDF já existente, com o brand kit Pátria).

## 2. Contratos

**Já existe e mantemos**
- Abas Locatários, Reajustes, Garantias, Revisionais, Por Competência, Vencimentos.
- Import de contrato manual e por leitura de IA.
- Gestão contratual com pipeline de status e histórico.

**Adaptar**
- Big Numbers do topo: padronizar os seis indicadores pedidos (total, criticidade, receita mensal, em vencimento, em reajuste, em revisional).
- Filtros globais de locatário e ativo aplicados a todas as abas.
- Reajustes: leitura automática do índice e do prazo a partir do contrato, com override manual e notificação pela plataforma.
- Garantias: modalidade negociada por locatário (fiança bancária, caução, seguro fiança, título), pipeline de vencimento ao lado, anexo/leitura de boleto de garantia e import/export de documento.
- Revisionais: elegibilidade por tempo, valor atual, motivação selecionável, e-mail de formalização e aplicação automática do novo valor no período.
- Vencimentos: ações de cobrar renovação, anexar documentos de renovação e encerrar contrato.
- Por Competência: exportação Excel e PDF da janela escolhida.

**Criar**
- Relatório exportável da página inteira, por ativo ou portfólio completo, com seleção de conteúdo.

## 3. Financeiro

**Já existe e mantemos**
- Fechamento Mensal (Esperado x Realizado) com série por competência e aba de Inadimplência.
- Conciliação Financeira com cobranças e Entradas Bancárias para vínculo manual.
- Despesas & NOI; Outros Recebimentos; Relatórios de Locação com histórico e agendamentos.

**Adaptar**
- Fechamento Mensal: gráfico do que permanece em aberto e filtros por fundo, ativo e competência em toda a aba.
- Inadimplência: cálculo de juros/multa conforme contrato, seleção múltipla com cobrança individual por e-mail personalizado em um clique, e export Excel com números tratáveis por fórmula.
- Conciliação: aluguel e IPTU frente ao valor esperado, ajuste manual, e-mail ao locatário ou ao banco, correção do esperado e aceitar/cobrar divergência.
- Relatórios: consolidar como Report de saúde de contratos e cadastro, compliance e garantias, financeiro, histórico e vencimentos — em Excel tratado e PDF personalizável, com histórico filtrável.
- Métricas e KPIs: sair de dentro do Financeiro e passar a módulo próprio no menu, com filtros por portfólio, fundo, ativo e período.

**Criar**
- Integração Open Finance Itaú: captura de entradas e saídas do banco, identificação e uso nos três pontos acima (recebimentos, conciliação, entradas bancárias). Depende de credenciais e habilitação do Itaú.
- Registro de Receitas e Despesas por fundo via importação de template Excel, com leitura do arquivo e montagem automática dos gráficos e registros.

## 4. Ativos

**Já existe e mantemos**
- Mapa/lista de Ativos com abas Geral, Unidades e Chamados.
- Documentos: upload manual e por IA com confiança para validação humana, status para renovação, biblioteca com pastas e geração de relatórios (Consumo, Críticos, Atenção, Geral).

**Criar**
- Stacking Plan andar a andar (e por galpão dividido): áreas BOMA e NBR, custo do m² de IPTU, garantia e aluguel, andar dividido entre múltiplos locatários com clique para abrir cada um, contato do locatário, histórico da unidade (troca de locatário, obras, operações), alertas e chamados vinculados.

## 5. Operações

**Manter como está**
- Reservas de espaços e áreas comuns, com controle.
- Comunicação com edifício, locatários e comunicados.

**Fora do escopo inicial do Pátria**
- Chamados com SLA (existe, fica desativado/oculto para eles).
- Calendário com integração Google/Outlook (existe base; integração não entra agora).

## 6. Relatório Mensal

**Já existe e mantemos**: gráficos, detalhes, narrativa do gestor por competência.

**Adaptar**: entrada de fotos da operação e personalização do relatório gerencial no brand kit Pátria.

## 7. Sustentabilidade / ESG

Módulos de telemetria (energia, água, gás), resíduos, neutralização de carbono, LEED,
Mercado Livre de Energia e I-REC ficam presentes, porém **sem integração** para o Pátria
neste momento.

## 8. Integrações externas

- **CRM Monday**: criar conexão do fluxo interno de operações com a plataforma. Depende de credencial Monday.
- **IPTU Prefeitura**: criar conexão; onde não houver API pública, usar o controle de valores já existente na plataforma.

## 9. Não implementar agora

- Marketplace de fornecedores e cotações.
- Apoio ao Gerente / Gestor (treinamentos e padronização de processos).

---

## Ordem de execução sugerida

1. Adaptações de Portfólio e Contratos (maior parte do valor percebido, sem dependência externa).
2. Exportações personalizadas (Portfólio, Contratos, Report Financeiro) com brand kit Pátria.
3. Financeiro: inadimplência, conciliação, import de template Excel, KPIs como módulo próprio.
4. Stacking Plan em Ativos.
5. Integrações: Open Finance Itaú, Monday, IPTU (conforme credenciais chegarem).
6. Relatório Mensal com fotos e narrativa.

## Notas técnicas

- Base atual: React + Vite, dados em `src/lib/*-data.ts` (mock/estruturado), backend Lovable Cloud disponível.
- Exportação: `src/lib/pdf-report-service.ts` (paleta Pátria já aplicada) e `src/lib/export-service.ts` (Excel/OFX) servem de base para todos os relatórios exportáveis.
- Competência: `src/lib/portfolio-competencia.ts` guarda snapshots congelados por mês; janelas de 3/6/12 meses serão agregações sobre essa camada.
- Integrações bancária/Monday/IPTU exigem chamadas server-side em funções do backend, com credenciais guardadas em segredos — nenhuma chave no front.
- Itens marcados como estimados nos ativos (endereços aproximados e valores proporcionais do HGRE11) seguem pendentes de planilha oficial por ativo.
