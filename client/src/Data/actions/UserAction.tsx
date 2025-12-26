import { backendApi } from "../api/backendApi";
export const checkUserLoginAndSettingProfile = async (userData: Partial<any>) => {
  const promise = await backendApi.post("/users/CheckAndSync", userData);
  return promise;
};
export const getUserByCostCenter = async (costCenter: number) => {
  const promise = await backendApi.get(`/users/costcenter/${costCenter}`);
  return promise;
};
