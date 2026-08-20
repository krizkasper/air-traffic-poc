import { useState } from 'react'
import type { Map } from 'maplibre-gl'
import globeIconUrl from '../lib/globe.svg?url'

type GlobeToggleProps = {
  map: Map | null
}

export function GlobeToggle({ map }: GlobeToggleProps) {
  const [isGlobe, setIsGlobe] = useState(false)

  const handleClick = () => {
    map?.setProjection({ type: isGlobe ? 'mercator' : 'globe' })
    setIsGlobe(!isGlobe)
  }

  return (
    <div className="group relative">
      <button
        className="p-2 bg-blue-950/40 backdrop-blur-md border border-white/20 rounded shadow-lg hover:bg-blue-950/60 transition-colors cursor-pointer"
        onClick={handleClick}
        aria-label={isGlobe ? 'Switch to flat map' : 'Switch to globe view'}
      >
        <img src={globeIconUrl} alt="" className="w-5 h-5" />
      </button>
      <span className="pointer-events-none absolute left-0 top-full mt-2 whitespace-nowrap rounded border border-white/20 bg-blue-950/80 px-2 py-1 text-xs text-white opacity-0 shadow-lg backdrop-blur-md transition-opacity group-hover:opacity-100">
        {isGlobe ? 'Switch to Flat Map' : 'Switch to Globe View'}
      </span>
    </div>
  )
}
