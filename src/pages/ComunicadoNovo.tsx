import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Upload, Plus, Minus, BarChart3, MessageSquare } from "lucide-react";
import ContactGroupSelector from "@/components/ContactGroupSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { mockUser } from "@/lib/mock-data";
import { toast } from "sonner";

const steps = ['Autor', 'Conteúdo', 'Datas', 'Destinatários', 'Interações', 'Preview'];
const categories = [
  { label: '🔧 Manutenção', value: 'Manutenção' },
  { label: '🔒 Segurança', value: 'Segurança' },
  { label: '📋 Administrativo', value: 'Administrativo' },
  { label: '🌿 ESG', value: 'ESG' },
  { label: '⚠️ Urgente', value: 'Urgente' },
  { label: '🎉 Evento', value: 'Evento' },
  { label: '📣 Informativo', value: 'Informativo' },
];

const ComunicadoNovo = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [stepErrors, setStepErrors] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    authorName: mockUser.full_name,
    company: mockUser.company || 'Gestão Predial do Ativo',
    position: mockUser.position || '',
    confirmed: false,
    title: '',
    category: '',
    priority: 'normal' as 'normal' | 'high' | 'urgent',
    content: '',
    publishDate: new Date().toISOString().split('T')[0],
    publishTime: new Date().toTimeString().slice(0, 5),
    hasExpiry: false,
    expiryDate: '',
    targetType: 'all' as 'all' | 'floors' | 'companies' | 'specific' | 'managers',
    selectedFloors: [] as number[],
    selectedGroupIds: ['g6'] as string[],
    selectedContactIds: [] as string[],
    allowComments: true,
    moderateComments: false,
    hasPoll: false,
    pollQuestion: '',
    pollOptions: ['', ''],
    pollType: 'single' as 'single' | 'multiple',
    requireConfirmation: false,
  });

  const update = (k: string, v: any) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setStepErrors({});
  };

  const validateStep = (s: number): boolean => {
    const errors: Record<string, boolean> = {};
    switch (s) {
      case 1: // Conteúdo
        if (!form.title.trim()) errors.title = true;
        if (!form.category) errors.category = true;
        if (!form.content.trim()) errors.content = true;
        break;
      case 2: // Datas
        if (form.hasExpiry && form.expiryDate) {
          if (new Date(form.expiryDate) <= new Date()) errors.expiryDate = true;
        }
        break;
      case 3: // Destinatários
        if (form.selectedGroupIds.length === 0 && form.selectedContactIds.length === 0) errors.recipients = true;
        break;
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (step < 5) {
      if (validateStep(step)) {
        setStep(step + 1);
      } else {
        toast.error('⚠️ Preencha os campos obrigatórios antes de avançar');
      }
    }
  };

  const handlePublish = () => {
    // Validate all required fields
    if (!form.title.trim() || !form.content.trim() || !form.category) {
      toast.error('⚠️ Preencha todos os campos obrigatórios antes de publicar');
      // Go to content step
      setStep(1);
      setStepErrors({ title: !form.title.trim(), category: !form.category, content: !form.content.trim() });
      return;
    }
    if (form.selectedGroupIds.length === 0 && form.selectedContactIds.length === 0) {
      toast.error('⚠️ Selecione ao menos um destinatário');
      setStep(3);
      setStepErrors({ recipients: true });
      return;
    }

    const totalRecipients = form.selectedGroupIds.length + form.selectedContactIds.length;
    toast.success(`✅ Comunicado publicado e enviado para ${totalRecipients} destinatário(s)`);
    setTimeout(() => navigate('/comunicados'), 1500);
  };

  const handleDraft = () => {
    toast.success('💾 Rascunho salvo — você pode continuar depois em Comunicados');
    setTimeout(() => navigate('/comunicados'), 1500);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/comunicados')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Comunicado</h1>
          <p className="text-sm text-muted-foreground">Preencha as informações para criar um comunicado</p>
        </div>
      </div>

      {/* Stepper - mobile: progress bar, desktop: full stepper */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Passo {step + 1} de {steps.length}</span>
          <span className="text-xs text-muted-foreground">{steps[step]}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-interactive rounded-full transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <button
              onClick={() => { if (i < step) setStep(i); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors w-full ${
                i === step ? 'bg-interactive text-interactive-foreground' :
                i < step ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < step ? <Check size={14} /> : <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px]">{i + 1}</span>}
              <span className="hidden md:inline">{s}</span>
            </button>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-6 premium-shadow animate-fade-in">
        {/* Step 1: Author */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full premium-gradient flex items-center justify-center text-xl font-bold text-primary-foreground">
                {mockUser.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <Label>Nome Completo</Label>
                <Input value={form.authorName} onChange={e => update('authorName', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Empresa / Organização</Label>
              <Input value={form.company} onChange={e => update('company', e.target.value)} />
            </div>
            <div>
              <Label>Cargo / Função</Label>
              <Input value={form.position} onChange={e => update('position', e.target.value)} placeholder="Ex: Gestor Predial" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Checkbox checked={form.confirmed} onCheckedChange={v => update('confirmed', v)} />
              <span className="text-sm text-muted-foreground">Confirmo que estou autorizado a publicar comunicados em nome desta organização</span>
            </div>
          </div>
        )}

        {/* Step 2: Content */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Título <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={e => update('title', e.target.value.slice(0, 100))} placeholder="Título do comunicado" className={stepErrors.title ? 'border-destructive' : ''} />
              {stepErrors.title && <p className="text-xs text-destructive mt-1">Campo obrigatório</p>}
              <p className="text-xs text-muted-foreground text-right mt-1">{form.title.length}/100</p>
            </div>
            <div>
              <Label>Categoria <span className="text-destructive">*</span></Label>
              {stepErrors.category && <p className="text-xs text-destructive mt-1">Selecione uma categoria</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {categories.map(c => (
                  <button key={c.value} onClick={() => update('category', c.value)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${form.category === c.value ? 'bg-interactive text-interactive-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'} ${stepErrors.category ? 'ring-1 ring-destructive' : ''}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Prioridade</Label>
              <div className="flex gap-2 mt-2">
                {(['normal', 'high', 'urgent'] as const).map(p => (
                  <button key={p} onClick={() => update('priority', p)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    form.priority === p
                      ? p === 'urgent' ? 'bg-destructive text-destructive-foreground' : p === 'high' ? 'bg-amber-500 text-white' : 'bg-interactive text-interactive-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {p === 'normal' ? 'Normal' : p === 'high' ? 'Alta' : 'Urgente'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Corpo do Comunicado <span className="text-destructive">*</span></Label>
              <Textarea value={form.content} onChange={e => update('content', e.target.value)} placeholder="Escreva o conteúdo do comunicado..." className={`min-h-[200px] mt-2 ${stepErrors.content ? 'border-destructive' : ''}`} />
              {stepErrors.content && <p className="text-xs text-destructive mt-1">Campo obrigatório</p>}
            </div>
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
              <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Arraste arquivos aqui ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, imagens, documentos</p>
            </div>
          </div>
        )}

        {/* Step 3: Dates */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Data do Comunicado</Label>
                <Input type="date" value={form.publishDate} onChange={e => update('publishDate', e.target.value)} />
              </div>
              <div>
                <Label>Horário de Publicação</Label>
                <Input type="time" value={form.publishTime} onChange={e => update('publishTime', e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <p className="text-sm font-medium">Data de Validade / Expiração</p>
                <p className="text-xs text-muted-foreground">Defina quando o comunicado expira</p>
              </div>
              <Switch checked={form.hasExpiry} onCheckedChange={v => update('hasExpiry', v)} />
            </div>
            {form.hasExpiry && (
              <div>
                <Label>Data de Expiração</Label>
                <Input type="date" value={form.expiryDate} onChange={e => update('expiryDate', e.target.value)} className={stepErrors.expiryDate ? 'border-destructive' : ''} />
                {stepErrors.expiryDate && <p className="text-xs text-destructive mt-1">A data de expiração deve ser futura</p>}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Recipients */}
        {step === 3 && (
          <div className="space-y-3">
            <Label>Destinatários <span className="text-destructive">*</span></Label>
            {stepErrors.recipients && <p className="text-xs text-destructive">Selecione ao menos 1 grupo ou contato</p>}
            <ContactGroupSelector
              selectedGroupIds={form.selectedGroupIds}
              selectedContactIds={form.selectedContactIds}
              onGroupsChange={ids => update('selectedGroupIds', ids)}
              onContactsChange={ids => update('selectedContactIds', ids)}
            />
          </div>
        )}

        {/* Step 5: Interactions */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <MessageSquare size={20} className="text-interactive" />
                <div>
                  <p className="text-sm font-medium">Permitir Comentários</p>
                  <p className="text-xs text-muted-foreground">Usuários podem comentar no comunicado</p>
                </div>
              </div>
              <Switch checked={form.allowComments} onCheckedChange={v => update('allowComments', v)} />
            </div>
            {form.allowComments && (
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl ml-6">
                <p className="text-sm">Moderar comentários antes de publicar</p>
                <Switch checked={form.moderateComments} onCheckedChange={v => update('moderateComments', v)} />
              </div>
            )}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <BarChart3 size={20} className="text-interactive" />
                <div>
                  <p className="text-sm font-medium">Adicionar Enquete</p>
                  <p className="text-xs text-muted-foreground">Crie uma votação para os leitores</p>
                </div>
              </div>
              <Switch checked={form.hasPoll} onCheckedChange={v => update('hasPoll', v)} />
            </div>
            {form.hasPoll && (
              <div className="space-y-3 ml-6 bg-muted/30 rounded-xl p-4">
                <div>
                  <Label>Pergunta da Enquete</Label>
                  <Input value={form.pollQuestion} onChange={e => update('pollQuestion', e.target.value)} placeholder="Sua pergunta..." />
                </div>
                {form.pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={opt} onChange={e => { const opts = [...form.pollOptions]; opts[i] = e.target.value; update('pollOptions', opts); }} placeholder={`Opção ${i + 1}`} />
                    {form.pollOptions.length > 2 && (
                      <Button variant="ghost" size="icon" onClick={() => update('pollOptions', form.pollOptions.filter((_, j) => j !== i))}><Minus size={14} /></Button>
                    )}
                  </div>
                ))}
                {form.pollOptions.length < 6 && (
                  <Button variant="outline" size="sm" onClick={() => update('pollOptions', [...form.pollOptions, ''])} className="gap-1"><Plus size={14} /> Adicionar opção</Button>
                )}
              </div>
            )}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <p className="text-sm font-medium">Requerer Confirmação de Leitura</p>
                <p className="text-xs text-muted-foreground">Usuários precisam confirmar que leram</p>
              </div>
              <Switch checked={form.requireConfirmation} onCheckedChange={v => update('requireConfirmation', v)} />
            </div>
          </div>
        )}

        {/* Step 6: Preview */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Preview do Comunicado</h3>
            <div className="bg-muted/30 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                {form.category && <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-interactive/10 text-interactive">{form.category}</span>}
                {form.priority !== 'normal' && <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${form.priority === 'urgent' ? 'bg-destructive/10 text-destructive' : 'bg-amber-100 text-amber-700'}`}>{form.priority === 'urgent' ? 'Urgente' : 'Alta'}</span>}
              </div>
              <h2 className="text-xl font-bold text-foreground">{form.title || 'Sem título'}</h2>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full premium-gradient flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {form.authorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium">{form.authorName}</p>
                  <p className="text-xs text-muted-foreground">{form.position} — {form.company}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{form.content || 'Sem conteúdo'}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-success" /> <span className="text-sm">Título {form.title ? '✅' : '❌'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-success" /> <span className="text-sm">Corpo {form.content ? '✅' : '❌'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-success" /> <span className="text-sm">Categoria {form.category ? '✅' : '❌'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={14} className="text-success" /> <span className="text-sm">Destinatários {(form.selectedGroupIds.length + form.selectedContactIds.length) > 0 ? '✅' : '❌'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
        <Button variant="outline" className="h-11 sm:h-10" onClick={() => step > 0 ? setStep(step - 1) : navigate('/comunicados')} disabled={step === 0}>
          Voltar
        </Button>
        <div className="flex flex-col sm:flex-row gap-2">
          {step === 5 && (
            <Button variant="outline" className="h-11 sm:h-10" onClick={handleDraft}>Salvar como Rascunho</Button>
          )}
          {step < 5 ? (
            <Button className="premium-gradient h-11 sm:h-10" onClick={handleNext}>Próximo</Button>
          ) : (
            <Button className="premium-gradient h-11 sm:h-10" onClick={handlePublish}>Publicar Agora</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComunicadoNovo;
