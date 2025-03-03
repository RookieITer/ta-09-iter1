'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Heading } from '@aws-amplify/ui-react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, Cell } from 'recharts'
//import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Play, Bike, Car, User } from 'lucide-react'
import { Button } from '@aws-amplify/ui-react'; 

interface CrashData {
    Suburb: string
    year: string
    SPEED_ZONE: string
    flag: string
    crash_count: number
}

interface CrimeData {
    LGA: string
    Postcode: number
    Suburb_Name: string
    Offence_Division: string
    Incidents_Recorded: number
    postcode_safety_rank: string
    Safety_Index: number
    Suggested_Video: string | null
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A4DE6C', '#FF6B6B']

const CustomizedPointer = ({ cx, cy, midAngle, outerRadius, safety_index }: { cx: number, cy: number, midAngle: number, outerRadius: number, safety_index: number }) => {
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const mx = cx + (outerRadius + 15) * cos;
    const my = cy + (outerRadius + 15) * sin;
    return (
        <g>
            <circle cx={mx} cy={my} r={4} fill="#666" stroke="none" />
            <path d={`M${cx},${cy}L${mx},${my}`} strokeWidth={2} stroke="#666" fill="none" />
            <text x={mx + (cos >= 0 ? 1 : -1) * 12} y={my} textAnchor={cos >= 0 ? 'start' : 'end'} dominantBaseline="central">
                {safety_index.toFixed(2)}
            </text>
        </g>
    );
};

export default function Statistics() {
    const [crashData, setCrashData] = useState<CrashData[]>([])
    const [crimeData, setCrimeData] = useState<CrimeData[]>([])
    const [selectedSuburb, setSelectedSuburb] = useState<string>('')
    const [suburbs, setSuburbs] = useState<string[]>([])
    const [selectedArea, setSelectedArea] = useState<string>('')
    const [areas, setAreas] = useState<string[]>([])
    const [activeTab, setActiveTab] = useState<'accident' | 'crime'>('accident')
    const [videoError, setVideoError] = useState<boolean>(false)
    const [videoErrorMessage, setVideoErrorMessage] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(true)
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
    const navigate = useNavigate()

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [crashResponse, crimeResponse] = await Promise.all([
                axios.get<{ body: string }>('https://ug7jfdmytf.execute-api.ap-southeast-2.amazonaws.com/v1/get_crash_data'),
                axios.get<{ body: string }>('https://ug7jfdmytf.execute-api.ap-southeast-2.amazonaws.com/v1/get_crime_data')
            ])

            const parsedCrashData = JSON.parse(crashResponse.data.body).crash_data as CrashData[]
            const parsedCrimeData = JSON.parse(crimeResponse.data.body).safety_info as CrimeData[]

            setCrashData(parsedCrashData)
            setCrimeData(parsedCrimeData)

            const uniqueSuburbs = Array.from(new Set(parsedCrashData.map(item => item.Suburb)))
            setSuburbs(uniqueSuburbs)
            setSelectedSuburb(uniqueSuburbs[0])

            const uniqueAreas = Array.from(new Set(parsedCrimeData.map(item => item.LGA)))
            setAreas(uniqueAreas)
            setSelectedArea(uniqueAreas[0])

            console.log('Fetched data successfully')
            console.log('Unique areas:', uniqueAreas)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSuburbChange = (value: string) => {
        setSelectedSuburb(value)
    }

    const handleAreaChange = (value: string) => {
        console.log('Area changed to:', value)
        setSelectedArea(value)
        setVideoError(false)
        setVideoErrorMessage('')
        setSelectedVideo(null)
    }

    const navigateToCanIParkHere = () => {
        navigate('/caniparkhere')
    }

    const processedCrashData = crashData
        .filter(item => item.Suburb === selectedSuburb)
        .reduce<Record<string, { SPEED_ZONE: number; [key: string]: number }>>((acc, item) => {
            const speedZone = parseInt(item.SPEED_ZONE)
            if (!acc[speedZone]) {
                acc[speedZone] = { SPEED_ZONE: speedZone }
            }
            acc[speedZone][item.flag] = (acc[speedZone][item.flag] || 0) + item.crash_count
            return acc
        }, {})

    const crashChartData = Object.values(processedCrashData).sort((a, b) => a.SPEED_ZONE - b.SPEED_ZONE)

    const transportModes = Array.from(new Set(crashData.map(item => item.flag)))
    const safestMode = transportModes.reduce((safest, mode) => {
        const totalCrashes = crashChartData.reduce((sum, item) => sum + (item[mode] || 0), 0)
        return totalCrashes < (safest.crashes || Infinity) ? { mode, crashes: totalCrashes } : safest
    }, { mode: '', crashes: Infinity })

    const selectedAreaData = crimeData.filter(item => item.LGA === selectedArea)
    const top5Risks = selectedAreaData
        .sort((a, b) => b.Incidents_Recorded - a.Incidents_Recorded)
        .slice(0, 5)

    const safetyIndex = selectedAreaData[0]?.Safety_Index || 0
    const suggestedVideos = selectedAreaData
        .map(item => item.Suggested_Video)
        .filter((video, index, self) => video && self.indexOf(video) === index) as string[]

    useEffect(() => {
        if (suggestedVideos.length > 0) {
            console.log('Suggested video URLs:', suggestedVideos)
        } else {
            console.log('No suggested videos for this area')
        }
    }, [suggestedVideos])

    const handleVideoError = useCallback((e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
        console.error('Video error:', e)
        setVideoError(true)
        setVideoErrorMessage('Sorry, the suggested video is currently unavailable. This may be due to content restrictions or network issues.')
    }, [])

    const getVideoId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)
        return (match && match[2].length === 11) ? match[2] : null
    }

    const handleVideoSelect = (video: string) => {
        setSelectedVideo(video)
        setVideoError(false)
        setVideoErrorMessage('')
    }

    const analyzeCrashData = () => {
        const totalCrashes = crashChartData.reduce((sum, item) =>
            sum + transportModes.reduce((modeSum, mode) => modeSum + (item[mode] || 0), 0), 0)

        const highestSpeedZone = crashChartData.reduce((highest, item) => {
            const zoneTotal = transportModes.reduce((sum, mode) => sum + (item[mode] || 0), 0)
            return zoneTotal > highest.total ? { zone: item.SPEED_ZONE, total: zoneTotal } : highest
        }, { zone: 0, total: 0 })

        return (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Crash Data Analysis</h3>
                <p>In {selectedSuburb}, there have been a total of {totalCrashes} reported crashes across all speed zones and transport modes.</p>
                <p>The speed zone with the highest number of crashes is {highestSpeedZone.zone} km/h, accounting for {highestSpeedZone.total} crashes.</p>
                <p>The safest mode of transport appears to be {safestMode.mode}, with the lowest number of reported incidents.</p>
                <p>This data suggests that extra caution should be exercised in {highestSpeedZone.zone} km/h zones, particularly when using modes of transport other than {safestMode.mode}.</p>
            </div>
        )
    }

    const analyzeCrimeData = () => {
        const totalIncidents = top5Risks.reduce((sum, risk) => sum + risk.Incidents_Recorded, 0)
        const highestRisk = top5Risks[0]

        return (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Crime Data Analysis</h3>
                <p>The overall restconnect risk score for this area is {safetyIndex.toFixed(2)}, where a higher score
                    indicates a
                    safer area.</p>
                <p className="font-semibold text-red-500">The most prevalent type of offense is {highestRisk?.Offence_Division},
                    with {highestRisk?.Incidents_Recorded} recorded incidents.</p>
                <p>In the area {selectedArea}, there have been a total of {totalIncidents} recorded
                    incidents across the top 5 risk categories.</p>
                <p>Based on this data, residents and visitors should be particularly vigilant
                    about {highestRisk?.Offence_Division.toLowerCase()} in this area. However, it's important to note
                    that this data represents reported incidents and may not capture all aspects of safety in the
                    area.</p>
            </div>
        )
    }

    const getColorInterpretation = (value: number) => {
        if (value >= 4) return 'Low Risk'
        if (value >= 3) return 'Moderately Low Risk'
        if (value >= 2) return 'Moderate Risk'
        if (value >= 1) return 'Moderately High Risk'
        return 'High Risk'
    }

    const SafestModeIcon = () => {
        switch (safestMode.mode.toLowerCase()) {
            case 'cycling':
                return <Bike size={64} className="text-green-500" />;
            case 'driving':
                return <Car size={64} className="text-blue-500" />;
            case 'walking':
                return <User size={64} className="text-purple-500" />;
            default:
                return null;
        }
    };

    const crimeChartData = selectedAreaData
        .reduce((acc, item) => {
            const existingItem = acc.find(i => i.Offence_Division === item.Offence_Division);
            if (existingItem) {
                existingItem.Incidents_Recorded += item.Incidents_Recorded;
            } else {
                acc.push({
                    Offence_Division: item.Offence_Division,
                    Incidents_Recorded: item.Incidents_Recorded
                });
            }
            return acc;
        }, [] as { Offence_Division: string; Incidents_Recorded: number }[])
        .sort((a, b) => b.Incidents_Recorded - a.Incidents_Recorded);

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>
    }

    return (
        <div className="min-h-screen bg-white text-gray-800 overflow-auto p-2">
            <div className="container mx-auto px-0 py-0 sm:py-2 md:py-4">
                <div className="flex items-center">
                    <Heading level={3}>Know your risks&nbsp;&nbsp;
                    </Heading>
                    <div>
                        {activeTab === 'accident' && (
                            <Select value={selectedSuburb} onValueChange={handleSuburbChange}>
                                <SelectTrigger style={{width: '12em', height: '2.5em', border: '2px solid #999999', margin: '8px 0px 0px 0px' }}>
                                    <SelectValue placeholder="Select suburb" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suburbs.map(suburb => (
                                        <SelectItem key={suburb} value={suburb}>{suburb}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            )}

                        {activeTab === 'crime' && (
                            <Select value={selectedArea} onValueChange={handleAreaChange}>
                                <SelectTrigger style={{width: '12em',  height: '2.5em', border: '2px solid #999999', margin: '8px 0px 0px 0px' }}>
                                    <SelectValue placeholder="Select area" />
                                </SelectTrigger>
                                <SelectContent>
                                    {areas.map(area => (
                                        <SelectItem key={area} value={area}>{area}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>
    
                <p className="text-gray-400 mb-6">Stay informed and rest easy with these insights on crime and accident data</p>

                <div className="flex justify-between items-center">
                   <div>
                        <Button className='btnmax12' onClick={() => setActiveTab('accident')}>Accident Data</Button>&nbsp;
                        <Button className='btnmax12' onClick={() => setActiveTab('crime')}>Crime Insight</Button>&nbsp;
                    </div>
                    <Button variation="primary" className="btnmax12" onClick={navigateToCanIParkHere}>Can I Park Here?</Button>
                </div>
                <br />

                {activeTab === 'accident' && (
                    <div>
                        <div className="bg-white p-2  rounded-lg border border-gray-200">
                            <div className='pseudoheading'>
                                Safest transport mode in  {selectedSuburb}: <strong className="ml-1">{safestMode.mode}</strong>
                            </div>
                            <br />
                            <div className="flex flex-col items-left mb-6">
                                <SafestModeIcon />
                            </div>

                            {analyzeCrashData()}
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart
                                    data={crashChartData}
                                    margin={{top: 20, right: 30, left: 20, bottom: 60}}
                                    layout="vertical"
                                >
                                    <CartesianGrid strokeDasharray="3 3"/>
                                    <XAxis
                                        type="number"
                                        label={{value: '(Number of Accidents 2020-2023)', position: 'insideBottom', offset: -10}}
                                    />
                                    <YAxis
                                        dataKey="SPEED_ZONE"
                                        type="category"
                                        label={{value: 'Speed Zone (km/h)', angle: -90, position: 'insideLeft', offset: 10}}
                                    />
                                    <Tooltip/>
                                    <Legend verticalAlign="top" height={36}/>
                                    {transportModes.map((mode, index) => (
                                        <Bar
                                            key={mode}
                                            dataKey={mode}
                                            stackId="a"
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {activeTab === 'crime' && (
                    <div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <h2 className="text-2xl font-semibold mb-4">Crime Risk Score for {selectedArea}</h2>
                            <div>
                                <div className="mt-4 text-left">
                                <p className="text-lg font-semibold">Rest Connect Risk Score: {safetyIndex.toFixed(2)}</p>
                                <p className="text-sm text-gray-600">
                                Interpretation: {getColorInterpretation(safetyIndex)}
                                </p>
                                <br />
                            </div>

                            <div>
                                <ResponsiveContainer width={300} height={300}>
                                            <RadialBarChart
                                                innerRadius="90%"
                                                outerRadius="90%"
                                                data={[{name: 'Safety Index', value: safetyIndex}]}
                                                startAngle={180}
                                                endAngle={0}
                                                barSize={30}
                                                
                                            >
                                            <defs>
                                                <linearGradient id="safetyGradient" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#F44336"/>
                                                    <stop offset="60%" stopColor="#FFC107"/>
                                                    <stop offset="100%" stopColor="#4CAF50"/>
                                                </linearGradient>
                                            </defs>
                                            <PolarAngleAxis
                                                type="number"
                                                domain={[0, 5]}
                                                angleAxisId={0}
                                                tick={false}
                                            />
                                            <RadialBar
                                                background
                                                dataKey="value"
                                                cornerRadius={30}
                                                fill="url(#safetyGradient)"
                                            />
                                            <CustomizedPointer
                                                cx={150}
                                                cy={200}
                                                midAngle={90 - (safetyIndex / 5) * 180}
                                                outerRadius={100}
                                                safety_index={safetyIndex}
                                            />
                                        </RadialBarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>


                            {analyzeCrimeData()}
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-2">Crime Incidents by Offence Type</h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart
                                        data={crimeChartData}
                                        layout="vertical"
                                        margin={{top: 5, right: 30, left: 20, bottom: 5}}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            type="number"
                                            label={{ value: 'Incidents Recorded', position: 'insideBottom', offset: -5 }}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="Offence_Division"
                                            width={150}
                                        />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="Incidents_Recorded" name="Incidents Recorded">
                                            {crimeChartData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            {suggestedVideos.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-lg font-semibold mb-2">Suggested Videos:</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {suggestedVideos.map((video, index) => (
                                            <div key={index} className="bg-gray-100 p-4 rounded-lg">
                                                <img
                                                    src={`https://img.youtube.com/vi/${getVideoId(video)}/0.jpg`}
                                                    alt={`Video thumbnail ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-md mb-2"
                                                />
                                                <Button
                                                    onClick={() => handleVideoSelect(video)}
                                                    className="w-full flex items-center justify-center"
                                                >
                                                    <Play className="mr-2" size={16}/>
                                                    Play Video {index + 1}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {selectedVideo && !videoError && (
                                <div className="mt-4">
                                    <h3 className="text-lg font-semibold mb-2">Selected Video:</h3>
                                    <iframe
                                        width="100%"
                                        height="315"
                                        src={`https://www.youtube.com/embed/${getVideoId(selectedVideo)}`}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        onError={handleVideoError}
                                    ></iframe>
                                </div>
                            )}
                            {videoError && (
                                <div className="mt-4 p-4 bg-yellow-100 rounded-md flex items-center">
                                    <AlertCircle className="text-yellow-500 mr-2"/>
                                    <p>{videoErrorMessage}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}