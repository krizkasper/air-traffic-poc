import { MercatorCoordinate, type CustomLayerInterface, type Map } from 'maplibre-gl'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { MutableRefObject } from 'react'

const MODEL_ALTITUDE = 0

// Deliberately not to scale: meterInMercatorCoordinateUnits() alone gives the
// model its real-world size, which is imperceptible at the country/continent
// zoom levels (5-8) where users hover over aircraft. This factor blows it up
// into a visual highlight, not a geographically accurate object.
const EXAGGERATION_FACTOR = 3000

// The mercator Y-flip (see the `.scale(scale, -scale, scale)` below) is applied
// after the heading rotation, and flipping one axis inverts the handedness of a
// rotation around the perpendicular (Z) axis. So the heading angle must be
// negated here to compensate, or the model spins opposite to the real turn.
// This offset is the model's own default "nose" direction once stood up by
// rotationX below - aircraft3d.glb's may not be 0; nudge in 90° steps (Math.PI / 2)
// while comparing against a plane's actual heading if the model still points wrong.
const MODEL_HEADING_OFFSET = 0

export type AircraftPosition = { lng: number; lat: number; heading: number }

export function createAircraft3DLayer(
  modelUrl: string,
  positionRef: MutableRefObject<AircraftPosition | null>
): CustomLayerInterface {
  let map: Map
  let camera: THREE.Camera
  let scene: THREE.Scene
  let renderer: THREE.WebGLRenderer

  return {
    id: '3d-model-test',
    type: 'custom',
    renderingMode: '3d',

    onAdd(mapInstance, gl) {
      map = mapInstance
      camera = new THREE.Camera()
      scene = new THREE.Scene()

      const directionalLight = new THREE.DirectionalLight(0xffffff)
      directionalLight.position.set(0, -70, 100).normalize()
      scene.add(directionalLight)

      const directionalLight2 = new THREE.DirectionalLight(0xffffff)
      directionalLight2.position.set(0, 70, 100).normalize()
      scene.add(directionalLight2)

      const loader = new GLTFLoader()
      loader.load(modelUrl, (gltf) => {
        scene.add(gltf.scene)
      })

      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      })

      renderer.autoClear = false
    },

    render(_gl, args) {
      if (!positionRef.current) return

      const { lng, lat, heading } = positionRef.current
      const modelAsMercatorCoordinate = MercatorCoordinate.fromLngLat([lng, lat], MODEL_ALTITUDE)
      const scale = modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * EXAGGERATION_FACTOR

      const rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2)
      // OpenSky's heading (trueTrack) is in degrees, same as the 2D icon-rotate
      // layer expects - but Three.js rotations need radians.
      const headingRad = THREE.MathUtils.degToRad(heading)
      const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        -headingRad + MODEL_HEADING_OFFSET
      )

      const m = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix)
      const l = new THREE.Matrix4()
        .makeTranslation(modelAsMercatorCoordinate.x, modelAsMercatorCoordinate.y, modelAsMercatorCoordinate.z)
        .scale(new THREE.Vector3(scale, -scale, scale))
        .multiply(rotationZ)
        .multiply(rotationX)

      camera.projectionMatrix = m.multiply(l)
      renderer.resetState()
      renderer.render(scene, camera)
      map.triggerRepaint()
    },
  }
}
