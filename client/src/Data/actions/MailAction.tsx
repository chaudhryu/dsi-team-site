import { backendApi } from "../api/backendApi";

export const sendEmail = async (emailDraft: object) => {
  const promise = await backendApi.post(`/mail/send`, emailDraft);
  return promise;
};
