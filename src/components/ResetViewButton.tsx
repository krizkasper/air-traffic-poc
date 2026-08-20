import { useEffect, useState } from 'react'
import type { Map } from 'maplibre-gl'
import { INITIAL_CENTER, INITIAL_ZOOM } from '../hooks/useMap'

type ResetViewButtonProps = {
  map: Map | null
}

const EPSILON = 1e-4

function isAtInitialView(map: Map): boolean {
  const { lng, lat } = map.getCenter()
  return (
    Math.abs(lng - INITIAL_CENTER[0]) < EPSILON &&
    Math.abs(lat - INITIAL_CENTER[1]) < EPSILON &&
    Math.abs(map.getZoom() - INITIAL_ZOOM) < EPSILON &&
    Math.abs(map.getBearing()) < EPSILON &&
    Math.abs(map.getPitch()) < EPSILON
  )
}

export function ResetViewButton({ map }: ResetViewButtonProps) {
  const [hasMoved, setHasMoved] = useState(false)

  useEffect(() => {
    if (!map) return

    const handleMove = () => setHasMoved(!isAtInitialView(map))

    map.on('move', handleMove)
    return () => {
      map.off('move', handleMove)
    }
  }, [map])

  if (!hasMoved) return null

  const handleClick = () => {
    if (!map) return

    map.flyTo({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      bearing: 0,
      pitch: 0,
      essential: true,
    })
  }

  return (
    <button
      className="px-4 py-2 bg-blue-950/40 text-white text-sm font-medium backdrop-blur-md border border-white/20 rounded shadow-lg hover:bg-blue-950/60 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      Reset View
    </button>
  )
}
