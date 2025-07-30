import { empApi } from '../api/empApi'

/**
 * To fetch employee details from FIS API service fir scanning badge
 * @param {*} badgeScanValue value form scanning a badge
 * @returns promise
 */
export const fetchEmployeeDetailsByScanCode = async (badgeScanValue:any) => {
  const promise = await empApi.get(`employee-info-by-code/?badgeCode=${badgeScanValue}`)
  return promise
}

/**
 * To fetch employee details from FIS API service
 * @param {*} badgeNo employee badge number
 * @returns promise
 */
export const fetchEmployeeDetails = async (badgeNo:any) => {
  const promise = await empApi.get(`employee-info/?badgeNumber=${badgeNo}`)
  return promise
}

/**
 * To fetch employee hierarchical-positions from FIS API service
 * @param {*} badgeNo employee badge number
 * @returns promise
 */
export const fetchEmployeeHierarchy = async (badgeNo:any) => {
  const promise = await empApi.get(`hierarchical-positions/?badgeNumber=${badgeNo}`)
  return promise
}
