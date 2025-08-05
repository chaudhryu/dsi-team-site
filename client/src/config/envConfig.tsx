
export const envConfig = {
  azureTenantId: 'ab57129b-dbfd-4cac-aa77-fc74c40364af',
  azureClientId: "d9e7775f-277f-40a2-8120-c485a7b5413a",              // << App Registration – Application (client) ID
  empApiKeyProd: '407098bf-e124-445e-858a-7d7c4533bb88',
  empApiKeyDev: 'a321dbe1-bcde-43d5-b85c-8a5af39fee30',
  empApiProdSelectBaseUrl: 'https://apip.metro.net/ws/rest/fis/v1/',
  empApiDevSelectBaseUrl: 'https://apit.metro.net/ws/rest/fis/v1/',
  fisApiBaseUrlOld: 'http://apisvc.metro.net/fis/',
  backendApiBaseUrl: import.meta.env.VITE_API_URL,
  roleTypeAdmin: 'Admin',
  roleTypeUser: 'User',
  ssLsrShortName: 'SS/LSR',
  ssLsrFullName: 'LA Metro DSI Web Team Application',
  csShortName: 'CS',
  csFullName: 'Corporate Safety (CS)',
  adminAccessToken: 'adminAccessToken',
  loginEmpKey: 'loginEmployee',
  
}
