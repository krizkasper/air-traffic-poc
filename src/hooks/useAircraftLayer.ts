import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Popup } from 'maplibre-gl'
import type { Map, GeoJSONSource } from 'maplibre-gl'
import type { Point } from 'geojson'
import type { OpenSkyState, OpenSkyStatesResponse } from '../types'
import planeIconUrl from '../lib/plane.svg?url'
import helicopterIconUrl from '../lib/helicopter.svg?url'

const OPENSKY_URL = '/opensky/states/all?lamin=34&lomin=-25&lamax=72&lomax=45&extended=1'
const SOURCE_ID = 'aircraft'
const LAYER_ID = 'aircraft-layer'

type AircraftProperties = {
  heading: number
  callsign: string
  country: string
  altitude: number
  velocity: number
  onGround: boolean
  category: number
}

function popupHtml({ callsign, country, altitude, velocity, onGround }: AircraftProperties): string {
  const speedKmh = (velocity * 3.6).toFixed(0)
  const details = onGround
    ? `<p class="mt-2 text-sm font-medium">On ground</p>`
    : `<div class="mt-2 text-sm space-y-1">
        <p>Altitude: <span class="font-medium">${altitude} m</span></p>
        <p>Speed: <span class="font-medium">${speedKmh} km/h</span></p>
      </div>`
  return `<p class="font-semibold text-base">${callsign}</p>
    <p class="text-sm text-white/70">${country}</p>
    ${details}`
}

// Rasterizes the image's silhouette (drawn at each offset, e.g. to dilate it
// into an outline) and recolors it via source-in compositing, so the on-disk
// SVG's own fill color doesn't matter.
function rasterizeSilhouette(
  image: HTMLImageElement,
  size: number,
  color: string,
  offsets: [number, number][] = [[0, 0]],
  padding = 0
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const drawSize = size - padding * 2

  for (const [dx, dy] of offsets) {
    ctx.drawImage(image, padding + dx, padding + dy, drawSize, drawSize)
  }

  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, size, size)

  return canvas
}

// map.loadImage() only decodes PNG/JPEG, so SVGs are rasterized to a canvas
// ourselves via <img>.decode(), which every evergreen browser supports for SVG.
async function loadIcon(map: Map, id: string, url: string, color: string, size = 32): Promise<void> {
  const image = new Image()
  image.src = url
  await image.decode()

  // Black outline: the silhouette drawn in a ring of offsets to dilate it
  // slightly, then the true-colored silhouette drawn on top at full size.
  // The base icon is inset by `padding` first, so the dilated outline has
  // room to grow without being clipped by the canvas edge.
  const outlineWidth = 1.5
  const padding = Math.ceil(outlineWidth)
  const outlineSteps = 12
  const outlineOffsets: [number, number][] = Array.from({ length: outlineSteps }, (_, i) => {
    const angle = (i / outlineSteps) * Math.PI * 2
    return [Math.cos(angle) * outlineWidth, Math.sin(angle) * outlineWidth]
  })

  const outline = rasterizeSilhouette(image, size, 'black', outlineOffsets, padding)
  const fill = rasterizeSilhouette(image, size, color, [[0, 0]], padding)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(outline, 0, 0)
  ctx.drawImage(fill, 0, 0)

  map.addImage(id, ctx.getImageData(0, 0, size, size))
}

async function fetchAircraft(
  map: Map,
  setAircraftCount: Dispatch<SetStateAction<number>>,
  setLastUpdated: Dispatch<SetStateAction<Date | null>>,
  popup: Popup,
  hoveredCallsignRef: { current: string | null }
) {
  const response = await fetch(OPENSKY_URL)
  if (!response.ok) {
    console.error(`OpenSky request failed: ${response.status} ${response.statusText}`)
    return
  }
  const data: OpenSkyStatesResponse = await response.json()

  const features = (data.states ?? [])
    .filter((state: OpenSkyState) => state[5] !== null && state[6] !== null)
    .map((state: OpenSkyState) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [state[5], state[6]] as [number, number],
      },
      properties: {
        heading: state[10] ?? 0,
        callsign: state[1]?.trim() || 'Unknown',
        country: state[2],
        altitude: state[7] ?? 0,
        velocity: state[9] ?? 0,
        onGround: state[8],
        category: state[17] ?? 0,
      },
    }))

  const source = map.getSource(SOURCE_ID) as GeoJSONSource
  source.setData({ type: 'FeatureCollection', features })

  setAircraftCount(features.length)
  setLastUpdated(new Date())

  if (hoveredCallsignRef.current) {
    const hovered = features.find((f) => f.properties.callsign === hoveredCallsignRef.current)
    if (hovered) {
      popup.setLngLat(hovered.geometry.coordinates).setHTML(popupHtml(hovered.properties))
    } else {
      popup.remove()
      hoveredCallsignRef.current = null
    }
  }
}

export function useAircraftLayer(map: Map | null) {
  const [aircraftCount, setAircraftCount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (!map) return

    let intervalId: number | undefined

    const handleLoad = async () => {
      await loadIcon(map, 'plane-icon', planeIconUrl, '#facc15')
      await loadIcon(map, 'helicopter-icon', helicopterIconUrl, '#facc15')

      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.addLayer({
        id: LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        layout: {
          'icon-image': ['match', ['get', 'category'], 8, 'helicopter-icon', 'plane-icon'],
          'icon-size': ['match', ['get', 'category'], 6, 1.3, 5, 1.2, 4, 1.1, 2, 0.6, 3, 0.7, 0.8],
          'icon-rotate': ['get', 'heading'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
        },
        paint: {
          'icon-opacity': ['case', ['get', 'onGround'], 0.4, 1],
        },
      })

      const popup = new Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'aircraft-popup',
      })
      const hoveredCallsignRef: { current: string | null } = { current: null }

      map.on('mouseenter', LAYER_ID, (e) => {
        map.getCanvas().style.cursor = 'pointer'

        const feature = e.features?.[0]
        if (!feature) return

        const coordinates = (feature.geometry as Point).coordinates.slice() as [number, number]
        const properties = feature.properties as AircraftProperties

        hoveredCallsignRef.current = properties.callsign
        popup.setLngLat(coordinates).setHTML(popupHtml(properties)).addTo(map)
      })

      map.on('mouseleave', LAYER_ID, () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
        hoveredCallsignRef.current = null
      })

      fetchAircraft(map, setAircraftCount, setLastUpdated, popup, hoveredCallsignRef)
      intervalId = window.setInterval(
        () => fetchAircraft(map, setAircraftCount, setLastUpdated, popup, hoveredCallsignRef),
        12000
      )
    }

    map.on('style.load', handleLoad)
    return () => {
      map.off('style.load', handleLoad)
      window.clearInterval(intervalId)
    }
  }, [map])

  return { aircraftCount, lastUpdated }
}
