import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Popup } from 'maplibre-gl'
import type { Map, GeoJSONSource } from 'maplibre-gl'
import type { Point } from 'geojson'
import type { OpenSkyState, OpenSkyStatesResponse } from '../types'
import { createPlaneIcon } from '../lib/planeIcon'

const OPENSKY_URL = '/opensky/states/all?lamin=34&lomin=-25&lamax=72&lomax=45'
const SOURCE_ID = 'aircraft'
const LAYER_ID = 'aircraft-layer'

async function fetchAircraft(
  map: Map,
  setAircraftCount: Dispatch<SetStateAction<number>>,
  setLastUpdated: Dispatch<SetStateAction<Date | null>>
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
      },
    }))

  const source = map.getSource(SOURCE_ID) as GeoJSONSource
  source.setData({ type: 'FeatureCollection', features })

  setAircraftCount(features.length)
  setLastUpdated(new Date())
}

export function useAircraftLayer(map: Map | null) {
  const [aircraftCount, setAircraftCount] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (!map) return

    let intervalId: number | undefined

    const handleLoad = () => {
      map.addImage('plane-icon', createPlaneIcon())

      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.addLayer({
        id: LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        layout: {
          'icon-image': 'plane-icon',
          'icon-size': 0.8,
          'icon-rotate': ['get', 'heading'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
        },
      })

      map.on('click', LAYER_ID, (e) => {
        const feature = e.features?.[0]
        if (!feature) return

        const coordinates = (feature.geometry as Point).coordinates.slice() as [number, number]
        const { callsign, country, altitude, velocity } = feature.properties as {
          callsign: string
          country: string
          altitude: number
          velocity: number
        }
        const speedKmh = (velocity * 3.6).toFixed(0)

        new Popup({ closeButton: true, className: 'aircraft-popup' })
          .setLngLat(coordinates)
          .setHTML(
            `<p class="font-semibold text-base">${callsign}</p>
             <p class="text-sm text-white/70">${country}</p>
             <div class="mt-2 text-sm space-y-1">
               <p>Altitude: <span class="font-medium">${altitude} m</span></p>
               <p>Speed: <span class="font-medium">${speedKmh} km/h</span></p>
             </div>`
          )
          .addTo(map)
      })

      map.on('mouseenter', LAYER_ID, () => {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', LAYER_ID, () => {
        map.getCanvas().style.cursor = ''
      })

      fetchAircraft(map, setAircraftCount, setLastUpdated)
      intervalId = window.setInterval(() => fetchAircraft(map, setAircraftCount, setLastUpdated), 12000)
    }

    map.on('load', handleLoad)
    return () => {
      map.off('load', handleLoad)
      window.clearInterval(intervalId)
    }
  }, [map])

  return { aircraftCount, lastUpdated }
}
