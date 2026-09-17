import { useApp } from "@/contexts/AppContext";
import { mockUsers, roleLabels, roleColors, UserRole } from "@/lib/mock-data";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserCog } from "lucide-react";

export function RoleSwitcher() {
  const { user, switchUser } = useApp();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs border-dashed border-destructive/40 text-destructive">
          <UserCog size={14} />
          <span className="hidden sm:inline">DEV: {roleLabels[user.role]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          🔧 Trocar perfil (modo desenvolvimento)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {mockUsers.map((u) => (
          <DropdownMenuItem
            key={u.id}
            onClick={() => switchUser(u.id)}
            className={`cursor-pointer ${u.id === user.id ? 'bg-muted' : ''}`}
          >
            <div className="flex items-center gap-3 w-full">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: u.avatar_bg || '#0B2A3D' }}
              >
                {u.avatar_initials || u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{u.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{u.company}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleColors[u.role]}`}>
                {roleLabels[u.role]}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
