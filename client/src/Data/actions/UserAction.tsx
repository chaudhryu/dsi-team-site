import { backendApi } from "../api/backendApi";
export const checkUserLoginAndSettingProfile = async (userData: Partial<any>) => {
  const promise = await backendApi.post("/users/CheckAndSync", userData);
  return promise;
};
