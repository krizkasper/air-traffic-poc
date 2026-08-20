type HudProps = {
  aircraftCount: number
  lastUpdated: Date | null
}

export function Hud({ aircraftCount, lastUpdated }: HudProps) {
  return (
    <div className="absolute top-6 left-6 bg-blue-950/40 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-white shadow-lg">
      <h1 className="text-sm font-medium text-white/70">Live Air Traffic — Europe</h1>
      <p className="text-4xl font-bold tabular-nums">{aircraftCount}</p>
      <p className="text-sm text-white/60">aircraft currently in flight over Europe</p>
      <p className="mt-2 text-sm text-white/70">
        {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading…'}
      </p>
      <p className="mt-3 text-xs text-white/50">Data: OpenSky Network · Map: MapLibre GL JS</p>
    </div>
  )
}
