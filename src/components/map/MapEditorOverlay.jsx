import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { renderToString } from 'react-dom/server'
import { createPortal } from 'react-dom'
import L from 'leaflet'
import { GameIcon, resolveAsset } from '../common/GameAssets.jsx'

// ============================================================================
// MAP EDITOR OVERLAY (mode développement uniquement)
// ============================================================================
// Outils d'édition superposés à MapPage permettant de:
//  - dessiner de nouvelles zones (polygones)
//  - éditer les zones existantes (drag, ajout/suppression de points)
//  - snap des points sur les arêtes des autres polygones (Ctrl désactive)
//  - déplacement groupé des points partagés entre plusieurs zones (Ctrl déplace seul)
//  - ajout / édition / suppression de marqueurs avec tous les champs du schéma
//  - undo/redo (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)
//  - export JSONC (zones + markers) à coller dans src/data/maps.jsonc
// ============================================================================

const SNAP_PIXELS = 12 // tolérance de snap en pixels écran

// ---------------------------------------------------------------------------
// Utilitaires géométriques (coords stockées [X, Y])
// ---------------------------------------------------------------------------
function clonePoint(p) { return [p[0], p[1]] }
function clonePoly(coords) { return coords.map(clonePoint) }
function pointsEqual(a, b) { return a[0] === b[0] && a[1] === b[1] }

function distancePointToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay
    const lenSq = dx * dx + dy * dy
    let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq
    t = Math.max(0, Math.min(1, t))
    const x = ax + t * dx, y = ay + t * dy
    return { x, y, t, dist: Math.hypot(px - x, py - y) }
}

function genId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

// ---------------------------------------------------------------------------
// Sérialisation JSONC : pretty-print 4 espaces, mais points [X,Y] sur 1 ligne
// ---------------------------------------------------------------------------
function isCoordPair(v) {
    return Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number'
}

function stringifyValue(value, indent, level) {
    const pad = indent.repeat(level)
    const padInner = indent.repeat(level + 1)

    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value)
    }

    if (Array.isArray(value)) {
        if (value.length === 0) return '[]'
        // Point [X,Y] sur une seule ligne
        if (isCoordPair(value)) {
            return `[${value[0]}, ${value[1]}]`
        }
        const items = value.map(v => padInner + stringifyValue(v, indent, level + 1))
        return `[\n${items.join(',\n')}\n${pad}]`
    }

    const keys = Object.keys(value)
    if (keys.length === 0) return '{}'
    const entries = keys.map(k => `${padInner}${JSON.stringify(k)}: ${stringifyValue(value[k], indent, level + 1)}`)
    return `{\n${entries.join(',\n')}\n${pad}}`
}

function stringifyMaps(maps) {
    return stringifyValue(maps, '    ', 0)
}

// ---------------------------------------------------------------------------
// Hook: stack undo / redo
// ---------------------------------------------------------------------------
function useHistory(initial) {
    const [state, setState] = useState(initial)
    const past = useRef([])
    const future = useRef([])

    const commit = useCallback((updater) => {
        setState(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater
            past.current.push(JSON.stringify(prev))
            if (past.current.length > 200) past.current.shift()
            future.current = []
            return next
        })
    }, [])

    const undo = useCallback(() => {
        if (!past.current.length) return
        setState(prev => {
            future.current.push(JSON.stringify(prev))
            return JSON.parse(past.current.pop())
        })
    }, [])

    const redo = useCallback(() => {
        if (!future.current.length) return
        setState(prev => {
            past.current.push(JSON.stringify(prev))
            return JSON.parse(future.current.pop())
        })
    }, [])

    const reset = useCallback((value) => {
        past.current = []
        future.current = []
        setState(value)
    }, [])

    return { state, commit, undo, redo, reset, setSilent: setState }
}

export default function MapEditorOverlay({ map, mapConfig, allMaps, onClose }) {
    // état édité (zones + markers)
    const initial = useMemo(() => ({
        zones: (mapConfig?.zones || []).map(z => ({ ...z, coords: clonePoly(z.coords) })),
        markers: (mapConfig?.markers || []).map(m => ({ ...m, coords: clonePoint(m.coords) }))
    }), [mapConfig])

    const { state, commit, undo, redo, reset } = useHistory(initial)

    // Quand mapConfig change (ex: changement de carte), réinitialise
    const lastConfigId = useRef(mapConfig?.id)
    useEffect(() => {
        if (mapConfig?.id !== lastConfigId.current) {
            lastConfigId.current = mapConfig?.id
            reset(initial)
        }
    }, [mapConfig, initial, reset])

    const [tool, setTool] = useState('select') // 'select' | 'drawZone' | 'addMarker'
    const [selectedZoneId, setSelectedZoneId] = useState(null)
    const [selectedMarkerId, setSelectedMarkerId] = useState(null)
    const [drawingCoords, setDrawingCoords] = useState([]) // points en cours pour nouvelle zone
    const [previewPoint, setPreviewPoint] = useState(null) // [x,y] aperçu du prochain point en mode drawZone
    const [editingMarkerData, setEditingMarkerData] = useState(null) // marqueur en cours d'édition (formulaire/modal)

    const ctrlRef = useRef(false)

    // -----------------------------------------------------------------------
    // Raccourcis clavier (undo/redo) + suivi de Ctrl
    // -----------------------------------------------------------------------
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Control') ctrlRef.current = true
            const mod = e.ctrlKey || e.metaKey
            if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault(); undo()
            } else if (mod && ((e.key === 'y' || e.key === 'Y') || ((e.key === 'z' || e.key === 'Z') && e.shiftKey))) {
                e.preventDefault(); redo()
            } else if (e.key === 'Escape') {
                if (editingMarkerData) setEditingMarkerData(null)
                else if (drawingCoords.length) { setDrawingCoords([]); setPreviewPoint(null) }
                else { setSelectedZoneId(null); setSelectedMarkerId(null) }
            }
        }
        const onKeyUp = (e) => { if (e.key === 'Control') ctrlRef.current = false }
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
        }
    }, [undo, redo, drawingCoords, editingMarkerData])

    // -----------------------------------------------------------------------
    // Snap: trouver le point d'attache le plus proche sur les arêtes des autres polygones
    // -----------------------------------------------------------------------
    const computeSnap = useCallback((x, y, excludeZoneId) => {
        if (ctrlRef.current || !map) return null
        const targetPx = map.latLngToContainerPoint([y, x])
        let best = null
        for (const zone of state.zones) {
            if (zone.id === excludeZoneId) continue
            const pts = zone.coords
            for (let i = 0; i < pts.length; i++) {
                const a = pts[i], b = pts[(i + 1) % pts.length]
                // tester proximité du point lui-même (priorité)
                const aPx = map.latLngToContainerPoint([a[1], a[0]])
                const dA = Math.hypot(aPx.x - targetPx.x, aPx.y - targetPx.y)
                if (dA <= SNAP_PIXELS && (!best || dA < best.distPx)) {
                    best = { x: a[0], y: a[1], distPx: dA, kind: 'vertex' }
                }
                // segment
                const bPx = map.latLngToContainerPoint([b[1], b[0]])
                const seg = distancePointToSegment(targetPx.x, targetPx.y, aPx.x, aPx.y, bPx.x, bPx.y)
                if (seg.dist <= SNAP_PIXELS && (!best || seg.dist < best.distPx)) {
                    const ll = map.containerPointToLatLng([seg.x, seg.y])
                    best = { x: ll.lng, y: ll.lat, distPx: seg.dist, kind: 'edge' }
                }
            }
        }
        return best
    }, [map, state.zones])

    // -----------------------------------------------------------------------
    // Évènements de la map: clic pour dessiner / ajouter marqueur
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!map) return

        const onMapClick = (e) => {
            if (tool === 'drawZone') {
                const snap = computeSnap(e.latlng.lng, e.latlng.lat, null)
                const x = snap ? snap.x : e.latlng.lng
                const y = snap ? snap.y : e.latlng.lat
                setDrawingCoords(prev => [...prev, [x, y]])
            } else if (tool === 'addMarker') {
                const newMarker = {
                    id: genId('marker'),
                    coords: [Math.round(e.latlng.lng), Math.round(e.latlng.lat)],
                    category: mapConfig?.categories?.[0]?.id || '',
                    label: 'Nouveau marqueur',
                    description: ''
                }
                commit(s => ({ ...s, markers: [...s.markers, newMarker] }))
                setSelectedMarkerId(newMarker.id)
                setEditingMarkerData(newMarker)
                setTool('select')
            } else {
                // clic ailleurs en mode select: désélectionne
                setSelectedZoneId(null)
                setSelectedMarkerId(null)
            }
        }

        const onMouseMove = (e) => {
            if (tool !== 'drawZone') return
            const snap = computeSnap(e.latlng.lng, e.latlng.lat, null)
            const x = snap ? snap.x : e.latlng.lng
            const y = snap ? snap.y : e.latlng.lat
            setPreviewPoint([x, y])
        }
        const onMouseOut = () => { if (tool === 'drawZone') setPreviewPoint(null) }

        const onDblClick = () => {
            if (tool === 'drawZone' && drawingCoords.length >= 3) {
                const newZone = {
                    id: genId('zone'),
                    label: 'Nouvelle zone',
                    description: '',
                    coords: drawingCoords,
                    borderColor: '#ff6d00',
                    fillColor: '#ff6d00',
                    fillOpacity: 0.2
                }
                commit(s => ({ ...s, zones: [...s.zones, newZone] }))
                setDrawingCoords([])
                setPreviewPoint(null)
                setSelectedZoneId(newZone.id)
                setTool('select')
            }
        }

        map.on('click', onMapClick)
        map.on('dblclick', onDblClick)
        map.on('mousemove', onMouseMove)
        map.on('mouseout', onMouseOut)
        // empêcher le double-clic de zoomer pendant le dessin
        if (tool === 'drawZone') map.doubleClickZoom.disable()
        else map.doubleClickZoom.enable()

        return () => {
            map.off('click', onMapClick)
            map.off('dblclick', onDblClick)
            map.off('mousemove', onMouseMove)
            map.off('mouseout', onMouseOut)
            map.doubleClickZoom.enable()
        }
    }, [map, tool, drawingCoords, commit, computeSnap, mapConfig])

    // -----------------------------------------------------------------------
    // Rendu des couches d'édition (Leaflet directement, hors React-Leaflet)
    // -----------------------------------------------------------------------
    const layerRef = useRef(null)
    useEffect(() => {
        if (!map) return
        const group = L.layerGroup().addTo(map)
        layerRef.current = group
        return () => { group.remove(); layerRef.current = null }
    }, [map])

    // Helpers de modification
    const updateZone = useCallback((zoneId, updater) => {
        commit(s => ({
            ...s,
            zones: s.zones.map(z => z.id === zoneId ? updater(z) : z)
        }))
    }, [commit])

    const deleteZone = (zoneId) => {
        commit(s => ({ ...s, zones: s.zones.filter(z => z.id !== zoneId) }))
        setSelectedZoneId(null)
    }
    const deleteMarker = (markerId) => {
        commit(s => ({ ...s, markers: s.markers.filter(m => m.id !== markerId) }))
        setSelectedMarkerId(null)
        setEditingMarkerData(null)
    }

    // Déplacement d'un point (potentiellement partagé)
    const moveVertex = useCallback((zoneId, vertexIndex, newX, newY, soloMode) => {
        commit(s => {
            const zone = s.zones.find(z => z.id === zoneId)
            if (!zone) return s
            const oldPt = zone.coords[vertexIndex]
            return {
                ...s,
                zones: s.zones.map(z => {
                    if (soloMode) {
                        if (z.id !== zoneId) return z
                        const newCoords = z.coords.map((p, i) => i === vertexIndex ? [newX, newY] : p)
                        return { ...z, coords: newCoords }
                    }
                    // mode partagé: déplace tous les sommets égaux à oldPt dans toutes les zones
                    const newCoords = z.coords.map(p => pointsEqual(p, oldPt) ? [newX, newY] : p)
                    return { ...z, coords: newCoords }
                })
            }
        })
    }, [commit])

    const insertVertex = (zoneId, edgeIndex, x, y) => {
        commit(s => ({
            ...s,
            zones: s.zones.map(z => {
                if (z.id !== zoneId) return z
                const newCoords = [...z.coords]
                newCoords.splice(edgeIndex + 1, 0, [x, y])
                return { ...z, coords: newCoords }
            })
        }))
    }
    const removeVertex = (zoneId, vertexIndex) => {
        commit(s => ({
            ...s,
            zones: s.zones.map(z => {
                if (z.id !== zoneId) return z
                if (z.coords.length <= 3) return z
                const newCoords = z.coords.filter((_, i) => i !== vertexIndex)
                return { ...z, coords: newCoords }
            })
        }))
    }

    const updateMarker = (markerId, patch) => {
        commit(s => ({
            ...s,
            markers: s.markers.map(m => m.id === markerId ? { ...m, ...patch } : m)
        }))
        setEditingMarkerData(prev => prev && prev.id === markerId ? { ...prev, ...patch } : prev)
    }

    // -----------------------------------------------------------------------
    // Rendu Leaflet impératif des zones/markers éditables
    // -----------------------------------------------------------------------
    useEffect(() => {
        const group = layerRef.current
        if (!map || !group) return
        group.clearLayers()

        // ---- Zones ----
        for (const zone of state.zones) {
            const isSelected = zone.id === selectedZoneId
            const positions = zone.coords.map(c => [c[1], c[0]])
            const poly = L.polygon(positions, {
                color: zone.borderColor || zone.color || '#ff6d00',
                fillColor: zone.fillColor || zone.color || '#ff6d00',
                fillOpacity: isSelected ? 0.35 : (zone.fillOpacity ?? 0.2),
                weight: isSelected ? 4 : 2,
                dashArray: isSelected ? null : '4 4'
            }).addTo(group)
            poly.on('click', (e) => {
                // En mode dessin de zone, on ignore les clics sur les polygones existants
                // pour que le clic atterrisse sur la map et ajoute un point.
                if (tool === 'drawZone' || tool === 'addMarker') return
                L.DomEvent.stopPropagation(e)
                setSelectedZoneId(zone.id)
                setSelectedMarkerId(null)
            })

            if (isSelected) {
                // Sommets (drag, suppression)
                zone.coords.forEach((pt, idx) => {
                    const vertex = L.circleMarker([pt[1], pt[0]], {
                        radius: 6, color: '#ffffff', fillColor: '#ff6d00', fillOpacity: 1, weight: 2
                    }).addTo(group)
                    let dragging = false
                    let solo = false
                    vertex.on('mousedown', (e) => {
                        L.DomEvent.stopPropagation(e)
                        dragging = true
                        solo = e.originalEvent.ctrlKey || e.originalEvent.metaKey
                        map.dragging.disable()
                        const onMove = (ev) => {
                            if (!dragging) return
                            const ll = ev.latlng
                            const snap = computeSnap(ll.lng, ll.lat, solo ? zone.id : null)
                            const nx = snap ? snap.x : ll.lng
                            const ny = snap ? snap.y : ll.lat
                            vertex.setLatLng([ny, nx])
                        }
                        const onUp = (ev) => {
                            if (!dragging) return
                            dragging = false
                            map.dragging.enable()
                            map.off('mousemove', onMove)
                            map.off('mouseup', onUp)
                            const ll = vertex.getLatLng()
                            const snap = computeSnap(ll.lng, ll.lat, solo ? zone.id : null)
                            const nx = snap ? snap.x : ll.lng
                            const ny = snap ? snap.y : ll.lat
                            moveVertex(zone.id, idx, nx, ny, solo)
                        }
                        map.on('mousemove', onMove)
                        map.on('mouseup', onUp)
                    })
                    vertex.on('contextmenu', (e) => {
                        L.DomEvent.stopPropagation(e); L.DomEvent.preventDefault(e)
                        removeVertex(zone.id, idx)
                    })
                })

                // Points milieu d'arête (cliquer pour insérer)
                for (let i = 0; i < zone.coords.length; i++) {
                    const a = zone.coords[i]
                    const b = zone.coords[(i + 1) % zone.coords.length]
                    const mx = (a[0] + b[0]) / 2
                    const my = (a[1] + b[1]) / 2
                    const mid = L.circleMarker([my, mx], {
                        radius: 4, color: '#ffffff', fillColor: '#10b981', fillOpacity: 0.7, weight: 1
                    }).addTo(group)
                    mid.on('click', (e) => {
                        L.DomEvent.stopPropagation(e)
                        insertVertex(zone.id, i, mx, my)
                    })
                }
            }
        }

        // ---- Markers éditables ----
        for (const marker of state.markers) {
            const isSelected = marker.id === selectedMarkerId
            const catDef = (mapConfig?.categories || []).find(c => c.id === marker.category) || {}
            const iconUrl = resolveAsset(catDef.icon)
            const bgColor = catDef.backgroundColor || 'transparent'
            const iconColor = catDef.iconColor || catDef.color || '#ffffff'
            const ringColor = isSelected ? '#facc15' : 'rgba(255,255,255,0.6)'
            const ringWidth = isSelected ? 3 : 1
            const iconHtml = iconUrl
                ? renderToString(<GameIcon src={iconUrl} color={iconColor} className="w-full h-full object-contain" />)
                : '<div class="w-full h-full rounded-full bg-blue-500"></div>'
            const divIcon = L.divIcon({
                html: `<div style="background-color:${bgColor};outline:${ringWidth}px solid ${ringColor};outline-offset:1px;box-shadow:0 0 8px rgba(0,0,0,0.6)" class="w-8 h-8 rounded-full flex items-center justify-center p-1 cursor-move">${iconHtml}</div>`,
                className: 'bg-transparent border-0',
                iconSize: [32, 32], iconAnchor: [16, 16]
            })
            const m = L.marker([marker.coords[1], marker.coords[0]], { icon: divIcon, interactive: true }).addTo(group)
            m.bindTooltip(marker.label || marker.id, { direction: 'top', offset: [0, -16] })

            let dragging = false
            let moved = false
            let startPx = null
            m.on('mousedown', (e) => {
                L.DomEvent.stopPropagation(e)
                L.DomEvent.preventDefault(e)
                dragging = true
                moved = false
                startPx = e.containerPoint
                map.dragging.disable()
                const onMove = (ev) => {
                    if (!dragging) return
                    if (!moved && startPx) {
                        const dx = ev.containerPoint.x - startPx.x
                        const dy = ev.containerPoint.y - startPx.y
                        if (Math.hypot(dx, dy) > 3) moved = true
                    }
                    if (moved) m.setLatLng(ev.latlng)
                }
                const onUp = () => {
                    if (!dragging) return
                    dragging = false
                    map.dragging.enable()
                    map.off('mousemove', onMove)
                    map.off('mouseup', onUp)
                    if (moved) {
                        const ll = m.getLatLng()
                        updateMarker(marker.id, { coords: [Math.round(ll.lng), Math.round(ll.lat)] })
                    } else {
                        // clic simple = ouvrir la modale d'édition
                        setSelectedMarkerId(marker.id)
                        setSelectedZoneId(null)
                        setEditingMarkerData(marker)
                    }
                }
                map.on('mousemove', onMove)
                map.on('mouseup', onUp)
            })
            m.on('click', (e) => {
                L.DomEvent.stopPropagation(e)
            })
        }

        // ---- Tracé en cours (drawZone) ----
        if (drawingCoords.length > 0) {
            const positions = drawingCoords.map(c => [c[1], c[0]])
            if (drawingCoords.length >= 2) {
                L.polyline(positions, { color: '#10b981', weight: 2, dashArray: '6 4' }).addTo(group)
            }
            drawingCoords.forEach((pt, idx) => {
                const isFirst = idx === 0
                const canClose = isFirst && drawingCoords.length >= 3
                const cm = L.circleMarker([pt[1], pt[0]], {
                    radius: canClose ? 8 : 5,
                    color: '#ffffff',
                    fillColor: canClose ? '#facc15' : '#10b981',
                    fillOpacity: 1,
                    weight: canClose ? 2 : 1,
                    interactive: canClose
                }).addTo(group)
                if (canClose) {
                    cm.on('click', (e) => {
                        L.DomEvent.stopPropagation(e)
                        const newZone = {
                            id: genId('zone'),
                            label: 'Nouvelle zone',
                            description: '',
                            coords: drawingCoords,
                            borderColor: '#ff6d00',
                            fillColor: '#ff6d00',
                            fillOpacity: 0.2
                        }
                        commit(s => ({ ...s, zones: [...s.zones, newZone] }))
                        setDrawingCoords([])
                        setPreviewPoint(null)
                        setSelectedZoneId(newZone.id)
                        setTool('select')
                    })
                    cm.bindTooltip('Cliquer pour fermer la zone', { direction: 'top' })
                }
            })
        }

        // ---- Aperçu du prochain point (drawZone) ----
        if (tool === 'drawZone' && previewPoint) {
            const [px, py] = previewPoint
            // segment fantôme entre dernier point et l'aperçu
            if (drawingCoords.length > 0) {
                const last = drawingCoords[drawingCoords.length - 1]
                L.polyline([[last[1], last[0]], [py, px]], {
                    color: '#facc15', weight: 1, dashArray: '4 4', opacity: 0.8, interactive: false
                }).addTo(group)
                // segment vers le premier point pour visualiser la fermeture (≥2 pts existants)
                if (drawingCoords.length >= 2) {
                    const first = drawingCoords[0]
                    L.polyline([[py, px], [first[1], first[0]]], {
                        color: '#facc15', weight: 1, dashArray: '2 4', opacity: 0.4, interactive: false
                    }).addTo(group)
                }
            }
            L.circleMarker([py, px], {
                radius: 5, color: '#facc15', fillColor: '#fde68a', fillOpacity: 0.7, weight: 2, interactive: false
            }).addTo(group)
        }
    }, [map, state, selectedZoneId, selectedMarkerId, drawingCoords, previewPoint, tool, computeSnap, moveVertex, mapConfig])

    // -----------------------------------------------------------------------
    // Synchroniser editingMarkerData avec l'état (si modifié ailleurs / undo)
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!editingMarkerData) return
        const fresh = state.markers.find(m => m.id === editingMarkerData.id)
        if (!fresh) setEditingMarkerData(null)
        else if (fresh !== editingMarkerData) setEditingMarkerData(fresh)
    }, [state.markers]) // eslint-disable-line react-hooks/exhaustive-deps

    // -----------------------------------------------------------------------
    // Export JSONC
    // -----------------------------------------------------------------------
    const exportJSON = () => {
        const editedZones = state.zones.map(z => ({
            ...z,
            coords: z.coords.map(c => [Math.round(c[0]), Math.round(c[1])])
        }))
        const editedMarkers = state.markers.map(m => ({
            ...m,
            coords: [Math.round(m.coords[0]), Math.round(m.coords[1])]
        }))

        // Reconstruit le tableau complet de cartes en remplaçant zones/markers de la carte courante
        const updateMap = (m) => {
            if (m.id === mapConfig?.id) {
                return { ...m, zones: editedZones, markers: editedMarkers }
            }
            if (Array.isArray(m.subMaps)) {
                return { ...m, subMaps: m.subMaps.map(updateMap) }
            }
            return m
        }
        const fullMaps = Array.isArray(allMaps) ? allMaps.map(updateMap) : [{ ...(mapConfig || {}), zones: editedZones, markers: editedMarkers }]

        const text = stringifyMaps(fullMaps)
        navigator.clipboard?.writeText(text).catch(() => {})
        // eslint-disable-next-line no-console
        console.log('[MapEditor] export JSONC:\n', text)
        alert('Export copié dans le presse-papier (et console).')
    }

    // -----------------------------------------------------------------------
    // UI overlay (panneau outils + formulaires)
    // -----------------------------------------------------------------------
    const selectedZone = state.zones.find(z => z.id === selectedZoneId)
    const categories = mapConfig?.categories || []

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[3000] pointer-events-none">
            <div className="pointer-events-auto bg-tactical-panel/95 border border-shd/60 rounded-lg shadow-2xl backdrop-blur-md text-gray-200 font-mono text-xs uppercase tracking-widest">
                {/* Barre d'outils */}
                <div className="flex items-center gap-1 p-2 border-b border-tactical-border">
                    <span className="px-2 text-shd font-bold">[DEV] EDITOR</span>
                    <button onClick={() => { setTool('select'); setDrawingCoords([]) }}
                            className={`px-2 py-1 rounded border ${tool === 'select' ? 'bg-shd/30 border-shd text-shd' : 'border-tactical-border hover:border-shd/50'}`}>Sélection</button>
                    <button onClick={() => { setTool('drawZone'); setSelectedZoneId(null); setSelectedMarkerId(null) }}
                            className={`px-2 py-1 rounded border ${tool === 'drawZone' ? 'bg-shd/30 border-shd text-shd' : 'border-tactical-border hover:border-shd/50'}`}>+ Zone</button>
                    <button onClick={() => { setTool('addMarker'); setSelectedZoneId(null); setSelectedMarkerId(null) }}
                            className={`px-2 py-1 rounded border ${tool === 'addMarker' ? 'bg-shd/30 border-shd text-shd' : 'border-tactical-border hover:border-shd/50'}`}>+ Marqueur</button>
                    <span className="w-px h-5 bg-tactical-border mx-1" />
                    <button onClick={undo} title="Ctrl+Z" className="px-2 py-1 rounded border border-tactical-border hover:border-shd/50">↶ Undo</button>
                    <button onClick={redo} title="Ctrl+Y" className="px-2 py-1 rounded border border-tactical-border hover:border-shd/50">↷ Redo</button>
                    <span className="w-px h-5 bg-tactical-border mx-1" />
                    <button onClick={exportJSON} className="px-2 py-1 rounded border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/20">Export</button>
                    <button onClick={() => reset(initial)} className="px-2 py-1 rounded border border-red-500/50 text-red-300 hover:bg-red-500/20">Reset</button>
                    <button onClick={onClose} className="px-2 py-1 rounded border border-tactical-border hover:border-red-500/60 ml-2">✕ Fermer</button>
                </div>
                <div className="px-3 py-1.5 text-[10px] text-gray-400 normal-case">
                    {tool === 'drawZone' && <>Clic pour ajouter un point · Double-clic pour terminer (≥3 pts) · Échap pour annuler · Ctrl pour désactiver le snap</>}
                    {tool === 'addMarker' && <>Clic sur la carte pour placer un nouveau marqueur</>}
                    {tool === 'select' && <>Sélectionne une zone/marqueur · Clic milieu d'arête pour ajouter un point · Clic-droit sur sommet pour le supprimer · Drag = déplacer (Ctrl = solo)</>}
                </div>
            </div>

            {/* Panneau zone sélectionnée */}
            {selectedZone && (
                <div className="pointer-events-auto mt-2 bg-tactical-panel/95 border border-tactical-border rounded-lg shadow-2xl backdrop-blur-md p-3 w-[360px] text-xs text-gray-200 font-sans">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-bold uppercase tracking-widest text-shd">Zone</span>
                        <button onClick={() => deleteZone(selectedZone.id)} className="text-red-400 hover:text-red-300 text-[10px] uppercase">Supprimer</button>
                    </div>
                    <ZoneFields zone={selectedZone} categories={categories} onChange={(patch) => updateZone(selectedZone.id, z => ({ ...z, ...patch }))} />
                </div>
            )}

            {/* Modal d'édition du marqueur (porté dans body pour éviter les soucis de stacking/transform/pointer-events) */}
            {editingMarkerData && createPortal(
                <MarkerEditModal
                    marker={editingMarkerData}
                    categories={categories}
                    onChange={(patch) => updateMarker(editingMarkerData.id, patch)}
                    onDelete={() => deleteMarker(editingMarkerData.id)}
                    onClose={() => setEditingMarkerData(null)}
                />,
                document.body
            )}
        </div>
    )
}

function MarkerEditModal({ marker, categories, onChange, onDelete, onClose }) {
    const panelRef = useRef(null)
    useEffect(() => {
        const el = panelRef.current
        if (!el) return
        // Empêche Leaflet d'intercepter les clics/drag/scroll sur la modale
        L.DomEvent.disableClickPropagation(el)
        L.DomEvent.disableScrollPropagation(el)
    }, [])
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])
    return (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div ref={panelRef} className="relative bg-tactical-panel/98 border border-shd/60 rounded-lg shadow-2xl backdrop-blur-md p-4 w-[440px] max-h-[90vh] overflow-y-auto text-xs text-gray-200 font-sans">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-tactical-border">
                    <span className="font-bold uppercase tracking-widest text-shd">Édition du marqueur</span>
                    <div className="flex items-center gap-2">
                        <button onClick={onDelete} className="text-red-400 hover:text-red-300 text-[10px] uppercase border border-red-500/50 rounded px-2 py-1">Supprimer</button>
                        <button onClick={onClose} className="text-gray-300 hover:text-white text-[10px] uppercase border border-tactical-border rounded px-2 py-1">Fermer</button>
                    </div>
                </div>
                <MarkerFields marker={marker} categories={categories} onChange={onChange} />
                <div className="mt-3 pt-2 border-t border-tactical-border text-[10px] text-gray-500">
                    Astuce : Échap pour fermer · les modifications sont enregistrées en direct (undo/redo dispo).
                </div>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Sous-composants formulaire
// ---------------------------------------------------------------------------
function Field({ label, children }) {
    return (
        <label className="block mb-2">
            <span className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">{label}</span>
            {children}
        </label>
    )
}

const inputCls = "w-full bg-tactical-bg/80 border border-tactical-border rounded px-2 py-1 text-xs text-gray-200 focus:border-shd outline-none"

function ZoneFields({ zone, categories, onChange }) {
    return (
        <>
            <Field label="ID"><input className={inputCls} value={zone.id} onChange={e => onChange({ id: e.target.value })} /></Field>
            <Field label="Label"><input className={inputCls} value={zone.label || ''} onChange={e => onChange({ label: e.target.value })} /></Field>
            <Field label="Catégorie">
                <select className={inputCls} value={zone.category || ''} onChange={e => onChange({ category: e.target.value || undefined })}>
                    <option value="">— aucune —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </Field>
            <Field label="Description"><textarea rows={2} className={inputCls} value={zone.description || ''} onChange={e => onChange({ description: e.target.value })} /></Field>
            <div className="grid grid-cols-3 gap-2">
                <Field label="Border"><input type="color" className={inputCls + ' h-7 p-0'} value={zone.borderColor || '#ff6d00'} onChange={e => onChange({ borderColor: e.target.value })} /></Field>
                <Field label="Fill"><input type="color" className={inputCls + ' h-7 p-0'} value={zone.fillColor || '#ff6d00'} onChange={e => onChange({ fillColor: e.target.value })} /></Field>
                <Field label="Opacité"><input type="number" min={0} max={1} step={0.05} className={inputCls} value={zone.fillOpacity ?? 0.2} onChange={e => onChange({ fillOpacity: Number(e.target.value) })} /></Field>
            </div>
            <div className="text-[10px] text-gray-500 mt-1">Points: {zone.coords.length}</div>
        </>
    )
}

function MarkerFields({ marker, categories, onChange }) {
    const catDef = categories.find(c => c.id === marker.category) || {}
    const iconUrl = resolveAsset(catDef.icon)
    return (
        <>
            <Field label="ID"><input className={inputCls} value={marker.id} onChange={e => onChange({ id: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-2">
                <Field label="X"><input type="number" className={inputCls} value={marker.coords[0]} onChange={e => onChange({ coords: [Number(e.target.value), marker.coords[1]] })} /></Field>
                <Field label="Y"><input type="number" className={inputCls} value={marker.coords[1]} onChange={e => onChange({ coords: [marker.coords[0], Number(e.target.value)] })} /></Field>
            </div>
            <Field label="Catégorie / Icône">
                <div className="flex items-center gap-2">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center p-1 shrink-0 border border-tactical-border"
                        style={{ backgroundColor: catDef.backgroundColor || 'transparent' }}
                        title={catDef.name || ''}
                    >
                        {iconUrl && <GameIcon src={iconUrl} color={catDef.iconColor || catDef.color || '#ffffff'} className="w-full h-full object-contain" />}
                    </div>
                    <select className={inputCls} value={marker.category || ''} onChange={e => onChange({ category: e.target.value })}>
                        <option value="">— choisir —</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}{c.group ? ` (${c.group})` : ''}</option>)}
                    </select>
                </div>
                <div className="text-[10px] text-gray-500 mt-1">L'icône est portée par la catégorie (schéma maps.jsonc).</div>
            </Field>
            <Field label="Label"><input className={inputCls} value={marker.label || ''} onChange={e => onChange({ label: e.target.value })} /></Field>
            <Field label="Description (tooltip)"><textarea rows={2} className={inputCls} value={marker.description || ''} onChange={e => onChange({ description: e.target.value })} /></Field>
            <Field label="Description étendue (modal)"><textarea rows={3} className={inputCls} value={marker.extendedDescription || ''} onChange={e => onChange({ extendedDescription: e.target.value || undefined })} /></Field>
            <Field label="Image (URL ou nom de fichier dans /img)"><input className={inputCls} value={marker.image || ''} onChange={e => onChange({ image: e.target.value || undefined })} /></Field>
        </>
    )
}
