import { UserRole } from '../../users/user.entity';

export type AnalyticsQuery = {
  month?: string;
  fromDate?: string;
  toDate?: string;
  department?: string;
  role?: string;
  userId?: string;
  branchName?: string;
  city?: string;
  zone?: string;
  status?: string;
  projectType?: string;
  paymentStatus?: string;
};

export type AnalyticsDateRange = {
  start: Date;
  end: Date;
};

export function getAnalyticsDateRange(query: AnalyticsQuery): AnalyticsDateRange {
  if (query.month) {
    const [year, month] = String(query.month).split('-').map(Number);

    if (year && month) {
      return {
        start: new Date(year, month - 1, 1, 0, 0, 0, 0),
        end: new Date(year, month, 0, 23, 59, 59, 999),
      };
    }
  }

  if (query.fromDate || query.toDate) {
    return {
      start: query.fromDate
        ? new Date(`${query.fromDate}T00:00:00`)
        : new Date('2000-01-01T00:00:00'),
      end: query.toDate
        ? new Date(`${query.toDate}T23:59:59.999`)
        : new Date(),
    };
  }

  const now = new Date();

  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
  };
}

export function normalizeAnalyticsText(value?: string) {
  return String(value || '').trim().toLowerCase();
}

export function getUserRoles(user?: any): string[] {
  if (Array.isArray(user?.roles)) return user.roles;
  if (user?.role) return [user.role];
  return [];
}

export function canViewAllAnalytics(user?: any): boolean {
  const roles = getUserRoles(user);

  return [
    UserRole.OWNER,
    UserRole.MARKETING_HEAD,
    UserRole.TELECALLING_MANAGER,
    UserRole.LEAD_MANAGER,
    UserRole.MEETING_MANAGER,
    UserRole.PROJECT_MANAGER,
    UserRole.PAYMENT_MANAGER,
    UserRole.ACCOUNT_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.CUSTOMER_MANAGER,
  ].some((role) => roles.includes(role));
}