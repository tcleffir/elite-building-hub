import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, Check, User, Shield, Settings, Eye, Upload } from "lucide-react";
import { roleLabels, type UserRole } from "@/lib/mock-data";
import {
  moduleList, AccessLevel, accessLevelLabels, defaultPermissionsByRole,
  roleDescriptions, tenantCompanies, type ModulePermissions, type ModuleKey,
} from "@/lib/permissions-data";
import { toast } from "sonner";

interface CreateUserWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restrictRoles?: boolean; // building_manager can't create super_admin or building_manager
}

const steps = [
  { label: 'Dados Pessoais', icon: User },
  { label: 'Perfil e Vínculo', icon: Shield },
  { label: 'Permissões', icon: Settings },
  { label: 'Revisão', icon: Eye },
];

const accessLevels: AccessLevel[] = ['none', 'view', 'edit', 'admin'];

const CreateUserWizard = ({ open, onOpenChange, restrictRoles }: CreateUserWizardProps) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '',
    sendInvite: true, role: '' as UserRole | '',
    // Owner
    managedFloors: [] as number[],
    isSoleProprietor: false,
    // Tenant
    tenantCompanyId: '',
    // Vendor
    vendorCompany: '',
    vendorSpecialties: [] as string[],
  });
  const [permissions, setPermissions] = useState<ModulePermissions>({ ...defaultPermissionsByRole.tenant_employee });
  const [permissionsCustomized, setPermissionsCustomized] = useState(false);

  const availableRoles = Object.keys(roleLabels).filter(r => {
    if (restrictRoles && (r === 'super_admin' || r === 'building_manager')) return false;
    return true;
  }) as UserRole[];

  const selectedTenant = tenantCompanies.find(c => c.id === formData.tenantCompanyId);

  const handleRoleChange = (role: UserRole) => {
    setFormData(p => ({ ...p, role }));
    setPermissions({ ...defaultPermissionsByRole[role] });
    setPermissionsCustomized(false);
  };

  const handlePermissionChange = (mod: ModuleKey, level: AccessLevel) => {
    setPermissions(p => ({ ...p, [mod]: level }));
    if (formData.role) {
      const def = defaultPermissionsByRole[formData.role as UserRole];
      const isCustom = Object.keys(def).some(k => {
        const key = k as ModuleKey;
        const updated = { ...permissions, [mod]: level };
        return updated[key] !== def[key];
      });
      setPermissionsCustomized(isCustom);
    }
  };

  const applyPreset = (preset: 'default' | 'full' | 'readonly') => {
    if (preset === 'default' && formData.role) {
      setPermissions({ ...defaultPermissionsByRole[formData.role as UserRole] });
      setPermissionsCustomized(false);
    } else if (preset === 'full') {
      const full = {} as ModulePermissions;
      moduleList.forEach(m => { full[m.key] = 'edit'; });
      setPermissions(full);
      setPermissionsCustomized(true);
    } else if (preset === 'readonly') {
      const ro = {} as ModulePermissions;
      moduleList.forEach(m => { ro[m.key] = 'view'; });
      setPermissions(ro);
      setPermissionsCustomized(true);
    }
  };

  const canProceed = () => {
    if (step === 0) return formData.name.trim() && formData.email.trim();
    if (step === 1) return !!formData.role;
    return true;
  };

  const handleCreate = () => {
    toast.success(`Usuário ${formData.name} criado com sucesso!`);
    if (formData.sendInvite) toast.info('Convite enviado por e-mail.');
    onOpenChange(false);
    setStep(0);
    setFormData({ name: '', email: '', phone: '', password: '', sendInvite: true, role: '', managedFloors: [], isSoleProprietor: false, tenantCompanyId: '', vendorCompany: '', vendorSpecialties: [] });
  };

  const accessibleModules = moduleList.filter(m => permissions[m.key] !== 'none');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-4">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                i === step ? 'bg-interactive/10 text-interactive' : i < step ? 'bg-success/10 text-success' : 'text-muted-foreground'
              }`}>
                {i < step ? <Check size={12} /> : <s.icon size={12} />}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </div>
              {i < steps.length - 1 && <ChevronRight size={12} className="text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>

        {/* Step 1: Dados Pessoais */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome completo *</Label>
                <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Nome completo" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">E-mail *</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="email@empresa.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Telefone</Label>
                <Input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="+55 (11) 99999-9999" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Senha temporária</Label>
                <Input value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} placeholder="Gerada automaticamente" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Foto de perfil</Label>
              <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-interactive/50 transition-colors cursor-pointer">
                <Upload size={20} className="mx-auto mb-1 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">Opcional — arraste ou clique</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <span className="text-sm font-medium">Enviar convite por e-mail</span>
                <p className="text-xs text-muted-foreground">E-mail com link de acesso e senha temporária</p>
              </div>
              <Switch checked={formData.sendInvite} onCheckedChange={v => setFormData(p => ({ ...p, sendInvite: v }))} />
            </div>
          </div>
        )}

        {/* Step 2: Perfil e Vínculo */}
        {step === 1 && (
          <div className="space-y-4">
            <Label className="text-xs font-semibold">Selecione o perfil (role)</Label>
            <div className="grid grid-cols-1 gap-2">
              {availableRoles.map(role => {
                const desc = roleDescriptions[role];
                return (
                  <button key={role} onClick={() => handleRoleChange(role)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      formData.role === role ? 'border-interactive bg-interactive/5 ring-1 ring-interactive' : 'border-border hover:bg-muted/30'
                    }`}>
                    <span className="text-xl">{desc.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{roleLabels[role]}</p>
                      <p className="text-xs text-muted-foreground">{desc.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Owner binding */}
            {formData.role === 'owner' && (
              <div className="space-y-3 p-4 rounded-xl border border-interactive/30 bg-interactive/5">
                <h4 className="text-sm font-semibold">Vínculo do Proprietário</h4>
                <div className="space-y-1.5">
                  <Label className="text-xs">Andares que possui</Label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 19 }, (_, i) => i + 1).map(floor => (
                      <button key={floor} onClick={() => {
                        setFormData(p => ({
                          ...p,
                          managedFloors: p.managedFloors.includes(floor)
                            ? p.managedFloors.filter(f => f !== floor)
                            : [...p.managedFloors, floor]
                        }));
                      }}
                        className={`w-9 h-9 rounded-lg text-xs font-semibold transition-colors ${
                          formData.managedFloors.includes(floor) ? 'bg-interactive text-white' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}>
                        {floor}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <span className="text-sm font-medium">Proprietário único do ativo</span>
                    <p className="text-xs text-muted-foreground">Vê todos os dados como um Gestor</p>
                  </div>
                  <Switch checked={formData.isSoleProprietor} onCheckedChange={v => setFormData(p => ({ ...p, isSoleProprietor: v }))} />
                </div>
              </div>
            )}

            {/* Tenant binding */}
            {(formData.role === 'tenant_admin' || formData.role === 'tenant_employee') && (
              <div className="space-y-3 p-4 rounded-xl border border-interactive/30 bg-interactive/5">
                <h4 className="text-sm font-semibold">Vínculo do Locatário</h4>
                <div className="space-y-1.5">
                  <Label className="text-xs">Empresa locatária</Label>
                  <Select value={formData.tenantCompanyId} onValueChange={v => setFormData(p => ({ ...p, tenantCompanyId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                    <SelectContent>
                      {tenantCompanies.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name} — {c.floors.map(f => `${f}º`).join(', ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedTenant && (
                  <p className="text-xs text-muted-foreground">Andares: {selectedTenant.floors.map(f => `${f}º`).join(', ')} (automático pelo contrato)</p>
                )}
              </div>
            )}

            {/* Vendor binding */}
            {formData.role === 'vendor' && (
              <div className="space-y-3 p-4 rounded-xl border border-interactive/30 bg-interactive/5">
                <h4 className="text-sm font-semibold">Dados do Fornecedor</h4>
                <div className="space-y-1.5">
                  <Label className="text-xs">Empresa fornecedora</Label>
                  <Input value={formData.vendorCompany} onChange={e => setFormData(p => ({ ...p, vendorCompany: e.target.value }))} placeholder="Nome da empresa ou buscar" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Especialidades</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Elétrica', 'HVAC', 'Hidráulica', 'Limpeza', 'Segurança', 'Paisagismo'].map(tag => (
                      <button key={tag} onClick={() => {
                        setFormData(p => ({
                          ...p,
                          vendorSpecialties: p.vendorSpecialties.includes(tag)
                            ? p.vendorSpecialties.filter(t => t !== tag)
                            : [...p.vendorSpecialties, tag]
                        }));
                      }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          formData.vendorSpecialties.includes(tag) ? 'bg-interactive/10 text-interactive' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        }`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Permissões por Módulo */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => applyPreset('default')}>Usar padrão da role</Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => applyPreset('full')}>Dar acesso total</Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => applyPreset('readonly')}>Acesso somente leitura</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Módulo</th>
                    {accessLevels.map(l => (
                      <th key={l} className="text-center px-2 py-2 text-xs font-semibold text-muted-foreground">{accessLevelLabels[l]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {moduleList.map((mod, i) => (
                    <tr key={mod.key} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/10' : ''}`}>
                      <td className="px-3 py-2 text-sm">{mod.label}</td>
                      {accessLevels.map(level => (
                        <td key={level} className="text-center px-2 py-2">
                          <button
                            onClick={() => handlePermissionChange(mod.key, level)}
                            className={`w-5 h-5 rounded-full border-2 transition-colors ${
                              permissions[mod.key] === level
                                ? 'bg-interactive border-interactive'
                                : 'border-border hover:border-muted-foreground'
                            }`}
                          >
                            {permissions[mod.key] === level && <Check size={12} className="text-white mx-auto" />}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {permissionsCustomized && (
              <Badge variant="secondary" className="text-xs">⚡ Permissões customizadas (diferem do padrão da role)</Badge>
            )}
          </div>
        )}

        {/* Step 4: Revisão */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Nome:</span> <span className="font-semibold">{formData.name}</span></div>
                <div><span className="text-muted-foreground">E-mail:</span> <span className="font-semibold">{formData.email}</span></div>
                <div><span className="text-muted-foreground">Role:</span> <span className="font-semibold">{formData.role ? roleLabels[formData.role as UserRole] : 'N/A'}</span></div>
                {formData.role === 'owner' && (
                  <div><span className="text-muted-foreground">Andares:</span> <span className="font-semibold">{formData.managedFloors.map(f => `${f}º`).join(', ') || 'N/A'}</span></div>
                )}
                {selectedTenant && (
                  <div><span className="text-muted-foreground">Empresa:</span> <span className="font-semibold">{selectedTenant.name}</span></div>
                )}
                {formData.vendorCompany && (
                  <div><span className="text-muted-foreground">Empresa:</span> <span className="font-semibold">{formData.vendorCompany}</span></div>
                )}
              </div>
              {formData.isSoleProprietor && (
                <Badge variant="outline" className="text-xs">👑 Proprietário único — acesso total</Badge>
              )}
              {permissionsCustomized && (
                <Badge variant="secondary" className="text-xs">⚡ Permissões customizadas</Badge>
              )}
            </div>
            <Separator />
            <h4 className="text-sm font-semibold">Módulos com acesso ({accessibleModules.length})</h4>
            <div className="flex flex-wrap gap-2">
              {accessibleModules.map(mod => (
                <span key={mod.key} className="px-2.5 py-1 rounded-full bg-interactive/10 text-interactive text-xs font-semibold">
                  {mod.label} — {accessLevelLabels[permissions[mod.key]]}
                </span>
              ))}
            </div>
            {formData.sendInvite && (
              <p className="text-xs text-muted-foreground">📧 Um convite será enviado para {formData.email} com link de acesso.</p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1">
              <ChevronLeft size={14} />Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button className="premium-gradient gap-1" onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
              Próximo<ChevronRight size={14} />
            </Button>
          ) : (
            <Button className="premium-gradient gap-1" onClick={handleCreate}>
              <Check size={14} />Criar Usuário
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserWizard;
