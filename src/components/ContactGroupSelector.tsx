import { useState } from "react";
import { X, Search, Users, User, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { mockGroups, mockContacts, getContactsByGroup, getUniqueRecipientsCount, contactTypeLabels, contactTypeColors, type ContactGroup, type Contact } from "@/lib/contacts-data";

interface Props {
  selectedGroupIds: string[];
  selectedContactIds: string[];
  onGroupsChange: (ids: string[]) => void;
  onContactsChange: (ids: string[]) => void;
  mode?: 'groups' | 'contacts' | 'all';
}

export default function ContactGroupSelector({ selectedGroupIds, selectedContactIds, onGroupsChange, onContactsChange, mode: initialMode }: Props) {
  const [selectionMode, setSelectionMode] = useState<'groups' | 'contacts' | 'all'>(initialMode || 'groups');
  const [groupSearch, setGroupSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [showRecipients, setShowRecipients] = useState(false);

  const totalRecipients = getUniqueRecipientsCount(selectedGroupIds, selectedContactIds);

  const filteredGroups = mockGroups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()));
  const filteredContacts = mockContacts.filter(c =>
    c.isActive && (c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.email.toLowerCase().includes(contactSearch.toLowerCase()))
  );

  const toggleGroup = (id: string) => {
    if (id === 'g6') {
      onGroupsChange(['g6']);
      setSelectionMode('all');
      return;
    }
    onGroupsChange(selectedGroupIds.includes(id) ? selectedGroupIds.filter(g => g !== id) : [...selectedGroupIds.filter(g => g !== 'g6'), id]);
    if (selectionMode === 'all') setSelectionMode('groups');
  };

  const toggleContact = (id: string) => {
    onContactsChange(selectedContactIds.includes(id) ? selectedContactIds.filter(c => c !== id) : [...selectedContactIds, id]);
  };

  const allRecipients = (() => {
    const ids = new Set<string>();
    const result: Contact[] = [];
    selectedGroupIds.forEach(gid => {
      getContactsByGroup(gid).forEach(c => { if (!ids.has(c.id)) { ids.add(c.id); result.push(c); } });
    });
    selectedContactIds.forEach(cid => {
      const c = mockContacts.find(ct => ct.id === cid);
      if (c && !ids.has(c.id)) { ids.add(c.id); result.push(c); }
    });
    return result;
  })();

  return (
    <div className="space-y-4">
      {/* Mode selection */}
      <div className="flex gap-2">
        {[
          { key: 'groups' as const, label: 'Grupos', icon: Users },
          { key: 'contacts' as const, label: 'Contatos individuais', icon: User },
          { key: 'all' as const, label: 'Todos do ativo', icon: Users },
        ].map(opt => (
          <button key={opt.key} onClick={() => {
            setSelectionMode(opt.key);
            if (opt.key === 'all') { onGroupsChange(['g6']); }
            else if (selectionMode === 'all') { onGroupsChange([]); }
          }}
            className={`flex-1 p-3 rounded-xl border-2 transition-colors text-left ${selectionMode === opt.key ? 'border-interactive bg-interactive/5' : 'border-border hover:border-interactive/50'}`}>
            <div className="flex items-center gap-2">
              <opt.icon size={16} className={selectionMode === opt.key ? 'text-interactive' : 'text-muted-foreground'} />
              <span className="text-sm font-semibold">{opt.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Group selector */}
      {(selectionMode === 'groups') && (
        <div className="space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar grupo..." value={groupSearch} onChange={e => setGroupSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedGroupIds.map(gid => {
              const g = mockGroups.find(gr => gr.id === gid);
              if (!g) return null;
              return (
                <span key={gid} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-interactive/10 text-interactive text-xs font-semibold">
                  {g.icon} {g.name}
                  <button onClick={() => toggleGroup(gid)}><X size={12} /></button>
                </span>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
            {filteredGroups.filter(g => g.id !== 'g6').map(g => (
              <button key={g.id} onClick={() => toggleGroup(g.id)}
                className={`p-3 rounded-xl border text-left transition-colors ${selectedGroupIds.includes(g.id) ? 'border-interactive bg-interactive/5' : 'border-border hover:bg-muted/30'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{g.icon}</span>
                  <span className="text-xs font-semibold text-foreground truncate">{g.name}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{g.memberCount} membros</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contact selector */}
      {selectionMode === 'contacts' && (
        <div className="space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar contato por nome ou e-mail..." value={contactSearch} onChange={e => setContactSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedContactIds.map(cid => {
              const c = mockContacts.find(ct => ct.id === cid);
              if (!c) return null;
              return (
                <span key={cid} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-interactive/10 text-interactive text-xs font-semibold">
                  <span className="w-4 h-4 rounded-full bg-interactive/20 flex items-center justify-center text-[8px]">{c.name[0]}</span>
                  {c.name}
                  <button onClick={() => toggleContact(cid)}><X size={12} /></button>
                </span>
              );
            })}
          </div>
          {contactSearch.length > 0 && (
            <div className="border rounded-xl max-h-[200px] overflow-y-auto divide-y">
              {filteredContacts.filter(c => !selectedContactIds.includes(c.id)).slice(0, 10).map(c => (
                <button key={c.id} onClick={() => { toggleContact(c.id); setContactSearch(''); }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 text-left">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{c.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${contactTypeColors[c.type]}`}>{contactTypeLabels[c.type]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recipients preview */}
      {totalRecipients > 0 && (
        <div className="bg-muted/50 rounded-xl p-3">
          <button onClick={() => setShowRecipients(!showRecipients)} className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">📨 Este comunicado será enviado para <span className="font-semibold text-foreground">{totalRecipients} pessoas</span></p>
            <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showRecipients ? 'rotate-180' : ''}`} />
          </button>
          {showRecipients && (
            <div className="mt-3 space-y-1 max-h-[150px] overflow-y-auto">
              {allRecipients.map(c => (
                <div key={c.id} className="flex items-center gap-2 text-xs py-1">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold">{c.name[0]}</span>
                  <span className="text-foreground">{c.name}</span>
                  <span className="text-muted-foreground">{c.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
