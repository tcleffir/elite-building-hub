## Conciliação Financeira — núcleo operacional

Vou estender o módulo de Conciliação Financeira existente (`ProprietarioConciliacaoFinanceira.tsx` + `reconciliation-engine.ts` + `reconciliation-data.ts`), sem redesenhar a interface. Tudo se apoia no motor de valor esperado, no recorte por competência e nos status já existentes (Conciliado, Divergência, Em aberto Banco/Cliente, Inadimplente, Antecipado).

### O que vou construir

**1. Ajustes mensais ao valor esperado (Funcionalidade 5 — base obrigatória)**
- Novo tipo `AjusteMensal` em `reconciliation-data.ts` com tipos: `desconto_negociado`, `inadimplencia_arrastada`, `credito_antecipado`, `condicao_especial`, `ajuste_manual`.
- O engine passa a calcular `ajustes[]` automaticamente:
  - `inadimplencia_arrastada`: soma do que ficou em aberto na competência anterior.
  - `credito_antecipado`: abate do mês quando há `creditoAntecipadoOrigem` apontando para a cobrança.
  - `condicao_especial`: carência e revisional viram itens explicitados.
  - `desconto_negociado`: descontos do contrato no mês.
- `totalEsperado = aluguelEsperado + iptuEsperado + Σ ajustes` (positivos somam, negativos abatem).
- Drawer da cobrança ganha seção **"Composição do esperado"** com cada item discriminado (tipo, descrição, valor) + botão "Adicionar ajuste manual".

**2. Cobrança correta + visão "quem pagou o quê e quando" (Funcionalidade 1)**
- Quando `valorCobradoBoleto ≠ totalEsperado`, marca como divergência e adiciona botão **"Reemitir boleto com valor correto"** que atualiza o cobrado para o esperado e registra ação de auditoria.
- A tabela principal já mostra esperado × cobrado × recebido × status × data de pagamento — vou reforçar a coluna "Pago em" e adicionar filtro rápido "Pagou / Não pagou" no header.

**3. Vínculo de entradas bancárias a cobranças (Funcionalidade 2)**
- Novo tipo `EntradaBancaria` e `VinculoConciliacao` + seed mockado de entradas (algumas casam automaticamente, outras ficam pendentes).
- Nova aba **"Entradas bancárias"** ao lado das abas existentes, mostrando:
  - Lista de entradas com data, valor, tipo (boleto/TED/PIX), descrição, pagador, status do vínculo.
  - Vínculo automático: matching por `identificador_boleto`; fallback por valor + janela de data + nome/CNPJ do inquilino.
  - Vínculo manual: botão **"Vincular"** abre dialog com busca por contrato/locatário/valor e permite vínculo parcial (define `valorAplicado`).
  - Registra `responsavel` e `data` de cada vínculo (auditoria).

**4. TED/PIX + importação por API/upload (Funcionalidade 3)**
- Botões no topo da aba "Entradas bancárias":
  - **"Sincronizar via Open Finance"** (mock: adiciona entradas simuladas, toast de sucesso).
  - **"Importar arquivo"** (aceita .xlsx / .ofx / .cnab / .pdf; mock parseia e adiciona entradas com `origem: 'upload'`).
- Entradas TED/PIX (sem identificador) seguem o fluxo de matching por valor + data + pagador da Funcionalidade 2.

**5. Split payment / agrupar contratos num boleto (Funcionalidade 4)**
- Novo tipo `GrupoCobranca` e seed de exemplo: um locatário com dois contratos agrupados num boleto único.
- Botão **"Agrupar cobranças"** na visão por locatário: seleciona N cobranças do mesmo inquilino na mesma competência e cria um grupo (boleto consolidado).
- Visão dupla no drawer do grupo: total consolidado + breakdown por contrato (esperado de cada um).
- No recebimento, faz split proporcional ao esperado e marca cada cobrança individualmente como conciliada.

### Arquivos afetados

- `src/lib/reconciliation-data.ts` — novos tipos (`AjusteMensal`, `EntradaBancaria`, `VinculoConciliacao`, `GrupoCobranca`, `Boleto`), seed de entradas bancárias e grupo de exemplo.
- `src/lib/reconciliation-engine.ts` — `computeAjustes()`, `enrichCobranca` com `ajustes[]`, `tryAutoMatch(entrada, cobrancas)`, `splitGrupo(grupo, valorRecebido)`.
- `src/pages/ProprietarioConciliacaoFinanceira.tsx` — coluna "Composição" no drawer, botão "Reemitir", nova aba "Entradas bancárias", dialogs de vínculo manual e agrupamento, botões de importação.
- Novos componentes pequenos (opcional, se ficar muito grande): `EntradasBancariasTab.tsx`, `VincularEntradaDialog.tsx`, `ComposicaoEsperado.tsx`.

### Como ficam as visões

```text
Conciliação Financeira
├── Por competência (existente)
├── Por edifício/inquilino (existente)
└── Entradas bancárias (novo)
    ├── [Sincronizar Open Finance] [Importar arquivo]
    ├── Tabela: data | valor | tipo | descrição | pagador | status vínculo | ação
    └── Auto-match indica % vinculado; pendentes abrem dialog manual
```

Drawer da cobrança:
```text
Composição do esperado
- Aluguel base ............ R$ 42.000
+ Reajuste IGPM (5,7%) .... R$  2.394   [condicao_especial — automático]
- Desconto março .......... R$ -5.000   [desconto_negociado — automático]
+ Saldo aberto fev ........ R$  3.200   [inadimplencia_arrastada — automático]
= Total esperado .......... R$ 42.594
[ + Adicionar ajuste manual ]
```

### Fora de escopo (próxima iteração)

- Integração real com Open Finance e parsing real de OFX/CNAB/PDF (mockado nesta entrega).
- Fluxo de caixa consolidado (a integração detalhada virá depois, conforme o próprio briefing).
- Persistência em backend (continua tudo em memória/mock como o resto do módulo).
