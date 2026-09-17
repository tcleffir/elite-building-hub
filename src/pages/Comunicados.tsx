import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter, Megaphone, CheckCheck, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import AnnouncementModal from "@/components/AnnouncementModal";
import { mockAnnouncements, Announcement } from "@/lib/mock-data";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { permissionsByRole } from "@/lib/role-config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const categoryColors: Record<string, string> = {
  Manutenção: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Segurança: "bg-destructive/10 text-destructive",
  ESG: "bg-success/10 text-success",
  Administrativo: "bg-interactive/10 text-interactive",
  Urgente: "bg-destructive/10 text-destructive",
  Informativo: "bg-blue-100 text-blue-700",
  Normas: "bg-purple-100 text-purple-700",
};

type AnnouncementCategory = 'all' | 'urgent' | 'informative' | 'maintenance' | 'rules';

const categoryFilterConfig: { key: AnnouncementCategory; label: string; emoji: string; color: string; match: string[] }[] = [
  { key: 'all', label: 'Todos', emoji: '', color: 'bg-slate-800 text-white', match: [] },
  { key: 'urgent', label: 'Urgente', emoji: '🚨', color: 'bg-red-100 text-red-700', match: ['Urgente'] },
  { key: 'informative', label: 'Informativo', emoji: 'ℹ', color: 'bg-blue-100 text-blue-700', match: ['Informativo', 'Administrativo', 'ESG', 'Segurança'] },
  { key: 'maintenance', label: 'Manutenção', emoji: '🔧', color: 'bg-amber-100 text-amber-700', match: ['Manutenção'] },
  { key: 'rules', label: 'Normas', emoji: '📜', color: 'bg-purple-100 text-purple-700', match: ['Normas'] },
];

const allPriorities = ["normal", "urgent"];

const Comunicados = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const { t } = useLanguage();
  const permissions = permissionsByRole[user.role];
  const [search, setSearch] = useState("");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [announcements, setAnnouncements] = useState(() =>
    mockAnnouncements.map((a, i) => ({
      ...a,
      is_pinned: i === 0, // First one pinned by default
      visibility: 'all' as 'all' | 'managers_only',
    }))
  );
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<AnnouncementCategory>('all');
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);

  const unread = announcements.filter((a) => !a.read).length;

  const handleMarkAllRead = () => {
    setAnnouncements(prev => prev.map(a => ({ ...a, read: true })));
    toast.success(`${unread} ${t('comunicados.markedAsRead')}`);
  };

  const togglePin = (id: string) => {
    setAnnouncements(prev => prev.map(a => {
      if (a.id !== id) return a;
      const newPinned = !a.is_pinned;
      toast.success(newPinned ? 'Comunicado fixado!' : 'Comunicado desfixado');
      return { ...a, is_pinned: newPinned };
    }));
  };

  const togglePriority = (p: string) => {
    setPriorityFilter(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const hasFilters = activeCategoryFilter !== 'all' || priorityFilter.length > 0;

  const filtered = announcements
    .filter(a => {
      if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeCategoryFilter !== 'all') {
        const cfg = categoryFilterConfig.find(c => c.key === activeCategoryFilter);
        if (cfg && !cfg.match.includes(a.category)) return false;
      }
      if (priorityFilter.length > 0 && !priorityFilter.includes(a.priority)) return false;
      return true;
    })
    .sort((a, b) => {
      // Pinned first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return 0;
    });

  const canPin = user.role === 'super_admin' || user.role === 'building_manager';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">{t('comunicados.title')}</h1>
          <p className="text-sm text-muted-foreground">{unread} {t('comunicados.unread')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" className="gap-2 w-full sm:w-auto text-sm" onClick={handleMarkAllRead} disabled={unread === 0}>
            <CheckCheck size={16} /> {t('comunicados.markAllRead')}
          </Button>
          {permissions.canCreateAnnouncements && (
            <Button className="premium-gradient gap-2 w-full sm:w-auto" onClick={() => navigate('/comunicados/novo')}>
              <Plus size={16} />{t('comunicados.new')}
            </Button>
          )}
        </div>
      </div>

      {/* Category filter bar */}
      <div className="flex flex-wrap gap-1.5">
        {categoryFilterConfig.map(cfg => (
          <button
            key={cfg.key}
            onClick={() => setActiveCategoryFilter(cfg.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
              activeCategoryFilter === cfg.key
                ? (cfg.key === 'all' ? 'bg-foreground text-background' : cfg.color)
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {cfg.emoji && `${cfg.emoji} `}{cfg.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t('comunicados.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-lg" />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter size={16} />{t('common.filters')}
              {priorityFilter.length > 0 && <span className="w-2 h-2 rounded-full bg-interactive" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 space-y-3" align="end">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{t('common.priority')}</p>
              <div className="flex gap-1.5">
                <button onClick={() => togglePriority('normal')}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${priorityFilter.includes('normal') ? 'bg-interactive text-interactive-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {t('comunicados.normal')}
                </button>
                <button onClick={() => togglePriority('urgent')}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${priorityFilter.includes('urgent') ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'}`}>
                  ⚠️ {t('comunicados.urgent')}
                </button>
              </div>
            </div>
            {priorityFilter.length > 0 && (
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setPriorityFilter([])}>
                {t('common.clearFilters')}
              </Button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {hasFilters && (
        <p className="text-xs text-muted-foreground">{t('common.showing')} {filtered.length} {t('common.of')} {announcements.length} {t('comunicados.title').toLowerCase()}</p>
      )}

      <div className="space-y-3">
        {filtered.map((a) => (
          <div
            key={a.id}
            className={cn(
              "bg-card rounded-2xl p-5 premium-shadow animate-fade-in cursor-pointer hover:shadow-xl transition-shadow relative",
              !a.read && "border-l-4 border-l-interactive",
              a.is_pinned && "border-2 border-amber-300"
            )}
            onClick={() => setSelectedAnnouncement(a)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {a.is_pinned && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600">
                      📌 FIXADO
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${categoryColors[a.category] || "bg-muted text-muted-foreground"}`}>
                    {a.category}
                  </span>
                  {a.priority === "urgent" && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive">⚠️ {t('comunicados.urgent')}</span>
                  )}
                  {a.has_poll && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-interactive/10 text-interactive">📊 {t('comunicados.poll')}</span>
                  )}
                  {a.requires_confirmation && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">✅ {t('comunicados.confirmation')}</span>
                  )}
                  {!a.read && <span className="w-2 h-2 rounded-full bg-interactive" />}
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1 line-clamp-2">{a.title}</h3>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">
                    {a.author.name} • {new Date(a.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    👁 {a.read_count}/{a.total_recipients}
                  </span>
                  {a.visibility === 'managers_only' && (
                    <span className="text-[10px] text-muted-foreground">👁 Gestores + Síndico</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {canPin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePin(a.id); }}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors text-xs",
                      a.is_pinned ? "bg-amber-100 text-amber-600" : "hover:bg-muted text-muted-foreground"
                    )}
                    title={a.is_pinned ? 'Desfixar' : 'Fixar'}
                  >
                    <Pin size={16} className={a.is_pinned ? "fill-current" : ""} />
                  </button>
                )}
                <Megaphone size={20} className="text-muted-foreground mt-1" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnnouncementModal announcement={selectedAnnouncement} open={!!selectedAnnouncement} onClose={() => setSelectedAnnouncement(null)} />
    </div>
  );
};

export default Comunicados;
