# Patria LUXCondo: Premium Building Management

Crie uma plataforma web completa de Gestão Predial para Edifícios Triple A (Classe AAA) chamada "LUXCondo" — uma solução premium, moderna e intuitiva que conecta Proprietários, Gestores Prediais, Locatários e Fornecedores em um único ecossistema digital.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 IDENTIDADE VISUAL & DESIGN SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Design Premium Corporativo com as seguintes especificações:

PALETA DE CORES (Baseada no Manual de Marca Triple A):
- Primary 1: #0B2A3D — Navegação, headers, CTAs principais
- Primary 2: #1F4E6B — Acentos, botões secundários
- Primary 3: #2F6F8F — Elementos interativos
- Primary 4: #4F7F99 — Backgrounds secundários, hover states
- Accent 1: #0F3834 — Detalhes premium, áreas especiais
- Accent 2: #4E7D5B — Ícones, destaques operacionais
- Accent 3 / Success: #8BC34A — Status positivos, confirmações
- Neutral 1: #E6ECEF — Backgrounds de cards, divisórias
- Neutral 2: #FBFFEF — Backgrounds de página (White Mode)
- Neutral 3: #FFFFFF — Textos no dark mode, fundos limpos nos cards
- Text / Muted: #6B7C88 — Textos secundários, placeholders, bordas

TIPOGRAFIA:
- Fonte Principal e Display: Montserrat (Google Fonts) - Aplicar para todos os pesos e tamanhos
- Tamanhos: xs(12px), sm(14px), base(16px), lg(18px), xl(20px), 2xl(24px), 3xl(30px)

COMPONENTES UI:
- Cards com sombra sutil (shadow-lg) e bordas arredondadas (rounded-2xl)
- Sidebar fixa à esquerda com ícones Lucide React
- Header com breadcrumbs e notificações
- Tabelas com stripe alternating e hover effects
- Badges coloridos por status
- Modal/Drawer para criação e edição
- Toast notifications (Sonner)
- Gráficos com Recharts
- Skeleton loading states
- Empty states ilustrados

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 PERFIS DE USUÁRIO E CONTROLE DE ACESSO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implemente 6 perfis distintos com dashboards e permissões próprias:

1. SUPER ADMINISTRADOR (role: super_admin)
   - Acesso total à plataforma
   - Gerencia múltiplos edifícios no portfólio
   - Configura módulos, usuários e integrações
   - Vê todos os relatórios consolidados
   - Aprova fornecedores para o Marketplace

2. GESTOR PREDIAL OU SÍNDICO (role: building_manager)
   - Gerencia um ou mais edifícios específicos (pode ser síndico de um ou múltiplos prédios).
   - OBRIGATÓRIO: Adicionar um seletor global (dropdown no header ou dashboard inicial) para ele optar/alternar por qual edifício ele deverá ver e gerenciar no momento.
   - VISUALIZAÇÃO: Todos os andares, locatários, contratos, chamados do edifício selecionado.
   - EDIÇÃO: Chamados, comunicados, reservas, fornecedores, visitas do edifício selecionado.
   - Acesso ao módulo ESG completo.
   - Relatórios operacionais e de sustentabilidade.
   - Não acessa dados financeiros detalhados dos proprietários.

3. PROPRIETÁRIO / ASSET MANAGER (role: owner)
   - Visualiza dashboards financeiros de seus imóveis
   - VISUALIZAÇÃO: Contratos de locação, status de ocupação, inadimplência
   - VISUALIZAÇÃO: Relatórios de receita, vacância, valorização
   - VISUALIZAÇÃO: Chamados abertos por locatário
   - EDIÇÃO: Documentos e informações de seus ativos
   - Sem acesso a informações de outros proprietários

4. LOCATÁRIO ADMINISTRADOR (role: tenant_admin)
   - Representa uma empresa locatária
   - VISUALIZAÇÃO: Seus contratos, área locada, andares
   - EDIÇÃO: Abre e acompanha chamados em nome da empresa
   - EDIÇÃO: Reserva ambientes e salas
   - EDIÇÃO: Gerencia usuários da sua empresa na plataforma
   - VISUALIZAÇÃO: Comunicados do edifício
   - Acessa Marketplace para contratar fornecedores homologados
   - Sem acesso a dados de outros locatários

5. LOCATÁRIO COLABORADOR (role: tenant_user)
   - Funcionário de uma empresa locatária
   - VISUALIZAÇÃO: Comunicados do edifício
   - EDIÇÃO: Abre chamados pessoais (manutenção, limpeza, etc.)
   - EDIÇÃO: Reserva salas e ambientes
   - VISUALIZAÇÃO: Status dos seus chamados
   - Sem acesso a contratos ou dados financeiros

6. FORNECEDOR / PRESTADOR (role: vendor)
   - Empresa homologada no Marketplace
   - Visualiza chamados atribuídos a ele
   - Atualiza status de execução de serviços
   - Gerencia seu perfil e portfólio de serviços
   - Recebe avaliações dos locatários

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 ESTRUTURA DE PÁGINAS E MÓDULOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

═══ AUTENTICAÇÃO ═══

/login
- Tela de login elegante com logo LUXCondo
- Campo e-mail + senha
- "Esqueci minha senha" com link de reset por e-mail
- Primeiro acesso com código de convite
- Layout split: imagem premium de edifício à esquerda, form à direita

/reset-password
- Formulário de recuperação de senha
- Validação de token por e-mail

/onboarding (para novos usuários)
- Wizard 3 passos: Perfil → Edifício → Preferências
- Progress bar animada

═══ DASHBOARD (PERSONALIZADO POR PERFIL) ═══

/dashboard

Para SUPER ADMIN e GESTOR PREDIAL:
- KPI Cards: Total Edifícios, Taxa de Ocupação (%), Chamados Abertos, Contratos Vencendo
- Gráfico de ocupação por andar (heatmap visual do edifício)
- Chamados por status (donut chart)
- Timeline de comunicados recentes
- Alertas críticos (vencimentos, chamados urgentes, certificações)
- ESG Score do portfólio (gauge chart)
- Consumo de energia e água (linha temporal)
- Receita de locação x meta (barra)

Para PROPRIETÁRIO:
- KPI Cards: Receita Total, Vacância (%), NOI (Net Operating Income), Contratos Ativos
- Gráfico de receita mensal (linha)
- Status de cada propriedade (cards)
- Contratos vencendo nos próximos 90 dias
- Chamados em aberto por propriedade

Para LOCATÁRIO ADMIN:
- KPI Cards: Andares Locados, Área (m²), Chamados Abertos, Próxima Reserva
- Comunicados importantes (highlight)
- Meus chamados por status
- Próximas reservas de salas
- Consumo de energia da área locada (se disponível)
- Documentos pendentes de assinatura

Para LOCATÁRIO COLABORADOR:
- Feed de comunicados
- Meus chamados (lista compacta)
- Reservas ativas (salas)
- Botão rápido "Abrir Chamado"
- Botão rápido "Reservar Sala"

═══ MÓDULO 1: COMUNICADOS ═══

/comunicados

LISTA DE COMUNICADOS:
- Cards de comunicados com: título, categoria, data, status (lido/não lido), destinos
- Categorias: Manutenção, Segurança, Administrativo, ESG/Sustentabilidade, Urgente
- Filtros: por categoria, data, edifício, andar, status
- Pesquisa full-text
- Badge contador de não lidos
- Marcar todos como lido

/comunicados/novo (apenas Gestor Predial e Super Admin)
- Formulário completo:
  - Título (obrigatório)
  - Corpo do comunicado (Rich Text Editor — headings, bold, bullet lists, links)
  - Categoria (dropdown)
  - Destinatários: Todos / Por andar / Por empresa locatária / Específico
  - Prioridade: Normal / Alta / Urgente
  - Anexos (PDF, imagens)
  - Agendar publicação (datetime picker)
  - Preview antes de publicar

/comunicados/:id
- Visualização completa do comunicado
- Status de leitura (quem leu, %)
- Comentários (se habilitado)
- Botão de compartilhar (interno)

═══ MÓDULO 2: GESTÃO DE CONTRATOS ═══

/contratos

LISTA DE CONTRATOS (visível de acordo com perfil):
- Tabela com: Locatário, CNPJ, Andares, Área (m²), Início, Fim, Valor/mês, Status
- Status badges: Ativo / Vencendo (< 90 dias) / Vencido / Em negociação / Rescindido
- Filtros: edifício, andar, status, vencimento
- Exportar para Excel/PDF
- Ordenação por coluna

/contratos/:id
- Detalhes completos do contrato:
  - Partes (locatário, proprietário, responsáveis)
  - Objeto: andares, área locada (m²), planta do andar (imagem)
  - Vigência: data início, data fim, renovações automáticas
  - Valores: aluguel base, índice de reajuste (IPCA, IGP-M), frequência
  - Histórico de reajustes
  - Cláusulas especiais (resumo)
  - Documentos anexados (PDF do contrato, adendos)
  - Chamados relacionados (lista compacta)
  - Timeline de eventos do contrato
  - Botão "Download do Contrato"

/contratos/novo e /contratos/:id/editar (Super Admin e Gestor apenas)
- Formulário completo em wizard:
  Passo 1: Selecionar locatário e proprietário
  Passo 2: Definir andares e área locada
  Passo 3: Valores e vigência
  Passo 4: Upload de documentos
  Passo 5: Revisão e confirmação

═══ MÓDULO 3: SISTEMA DE CHAMADOS ═══

/chamados

KANBAN BOARD (visualização padrão para Gestor):
- Colunas: Aberto → Em Análise → Em Execução → Aguardando Aprovação → Concluído → Cancelado
- Cards de chamado com: ID, título, solicitante, prioridade, data abertura, responsável, SLA
- Arrastar e soltar para mudar status (Drag & Drop)
- Filtros: prioridade, categoria, locatário, andar, responsável, data
- Alternativa: visualização em lista/tabela

CATEGORIAS DE CHAMADO:
  → Manutenção Preventiva
  → Manutenção Corretiva
  → Limpeza e Higiene
  → Climatização (HVAC/AC)
  → Elétrica e Iluminação
  → Hidráulica
  → Segurança e CFTV
  → Controle de Acesso
  → Telecomunicações e TI
  → Paisagismo e Áreas Externas
  → Elevadores
  → Estacionamento
  → Facilities Gerais
  → Solicitação de Serviço Especial

ESFERAS DE GESTÃO (a quem o chamado é direcionado):
  → Gestão Predial (operações gerais)
  → Manutenção (equipe técnica)
  → Limpeza e Conservação
  → Segurança Patrimonial
  → Administração (financeiro, contratos)
  → ESG e Sustentabilidade
  → Fornecedor Específico (do marketplace)

/chamados/novo
- Formulário otimizado mobile:
  - Título descritivo
  - Categoria (dropdown com ícones)
  - Esfera de gestão (direcionamento)
  - Prioridade: Baixa / Normal / Alta / Urgente
  - Localização: Edifício → Andar → Área específica
  - Descrição detalhada (textarea)
  - Fotos/anexos (upload múltiplo, camera no mobile)
  - Contato preferencial

/chamados/:id
- Header: ID, título, status badge, prioridade badge
- Timeline de atividades (criação → atribuição → updates → conclusão)
- Comentários internos (apenas Gestor/Admin vê) vs. públicos
- Responsável atribuído (com foto e contato)
- SLA indicator (tempo restante / tempo decorrido)
- Seção de arquivos (fotos do problema, fotos da solução)
- Avaliação de satisfação (após conclusão — 1-5 estrelas + comentário)
- Botão "Escalar" para nível superior
- Botão "Reabrir" (se concluído)
- Histórico de reatribuições

/chamados/relatorios (apenas Gestor e Admin)
- Tempo médio de atendimento por categoria
- Volume por período
- SLA cumprido x descumprido
- Heatmap de chamados por andar
- Top 5 locatários por volume
- Satisfação média (NPS)

═══ MÓDULO 4: MAPA DO EDIFÍCIO ═══

/edificio

VISÃO GERAL DO EDIFÍCIO:
- Representação visual interativa (SVG/ilustração) do edifício
- Legenda de ocupação com código de cores:
  → Verde: 100% ocupado
  → Amarelo: Parcialmente ocupado
  → Cinza: Vago
  → Vermelho: Contrato vencido/problema
- Clique em um andar → abre painel lateral

/edificio/andar/:numero
- VISUALIZAÇÃO DO ANDAR:
  - Planta baixa do andar (imagem ou SVG interativo)
  - Lista de locatários naquele andar:
    → Nome da empresa
    → CNPJ
    → Área locada (m²)
    → Responsável pelo locatário
    → Status do contrato (badge)
    → Chamados em aberto (contador)
    → Link para o contrato
  - Chamados ativos no andar (lista compacta com status)
  - Ambientes disponíveis para reserva neste andar
  - Histórico de ocupação
  - Botão "Novo Chamado neste Andar"

PERMISSÕES:
- Super Admin e Gestor: Vê todos os andares e locatários
- Proprietário: Vê apenas os andares de seus imóveis
- Locatário Admin/User: Vê apenas seu próprio andar (sem ver dados de outros locatários)

═══ MÓDULO 5: RESERVA DE AMBIENTES ═══

/reservas

CALENDÁRIO DE RESERVAS:
- Visualização: Semana (padrão) / Dia / Mês
- Grid de salas x horários
- Cores por sala/ambiente
- Clique no slot para abrir modal de nova reserva
- Filtros: por ambiente, por andar, por disponibilidade

TIPOS DE AMBIENTE:
  → Sala de Reunião (capacidade 4-8 pessoas)
  → Sala de Conferência (capacidade 10-20 pessoas)
  → Auditório (capacidade 50-200 pessoas)
  → Sala de Treinamento
  → Espaço de Eventos (rooftop, térreo)
  → Estacionamento (vagas de visitantes)
  → Sala de Apoio

CARD DE AMBIENTE:
- Foto do ambiente (galeria)
- Nome e localização (andar)
- Capacidade de pessoas
- Equipamentos disponíveis (TV, projetor, videoconferência, flipchart)
- Disponibilidade em tempo real
- Regras de uso

/reservas/nova
- Seletor de ambiente (cards com foto e disponibilidade)
- Date picker + time picker
- Duração (com opção de recorrência)
- Número de participantes
- Recursos adicionais: coffee-break, TI support, etc.
- Observações
- Confirmação com e-mail automático

/reservas/minhas
- Lista de reservas ativas e históricas
- Botão cancelar (com antecedência mínima configurável)
- QR Code de acesso à sala (futuro)

═══ MÓDULO 6: MARKETPLACE DE FORNECEDORES ═══

/marketplace

HOME DO MARKETPLACE:
- Banner de destaque (fornecedor em evidência)
- Categorias em grid com ícones:
  → Limpeza e Higiene
  → Segurança Patrimonial
  → Manutenção Predial
  → Jardinagem e Paisagismo
  → Reformas e Obras
  → Tecnologia e TI
  → Alimentação e Catering
  → Mudanças e Logística
  → Serviços Jurídicos
  → Consultoria ESG
  → Arquitetura e Design
  → Controle de Pragas
  → Climatização e HVAC
  → Energia Solar e ESG
    → Certificações ESG 
- Pesquisa por serviço, nome ou CNPJ

/marketplace/categoria/:slug
- Grid de fornecedores homologados
- Cards com: logo, nome, especialidade, avaliação (estrelas), número de contratos, badge "Homologado"
- Filtros: avaliação mínima, localização, tipo de serviço
- Ordenação: Relevância / Avaliação / Mais contratado

/marketplace/fornecedor/:id
- Perfil completo do fornecedor:
  - Logo e nome
  - Descrição da empresa
  - CNPJ, fundação, porte
  - Certificações (ISO, etc.)
  - Serviços oferecidos (tags)
  - Portfólio de trabalhos (galeria)
  - Avaliações de outros locatários (estrelas + comentários)
  - Documentos: contrato social, alvarás, seguros, certidões
  - Contato: telefone, e-mail, site
  - Botão "Solicitar Proposta" → abre chamado de tipo "Serviço Especial"
  - Botão "Favoritar"

/marketplace/admin (apenas Super Admin)
- Gestão de fornecedores: aprovar, reprovar, suspender
- Formulário de cadastro de novo fornecedor
- Renovação de homologação (anual)
- Checklist de documentos necessários

═══ MÓDULO 7: ESG & SUSTENTABILIDADE ═══

/esg

DASHBOARD ESG:
- ESG Score Geral do Edifício (gauge animado — 0 a 100)
- Três pilares em cards:
  → E (Environmental): Energia, Água, Resíduos, Carbono
  → S (Social): Satisfação dos Locatários, Programas Sociais, Comunidade
  → G (Governance): Compliance, Transparência, Relatórios

/esg/certificacoes

CERTIFICAÇÃO LEED:
- Status atual: Certified / Silver / Gold / Platinum (badge visual)
- Progress tracker de pontos LEED:
  → Categoria: Localização e Transporte (LT)
  → Categoria: Sustentabilidade do Terreno (SS)
  → Categoria: Eficiência no Uso da Água (WE)
  → Categoria: Energia e Atmosfera (EA)
  → Categoria: Materiais e Recursos (MR)
  → Categoria: Qualidade do Ambiente Interno (EQ)
  → Categoria: Inovação (IN)
  → Categoria: Prioridade Regional (RP)
- Para cada categoria: pontos obtidos vs. pontos possíveis (progress bar)
- Documentos de evidência por crédito (upload)
- Histórico de auditorias
- Próxima data de renovação / auditoria

I-REC (RASTREABILIDADE DE ENERGIA RENOVÁVEL):
- Total de I-RECs emitidos e aposentados (MWh)
- Gráfico de evolução mensal
- Fonte de energia (solar, eólica, hídrica)
- Certificados ativos (tabela com número, vigência, MWh)
- Botão "Solicitar Emissão de I-REC"
- Relatório de emissões evitadas (tCO₂eq)
- Integração visual com logo I-REC

/esg/metricas

MONITORAMENTO AMBIENTAL:
- Energia Elétrica:
  → Consumo mensal (kWh) — gráfico de linha
  → Consumo por m² (benchmark)
  → Intensidade de carbono (tCO₂/kWh)
  → Comparativo com mês anterior e meta

- Água:
  → Consumo mensal (m³) — gráfico de linha
  → Consumo per capita
  → Recaptura de água da chuva (se aplicável)

- Resíduos:
  → Geração total (toneladas/mês)
  → Taxa de reciclagem (%)
  → Categorias: papel, plástico, vidro, orgânico, rejeito
  → Destinação final

- Carbono:
  → Emissões Escopo 1, 2 e 3
  → Meta de redução e progresso
  → Compensação (créditos de carbono)

/esg/relatorios
- Gerador de relatórios ESG:
  → GRI (Global Reporting Initiative)
  → SASB
  → CDP (Carbon Disclosure Project)
  → Relatório Anual de Sustentabilidade
  → Relatório LEED para auditoria
- Exportar em PDF e Excel
- Histórico de relatórios gerados

═══ MÓDULO 8: GESTÃO DE VISITANTES ═══

/visitantes

REGISTRO DE VISITAS:
- Tabela: Nome, Empresa, Destino (andar/empresa), Entrada, Saída, Status
- Status: Aguardando → Presente → Saiu
- Filtros: data, andar, locatário

/visitantes/nova-visita
- Pré-agendamento de visita pelo locatário:
  - Nome completo do visitante
  - Documento (CPF/RG/Passaporte)
  - Empresa
  - Data e hora prevista
  - Andar/empresa de destino
  - Responsável interno
  - Observações
  - QR Code de acesso gerado automaticamente

- Check-in presencial (pelo segurança via mobile):
  - Scan do QR Code ou busca por nome
  - Foto do visitante (webcam)
  - Confirmação da recepção

═══ MÓDULO 9: NOTIFICAÇÕES E AVISOS ═══

/notificacoes
- Central de notificações em tempo real
- Filtros: não lidas, por tipo, por módulo
- Tipos:
  → Novo chamado aberto
  → Chamado atualizado/concluído
  → Comunicado publicado
  → Reserva confirmada/cancelada
  → Contrato vencendo (alerta 90, 60, 30 dias)
  → Novo fornecedor homologado
  → Relatório ESG disponível
  → Certificação LEED atualizada

Configuração de preferências de notificação por canal:
  - Email
  - Push (PWA)
  - WhatsApp (futuro)

═══ MÓDULO 10: RELATÓRIOS E ANALYTICS ═══

/relatorios

PAINÉIS DISPONÍVEIS POR PERFIL:

Para Gestor/Admin:
- Operacional: Chamados x Período, SLA, Satisfação
- Ocupação: Taxa por andar, vacância, evolução
- ESG: Consumo, certificações, I-REC
- Marketplace: Fornecedores mais contratados, avaliações

Para Proprietário:
- Financeiro: Receita de locação, inadimplência, projeções
- Portfólio: Vacância, vencimentos de contratos
- Valorização: Histórico de valores de locação

Exportação: PDF e Excel de qualquer relatório
Agendamento: Receber relatórios por e-mail (semanal/mensal)

═══ MÓDULO 11: CONFIGURAÇÕES ═══

/configuracoes (Super Admin apenas)

EDIFÍCIO:
- Dados do edifício (nome, endereço, CNPJ, certificações)
- Upload de fotos do edifício
- Plantas dos andares (por andar)
- Ambientes cadastrados (salas de reunião, etc.)

USUÁRIOS:
- Listagem de todos os usuários
- Criar/editar/desativar usuários
- Atribuir perfis e edifícios
- Enviar convite por e-mail

NOTIFICAÇÕES:
- Templates de e-mail customizáveis
- Regras de alerta (SLA, vencimentos, etc.)

INTEGRAÇÕES:
- Webhooks disponíveis
- API keys para integrações externas
- Configurar e-mail SMTP

APARÊNCIA:
- Logo da empresa (upload)
- Cores primárias customizáveis
- Nome da plataforma

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗄️ MODELO DE DADOS (BANCO DE DADOS SUPABASE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Crie as seguintes tabelas no Supabase:

buildings (edifícios)
- id, name, address, city, state, cnpj, total_floors, total_area_m2,
  certification_leed, certification_leed_level, photo_url, created_at

floors (andares)
- id, building_id, floor_number, floor_name, total_area_m2, floor_plan_url

tenants (locatários/empresas)
- id, company_name, cnpj, email, phone, logo_url, created_at

leases (contratos)
- id, building_id, floor_id, tenant_id, owner_id, start_date, end_date,
  area_m2, monthly_value, adjustment_index, status, document_url, created_at

users (usuários)
- id, email, full_name, role, tenant_id, building_id, phone, avatar_url,
  is_active, created_at

tickets (chamados)
- id, building_id, floor_id, tenant_id, user_id, title, description,
  category, sphere, priority, status, assigned_to, sla_deadline,
  satisfaction_rating, satisfaction_comment, resolved_at, created_at

ticket_updates (histórico de chamados)
- id, ticket_id, user_id, comment, is_internal, attachments, created_at

announcements (comunicados)
- id, building_id, title, content, category, priority, target_type,
  target_ids, published_at, author_id, created_at

rooms (ambientes para reserva)
- id, building_id, floor_id, name, type, capacity, amenities, photo_urls,
  is_active, created_at

reservations (reservas)
- id, room_id, user_id, tenant_id, start_datetime, end_datetime,
  attendees_count, notes, status, created_at

vendors (fornecedores)
- id, company_name, cnpj, category, description, logo_url, rating,
  is_approved, approval_date, documents, created_at

vendor_reviews (avaliações de fornecedores)
- id, vendor_id, user_id, rating, comment, created_at

esg_metrics (métricas ESG)
- id, building_id, metric_type, value, unit, period_month, period_year,
  source, created_at

leed_credits (créditos LEED)
- id, building_id, category, credit_name, points_possible, points_obtained,
  evidence_url, status, updated_at

irec_certificates (certificados I-REC)
- id, building_id, certificate_number, energy_type, mwh_amount,
  valid_from, valid_until, status, created_at

visitors (visitantes)
- id, building_id, floor_id, tenant_id, visitor_name, document,
  company, host_user_id, scheduled_at, checked_in_at, checked_out_at,
  qr_code, status, created_at

notifications (notificações)
- id, user_id, type, title, message, read_at, related_entity, created_at

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 NAVEGAÇÃO / SIDEBAR POR PERFIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SIDEBAR SUPER ADMIN e GESTOR PREDIAL:
  🏠 Dashboard
  📢 Comunicados
  📋 Contratos
  🎫 Chamados
  🏢 Mapa do Edifício
  📅 Reservas
  🛒 Marketplace
  🌿 ESG & Sustentabilidade
  👤 Visitantes
  📊 Relatórios
  ⚙️ Configurações

SIDEBAR PROPRIETÁRIO:
  🏠 Dashboard
  📋 Contratos
  🎫 Chamados (visualização)
  🏢 Mapa do Edifício
  🌿 ESG & Sustentabilidade
  📊 Relatórios

SIDEBAR LOCATÁRIO ADMIN:
  🏠 Dashboard
  📢 Comunicados
  🎫 Chamados
  📅 Reservas
  🛒 Marketplace
  👤 Visitantes
  📋 Meu Contrato

SIDEBAR LOCATÁRIO COLABORADOR:
  🏠 Dashboard
  📢 Comunicados
  🎫 Meus Chamados
  📅 Reservas

SIDEBAR FORNECEDOR:
  🏠 Dashboard
  🎫 Serviços Atribuídos
  ⭐ Avaliações
  👤 Meu Perfil

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 TECH STACK OBRIGATÓRIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend:
- React 18 + TypeScript
- Vite como bundler
- React Router v6 (roteamento)
- Tailwind CSS (styling)
- shadcn/ui (componentes base)
- Lucide React (ícones)
- Recharts (gráficos)
- React Hook Form + Zod (formulários e validação)
- Tanstack Query (data fetching e cache)
- date-fns (manipulação de datas em pt-BR)
- Sonner (toast notifications)

Backend (Supabase):
- Supabase Auth (autenticação com e-mail/senha)
- Supabase Database (PostgreSQL)
- Supabase Storage (uploads de arquivos)
- Supabase Realtime (notificações em tempo real)
- Row Level Security (RLS) para controle de acesso por perfil
- Edge Functions para lógica de negócio complexa

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 SEGURANÇA E PERMISSÕES RLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Implemente Row Level Security (RLS) no Supabase:

- Usuários só veem dados do(s) seu(s) edifício(s)
- Locatários só veem seus próprios contratos, chamados e reservas
- Proprietários só veem imóveis de sua propriedade
- Gestores veem todos os dados dos edifícios gerenciados
- Dados financeiros de proprietário não são visíveis para locatários
- Informações de outros locatários não são visíveis entre si
- Fornecedores só veem chamados a eles atribuídos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ FUNCIONALIDADES PREMIUM DE UX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ONBOARDING CONTEXTUAL: Tooltip tour na primeira vez em cada módulo
2. BREADCRUMBS: Navegação clara em todas as páginas internas
3. BUSCA GLOBAL: Barra de pesquisa no header busca chamados, contratos, locatários
4. MODO ESCURO E CLARO: O aplicativo deve suportar nativamente ambas as versões (Dark Mode e White Mode). O usuário deve poder escolher a versão de sua preferência (ex: através de um toggle no header ou nas configurações do perfil).
5. RESPONSIVE: Layout adaptado para tablet e mobile (menu hamburguer)
6. PWA: Progressive Web App com notificações push
7. SKELETON LOADING: Telas de carregamento para todas as listas
8. EMPTY STATES: Ilustrações e CTAs quando não há conteúdo
9. CONFIRMAÇÃO DE AÇÕES: Modais de confirmação para ações críticas
10. ATALHOS DE TECLADO: Ctrl+K para busca, Ctrl+N para novo item
11. FILTROS SALVOS: Usuário salva seus filtros favoritos
12. EXPORT UNIVERSAL: Botão de exportar em todas as listas (Excel/PDF)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 DADOS DE EXEMPLO (SEED DATA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Crie dados iniciais para demonstração:

EDIFÍCIO DE EXEMPLO:
- Nome: "Torre LUX Faria Lima"
- Endereço: Av. Brigadeiro Faria Lima, 4100 — São Paulo, SP
- 25 andares, 35.000 m²
- Certificação LEED Gold

LOCATÁRIOS DE EXEMPLO (5 empresas):
1. Empresa Alpha S.A. — Andares 5, 6, 7 — Tecnologia
2. Beta Consultores Ltda. — Andar 10 — Consultoria
3. Gamma Capital — Andares 12, 13 — Financeiro
4. Delta Legal — Andar 18 — Escritório de Advocacia
5. Epsilon Tech — Andares 20, 21, 22 — Tecnologia

USUÁRIOS DE EXEMPLO
- admin@luxcondo.com / senha: Admin@123 → Super Admin
- gestor@luxcondo.com / senha: Gestor@123 → Gestor Predial
- proprietario@luxcondo.com / senha: Owner@123 → Proprietário
- tenant@luxcondo.com.br / senha: Tenant@123 → Locatário Admin
- user@luxcondo.com.br / senha: User@123 → Locatário Colaborador
- fornecedor@luxcondo.com.br / senha: Vendor@123 → Fornecedor

CHAMADOS DE EXEMPLO: 10 chamados em diferentes status e categorias
COMUNICADOS DE EXEMPLO: 5 comunicados recentes
RESERVAS DE EXEMPLO: 3 reservas na próxima semana
MÉTRICAS ESG: 12 meses de dados de consumo de energia, água e resíduos

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6bd74371-03a1-4207-b3b0-b6e248f7a6d6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
