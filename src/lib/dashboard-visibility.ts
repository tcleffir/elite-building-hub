import { UserRole, User, Ticket } from './mock-data';
import { Package } from './packages-data';

// Roles with full building-wide visibility
const fullAccessRoles: UserRole[] = ['super_admin', 'building_manager'];

export function hasFullAccess(role: UserRole): boolean {
  return fullAccessRoles.includes(role);
}

// Filter tickets by role
export function filterTicketsByRole(tickets: Ticket[], user: User): Ticket[] {
  if (hasFullAccess(user.role)) return tickets;
  // Owner / tenant: see only their floor(s) + common areas (floor <= 0)
  const userFloors = user.floors || [];
  return tickets.filter(t => userFloors.includes(t.floor) || t.floor <= 0);
}

// Filter packages by role
export function filterPackagesByRole(packages: Package[], user: User): Package[] {
  if (hasFullAccess(user.role)) return packages;
  if (user.role === 'concierge') return packages; // concierge sees all
  // Tenant: filter by company
  const company = user.company || '';
  return packages.filter(p => p.recipientCompany.toLowerCase().includes(company.toLowerCase()));
}

// Widget visibility
export interface DashboardWidgetVisibility {
  showOccupancy: boolean;
  showFinancials: boolean;
  showPackagesGeneral: boolean;
  showAllTickets: boolean;
  showAllAlerts: boolean;
}

export function getWidgetVisibility(role: UserRole): DashboardWidgetVisibility {
  const full = hasFullAccess(role);
  return {
    showOccupancy: full,
    showFinancials: full,
    showPackagesGeneral: full,
    showAllTickets: full,
    showAllAlerts: full,
  };
}
