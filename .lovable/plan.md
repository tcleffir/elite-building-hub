# Super Admin x Natalia: visões separadas, base de dados única

## Objetivo
As duas visões (Administradora CBRE e Natalia Landi) NÃO são unificadas — cada uma mantém seus módulos e telas. Porém ambas leem e gravam na MESMA base de dados: ativos, andares, conjuntos, locatários, contratos e IPTU. Um ativo/número/conjunto que existe em uma visão existe na outra, sempre com os mesmos valores.

## 1. Base única de dados (fonte da verdade)
- Remover 360JK, You, Capitale, Lux e demais ativos antigos da visão Super Admin; ambas as visões passam a ler os 13 ativos HGRE11.
- Criar um "store" central persistido (navegador) com: Ativos (prédios) > Andares > Conjuntos (unidades) > Locatário > Contrato > IPTU por conjunto.
- Todos os números do ativo (ABL, ocupação, aluguel, IPTU, nº de conjuntos vagos/ocupados) passam a ser calculados a partir dos conjuntos — nunca digitados em separado. Ex.: 90% de ocupação = área locada / área total dos conjuntos.

## 2. Cadastro de Ativo e Conjunto
- "Adicionar Ativo" (ambas as visões) grava no store: nome, endereço, nº de andares, conjuntos por andar, área por conjunto. O ativo aparece imediatamente no Mapa de Ativos, Documentos, Contratos, IPTU, Financeiro etc.
- "Adicionar Locatário" aloca um locatário em um ou mais conjuntos.
- Mapa do Ativo do Super Admin substituído pelo mesmo Mapa/Stacking Plan da Natalia.

## 3. Chucri Zaidan totalmente preenchido
- Andares, conjuntos (101, 102, 201…), locatários, contratos, aluguel/m², garantias, reajustes, revisionais e IPTU por conjunto, todos coerentes entre si. Conjunto 71 (7º andar) deixado vago para o teste.

## 4. Contrato via leitura de IA
- Upload do PDF > IA extrai locatário, locador, fiador, conjunto, andar, vagas, aluguel, vencimento, índice/periodicidade de reajuste, carência, início/vigência, garantia, revisional.
- Tela de revisão com seleção de ativo/andar/conjunto (teste: Chucri Zaidan, 7º andar), depois grava no store e aparece em: Contratos, Stacking Plan, Reajustes, Revisionais, Competência, IPTU (conjunto passa a ter devedor) e Financeiro.
- Atualizar a função de IA para o modelo padrão atual e validar com o aditivo enviado (Lux Energy / AVM, R$ 31.000, IPCA anual, vencimento dia 5, carência 177 dias, início 01/09/2022, fiador BC Comercializadora).

## 5. Contratos
- Novo status "Inativo" (manual) + filtro "Inativos"; vencidos continuam ativos/renováveis.
- Ordenação por conjunto crescente/decrescente (101, 102, 201…).
- Gráfico "Mês de Reajuste" (% por mês, Jan–Dez) na aba Reajustes e "Concentração das Revisionais" (Em aberto, 2026…2030+) na aba Revisionais, no visual do relatório Patria.

## 6. IPTU por conjunto
- Matrícula do terreno, da construção e de cada conjunto; IPTU cobrado por conjunto com o locatário como devedor e histórico de pagamentos por locatário. Total do ativo = soma dos conjuntos (mesmo valor em todas as telas).

## 7. Super Admin — renomeações e contratos de prestadores
- Módulo "Financeiro" renomeado para "Administrativo"; título "Financeiro — IPMS" vira "Financeiro".
- Submódulo Contratos do Super Admin passa a ser de prestadores de serviço do edifício (recorrentes e pontuais: limpeza, segurança, manutenção, elevadores etc.), sem locatários.

## Detalhes técnicos
- Novo `src/lib/portfolio-store.ts` (Context + localStorage) derivado de `getHGRE11PortfolioBuildings()`; páginas atuais passam a consumi-lo.
- `analyze-document-ai` migrado para `openai/gpt-6-astra` via Responses (streaming), com campos de conjunto/andar/vagas/fiador/carência em dias.
- Gráficos com Recharts usando tokens Patria.

## Ponto em aberto
A frase sobre contratos de prestadores terminou em "tudo que…". Vou assumir: todos os contratos com terceiros (recorrentes e pontuais) ligados ao edifício, com vigência, valor, SLA e reajuste. Me corrija se faltou algo.
