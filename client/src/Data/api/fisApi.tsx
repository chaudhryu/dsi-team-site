import axios from 'axios'
import { envConfig } from '../../config/envConfig'

export const fisApiOld = axios.create({
  baseURL: envConfig.fisApiBaseUrlOld,
})
export const fisApiNew = axios.create({
  baseURL: envConfig.empApiProdSelectBaseUrl,
  headers: {
    'x-api-key': envConfig.empApiKeyProd,
  },
})
