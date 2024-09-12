import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ToiletData, OpenSpaceData, ParkingData, FilterState } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const filterToilets = (toilet: ToiletData, filters: FilterState['toiletFilters']) => {
  if (Object.values(filters).every(v => !v)) return true
  return (
      (filters.male && toilet.male.toLowerCase() === 'yes') ||
      (filters.female && toilet.female.toLowerCase() === 'yes') ||
      (filters.wheelchair && toilet.wheelchair.toLowerCase() === 'yes') ||
      (filters.babyFacilities && toilet.baby_facil.toLowerCase() === 'yes')
  )
}

export const filterOpenSpaces = (space: OpenSpaceData, filters: FilterState['openSpaceFilters'], locationType: FilterState['locationType']) => {
  if (locationType === 'all') return true
  const isMelbourne = space.LGA.toLowerCase().includes('melbourne')
  return (isMelbourne && filters.melbourne) || (!isMelbourne && filters.others)
}

export const filterParkingSpaces = (parking: ParkingData, filters: FilterState['parkingFilters']) => {
  if (Object.values(filters).every(v => !v)) return true
  return (
      (filters.councilMajor && parking.str_type === 'Council Major') ||
      (filters.councilMinor && parking.str_type === 'Council Minor') ||
      (filters.weekday && ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(parking.day_of_week)) ||
      (filters.weekend && ['Saturday', 'Sunday'].includes(parking.day_of_week))
  )
}

export const handleCopyLocation = (location: string) => {
  return new Promise<void>((resolve, reject) => {
    navigator.clipboard.writeText(location).then(() => {
      alert('Location copied to clipboard!')
      resolve()
    }).catch(err => {
      console.error('Failed to copy: ', err)
      reject(new Error('Failed to copy location. Please try again.'))
    })
  })
}