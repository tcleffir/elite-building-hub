---
name: Asset Management Module
description: Building physical assets (equipment) tracking with purchase, warranty, maintenance and linked tickets
type: feature
---
Módulo /ativos para super_admin e building_manager dentro do grupo "Edifício" da sidebar. Rastreia equipamentos físicos do edifício (climatização, elétrica, hidráulica, segurança, transporte vertical, outros).

KPIs: Total de Ativos, Valor Patrimonial (R$ pt-BR), Em Garantia (X/total), Manutenções Vencidas (alerta vermelho).

Filtros: busca livre, categoria, andar, status de garantia (active/expiring/expired), status de manutenção (ok/due_soon/overdue).

Indicadores 🟢🟡🔴: garantia ativa (>30d) / vence em ≤30d / vencida; manutenção em dia / próx. vencer (≤30d) / atrasada (<0d); saúde agrega garantia + manutenção + chamados abertos + status operacional.

AssetDrawer 5 abas: Visão Geral, Compra & NF, Garantia, Manutenção Preventiva (botão "Registrar Manutenção" via AssetMaintenanceDialog com upload mock de NF), Chamados Vinculados (filtra mockTickets por asset_id).

Tickets ganharam campo asset_id?: string (CH-002 → AT-002 split 13º; CH-006 → AT-008 QGBT). Botão "Novo Chamado" navega para /chamados?asset=<id>.

Dados em src/lib/assets-data.ts (12 ativos mock no 360JK + 7 manutenções históricas + 10 logs iniciais). Persistência futura em Lovable Cloud.

CRUD completo: super_admin e building_manager veem botões "+ Novo Ativo" (header), "Editar" e "Excluir" (header do AssetDrawer). Exclusão bloqueada se houver chamados abertos vinculados (AssetDeleteDialog).

Extração via IA: AssetUploadZone + edge function extract-asset-document (Gemini 2.5 Flash multimodal, JPG/PNG/PDF até 10MB). Pré-preenche o AssetFormDialog (acordeão de 5 seções) e marca campos com badge cyan "✨ IA". Botão "Limpar marcações IA" remove badges sem apagar valores. Validação Zod (nome ≥2 chars, valor ≥0, fim garantia ≥ início).

Histórico (6ª aba do AssetDrawer): timeline cronológica reversa com tipos create/update/delete/maintenance/attachment/ai_extraction. diffAsset(prev,next) calcula automaticamente changes[] em edições. Cada ação (criar, editar, manutenção) gera log via appendLog usando user.full_name + roleLabel do AppContext. source: manual | ai | system.

Persistência local: hook useAssetsStore (src/hooks/use-assets-store.ts) sincroniza assets, maintenances, logs e categories com localStorage (chaves luxcondo:assets:v1, luxcondo:asset-maintenances:v1, luxcondo:asset-logs:v1, luxcondo:asset-categories:v1) — sobrevive a navegação e reload. Migração futura para Lovable Cloud preserva mesma API.

Categorias dinâmicas: AssetCategory passou a ser string. defaultCategoryLabels/defaultCategoryIcons + helper getCategoryIcon(cat) com fallback Wrench. Componente AssetCategoryManager (botão "Categorias" no header) permite criar/renomear/excluir; categorias builtin marcadas como `padrão` não podem ser excluídas; categorias em uso bloqueiam exclusão até reclassificação. Slug gerado via slugifyCategory() (NFD + a-z0-9 + _).

Tabela ordenável: 8 colunas (Ativo, Categoria, Localização, Compra, Valor, Garantia, Próx. Manutenção, Chamados) com SortHeader clicável (ArrowUp/ArrowDown/ArrowUpDown). Garantia ordena por peso vencida(0)→prox(1)→ativa(2) com tiebreak na endDate. Click alterna asc/desc; trocar de coluna reseta para asc.
