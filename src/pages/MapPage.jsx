import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { MapContainer, ImageOverlay, ZoomControl, useMap, Marker, Tooltip, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { resolveMapImage, GameIcon, resolveIcon } from '../utils/gameAssets.jsx'
import { loadJsonc } from '../utils/dataLoader.js'
import Loader from '../components/common/Loader.jsx'

const BASE = import.meta.env.BASE_URL

// ============================================================================
// CALCULATEUR DYNAMIQUE DE ZOOM ET POSITION INITIALE
// ============================================================================
function DynamicMapFit({ bounds, urlParams }) {
    const map = useMap()
    const firstRender = useRef(true)

    useEffect(() => {
        if (!map || !bounds) return

        const updateMapFit = () => {
            map.invalidateSize()
            const mapContainerWidth = map.getSize().x
            const imageWidth = bounds[1][1]
            const scale = mapContainerWidth / imageWidth
            const zoomToFitWidth = Math.log(scale) / Math.LN2

            map.setMinZoom(zoomToFitWidth)

            if (firstRender.current) {
                firstRender.current = false
                const targetX = parseFloat(urlParams.x)
                const targetY = parseFloat(urlParams.y)
                const isValidPosition = !isNaN(targetX) && !isNaN(targetY) &&
                    targetX >= bounds[0][1] && targetX <= bounds[1][1] &&
                    targetY >= bounds[0][0] && targetY <= bounds[1][0];

                if (isValidPosition) {
                    const targetZ = !isNaN(parseFloat(urlParams.z)) ? parseFloat(urlParams.z) : zoomToFitWidth + 1
                    map.setView([targetY, targetX], targetZ)
                } else if (map.getZoom() < zoomToFitWidth) {
                    map.setZoom(zoomToFitWidth)
                }
            }
        }

        const timer = setTimeout(updateMapFit, 50)
        map.on('resize', updateMapFit)

        return () => {
            clearTimeout(timer)
            map.off('resize', updateMapFit)
        }
    }, [map, bounds, urlParams])

    return null
}

// ============================================================================
// GESTIONNAIRE DE PERFORMANCES (LOD & FRUSTUM CULLING)
// ============================================================================
function ViewportManager({ parts, currentMapId }) {
    const map = useMap()
    const [viewState, setViewState] = useState({
        bounds: null,
        zoom: 0
    })

    // Écoute des déplacements pour mettre à jour la zone visible
    useMapEvents({
        moveend: () => {
            setViewState({ bounds: map.getBounds(), zoom: map.getZoom() })
        },
        zoomend: () => {
            setViewState({ bounds: map.getBounds(), zoom: map.getZoom() })
        }
    })

    // Initialisation au premier rendu
    useEffect(() => {
        setViewState({ bounds: map.getBounds(), zoom: map.getZoom() })
    }, [map])

    if (!viewState.bounds || !parts) return null

    // Filtrage strict : Ne garde que ce qui est au bon zoom ET visible à l'écran
    const visibleParts = parts.filter(part => {
        const minZ = part.minZoom !== undefined ? part.minZoom : -10
        const maxZ = part.maxZoom !== undefined ? part.maxZoom : 10

        // 1. Check de Zoom (LOD)
        if (viewState.zoom < minZ || viewState.zoom > maxZ) return false

        // 2. Check de visibilité (Culling)
        const partBounds = L.latLngBounds(part.bounds)
        return viewState.bounds.intersects(partBounds)
    })

    return (
        <>
            {visibleParts.map((part, idx) => {
                const imageKey = part.map || part.slug
                const partUrl = resolveMapImage(imageKey)

                if (!partUrl) return null

                return (
                    <ImageOverlay
                        key={`${currentMapId}-${imageKey}-${idx}`}
                        url={partUrl}
                        bounds={part.bounds}
                    />
                )
            })}
        </>
    )
}

function MapMouseCoordinatesHUD({ setHUDCoords }) {
    useMapEvents({
        mousemove(e) {
            setHUDCoords({
                x: e.latlng.lng.toFixed(0),
                y: e.latlng.lat.toFixed(0)
            })
        },
    })
    return null
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================
export default function MapPage() {
    const { mapId, subMapId } = useParams()
    const [searchParams] = useSearchParams()

    const [mapsConfig, setMapsConfig] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loadingError, setLoadingError] = useState(null)
    const [activeCategories, setActiveCategories] = useState([])
    const [filterPanelOpen, setFilterPanelOpen] = useState(true)
    const [hudCoords, setHUDCoords] = useState({ x: '0', y: '0' })

    useEffect(() => {
        setLoading(true)
        loadJsonc(`${BASE}data/maps.jsonc`)
            .then(data => {
                if (Array.isArray(data)) {
                    setMapsConfig(data)
                } else {
                    throw new Error("Format JSONC invalide (tableau attendu)")
                }
                setLoading(false)
            })
            .catch(err => {
                console.error("Erreur chargement maps:", err)
                setLoadingError(err.message)
                setLoading(false)
            })
    }, [])

    const currentMapConfig = useMemo(() => {
        if (!mapsConfig) return null
        const activeMapId = mapId || mapsConfig[0]?.id
        const parentMapConfig = mapsConfig.find(m => m.id === activeMapId) || mapsConfig[0]

        if (parentMapConfig?.subMaps) {
            const activeSubMapId = subMapId || parentMapConfig.subMaps[0].id
            return parentMapConfig.subMaps.find(sm => sm.id === activeSubMapId) || parentMapConfig.subMaps[0]
        }
        return parentMapConfig
    }, [mapsConfig, mapId, subMapId])

    useEffect(() => {
        if (currentMapConfig?.categories) {
            setActiveCategories(currentMapConfig.categories.map(c => c.id))
        } else {
            setActiveCategories([])
        }
    }, [currentMapConfig])

    const toggleCategory = (categoryId) => {
        setActiveCategories(prev =>
            prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
        )
    }

    const visibleMarkers = useMemo(() => {
        if (!currentMapConfig?.markers) return []
        return currentMapConfig.markers.filter(marker => activeCategories.includes(marker.category))
    }, [currentMapConfig?.markers, activeCategories])

    if (loading) return <Loader />
    if (loadingError) return <div className="flex h-full w-full items-center justify-center bg-[#0a0a0a] text-red-500 font-mono text-sm uppercase p-10 text-center">[ERROR] Impossible de charger maps.jsonc<br/>{loadingError}</div>
    if (!currentMapConfig) return <div className="flex h-full w-full items-center justify-center bg-[#0a0a0a] text-gray-500 font-mono text-sm uppercase">[ERROR] Carte introuvable</div>

    const urlParams = { x: searchParams.get('x'), y: searchParams.get('y'), z: searchParams.get('z') }
    const resolvedSingleImageUrl = !currentMapConfig.mapParts ? resolveMapImage(currentMapConfig.map || currentMapConfig.imageSlug) : null
    const hasImageContent = resolvedSingleImageUrl || (currentMapConfig.mapParts && currentMapConfig.mapParts.length > 0)

    return (
        <div className="h-full w-full relative bg-[#0a0a0a] overflow-hidden z-0">
            <style>{`.leaflet-tooltip.tactical-map-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; } .leaflet-tooltip.tactical-map-tooltip::before, .leaflet-tooltip.tactical-map-tooltip::after { display: none !important; }`}</style>

            {currentMapConfig.categories?.length > 0 && (
                <div className="absolute top-4 right-4 z-[400] flex flex-col items-end">
                    <button onClick={() => setFilterPanelOpen(!filterPanelOpen)} className="mb-2 p-2 bg-tactical-panel/90 border border-tactical-border rounded shadow-lg text-gray-400 hover:text-white backdrop-blur-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button>
                    {filterPanelOpen && (
                        <div className="bg-tactical-panel/90 border border-tactical-border rounded-lg p-4 backdrop-blur-sm min-w-[220px] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                            <h3 className="text-white text-xs font-bold uppercase tracking-widest border-b border-tactical-border pb-2 mb-3">Légende & Filtres</h3>
                            <div className="space-y-2">
                                {currentMapConfig.categories.map(cat => (
                                    <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" checked={activeCategories.includes(cat.id)} onChange={() => toggleCategory(cat.id)} className="hidden" />
                                        <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors shrink-0 ${activeCategories.includes(cat.id) ? 'border-shd bg-shd/20' : 'border-gray-600 bg-transparent'}`}>{activeCategories.includes(cat.id) && <div className="w-2 h-2 bg-shd rounded-sm" />}</div>
                                        <div className="w-5 h-5 flex items-center justify-center shrink-0"><GameIcon src={resolveIcon(cat.icon)} className="w-full h-full object-contain" /></div>
                                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{cat.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {hasImageContent ? (
                <MapContainer
                    key={currentMapConfig.id}
                    crs={L.CRS.Simple}
                    bounds={currentMapConfig.bounds}
                    maxBounds={currentMapConfig.bounds}
                    maxBoundsViscosity={0.7}
                    minZoom={currentMapConfig.minZoom || -4}
                    maxZoom={currentMapConfig.maxZoom}
                    zoomSnap={0}
                    zoomDelta={0.1}
                    wheelPxPerZoomLevel={120}
                    zoomControl={false}
                    className="absolute inset-0 z-0"
                    style={{ backgroundColor: '#0a0a0a' }}
                >
                    <DynamicMapFit bounds={currentMapConfig.bounds} urlParams={urlParams} />
                    <MapMouseCoordinatesHUD setHUDCoords={setHUDCoords} />
                    <ZoomControl position="bottomright" />

                    {/* DÉLÉGATION DU RENDU AU VIEWPORT MANAGER */}
                    {currentMapConfig.mapParts ? (
                        <ViewportManager parts={currentMapConfig.mapParts} currentMapId={currentMapConfig.id} />
                    ) : (
                        resolvedSingleImageUrl && (
                            <ImageOverlay url={resolvedSingleImageUrl} bounds={currentMapConfig.bounds} />
                        )
                    )}

                    {visibleMarkers.map(marker => {
                        const catDef = currentMapConfig.categories?.find(c => c.id === marker.category) || {}
                        const iconUrl = resolveIcon(catDef.icon)
                        const customIcon = L.divIcon({
                            html: `<div style="background-color: ${catDef.color || '#3b82f6'}; box-shadow: 0 0 10px ${catDef.color || '#3b82f6'}80;" class="w-8 h-8 rounded-full border border-black/50 flex items-center justify-center shadow-lg p-1">${iconUrl ? `<img src="${iconUrl}" style="filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.6));" class="w-full h-full object-contain" />` : ''}</div>`,
                            className: 'bg-transparent border-0',
                            iconSize: [32, 32], iconAnchor: [16, 16], tooltipAnchor: [0, -16]
                        })

                        return (
                            <Marker key={marker.id} position={[marker.coords[1], marker.coords[0]]} icon={customIcon}>
                                <Tooltip direction="top" offset={[0, -5]} opacity={1} className="tactical-map-tooltip">
                                    <div className="bg-tactical-panel/95 border border-tactical-border rounded p-3 backdrop-blur-sm min-w-[200px] shadow-2xl text-left font-sans">
                                        <h4 className="font-bold text-sm mb-1 uppercase tracking-widest" style={{ color: catDef.color || '#fff' }}>{marker.label}</h4>
                                        <div className="w-full h-px bg-tactical-border mb-2 opacity-50"></div>
                                        <p className="text-xs text-gray-300 m-0 leading-relaxed whitespace-pre-wrap">{marker.description}</p>
                                    </div>
                                </Tooltip>
                            </Marker>
                        )
                    })}
                </MapContainer>
            ) : (
                <div className="flex flex-col h-full w-full items-center justify-center text-gray-500 font-mono text-sm uppercase">
                    <span>[ERROR] Image introuvable pour "{currentMapConfig.map || 'collages'}"</span>
                </div>
            )}

            <div className="absolute top-4 left-4 text-[10px] text-shd/70 font-mono uppercase tracking-widest pointer-events-none z-[400]">
                SYS.COORD: {currentMapConfig.id.toUpperCase()}_SEC_01<br/>CRS: SIMPLE (FLAT)
            </div>
            <div className="absolute bottom-8 right-14 text-xs text-shd font-mono uppercase tracking-widest pointer-events-none z-[400] text-right">
                GPS: X={hudCoords.x} Y={hudCoords.y}
            </div>
        </div>
    )
}