import { useState } from 'react'
import type { Map } from 'maplibre-gl'

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
    <button
      className="px-4 py-2 bg-blue-950/40 text-white text-sm font-medium backdrop-blur-md border border-white/20 rounded shadow-lg hover:bg-blue-950/60 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </button>
  )
}
