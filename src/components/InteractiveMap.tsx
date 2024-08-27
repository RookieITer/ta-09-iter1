import React, { useEffect, useState } from 'react'
import Map, { Marker, Popup } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Icons } from '@/components/Icons'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ToiletData {
    Toilet_ID: number
    Location: string
    male: string
    female: string
    wheelchair: string
    baby_facil: string
    lat: number
    lon: number
}

interface TreeData {
    id: number
    latitude: number
    longitude: number
}

interface ApiResponse {
    statusCode: number
    body: string
}

export const InteractiveMap: React.FC = () => {
    const [toilets, setToilets] = useState<ToiletData[]>([])
    const [trees, setTrees] = useState<TreeData[]>([])
    const [selectedItem, setSelectedItem] = useState<ToiletData | TreeData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<'toilets' | 'trees' | 'all'>('all')

    useEffect(() => {
        const fetchToilets = async () => {
            try {
                const response = await axios.get<ApiResponse>('https://ug7jfdmytf.execute-api.ap-southeast-2.amazonaws.com/v1/get_public_toilets')
                const parsedBody = JSON.parse(response.data.body)
                const toiletsData = parsedBody.toilets as ToiletData[]

                const validToilets = toiletsData.filter(toilet =>
                    typeof toilet.lat === 'number' && !isNaN(toilet.lat) &&
                    typeof toilet.lon === 'number' && !isNaN(toilet.lon)
                )

                setToilets(validToilets)
            } catch (error) {
                console.error('Error fetching toilet data:', error)
                setError('Failed to load toilet data. Please try again later.')
            }
        }

        const fetchTrees = async () => {
            try {
                const response = await axios.get<ApiResponse>('https://ug7jfdmytf.execute-api.ap-southeast-2.amazonaws.com/v1/get_tree_canopies')
                const parsedBody = JSON.parse(response.data.body)
                const treesData = parsedBody.tree_canopies as TreeData[]

                setTrees(treesData)
            } catch (error) {
                console.error('Error fetching tree data:', error)
                setError('Failed to load tree data. Please try again later.')
            }
        }

        fetchToilets()
        fetchTrees()
    }, [])

    const handleCopyLocation = (location: string) => {
        navigator.clipboard.writeText(location).then(() => {
            alert('Location copied to clipboard!')
        }).catch(err => {
            console.error('Failed to copy: ', err)
            setError('Failed to copy location. Please try again.')
        })
    }

    if (error) {
        return <div className="text-red-500">{error}</div>
    }

    return (
        <div className="w-full h-full">
            <h2 className="text-2xl font-bold mb-4">Melbourne Interactive Map</h2>
            <div className="mb-4">
                <Select onValueChange={(value: 'toilets' | 'trees' | 'all') => setFilter(value)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select filter" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="toilets">Toilets</SelectItem>
                        <SelectItem value="trees">Trees</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="w-full h-[calc(100vh-200px)] min-h-[400px]">
                <Map
                    initialViewState={{
                        latitude: -37.8136,
                        longitude: 144.9631,
                        zoom: 13,
                        bearing: 0,
                        pitch: 0
                    }}
                    mapStyle="mapbox://styles/mapbox/streets-v11"
                    mapboxAccessToken="pk.eyJ1IjoibW9uYXNoYXVyYWUiLCJhIjoiY2pyMGJqbzV2MDk3dTQ0bndqaHA4d3hzeSJ9.TDvqYvsmY1DHhE8N8_UbFg"
                >
                    {(filter === 'all' || filter === 'toilets') && toilets.map((toilet) => (
                        <Marker
                            key={`toilet-${toilet.Toilet_ID}`}
                            latitude={toilet.lat}
                            longitude={toilet.lon}
                            anchor="bottom"
                            onClick={e => {
                                e.originalEvent.stopPropagation()
                                setSelectedItem(toilet)
                            }}
                        >
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <Icons.MapPin className="w-4 h-4 text-white" />
                            </div>
                        </Marker>
                    ))}
                    {(filter === 'all' || filter === 'trees') && trees.map((tree) => (
                        <Marker
                            key={`tree-${tree.id}`}
                            latitude={tree.latitude}
                            longitude={tree.longitude}
                            anchor="bottom"
                            onClick={e => {
                                e.originalEvent.stopPropagation()
                                setSelectedItem(tree)
                            }}
                        >
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <Icons.Tree className="w-4 h-4 text-white" />
                            </div>
                        </Marker>
                    ))}

                    {selectedItem && 'Toilet_ID' in selectedItem && (
                        <Popup
                            latitude={selectedItem.lat}
                            longitude={selectedItem.lon}
                            anchor="top"
                            onClose={() => setSelectedItem(null)}
                            closeOnClick={false}
                        >
                            <div className="p-2">
                                <h3 className="font-bold mb-2">{selectedItem.Location}</h3>
                                <p>Male: {selectedItem.male}</p>
                                <p>Female: {selectedItem.female}</p>
                                <p>Wheelchair: {selectedItem.wheelchair}</p>
                                <p>Baby Facilities: {selectedItem.baby_facil}</p>
                                <Button
                                    onClick={() => handleCopyLocation(selectedItem.Location)}
                                    className="mt-2 w-full"
                                    variant="outline"
                                >
                                    <Icons.Copy className="w-4 h-4 mr-2" />
                                    Copy Location
                                </Button>
                            </div>
                        </Popup>
                    )}
                    {selectedItem && 'id' in selectedItem && (
                        <Popup
                            latitude={selectedItem.latitude}
                            longitude={selectedItem.longitude}
                            anchor="top"
                            onClose={() => setSelectedItem(null)}
                            closeOnClick={false}
                        >
                            <div className="p-2">
                                <h3 className="font-bold mb-2">Tree ID: {selectedItem.id}</h3>
                                <p>Latitude: {selectedItem.latitude}</p>
                                <p>Longitude: {selectedItem.longitude}</p>
                            </div>
                        </Popup>
                    )}
                </Map>
            </div>
        </div>
    )
}

export default InteractiveMap