import { MercatorCoordinate, type CustomLayerInterface, type Map } from 'maplibre-gl'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const MODEL_ORIGIN: [number, number] = [21.0, 52.2]
const MODEL_ALTITUDE = 0

export function createTest3DLayer(modelUrl: string): CustomLayerInterface {
  const modelAsMercatorCoordinate = MercatorCoordinate.fromLngLat(MODEL_ORIGIN, MODEL_ALTITUDE)

  const modelTransform = {
    translateX: modelAsMercatorCoordinate.x,
    translateY: modelAsMercatorCoordinate.y,
    translateZ: modelAsMercatorCoordinate.z,
    rotateX: Math.PI / 2,
    scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
  }

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
      const rotationX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), modelTransform.rotateX)

      const m = new THREE.Matrix4().fromArray(args.defaultProjectionData.mainMatrix)
      const l = new THREE.Matrix4()
        .makeTranslation(modelTransform.translateX, modelTransform.translateY, modelTransform.translateZ)
        .scale(new THREE.Vector3(modelTransform.scale, -modelTransform.scale, modelTransform.scale))
        .multiply(rotationX)

      camera.projectionMatrix = m.multiply(l)
      renderer.resetState()
      renderer.render(scene, camera)
      map.triggerRepaint()
    },
  }
}
