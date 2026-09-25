// ─── Contract Guarantees, Insurance, IPTU, Common Area, Payments ─────────

export interface GuaranteeRenewalEntry {
  year: number;
  expiryDate: string;
  documentUrl: string | null;
  uploadDate: string | null;
}

export interface ContractGuarantee {
  id: string;
  contract_id: string;
  type: 'fianca_bancaria' | 'seguro_fianca' | 'caucao' | 'carta_fianca' | 'titulo_capitalizacao' | 'fiador';
  value: number;
  valid_until: string | null;
  guarantor: string;
  issueDate: string;
  certificateNumber?: string;
  documentUrl?: string | null;
  documentUploadDate?: string | null;
  renewalHistory: GuaranteeRenewalEntry[];
}

export interface ContractInsurance {
  id: string;
  contract_id: string;
  insurer: string;
  policy_number: string;
  insured_value: number;
  start_date: string;
  end_date: string;
}

export interface ContractIPTU {
  id: string;
  contract_id: string;
  responsible: 'locatario' | 'proprietario' | 'compartilhado';
  annual_value: number;
  taxpayer_number: string;
  parcels: { month: number; value: number; due_date: string; status: 'paid' | 'pending' | 'overdue' }[];
}

export interface CommonAreaContract {
  id: string;
  building_id: string;
  area_name: string;
  operator: string;
  area_m2: number;
  monthly_revenue: number;
  adjustment_index: string;
  contract_start: string;
  contract_end: string;
  status: 'active' | 'expiring' | 'expired';
}

export interface MonthlyPayment {
  id: string;
  building_id: string;
  tenant_name: string;
  unit_id: string;
  contractual_value: number;
  discount: number;
  billable_value: number;
  btg_sent: boolean;
  btg_sent_date?: string;
  received: boolean;
  received_date?: string;
  received_amount?: number | null;
  status: 'paid' | 'paid_partial' | 'paid_over' | 'sent' | 'pending' | 'overdue' | 'awaiting_btg';
  competence: string;
  due_day: number;
  notes?: string;
  contactHistory: ContactRecord[];
  receiptUrl: string | null;
}

export interface ContactRecord {
  date: string;
  method: 'email' | 'whatsapp' | 'phone' | 'letter';
  sentBy: string;
  message: string;
  response: 'no_response' | 'promised_payment' | 'agreement' | 'dispute';
}

export interface ReajusteInfo {
  id: string;
  building_id: string;
  tenant_name: string;
  unit_id: string;
  index: string;
  base_date: string;
  last_adjustment: string;
  next_adjustment: string;
  current_value: number;
  simulated_value: number;
  variation_pct: number;
  status: 'applied' | 'upcoming' | 'next' | 'urgent';
}

export interface InadimplenciaRecord {
  id: string;
  building_id: string;
  building_name?: string;
  tenant_name: string;
  unit_id: string;
  competence: string;
  value: number;
  days_overdue: number;
  last_contact?: string;
  last_contact_type?: 'email' | 'telefone' | 'reuniao' | 'whatsapp' | 'phone';
  contact_status: 'not_contacted' | 'contacted' | 'promised' | 'agreement';
  history: { date: string; type: string; note: string }[];
  // Responsável financeiro
  responsible_name?: string;
  responsible_email?: string;
  responsible_phone?: string;
  // Política de cobrança
  multa_pct?: number;      // ex: 2 = 2%
  juros_am_pct?: number;   // juros ao mês — ex: 1 = 1% a.m.
  // Próximo prazo combinado
  next_payment_deadline?: string;
  // Anotações livres do gestor
  comments?: string;
  // Marcado para envio ao Serasa
  serasa?: boolean;
}


export interface CashFlowMonth {
  competence: string;
  building_id: string;
  expected_revenue: number;
  realized_revenue: number;
  expenses: number;
  result: number;
  variation_pct: number;
  projected?: boolean;
  breakdown?: {
    alugueis: number;
    outras_receitas: number;
    condominio: number;
    iptu: number;
    manutencao: number;
    administracao: number;
    outras_despesas: number;
  };
}

export interface RevenueRecord {
  id: string;
  building_id: string;
  date: string;
  origin: 'locatario' | 'area_comum' | 'outra';
  tenant_name: string;
  description: string;
  value: number;
  category: 'aluguel_locatario' | 'aluguel_area_comum' | 'iptu_recuperacao' | 'estacionamento' | 'outros';
  competence: string;
  status: 'paid' | 'pending' | 'overdue';
  reference?: string;
}

export interface ExpenseRecord {
  id: string;
  building_id: string;
  date: string;
  supplier: string;
  description: string;
  value: number;
  category: 'iptu' | 'condominio' | 'manutencao' | 'seguro_predial' | 'honorarios' | 'vaga' | 'obras' | 'outros';
  cost_center: string;
  competence: string;
  receipt_url?: string;
}

export interface FinancialEntry {
  id: string;
  buildingId: string;
  unitId: string | null;
  date: string;
  type: 'receita' | 'despesa';
  category: string;
  subcategory: string;
  description: string;
  amount: number;
  receiptUrl: string | null;
  isCapex: boolean;
  iptuInstallment: { current: number; total: number } | null;
  notes: string;
}

export interface BTGExtractEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  documentNumber: string;
  matchStatus?: 'matched' | 'divergent' | 'not_found' | 'unidentified';
  matchedEntryId?: string | null;
}

export interface ReportHistoryEntry {
  id: string;
  type: 'gestao' | 'pendencias';
  building_name: string;
  tenants: string[];
  period: string;
  generated_at: string;
  generated_by: string;
  format?: 'pdf' | 'excel';
  size?: string;
}

export const revenueCategoryLabels: Record<RevenueRecord['category'], string> = {
  aluguel_locatario: 'Aluguel — Locatário',
  aluguel_area_comum: 'Aluguel — Área Comum',
  iptu_recuperacao: 'IPTU (recuperação)',
  estacionamento: 'Estacionamento',
  outros: 'Outros',
};

export const expenseCategoryLabels: Record<ExpenseRecord['category'], string> = {
  iptu: 'IPTU',
  condominio: 'Condomínio',
  manutencao: 'Manutenção',
  seguro_predial: 'Seguro Predial',
  honorarios: 'Honorários de Gestão',
  vaga: 'Vaga/Estacionamento',
  obras: 'Obras',
  outros: 'Outros',
};

export const guaranteeTypeLabels: Record<ContractGuarantee['type'], string> = {
  fianca_bancaria: 'Fiança Bancária',
  seguro_fianca: 'Seguro Fiança',
  caucao: 'Caução',
  carta_fianca: 'Carta de Fiança Bancária',
  titulo_capitalizacao: 'Título de Capitalização',
  fiador: 'Fiador Pessoal',
};

export const guaranteeTypeBadgeColor: Record<ContractGuarantee['type'], string> = {
  fianca_bancaria: 'bg-blue-100 text-blue-700',
  seguro_fianca: 'bg-emerald-100 text-emerald-700',
  caucao: 'bg-purple-100 text-purple-700',
  carta_fianca: 'bg-blue-100 text-blue-700',
  titulo_capitalizacao: 'bg-amber-100 text-amber-700',
  fiador: 'bg-gray-100 text-gray-700',
};

export const contractTypeLabels: Record<string, { label: string; tooltip: string }> = {
  net: { label: 'Net', tooltip: 'Locatário paga aluguel + encargos operacionais separadamente' },
  gross: { label: 'Gross', tooltip: 'Aluguel inclui todos os encargos operacionais' },
  'semi-gross': { label: 'Semi-Gross', tooltip: 'Aluguel inclui parte dos encargos; alguns cobrados separadamente' },
};

export const iptuResponsibleLabels: Record<string, string> = {
  locatario: 'Locatário',
  proprietario: 'Proprietário',
  compartilhado: 'Compartilhado',
};

// Financial entry categories hierarchy
export const financialCategories = {
  receitas: [
    { key: 'aluguel', label: 'Aluguel' },
    { key: 'aluguel_atraso', label: 'Aluguel em Atraso (com multa/juros)' },
    { key: 'caucao_recebida', label: 'Caução recebida' },
    { key: 'outras_receitas', label: 'Outras receitas' },
  ],
  despesas_opex: [
    { key: 'condominio', label: 'Condomínio' },
    { key: 'iptu', label: 'IPTU' },
    { key: 'seguro', label: 'Seguro' },
    { key: 'manutencao_preventiva', label: 'Manutenção preventiva' },
    { key: 'manutencao_corretiva', label: 'Manutenção corretiva' },
    { key: 'limpeza', label: 'Limpeza / Conservação' },
    { key: 'administracao', label: 'Administração (taxa gestora)' },
    { key: 'honorarios', label: 'Honorários jurídicos' },
    { key: 'outras_opex', label: 'Outras OPEX' },
  ],
  despesas_capex: [
    { key: 'reforma', label: 'Reforma' },
    { key: 'equipamentos', label: 'Equipamentos' },
    { key: 'benfeitorias', label: 'Benfeitorias' },
    { key: 'outras_capex', label: 'Outras CAPEX' },
  ],
  provisoes: [
    { key: 'prov_vacancia', label: 'Provisão de vacância' },
    { key: 'prov_inadimplencia', label: 'Provisão de inadimplência' },
    { key: 'prov_manutencao', label: 'Provisão de manutenção' },
  ],
};

// ─── Contract Documents ─────────
export interface ContractDocumentFile {
  id: string;
  contractId: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  type: 'contract_pdf' | 'other';
}

export let mockContractDocuments: ContractDocumentFile[] = [
  { id: 'cd1', contractId: 'tc1', fileName: 'Contrato_Vivo (Telefônica Brasil)_GalpaoA1.pdf', fileSize: '2.4 MB', uploadDate: '2024-02-15', type: 'contract_pdf' },
  { id: 'cd2', contractId: 'tc2', fileName: 'Contrato_Ambev_GalpaoA2.pdf', fileSize: '1.8 MB', uploadDate: '2024-06-10', type: 'contract_pdf' },
  { id: 'cd3', contractId: 'tc6', fileName: 'Contrato_DHL_GalpaoC2.pdf', fileSize: '2.1 MB', uploadDate: '2024-03-20', type: 'contract_pdf' },
];

// ─── SEED DATA ─────────────────────────────────

export let mockGuarantees: ContractGuarantee[] = [
  // Chucri Zaidan (b12) — vinculadas aos mesmos contratos exibidos em Locatários.
  // Valor de cobertura demonstrativo: três aluguéis mensais por conjunto.
  { id: 'g-b12-11', contract_id: 'b12-ct11', type: 'fianca_bancaria', value: 556800, valid_until: '2027-01-31', guarantor: 'Itaú BBA', issueDate: '2023-02-01', certificateNumber: 'FB-CZ-0011', documentUrl: 'fianca-nubank-cj11.pdf', documentUploadDate: '2026-01-15', renewalHistory: [{ year: 2025, expiryDate: '2026-01-31', documentUrl: 'fianca-nubank-cj11-2025.pdf', uploadDate: '2025-01-20' }] },
  { id: 'g-b12-21', contract_id: 'b12-ct21', type: 'seguro_fianca', value: 513360, valid_until: '2026-10-31', guarantor: 'Porto Seguro', issueDate: '2022-06-01', certificateNumber: 'SF-CZ-0021', documentUrl: 'seguro-ambev-cj21.pdf', documentUploadDate: '2025-11-03', renewalHistory: [] },
  { id: 'g-b12-31', contract_id: 'b12-ct31', type: 'fianca_bancaria', value: 502680, valid_until: '2027-02-28', guarantor: 'Bradesco', issueDate: '2022-03-01', certificateNumber: 'FB-CZ-0031', documentUrl: 'fianca-vivo-cj31.pdf', documentUploadDate: '2026-02-10', renewalHistory: [] },
  { id: 'g-b12-41', contract_id: 'b12-ct41', type: 'fianca_bancaria', value: 492120, valid_until: '2026-09-15', guarantor: 'Bradesco', issueDate: '2022-03-01', certificateNumber: 'FB-CZ-0041', documentUrl: 'fianca-vivo-cj41.pdf', documentUploadDate: '2025-09-10', renewalHistory: [] },
  { id: 'g-b12-51', contract_id: 'b12-ct51', type: 'caucao', value: 473760, valid_until: null, guarantor: 'Depósito vinculado', issueDate: '2021-08-01', certificateNumber: 'CAU-CZ-0051', documentUrl: 'caucao-totvs-cj51.pdf', documentUploadDate: '2021-08-05', renewalHistory: [] },
  { id: 'g-b12-61', contract_id: 'b12-ct61', type: 'caucao', value: 460320, valid_until: null, guarantor: 'Depósito vinculado', issueDate: '2021-08-01', certificateNumber: 'CAU-CZ-0061', documentUrl: 'caucao-totvs-cj61.pdf', documentUploadDate: '2021-08-05', renewalHistory: [] },
  { id: 'g-b12-81', contract_id: 'b12-ct81', type: 'seguro_fianca', value: 508200, valid_until: '2027-01-31', guarantor: 'Tokio Marine', issueDate: '2023-01-01', certificateNumber: 'SF-CZ-0081', documentUrl: 'seguro-befly-cj81.pdf', documentUploadDate: '2026-01-08', renewalHistory: [] },
  { id: 'g-b12-91', contract_id: 'b12-ct91', type: 'fianca_bancaria', value: 434910, valid_until: '2026-10-10', guarantor: 'Banco Safra', issueDate: '2022-11-01', certificateNumber: 'FB-CZ-0091', documentUrl: 'fianca-sirio-cj91.pdf', documentUploadDate: '2025-10-06', renewalHistory: [] },
  { id: 'g-b12-101', contract_id: 'b12-ct101', type: 'fianca_bancaria', value: 444720, valid_until: '2027-03-31', guarantor: 'Banco Safra', issueDate: '2022-11-01', certificateNumber: 'FB-CZ-0101', documentUrl: 'fianca-sirio-cj101.pdf', documentUploadDate: '2026-03-17', renewalHistory: [] },
  { id: 'g-b12-111', contract_id: 'b12-ct111', type: 'fiador', value: 418080, valid_until: '2027-01-31', guarantor: 'BP Energy do Brasil Ltda.', issueDate: '2024-02-01', certificateNumber: 'FIA-CZ-0111', documentUrl: 'fiador-bp-cj111.pdf', documentUploadDate: '2024-02-01', renewalHistory: [] },
  { id: 'g-b12-121', contract_id: 'b12-ct121', type: 'fianca_bancaria', value: 521640, valid_until: '2027-05-31', guarantor: 'Santander', issueDate: '2023-06-01', certificateNumber: 'FB-CZ-0121', documentUrl: 'fianca-dhl-cj121.pdf', documentUploadDate: '2026-05-14', renewalHistory: [] },
  { id: 'g-b12-131', contract_id: 'b12-ct131', type: 'fianca_bancaria', value: 498960, valid_until: '2027-05-31', guarantor: 'Santander', issueDate: '2023-06-01', certificateNumber: 'FB-CZ-0131', documentUrl: 'fianca-dhl-cj131.pdf', documentUploadDate: '2026-05-14', renewalHistory: [] },
  { id: 'g-b12-151', contract_id: 'b12-ct151', type: 'fianca_bancaria', value: 421200, valid_until: '2026-11-15', guarantor: 'Itaú BBA', issueDate: '2023-09-01', certificateNumber: 'FB-CZ-0151', documentUrl: null, documentUploadDate: null, renewalHistory: [] },
  { id: 'g-b12-161', contract_id: 'b12-ct161', type: 'fianca_bancaria', value: 430920, valid_until: '2027-08-31', guarantor: 'Itaú BBA', issueDate: '2023-09-01', certificateNumber: 'FB-CZ-0161', documentUrl: 'fianca-deloitte-cj161.pdf', documentUploadDate: '2026-08-12', renewalHistory: [] },
  { id: 'g-b12-171', contract_id: 'b12-ct171', type: 'fiador', value: 402480, valid_until: '2026-08-31', guarantor: 'BP Energy do Brasil Ltda.', issueDate: '2024-02-01', certificateNumber: 'FIA-CZ-0171', documentUrl: 'fiador-bp-cj171.pdf', documentUploadDate: '2024-02-01', renewalHistory: [] },
];

export const mockInsurances: ContractInsurance[] = [
  { id: 'ins1', contract_id: 'tc1', insurer: 'Allianz Seguros', policy_number: 'APO-2024-001', insured_value: 12000000, start_date: '2024-01-01', end_date: '2027-01-01' },
  { id: 'ins2', contract_id: 'tc2', insurer: 'Porto Seguro', policy_number: 'APO-2024-002', insured_value: 14500000, start_date: '2024-03-01', end_date: '2027-03-01' },
  { id: 'ins3', contract_id: 'tc5', insurer: 'SulAmérica', policy_number: 'APO-2023-005', insured_value: 8000000, start_date: '2023-10-01', end_date: '2026-07-01' },
  { id: 'ins4', contract_id: 'tc7', insurer: 'Tokio Marine', policy_number: 'APO-2024-007', insured_value: 9500000, start_date: '2024-01-01', end_date: '2027-01-01' },
];

const makeIPTUParcels = (annualValue: number) => {
  const monthly = Math.round(annualValue / 12);
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    value: monthly,
    due_date: `2026-${String(i + 1).padStart(2, '0')}-10`,
    status: (i < 3 ? 'paid' : i === 3 ? 'pending' : 'pending') as 'paid' | 'pending' | 'overdue',
  }));
};

export const mockIPTUs: ContractIPTU[] = [
  { id: 'iptu1', contract_id: 'tc1', responsible: 'locatario', annual_value: 48000, taxpayer_number: '001.234.567-8', parcels: makeIPTUParcels(48000) },
  { id: 'iptu2', contract_id: 'tc2', responsible: 'compartilhado', annual_value: 38000, taxpayer_number: '001.234.568-9', parcels: makeIPTUParcels(38000) },
  { id: 'iptu3', contract_id: 'tc5', responsible: 'locatario', annual_value: 42000, taxpayer_number: '001.234.569-0', parcels: makeIPTUParcels(42000) },
  { id: 'iptu4', contract_id: 'tc7', responsible: 'proprietario', annual_value: 35000, taxpayer_number: '001.234.570-1', parcels: makeIPTUParcels(35000) },
];

export const mockCommonAreaContracts: CommonAreaContract[] = [
  { id: 'cac1', building_id: 'b12', area_name: 'Cantina Industrial', operator: 'Sabor & Logística Ltda', area_m2: 220, monthly_revenue: 8500, adjustment_index: 'IPCA', contract_start: '2024-02-01', contract_end: '2027-01-31', status: 'active' },
  { id: 'cac2', building_id: 'b12', area_name: 'Estacionamento Carretas', operator: 'TruckPark Gestão', area_m2: 1800, monthly_revenue: 12000, adjustment_index: 'IGP-M', contract_start: '2023-01-01', contract_end: '2026-12-31', status: 'active' },
  { id: 'cac3', building_id: 'b12', area_name: 'Centro de Treinamento', operator: 'Logística Academy', area_m2: 350, monthly_revenue: 15000, adjustment_index: 'IPCA', contract_start: '2024-06-01', contract_end: '2027-05-31', status: 'active' },
  { id: 'cac4', building_id: 'b12', area_name: 'Posto de Combustível', operator: 'Vibra Energia', area_m2: 480, monthly_revenue: 9800, adjustment_index: 'IGP-M', contract_start: '2023-09-01', contract_end: '2026-08-31', status: 'expiring' },
];

// ─── PAYMENT RECORDS (expanded with all fields) ─────────
// Chucri Zaidan (b12) — Locatários HGRE11 — competência 2026-04
export let mockMonthlyPayments: MonthlyPayment[] = [
  { id: 'mp1', building_id: 'b12', tenant_name: 'Vivo (Telefônica Brasil)', unit_id: 'Conjunto A1', contractual_value: 180000, discount: 0, billable_value: 180000, btg_sent: true, btg_sent_date: '2026-04-03', received: true, received_date: '2026-04-05', received_amount: 180000, status: 'paid', competence: '2026-04', due_day: 5, contactHistory: [], receiptUrl: 'comprovante-magalu-abr.pdf' },
  { id: 'mp2', building_id: 'b12', tenant_name: 'Totvs S.A.', unit_id: 'Conjunto A2', contractual_value: 207000, discount: 0, billable_value: 207000, btg_sent: true, btg_sent_date: '2026-04-03', received: true, received_date: '2026-04-09', received_amount: 207000, status: 'paid', competence: '2026-04', due_day: 10, contactHistory: [], receiptUrl: 'comprovante-ambev-abr.pdf' },
  { id: 'mp3', building_id: 'b12', tenant_name: 'Befly Viagens', unit_id: 'Conjunto B1', contractual_value: 162500, discount: 0, billable_value: 162500, btg_sent: true, btg_sent_date: '2026-04-03', received: false, received_amount: null, status: 'pending', competence: '2026-04', due_day: 10, contactHistory: [], receiptUrl: null },
  { id: 'mp4', building_id: 'b12', tenant_name: 'Hospital Sírio-Libanês', unit_id: 'Conjunto B2', contractual_value: 127600, discount: 0, billable_value: 127600, btg_sent: true, btg_sent_date: '2026-03-20', received: false, received_amount: null, status: 'overdue', competence: '2026-04', due_day: 5, contactHistory: [
    { date: '2026-04-06', method: 'email', sentBy: 'Rodrigo Silva', message: 'Cobrança de aluguel em atraso', response: 'no_response' },
  ], receiptUrl: null },
  { id: 'mp5', building_id: 'b12', tenant_name: 'BP Brasil', unit_id: 'Conjunto C1', contractual_value: 88200, discount: 0, billable_value: 88200, btg_sent: true, btg_sent_date: '2026-02-20', received: false, received_amount: null, status: 'overdue', competence: '2026-04', due_day: 5, contactHistory: [
    { date: '2026-03-10', method: 'email', sentBy: 'Rodrigo Silva', message: 'Primeiro aviso de cobrança — aluguel Fev/2026', response: 'promised_payment' },
    { date: '2026-03-25', method: 'whatsapp', sentBy: 'Ana Martins', message: 'Reforço de cobrança — ainda pendente', response: 'no_response' },
  ], receiptUrl: null },
  { id: 'mp6', building_id: 'b12', tenant_name: 'DHL', unit_id: 'Conjunto C2', contractual_value: 202800, discount: 0, billable_value: 202800, btg_sent: true, btg_sent_date: '2026-04-03', received: true, received_date: '2026-04-08', received_amount: 202800, status: 'paid', competence: '2026-04', due_day: 15, contactHistory: [], receiptUrl: 'comprovante-dhl-abr.pdf' },
  { id: 'mp7', building_id: 'b12', tenant_name: 'WeWork Brasil', unit_id: 'Conjunto D1', contractual_value: 103500, discount: 0, billable_value: 103500, btg_sent: true, btg_sent_date: '2026-04-03', received: false, received_amount: null, status: 'awaiting_btg', competence: '2026-04', due_day: 5, contactHistory: [], receiptUrl: null },
  { id: 'mp10', building_id: 'b12', tenant_name: 'Deloitte Brasil', unit_id: 'Conjunto D2', contractual_value: 80520, discount: 0, billable_value: 80520, btg_sent: true, btg_sent_date: '2026-04-03', received: true, received_date: '2026-04-05', received_amount: 80520, status: 'paid', competence: '2026-04', due_day: 5, contactHistory: [], receiptUrl: 'comprovante-caedu-abr.pdf' },
  // Áreas comuns Chucri Zaidan
  { id: 'mp8', building_id: 'b12', tenant_name: 'Cantina Industrial', unit_id: 'Área Comum', contractual_value: 8500, discount: 0, billable_value: 8500, btg_sent: true, btg_sent_date: '2026-04-02', received: true, received_date: '2026-04-04', received_amount: 8500, status: 'paid', competence: '2026-04', due_day: 5, contactHistory: [], receiptUrl: null },
  { id: 'mp9', building_id: 'b12', tenant_name: 'Estacionamento Carretas', unit_id: 'Área Comum', contractual_value: 12000, discount: 0, billable_value: 12000, btg_sent: true, btg_sent_date: '2026-04-02', received: false, received_amount: null, status: 'overdue', competence: '2026-04', due_day: 5, contactHistory: [], receiptUrl: null },
  { id: 'mp16', building_id: 'b12', tenant_name: 'Centro de Treinamento', unit_id: 'Área Comum', contractual_value: 15000, discount: 0, billable_value: 15000, btg_sent: true, btg_sent_date: '2026-04-02', received: true, received_date: '2026-04-04', received_amount: 15000, status: 'paid', competence: '2026-04', due_day: 5, contactHistory: [], receiptUrl: null },
  { id: 'mp17', building_id: 'b12', tenant_name: 'Posto de Combustível', unit_id: 'Área Comum', contractual_value: 9800, discount: 0, billable_value: 9800, btg_sent: true, btg_sent_date: '2026-04-02', received: true, received_date: '2026-04-05', received_amount: 9800, status: 'paid', competence: '2026-04', due_day: 5, contactHistory: [], receiptUrl: null },
];

export const mockReajustes: ReajusteInfo[] = [
  { id: 'r1', building_id: 'b12', tenant_name: 'Vivo (Telefônica Brasil)', unit_id: 'Conjunto A1', index: 'IGP-M', base_date: '2022-03-01', last_adjustment: '2025-03-01', next_adjustment: '2026-03-01', current_value: 180000, simulated_value: 188676, variation_pct: 4.82, status: 'urgent' },
  { id: 'r2', building_id: 'b12', tenant_name: 'Totvs S.A.', unit_id: 'Conjunto A2', index: 'IPCA', base_date: '2021-08-01', last_adjustment: '2025-08-01', next_adjustment: '2026-08-01', current_value: 207000, simulated_value: 215280, variation_pct: 4.0, status: 'upcoming' },
  { id: 'r3', building_id: 'b12', tenant_name: 'Befly Viagens', unit_id: 'Conjunto B1', index: 'IGP-M', base_date: '2023-01-01', last_adjustment: '2025-01-01', next_adjustment: '2026-01-01', current_value: 162500, simulated_value: 170334, variation_pct: 4.82, status: 'applied' },
  { id: 'r4', building_id: 'b12', tenant_name: 'Hospital Sírio-Libanês', unit_id: 'Conjunto B2', index: 'IPCA', base_date: '2022-11-01', last_adjustment: '2025-11-01', next_adjustment: '2026-11-01', current_value: 127600, simulated_value: 132704, variation_pct: 4.0, status: 'upcoming' },
  { id: 'r5', building_id: 'b12', tenant_name: 'DHL', unit_id: 'Conjunto C2', index: 'IPCA', base_date: '2023-06-01', last_adjustment: '2025-06-01', next_adjustment: '2026-06-01', current_value: 202800, simulated_value: 210912, variation_pct: 4.0, status: 'upcoming' },
  { id: 'r6', building_id: 'b12', tenant_name: 'WeWork Brasil', unit_id: 'Conjunto D1', index: 'IGP-M', base_date: '2024-04-01', last_adjustment: '2025-04-01', next_adjustment: '2026-04-01', current_value: 103500, simulated_value: 108489, variation_pct: 4.82, status: 'urgent' },
  { id: 'r7', building_id: 'b12', tenant_name: 'Deloitte Brasil', unit_id: 'Conjunto D2', index: 'IPCA', base_date: '2023-09-01', last_adjustment: '2025-09-01', next_adjustment: '2026-09-01', current_value: 80520, simulated_value: 83741, variation_pct: 4.0, status: 'upcoming' },
];

export let mockInadimplencia: InadimplenciaRecord[] = [
  { id: 'inad1', building_id: 'b12', building_name: 'Chucri Zaidan', tenant_name: 'Hospital Sírio-Libanês', unit_id: 'Conjunto B2', competence: '2026-04', value: 127600, days_overdue: 3,
    last_contact: '2026-04-06', last_contact_type: 'email', contact_status: 'contacted',
    responsible_name: 'Renata Furlan', responsible_email: 'financeiro@tokstok.com.br', responsible_phone: '(11) 98765-1234',
    multa_pct: 2, juros_am_pct: 1, next_payment_deadline: '2026-04-20',
    comments: 'Locatária com bom histórico — atraso pontual relacionado a troca de banco.',
    serasa: false,
    history: [
      { date: '2026-04-06', type: 'email', note: 'E-mail de cobrança enviado automaticamente via Banco' },
    ],
  },
  { id: 'inad2', building_id: 'b12', building_name: 'Chucri Zaidan', tenant_name: 'BP Brasil', unit_id: 'Conjunto C1', competence: '2026-04', value: 88200, days_overdue: 45,
    last_contact: '2026-03-25', last_contact_type: 'whatsapp', contact_status: 'promised',
    responsible_name: 'Carlos Mendes', responsible_email: 'carlos.mendes@supporte.com.br', responsible_phone: '(11) 99123-4567',
    multa_pct: 2, juros_am_pct: 1, next_payment_deadline: '2026-04-30',
    comments: 'Cliente prometeu pagamento parcial até 30/04. Avaliar protesto caso descumpra.',
    serasa: true,
    history: [
      { date: '2026-03-10', type: 'email', note: 'Primeiro aviso de cobrança — aluguel Fev/2026' },
      { date: '2026-03-25', type: 'whatsapp', note: 'Reforço de cobrança — locatário prometeu pagar em 5 dias' },
    ],
  },
  { id: 'inad3', building_id: 'b12', building_name: 'Chucri Zaidan', tenant_name: 'Estacionamento Carretas', unit_id: 'Área Comum', competence: '2026-04', value: 12000, days_overdue: 3,
    contact_status: 'not_contacted',
    responsible_name: 'João Pacheco', responsible_email: 'joao@estcarretas.com.br', responsible_phone: '(11) 97777-8821',
    multa_pct: 2, juros_am_pct: 1, next_payment_deadline: '2026-04-18',
    comments: '',
    serasa: false,
    history: [],
  },
  { id: 'inad4', building_id: 'b12', building_name: 'Chucri Zaidan', tenant_name: 'WeWork Brasil', unit_id: 'Conjunto D1', competence: '2026-04', value: 103500, days_overdue: 3,
    last_contact: '2026-04-07', last_contact_type: 'email', contact_status: 'contacted',
    responsible_name: 'Patrícia Lemos', responsible_email: 'financeiro@sierralog.com', responsible_phone: '(11) 98123-5599',
    multa_pct: 2, juros_am_pct: 1, next_payment_deadline: '2026-04-22',
    comments: 'Em negociação para parcelamento em 2x.',
    serasa: false,
    history: [
      { date: '2026-04-07', type: 'email', note: 'Cobrança aluguel em atraso — Conjunto D1' },
    ],
  },
];


export const mockCashFlow: CashFlowMonth[] = [
  // Chucri Zaidan (b12) — HGRE11
  { competence: '2026-01', building_id: 'b12', expected_revenue: 1107120, realized_revenue: 1098000, expenses: 32500, result: 1065500, variation_pct: 0, breakdown: { alugueis: 1052120, outras_receitas: 45300, condominio: 0, iptu: 12500, manutencao: 14200, administracao: 5800, outras_despesas: 0 } },
  { competence: '2026-02', building_id: 'b12', expected_revenue: 1107120, realized_revenue: 1110000, expenses: 31800, result: 1078200, variation_pct: 1.2, breakdown: { alugueis: 1064820, outras_receitas: 45300, condominio: 0, iptu: 12500, manutencao: 13500, administracao: 5800, outras_despesas: 0 } },
  { competence: '2026-03', building_id: 'b12', expected_revenue: 1107120, realized_revenue: 1112000, expenses: 38900, result: 1073100, variation_pct: -0.5, breakdown: { alugueis: 1066700, outras_receitas: 45300, condominio: 0, iptu: 12500, manutencao: 18700, administracao: 7700, outras_despesas: 0 } },
  { competence: '2026-04', building_id: 'b12', expected_revenue: 1107120, realized_revenue: 783820, expenses: 30200, result: 753620, variation_pct: -29.7, breakdown: { alugueis: 738520, outras_receitas: 45300, condominio: 0, iptu: 12500, manutencao: 12300, administracao: 5400, outras_despesas: 0 } },
  // projected
  { competence: '2026-05', building_id: 'b12', expected_revenue: 1107120, realized_revenue: 1100000, expenses: 33700, result: 1066300, variation_pct: 0, projected: true, breakdown: { alugueis: 1054700, outras_receitas: 45300, condominio: 0, iptu: 12500, manutencao: 14000, administracao: 7200, outras_despesas: 0 } },
  { competence: '2026-06', building_id: 'b12', expected_revenue: 1107120, realized_revenue: 1100000, expenses: 33700, result: 1066300, variation_pct: 0, projected: true, breakdown: { alugueis: 1054700, outras_receitas: 45300, condominio: 0, iptu: 12500, manutencao: 14000, administracao: 7200, outras_despesas: 0 } },
  { competence: '2026-07', building_id: 'b12', expected_revenue: 1107120, realized_revenue: 1100000, expenses: 33700, result: 1066300, variation_pct: 0, projected: true, breakdown: { alugueis: 1054700, outras_receitas: 45300, condominio: 0, iptu: 12500, manutencao: 14000, administracao: 7200, outras_despesas: 0 } },
];

// ─── REVENUE SEED DATA ────────────────────────
const caxiasTenants = [
  { name: 'Vivo (Telefônica Brasil)', unit: 'Conjunto A1', value: 180000 },
  { name: 'Totvs S.A.', unit: 'Conjunto A2', value: 207000 },
  { name: 'Befly Viagens', unit: 'Conjunto B1', value: 162500 },
  { name: 'Hospital Sírio-Libanês', unit: 'Conjunto B2', value: 127600 },
  { name: 'BP Brasil', unit: 'Conjunto C1', value: 88200 },
  { name: 'DHL', unit: 'Conjunto C2', value: 202800 },
  { name: 'WeWork Brasil', unit: 'Conjunto D1', value: 103500 },
  { name: 'Deloitte Brasil', unit: 'Conjunto D2', value: 80520 },
];
const caxiasAreas = [
  { name: 'Cantina Industrial', value: 8500 },
  { name: 'Estacionamento Carretas', value: 12000 },
  { name: 'Centro de Treinamento', value: 15000 },
  { name: 'Posto de Combustível', value: 9800 },
];

const caxiasTenantStatuses: Record<string, ('paid'|'pending'|'overdue')[]> = {
  'Vivo (Telefônica Brasil)': ['paid','paid','paid','paid'],
  'Totvs S.A.': ['paid','paid','paid','paid'],
  'Befly Viagens': ['paid','paid','paid','pending'],
  'Hospital Sírio-Libanês': ['paid','paid','paid','overdue'],
  'BP Brasil': ['paid','paid','overdue','overdue'],
  'DHL': ['paid','paid','paid','paid'],
  'WeWork Brasil': ['paid','paid','pending','pending'],
  'Deloitte Brasil': ['paid','paid','paid','paid'],
};

let revId = 0;
const revenueVariation: Record<string, Record<string, number>> = {
  'Posto de Combustível': { '01': 0, '02': 9800, '03': 9800, '04': 9800 },
  'Estacionamento Carretas': { '01': 11000, '02': 11500, '03': 12000, '04': 12000 },
  'Cantina Industrial': { '01': 7500, '02': 8000, '03': 8200, '04': 8500 },
};
const generateRevenues = (): RevenueRecord[] => {
  const records: RevenueRecord[] = [];
  const months = ['01','02','03','04'];
  caxiasTenants.forEach(t => {
    months.forEach((m, mi) => {
      records.push({
        id: `rev-${++revId}`, building_id: 'b12', date: `2026-${m}-05`,
        origin: 'locatario', tenant_name: t.name, description: `Aluguel ${t.unit}`,
        value: t.value, category: 'aluguel_locatario', competence: `2026-${m}`,
        status: caxiasTenantStatuses[t.name]?.[mi] || 'pending', reference: `NF-${revId}`,
      });
    });
  });
  caxiasAreas.forEach(a => {
    months.forEach((m) => {
      const variedValue = revenueVariation[a.name]?.[m] ?? a.value;
      if (variedValue === 0) return;
      records.push({
        id: `rev-${++revId}`, building_id: 'b12', date: `2026-${m}-05`,
        origin: 'area_comum', tenant_name: a.name, description: `Receita ${a.name}`,
        value: variedValue, category: 'aluguel_area_comum', competence: `2026-${m}`,
        status: 'paid',
      });
    });
  });
  return records;
};

export const mockRevenues: RevenueRecord[] = generateRevenues();

let expId = 0;
export const mockExpenses: ExpenseRecord[] = [
  { id: `exp-${++expId}`, building_id: 'b12', date: '2026-01-10', supplier: 'Prefeitura de São Paulo', description: 'IPTU Parcela Jan', value: 12500, category: 'iptu', cost_center: 'Chucri Zaidan', competence: '2026-01' },
  { id: `exp-${++expId}`, building_id: 'b12', date: '2026-01-15', supplier: 'TechLog Manutenção', description: 'Manutenção docas e portões', value: 7200, category: 'manutencao', cost_center: 'Chucri Zaidan', competence: '2026-01' },
  { id: `exp-${++expId}`, building_id: 'b12', date: '2026-01-20', supplier: 'CleanLog Serviços', description: 'Limpeza industrial mensal', value: 7000, category: 'manutencao', cost_center: 'Chucri Zaidan', competence: '2026-01' },
  { id: `exp-${++expId}`, building_id: 'b12', date: '2026-01-25', supplier: 'Patria Investimentos', description: 'Taxa de administração', value: 5800, category: 'honorarios', cost_center: 'Chucri Zaidan', competence: '2026-01' },
  { id: `exp-${++expId}`, building_id: 'b12', date: '2026-02-10', supplier: 'Prefeitura de São Paulo', description: 'IPTU Parcela Fev', value: 12500, category: 'iptu', cost_center: 'Chucri Zaidan', competence: '2026-02' },
  { id: `exp-${++expId}`, building_id: 'b12', date: '2026-02-15', supplier: 'Allianz Seguros', description: 'Seguro patrimonial', value: 6300, category: 'seguro_predial', cost_center: 'Chucri Zaidan', competence: '2026-02' },
  { id: `exp-${++expId}`, building_id: 'b12', date: '2026-02-20', supplier: 'CleanLog Serviços', description: 'Limpeza industrial mensal', value: 7200, category: 'manutencao', cost_center: 'Chucri Zaidan', competence: '2026-02' },
  { id: `exp-${++expId}`, building_id: 'b12', date: '2026-02-25', supplier: 'Patria Investimentos', description: 'Taxa de administração', value: 5800, category: 'honorarios', cost_center: 'Chucri Zaidan', competence: '2026-02' },
  { id: `exp-${++expId}`, building_id: 'b12', date: '2026-03-10', supplier: 'Prefeitura de São Paulo', description: 'IPTU Parcela Mar', value: 12500, category: 'iptu', cost_center: 'Chucri Zaidan', competence: '2026-03' },
  { id: `exp-${++expId}`, building_id: 'b12', date: '2026-03-18', supplier: 'TechLog Manutenção', description: 'Reparo telhado galpão A', value: 11500, category: 'manutencao', cost_center: 'Chucri Zaidan', competence: '2026-03' },
  { id: `exp-${++expId}`, building_id: 'b12', date: '2026-03-25', supplier: 'Patria Investimentos', description: 'Taxa de administração', value: 7700, category: 'honorarios', cost_center: 'Chucri Zaidan', competence: '2026-03' },
  { id: `exp-${++expId}`, building_id: 'b12', date: '2026-04-10', supplier: 'Prefeitura de São Paulo', description: 'IPTU Parcela Abr', value: 12500, category: 'iptu', cost_center: 'Chucri Zaidan', competence: '2026-04' },
  { id: `exp-${++expId}`, building_id: 'b12', date: '2026-04-20', supplier: 'CleanLog Serviços', description: 'Limpeza industrial mensal', value: 6900, category: 'manutencao', cost_center: 'Chucri Zaidan', competence: '2026-04' },
  { id: `exp-${++expId}`, building_id: 'b12', date: '2026-04-25', supplier: 'Patria Investimentos', description: 'Taxa de administração', value: 5400, category: 'honorarios', cost_center: 'Chucri Zaidan', competence: '2026-04' },
];

// ─── Financial Entries (unified model) ─────────
export let mockFinancialEntries: FinancialEntry[] = [
  { id: 'fe1', buildingId: 'b12', unitId: 'Conjunto A1', date: '2026-04-05', type: 'receita', category: 'aluguel', subcategory: 'Aluguel', description: 'Aluguel Vivo (Telefônica Brasil) Conjunto A1', amount: 180000, receiptUrl: 'comprovante-magalu.pdf', isCapex: false, iptuInstallment: null, notes: '' },
  { id: 'fe2', buildingId: 'b12', unitId: 'Conjunto A2', date: '2026-04-09', type: 'receita', category: 'aluguel', subcategory: 'Aluguel', description: 'Aluguel Ambev Conjunto A2', amount: 207000, receiptUrl: 'comprovante-ambev.pdf', isCapex: false, iptuInstallment: null, notes: '' },
  { id: 'fe3', buildingId: 'b12', unitId: 'Conjunto C2', date: '2026-04-08', type: 'receita', category: 'aluguel', subcategory: 'Aluguel', description: 'Aluguel DHL Conjunto C2', amount: 202800, receiptUrl: 'comprovante-dhl.pdf', isCapex: false, iptuInstallment: null, notes: '' },
  { id: 'fe4', buildingId: 'b12', unitId: null, date: '2026-04-10', type: 'despesa', category: 'iptu', subcategory: 'IPTU', description: 'IPTU Parcela Abr — Chucri Zaidan', amount: 12500, receiptUrl: null, isCapex: false, iptuInstallment: { current: 4, total: 12 }, notes: '' },
  { id: 'fe5', buildingId: 'b12', unitId: null, date: '2026-04-20', type: 'despesa', category: 'manutencao_preventiva', subcategory: 'Manutenção preventiva', description: 'Limpeza industrial mensal', amount: 6900, receiptUrl: null, isCapex: false, iptuInstallment: null, notes: '' },
  { id: 'fe6', buildingId: 'b12', unitId: null, date: '2026-04-25', type: 'despesa', category: 'honorarios', subcategory: 'Administração', description: 'Taxa de administração Patria', amount: 5400, receiptUrl: null, isCapex: false, iptuInstallment: null, notes: '' },
  { id: 'fe7', buildingId: 'b12', unitId: null, date: '2026-02-15', type: 'despesa', category: 'seguro_predial', subcategory: 'Seguro patrimonial', description: 'Seguro patrimonial Chucri Zaidan', amount: 6300, receiptUrl: 'apolice-allianz.pdf', isCapex: false, iptuInstallment: null, notes: '' },
];

// Banco Extract mock — Chucri Zaidan / HGRE11
export let mockBTGExtract: BTGExtractEntry[] = [
  { id: 'btg1', date: '2026-04-02', description: 'TED RECEBIDA Vivo (Telefônica Brasil)', amount: 180000, documentNumber: 'BANCO001' },
  { id: 'btg2', date: '2026-04-02', description: 'TED RECEBIDA AMBEV SA', amount: 207000, documentNumber: 'BANCO002' },
  { id: 'btg3', date: '2026-04-01', description: 'TED RECEBIDA CANTINA INDUSTRIAL', amount: 8500, documentNumber: 'BANCO003' },
  { id: 'btg4', date: '2026-04-01', description: 'TED RECEBIDA CENTRO TREINAMENTO', amount: 15000, documentNumber: 'BANCO004' },
  { id: 'btg5', date: '2026-04-09', description: 'DEB IPTU CAXIAS PARK', amount: -12500, documentNumber: 'BANCO005' },
  { id: 'btg6', date: '2026-04-09', description: 'DEB SEGURO ALLIANZ', amount: -6280, documentNumber: 'BANCO006' }, // divergente: sistema tem 6300
  { id: 'btg7', date: '2026-04-11', description: 'DEB MANUTENCAO TECHLOG', amount: -7200, documentNumber: 'BANCO007' },
  { id: 'btg8', date: '2026-04-15', description: 'TED RECEBIDA ORIGEM DESCONHECIDA', amount: 12000, documentNumber: 'BANCO008' }, // não identificado
  { id: 'btg9', date: '2026-04-01', description: 'TED RECEBIDA POSTO COMBUSTIVEL', amount: 9800, documentNumber: 'BANCO009' },
];

export const mockReportHistory: ReportHistoryEntry[] = [
  { id: 'rh1', type: 'gestao', building_name: 'Chucri Zaidan', tenants: ['Vivo (Telefônica Brasil)', 'Totvs S.A.'], period: 'Jan-Mar/2026', generated_at: '2026-03-31T14:00:00', generated_by: 'Rodrigo Silva', format: 'pdf', size: '1.2 MB' },
  { id: 'rh2', type: 'pendencias', building_name: 'Chucri Zaidan', tenants: ['BP Brasil'], period: 'Mar/2026', generated_at: '2026-03-28T10:30:00', generated_by: 'Rodrigo Silva', format: 'pdf', size: '340 KB' },
  { id: 'rh3', type: 'gestao', building_name: 'Chucri Zaidan', tenants: ['Todos'], period: 'Jan-Mar/2026', generated_at: '2026-03-30T16:00:00', generated_by: 'Ana Martins', format: 'pdf', size: '2.8 MB' },
  { id: 'rh4', type: 'gestao', building_name: 'Chucri Zaidan', tenants: ['Todos'], period: 'Jan-Dez/2025', generated_at: '2026-01-05T09:00:00', generated_by: 'Rodrigo Silva', format: 'excel', size: '890 KB' },
  { id: 'rh5', type: 'pendencias', building_name: 'Chucri Zaidan', tenants: ['Todos'], period: 'Fev/2026', generated_at: '2026-03-01T11:00:00', generated_by: 'Ana Martins', format: 'pdf', size: '280 KB' },
  { id: 'rh6', type: 'gestao', building_name: 'Chucri Zaidan', tenants: ['Hospital Sírio-Libanês'], period: 'Abr/2026', generated_at: '2026-04-05T15:30:00', generated_by: 'Rodrigo Silva', format: 'pdf', size: '520 KB' },
];
