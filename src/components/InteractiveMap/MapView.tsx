import React from 'react'
import Map, { Marker } from 'react-map-gl'
import { Icons } from '@/components/Icons'
import { ToiletData, OpenSpaceData, ParkingData, FilterState } from '@/utils/types'
import { ToiletPopup, OpenSpacePopup, ParkingPopup } from './Popups'
import { filterToilets, filterOpenSpaces } from '@/utils/utils'
import { FaToilet } from 'react-icons/fa'

interface MapViewProps {
    toilets: ToiletData[]
    openSpaces: OpenSpaceData[]
    parkingSpaces: ParkingData[]
    filter: FilterState
    selectedItem: ToiletData | OpenSpaceData | ParkingData | null
    onItemSelect: (item: ToiletData | OpenSpaceData | ParkingData | null) => void
    isLoadingOpenSpaces: boolean
}

export const MapView: React.FC<MapViewProps> = ({ toilets, openSpaces, parkingSpaces, filter, selectedItem, onItemSelect }) => {
    return (
        <div className="w-full h-[calc(100vh-200px)] min-h-[400px] rounded-lg overflow-hidden bg-white">
            <Map
                initialViewState={{
                    latitude: -37.8136,
                    longitude: 144.9631,
                    zoom: 17,
                    bearing: 0,
                    pitch: 0
                }}
                mapStyle="mapbox://styles/mapbox/streets-v11"
                mapboxAccessToken="pk.eyJ1IjoibW9uYXNoYXVyYWUiLCJhIjoiY2pyMGJqbzV2MDk3dTQ0bndqaHA4d3hzeSJ9.TDvqYvsmY1DHhE8N8_UbFg"
            >
                {filter.locationTypes.includes('toilets') && toilets.filter(toilet => filterToilets(toilet, filter.toiletFilters)).map((toilet) => (
                    <Marker
                        key={`toilet-${toilet.Toilet_ID}-${toilet.lat}-${toilet.lon}`}
                        latitude={toilet.lat}
                        longitude={toilet.lon}
                        anchor="bottom"
                        onClick={e => {
                            e.originalEvent.stopPropagation()
                            onItemSelect(toilet)
                        }}
                    >
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-primary/90 transition-colors">
                            <FaToilet className="w-6 h-6 text-primary-foreground" />
                        </div>
                    </Marker>
                ))}
                {filter.locationTypes.includes('openSpaces') && openSpaces.filter(space => filterOpenSpaces(space, filter.openSpaceFilters)).map((space) => (
                    <Marker
                        key={`space-${space.PARK_NAME}-${space.latitude}-${space.longitude}`}
                        latitude={space.latitude}
                        longitude={space.longitude}
                        anchor="bottom"
                        onClick={e => {
                            e.originalEvent.stopPropagation()
                            onItemSelect(space)
                        }}
                    >
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                            <Icons.Trees className="w-8 h-8 text-white" />
                        </div>
                    </Marker>
                ))}
                {filter.locationTypes.includes('parking') && parkingSpaces.map((space) => (
                    <Marker
                        key={`parking-${space.segment_id}-${space.geo_point}`}
                        latitude={parseFloat(space.geo_point.split(',')[0])}
                        longitude={parseFloat(space.geo_point.split(',')[1])}
                        anchor="bottom"
                        onClick={e => {
                            e.originalEvent.stopPropagation()
                            onItemSelect(space)
                        }}
                    >
                        <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                            <Icons.ParkingCircle className="w-8 h-8 text-white" />
                        </div>
                    </Marker>
                ))}

                {selectedItem && 'Toilet_ID' in selectedItem && (
                    <ToiletPopup item={selectedItem} onClose={() => onItemSelect(null)} />
                )}
                {selectedItem && 'PARK_NAME' in selectedItem && (
                    <OpenSpacePopup item={selectedItem} onClose={() => onItemSelect(null)} />
                )}
                {selectedItem && 'segment_id' in selectedItem && (
                    <ParkingPopup item={selectedItem} onClose={() => onItemSelect(null)} />
                )}
            </Map>
        </div>
    )
}