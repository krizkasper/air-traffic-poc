// OpenSky /states/all response row: https://openskynetwork.github.io/opensky-api/rest.html#response
export type OpenSkyState = [
  icao24: string,
  callsign: string | null,
  originCountry: string,
  timePosition: number | null,
  lastContact: number,
  longitude: number | null,
  latitude: number | null,
  baroAltitude: number | null,
  onGround: boolean,
  velocity: number | null,
  trueTrack: number | null,
  verticalRate: number | null,
  sensors: number[] | null,
  geoAltitude: number | null,
  squawk: string | null,
  spi: boolean,
  positionSource: number,
  category: number,
]

export type OpenSkyStatesResponse = {
  time: number
  states: OpenSkyState[] | null
}
