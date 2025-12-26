export type UserType = {
  badge: number;
  email?: string | null;
  firstName: string;
  lastName: string;
  position?: string | null;
  role: string;
  costCenter?: number | null;
  reportToLevelOne?: number | null;
  reportToLevelTwo?: number | null;
  readOnly: number;
};
