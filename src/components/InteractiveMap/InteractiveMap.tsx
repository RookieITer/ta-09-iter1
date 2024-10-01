import React, { useEffect, useState, useCallback } from 'react'
import { Heading } from '@aws-amplify/ui-react'

import { ToiletData, OpenSpaceData, ParkingData, FilterState } from '@/utils/types'
import { fetchToilets, fetchOpenSpaces, fetchParkingData } from '@/utils/api'
import { MapFilters } from './MapFilters'
import { MapView } from './MapView'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export const InteractiveMap: React.FC = () => {
    const [toilets, setToilets] = useState<ToiletData[]>([])
    const [openSpaces, setOpenSpaces] = useState<OpenSpaceData[]>([])
    const [parkingSpaces, setParkingSpaces] = useState<ParkingData[]>([])
    const [selectedItem, setSelectedItem] = useState<ToiletData | OpenSpaceData | ParkingData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingOpenSpaces, setIsLoadingOpenSpaces] = useState(false)
    const [filter, setFilter] = useState<FilterState>({
        locationType: 'all',
        toiletFilters: {
            male: false,
            female: false,
            changeFacilities: false
        },
        openSpaceFilters: {
            melbourne: true,
            others: true
        }
    })

    const loadInitialData = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const [toiletsData, parkingData] = await Promise.all([
                fetchToilets(),
                fetchParkingData()
            ])
            setToilets(toiletsData.filter(toilet =>
                typeof toilet.lat === 'number' && !isNaN(toilet.lat) &&
                typeof toilet.lon === 'number' && !isNaN(toilet.lon)
            ))
            setParkingSpaces(parkingData)
        } catch (error) {
            console.error('Error loading initial data:', error)
            setError('Failed to load initial map data. Please try again later.')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadInitialData()
    }, [loadInitialData])

    const loadOpenSpaces = useCallback(async () => {
        if (openSpaces.length > 0) return // Don't reload if data is already present
        setIsLoadingOpenSpaces(true)
        setError(null)
        try {
            const openSpacesData = await fetchOpenSpaces()
            setOpenSpaces(openSpacesData)
        } catch (error) {
            console.error('Error loading open spaces data:', error)
            setError('Failed to load open spaces data. Please try again later.')
        } finally {
            setIsLoadingOpenSpaces(false)
        }
    }, [openSpaces.length])

    const handleFilterChange = useCallback((key: string) => {
        setFilter(prev => {
            if (key in prev.toiletFilters) {
                return {
                    ...prev,
                    toiletFilters: {
                        ...prev.toiletFilters,
                        [key]: !prev.toiletFilters[key as keyof FilterState['toiletFilters']]
                    }
                }
            } else if (key in prev.openSpaceFilters) {
                return {
                    ...prev,
                    openSpaceFilters: {
                        ...prev.openSpaceFilters,
                        [key]: !prev.openSpaceFilters[key as keyof FilterState['openSpaceFilters']]
                    }
                }
            }
            return prev
        })
    }, [])

    const handleLocationTypeChange = useCallback((value: FilterState['locationType']) => {
        setFilter(prev => ({ ...prev, locationType: value }))
        if (value === 'openSpaces') {
            void loadOpenSpaces()
        }
    }, [loadOpenSpaces])

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading map data...</div>
    }

    return (
        <div className="min-h-screen bg-white text-gray-800 overflow-auto font-sans">
            <div className="container mx-auto px-4 py-6 sm:py-8 md:py-10">
                <Heading level={3}>Find the nearest rest areas and amenities</Heading><br />
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <MapFilters
                    filter={filter}
                    onFilterChange={handleFilterChange}
                    onLocationTypeChange={handleLocationTypeChange}
                />
                <MapView
                    toilets={toilets}
                    openSpaces={openSpaces}
                    parkingSpaces={parkingSpaces}
                    filter={filter}
                    selectedItem={selectedItem}
                    onItemSelect={setSelectedItem}
                    isLoadingOpenSpaces={isLoadingOpenSpaces}
                />
            </div>
        </div>
    )
}

export default InteractiveMap