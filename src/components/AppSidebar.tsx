import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ChevronRight, Lock } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { TranslationKey } from "@/lib/translations";
import { getVisibleNav, NavGroup, moduleKeyForGroup } from "@/lib/role-config";
import logoBranco from "@/assets/logo-branco.png";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, isModuleBlocked } = useApp();
  const { t } = useLanguage();

  const visibleNav = getVisibleNav(user.role);
  const mainGroups = visibleNav.filter(g => g.section !== 'footer');
  const footerGroups = visibleNav.filter(g => g.section === 'footer');

  const findActiveGroupId = () => {
    for (const group of visibleNav) {
      for (const item of group.items) {
        if (location.pathname === item.path || location.pathname.startsWith(item.path + "/")) {
          return group.items.length >= 2 ? group.id : null;
        }
      }
    }
    return null;
  };

  const [openGroupId, setOpenGroupId] = useState<string | null>(findActiveGroupId);

  useEffect(() => {
    const activeId = findActiveGroupId();
    if (activeId && activeId !== openGroupId) {
      setOpenGroupId(activeId);
    }
  }, [location.pathname]);

  const toggleGroup = (groupId: string) => {
    setOpenGroupId(prev => prev === groupId ? null : groupId);
  };

  const isItemActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const isGroupActive = (group: NavGroup) =>
    group.items.some(item => isItemActive(item.path));

  const tLabel = (key?: string, fallback?: string) => {
    if (key) return t(key as TranslationKey);
    return fallback || '';
  };

  const renderGroup = (group: NavGroup) => {
    const isSolo = group.items.length === 1;
    const soloItem = group.items[0];
    const premiumKey = moduleKeyForGroup[group.id];
    const lockedReason = group.lockedReason ?? soloItem?.lockedReason;
    const isLocked = !!group.locked || (isSolo && !!soloItem?.locked);
    const isBlocked = (premiumKey ? isModuleBlocked(premiumKey) : false) || isLocked;

    if (isSolo && isLocked) {
      return (
        <SidebarMenuItem key={group.id}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  aria-disabled
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium cursor-not-allowed text-sidebar-foreground/40",
                    collapsed ? "justify-center" : "gap-3 px-3 h-11"
                  )}
                >
                  <soloItem.icon size={20} className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1">{tLabel(soloItem.labelKey, soloItem.label)}</span>
                      <Lock size={14} className="w-3.5 h-3.5 shrink-0 text-amber-400/80" />
                    </>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="text-xs max-w-[220px]">{lockedReason ?? 'Módulo não habilitado.'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </SidebarMenuItem>
      );
    }

    if (isSolo) {
      const active = isItemActive(soloItem.path);

      return (
        <SidebarMenuItem key={group.id}>
          <SidebarMenuButton asChild>
            <NavLink
              to={soloItem.path}
              end={soloItem.path === "/dashboard"}
              className={cn(
                "flex items-center rounded-lg transition-all text-sm font-medium",
                collapsed ? "justify-center" : "gap-3 px-3 h-11",
                isBlocked && "opacity-70",
                active
                  ? cn(
                      "bg-white/20 text-sidebar-foreground",
                      !collapsed && "border-l-2 border-[#C9A84C]"
                    )
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/10"
              )}
              activeClassName=""
            >
              <soloItem.icon size={20} className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="truncate flex-1">{tLabel(soloItem.labelKey, soloItem.label)}</span>
                  {isBlocked && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Lock size={14} className="w-3.5 h-3.5 shrink-0 text-amber-400 opacity-80" />
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="text-xs">{t('premium.tooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </>
              )}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    // Folder (accordion)
    const isOpen = openGroupId === group.id;
    const groupActive = isGroupActive(group);

    return (
      <div key={group.id}>
        <SidebarMenuItem>
          <button
            onClick={() => toggleGroup(group.id)}
            className={cn(
              "flex items-center rounded-lg transition-all text-sm font-medium",
              collapsed ? "justify-center size-8 mx-auto p-0" : "gap-3 px-3 h-11 w-full",
              isBlocked && "opacity-70",
              groupActive
                ? cn(
                    "bg-white/10 text-sidebar-foreground",
                    !collapsed && "border-l-2 border-[#C9A84C]"
                  )
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/10"
            )}
          >
            <group.icon size={20} className="w-5 h-5 shrink-0" />
            {!collapsed && (
              <>
                <span className="truncate flex-1 text-left">{tLabel(group.labelKey, group.label)}</span>
                {isBlocked && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Lock size={14} className="w-3.5 h-3.5 shrink-0 text-amber-400 opacity-80 mr-1" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="text-xs">{t('premium.tooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <ChevronRight
                  size={16}
                  className={cn(
                    "shrink-0 transition-transform duration-200",
                    isOpen && "rotate-90"
                  )}
                />
              </>
            )}
          </button>
        </SidebarMenuItem>

        {/* Sub-items */}
        {isOpen && !collapsed && (
          <div className="overflow-hidden">
            {group.items.map(item => {
              const active = isItemActive(item.path);
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.path}
                      className={cn(
                        "flex items-center gap-2.5 pl-9 pr-3 h-[38px] rounded-lg transition-all text-sm",
                        active
                          ? "bg-white/20 text-sidebar-foreground font-medium border-l-2 border-[#C9A84C]"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-white/10"
                      )}
                      activeClassName=""
                    >
                      <item.icon size={16} className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tLabel(item.labelKey, item.label)}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar pt-4 flex flex-col">
        {/* Logo */}
        <div className="px-4 mb-6 flex items-center justify-center w-full">
          {collapsed ? (
            <img src={logoBranco} alt="Patria" className="h-10 w-10 object-contain mx-auto" />
          ) : (
            <img src={logoBranco} alt="Patria" className="h-10 w-auto object-contain mx-auto" />
          )}
        </div>

        {/* Main navigation */}
        <SidebarGroup className="flex-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {mainGroups.map(renderGroup)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer separator + items */}
        {footerGroups.length > 0 && (
          <>
            <Separator className="mx-3 my-2 bg-white/10" />
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {footerGroups.map(renderGroup)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
