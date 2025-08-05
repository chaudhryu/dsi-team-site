import axios from 'axios'
import { envConfig } from '../../config/envConfig'


let selectedBaseUrl = envConfig.empApiProdSelectBaseUrl
let xApiKey = envConfig.empApiKeyProd

export const empApi = axios.create({
  baseURL: selectedBaseUrl,
  headers: {
    'x-api-key': xApiKey,
  },
})
