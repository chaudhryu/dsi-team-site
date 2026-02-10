import { backendApi } from "../api/backendApi";

export const toggleUserAudit = async (badge: number, auditEnabled: boolean) => {
  const promise = await backendApi.put(`/users/badge/${badge}/toggle-audit`, {
    auditEnabled,
  });
  return promise;
};

export const getUserActivityLogs = async (badge: number) => {
  const promise = await backendApi.get(`/user-activity-logs/badge/${badge}`);
  return promise;
};

export const createActivityLog = async (data: {
  badge: number;
  activityType: string;
  accomplishmentId?: number;
  metadata?: string;
}) => {
  const promise = await backendApi.post("/user-activity-logs", data);
  return promise;
};
