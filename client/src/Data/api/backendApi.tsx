import axios from 'axios'
import { envConfig } from '../../config/envConfig'

export const backendApi = axios.create({
  baseURL: envConfig.backendApiBaseUrl,
});