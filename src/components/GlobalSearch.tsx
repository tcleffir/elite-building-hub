import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, Ticket, Megaphone, Building2, CalendarDays, ShoppingCart, Leaf, Settings, BarChart3, Users, DollarSign, Vote, BookOpen, Banknote, ClipboardList } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/contexts/AppContext";
import { mockTickets, mockAnnouncements, mockContracts } from "@/lib/mock-data";
import { menuByRole as roleMenus } from "@/lib/role-config";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: any;
  link: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useApp();

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const allResults = useMemo<SearchResult[]>(() => {
    const results: SearchResult[] = [];

    // Pages from sidebar
    const menu = roleMenus[user.role] || [];
    menu.forEach(item => {
      results.push({
        id: `page-${item.url}`,
        title: item.title,
        subtitle: `Navegar para ${item.title}`,
        category: 'Páginas',
        icon: item.icon,
        link: item.url,
      });
    });

    // Tickets
    mockTickets.forEach(t => {
      results.push({
        id: `ticket-${t.id}`,
        title: `${t.id} — ${t.title}`,
        subtitle: `${t.category} • ${t.status} • ${t.requester}`,
        category: 'Chamados',
        icon: Ticket,
        link: '/chamados',
      });
    });

    // Announcements
    mockAnnouncements.forEach(a => {
      results.push({
        id: `ann-${a.id}`,
        title: a.title,
        subtitle: `${a.category} • ${a.author.name}`,
        category: 'Comunicados',
        icon: Megaphone,
        link: '/comunicados',
      });
    });

    // Contracts
    mockContracts.forEach(c => {
      results.push({
        id: `contract-${c.id}`,
        title: `${c.number} — ${c.tenant_name}`,
        subtitle: `Andares ${c.floors.join(', ')} • ${c.status}`,
        category: 'Contratos',
        icon: FileText,
        link: '/contratos',
      });
    });

    return results;
  }, [user.role]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allResults.slice(0, 8);
    const q = query.toLowerCase();
    return allResults.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.subtitle.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [query, allResults]);

  const grouped = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    filtered.forEach(r => {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    });
    return groups;
  }, [filtered]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    navigate(result.link);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Search size={18} />
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuery(""); }}>
        <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden [&>button]:hidden">
          <div className="flex items-center gap-2 px-4 border-b">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <Input
              placeholder="Buscar páginas, chamados, contratos, comunicados..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 h-12 text-sm"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded border shrink-0">
              ESC
            </kbd>
          </div>
          <ScrollArea className="max-h-[360px]">
            {Object.keys(grouped).length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Nenhum resultado para "{query}"
              </div>
            ) : (
              <div className="py-2">
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {category}
                    </p>
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/60 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Icon size={14} className="text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="px-4 py-2 border-t bg-muted/30 flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded border font-mono">↑↓</kbd> navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded border font-mono">↵</kbd> abrir
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-muted rounded border font-mono">Ctrl+K</kbd> buscar
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
