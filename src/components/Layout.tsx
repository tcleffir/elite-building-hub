import { ReactNode } from "react";
import { Moon, Sun, ChevronDown, Menu, MapPin, Globe } from "lucide-react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFund, FUNDS } from "@/contexts/FundContext";
import { localeLabels, Locale } from "@/lib/translations";
import { mockBuildings } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import AIChatAssistant from "@/components/AIChatAssistant";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { GlobalSearch } from "@/components/GlobalSearch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, selectedBuilding, setSelectedBuildingId, isDark, toggleDark } = useApp();
  const { locale, setLocale, t } = useLanguage();
  const { selectedFund, setSelectedFund } = useFund();
  const location = useLocation();

  const isGestorFundo = user.role === 'gestor_fundo';
  const userBuildings = mockBuildings.filter(b => user.building_ids.includes(b.id));

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 md:h-16 border-b bg-card flex items-center justify-between px-3 md:px-4 lg:px-6 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                <Menu size={20} />
              </SidebarTrigger>

              {/* Building Selector — hidden for gestor_fundo */}
              {!isGestorFundo && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 font-semibold text-foreground">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-interactive/10 text-interactive text-xs font-semibold max-w-[120px] truncate">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{selectedBuilding.short_name || selectedBuilding.name.split(" ").slice(0, 2).join(" ")}</span>
                      </span>
                      {userBuildings.length > 1 && <ChevronDown size={16} className="text-muted-foreground" />}
                    </Button>
                  </DropdownMenuTrigger>
                  {userBuildings.length > 1 && (
                    <DropdownMenuContent align="start" className="w-80">
                      {userBuildings.map((b) => (
                        <DropdownMenuItem
                          key={b.id}
                          onClick={() => setSelectedBuildingId(b.id)}
                          className={`cursor-pointer ${b.id === selectedBuilding.id ? "bg-muted" : ""}`}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{b.name}</p>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${b.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                                  {b.status === 'active' ? t('common.active') : t('common.inactive')}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">{b.address}, {b.city}</p>
                            </div>
                            {(b.urgent_tickets || 0) > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-semibold">
                                {b.urgent_tickets} {t('misc.urgents')}
                              </span>
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  )}
                </DropdownMenu>
              )}

              {/* Gestor Fundo: Fund Selector */}
              {isGestorFundo && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 font-semibold text-foreground">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-interactive/10 text-interactive text-xs font-semibold">
                        <MapPin size={12} className="shrink-0" />
                        <span>{selectedFund.ticker}</span>
                      </span>
                      <span className="hidden md:inline text-xs text-muted-foreground truncate max-w-[220px]">{selectedFund.name}</span>
                      <ChevronDown size={16} className="text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72 max-h-96 overflow-y-auto">
                    {(["tijolo", "papel"] as const).map((seg) => (
                      <div key={seg}>
                        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {seg === "tijolo" ? "Tijolo" : "Papel"}
                        </div>
                        {FUNDS.filter((f) => (f.segment ?? "tijolo") === seg).map((f) => (
                          <DropdownMenuItem
                            key={f.ticker}
                            onClick={() => setSelectedFund(f)}
                            className={`cursor-pointer ${f.ticker === selectedFund.ticker ? "bg-muted" : ""}`}
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm">{f.ticker}</span>
                              <span className="text-xs text-muted-foreground">{f.name}</span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Role Switcher (DEV) */}
              <RoleSwitcher />

              {/* Search */}
              <GlobalSearch />

              {/* Language Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Globe size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {(Object.keys(localeLabels) as Locale[]).map((loc) => (
                    <DropdownMenuItem
                      key={loc}
                      onClick={() => setLocale(loc)}
                      className={`cursor-pointer gap-2 ${locale === loc ? "bg-muted font-medium" : ""}`}
                    >
                      <span>{localeLabels[loc].flag}</span>
                      <span>{localeLabels[loc].label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dark mode */}
              <Button variant="ghost" size="icon" onClick={toggleDark} className="text-muted-foreground hover:text-foreground">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </Button>

              {/* Notifications */}
              <NotificationsPanel />

              {/* User */}
              <div className="hidden md:flex items-center gap-3 ml-2 pl-4 border-l">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: user.avatar_bg || '#0B2A3D' }}
                >
                  {user.avatar_initials || user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-foreground leading-tight">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user.company}</p>
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 px-4 md:px-6 lg:px-8 py-4 lg:py-6 overflow-auto max-w-full">
            {children}
          </main>
        </div>

        <AIChatAssistant />
      </div>
    </SidebarProvider>
  );
};

export default Layout;
