import { fisApiNew } from '../api/fisApi'

/**
 *get list of cost centers from FIS API service
 *
 * @return {*}
 */
export const fetchListCostCenters = async (): Promise<any> => {
  try {
    const response = await fisApiNew.get(`cost-centers`)
  
    return response
  } catch (error) {
    console.error('Error in fetch cost center list: ', error)
    return []
  }
}
/**
 *get list of projects from FIS API service
 *
 * @param {*} costCenterNumber
 * @return {*}
 */
export const fetchProjectsByCostCenterNumber =
 async (costCenterNumber: string) =>
 {
    try {
      const response = await fisApiNew.get(`projects-by-cost-center?costCenter=${costCenterNumber}`)
      // Only dispatch if dispatch function is available
      return response
    } catch (error) {
      console.error('Error in fetch cost center by ID list: ', error)
      return []
    }
  }
/**
 *Get Vendor Number
 *
 * @param {*} badgeNumber
 * @return {*}
 */
export const getVendorIdByBadgeNumber = async (badgeNumber: string) => {
  try {
    const response = await fisApiNew.get(`employee-vendor-id?badgeNumber=${badgeNumber}`)
    if (response.status === 200) {
      return response.data
    }
    return null
  } catch (error) {
    console.error('Error in get vendor ID by badge number: ', error)
    return null
  }
}
