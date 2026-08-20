import { useState } from 'react'
import type { Map } from 'maplibre-gl'
import darkModeIconUrl from '../lib/dark-mode.svg?url'
import lightModeIconUrl from '../lib/light-mode.svg?url'

const LIGHT_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
const DARK_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark'

type DarkModeToggleProps = {
  map: Map | null
}

export function DarkModeToggle({ map }: DarkModeToggleProps) {
  const [isDark, setIsDark] = useState(false)

  const handleClick = () => {
    map?.setStyle(isDark ? LIGHT_STYLE_URL : DARK_STYLE_URL)
    setIsDark(!isDark)
  }

  return (
    <div className="group relative">
      <button
        className="p-2 bg-blue-950/40 backdrop-blur-md border border-white/20 rounded shadow-lg hover:bg-blue-950/60 transition-colors cursor-pointer"
        onClick={handleClick}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <img src={isDark ? lightModeIconUrl : darkModeIconUrl} alt="" className="w-5 h-5" />
      </button>
      <span className="pointer-events-none absolute left-0 top-full mt-2 whitespace-nowrap rounded border border-white/20 bg-blue-950/80 px-2 py-1 text-xs text-white opacity-0 shadow-lg backdrop-blur-md transition-opacity group-hover:opacity-100">
        {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      </span>
    </div>
  )
}
