import 'maplibre-gl/dist/maplibre-gl.css'
import { useMap } from './hooks/useMap'
import { useAircraftLayer } from './hooks/useAircraftLayer'
import { LocateButton } from './components/LocateButton'

export const App = () => {
  const map = useMap('map')
  const { aircraftCount, lastUpdated } = useAircraftLayer(map)
  console.log('aircraftCount:', aircraftCount, 'lastUpdated:', lastUpdated)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div id="map" style={{ width: '100%', height: '100%' }} />
      <LocateButton map={map} />
    </div>
  )
}

export default App
