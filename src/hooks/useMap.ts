import { useEffect, useState } from 'react'
import { Map } from 'maplibre-gl'

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
export const INITIAL_CENTER: [number, number] = [19.5, 53.5] // Poland + neighbours, Baltic Sea
export const INITIAL_ZOOM = 5.8

export function useMap(containerId: string) {
  const [map, setMap] = useState<Map | null>(null)

  useEffect(() => {
    const instance = new Map({
      container: containerId,
      style: STYLE_URL,
      center: [21.0, 52.2], // TEMP: testing 3D model visibility
      zoom: 18, // TEMP: testing 3D model visibility
    })
    setMap(instance)

    return () => {
      instance.remove()
      setMap(null)
    }
  }, [containerId])

  return map
}
