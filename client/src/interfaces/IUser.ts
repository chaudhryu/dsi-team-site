export interface UserRow {
  badge: number;
  firstName: string;
  lastName: string;
  email: string;
  position?: string | null;
  costCenter: number;
  readOnly?: boolean | null;
  role: string;
  reportToLevelOne: string;
  reportToLevelTwo: string;
  auditEnabled?: boolean | null;
}
