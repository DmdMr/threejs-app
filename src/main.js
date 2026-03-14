import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const canvas = document.querySelector('#bg')
const hud = document.createElement('div')
hud.className = 'hud'
hud.innerHTML = `
  <h1>Cube Rain</h1>
  <p>Drag to rotate camera • Scroll to zoom</p>
  <ul>
    <li>Cubes fall continuously from the sky.</li>
    <li>They stack into piles on a grid.</li>
    <li>OrbitControls lets you rotate around the scene.</li>
  </ul>
`
document.body.appendChild(hud)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x090f1f)
scene.fog = new THREE.Fog(0x090f1f, 25, 85)

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  250
)
camera.position.set(16, 14, 16)

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(0, 3, 0)
controls.autoRotate = true
controls.autoRotateSpeed = 0.55

scene.add(new THREE.AmbientLight(0x9db5ff, 0.32))

const sun = new THREE.DirectionalLight(0xffffff, 1.25)
sun.position.set(10, 25, 7)
sun.castShadow = true
sun.shadow.mapSize.set(1024, 1024)
sun.shadow.camera.near = 1
sun.shadow.camera.far = 80
sun.shadow.camera.left = -24
sun.shadow.camera.right = 24
sun.shadow.camera.top = 24
sun.shadow.camera.bottom = -24
scene.add(sun)

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(70, 70),
  new THREE.MeshStandardMaterial({
    color: 0x141c31,
    roughness: 0.98,
    metalness: 0.04,
  })
)
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

const grid = new THREE.GridHelper(42, 42, 0x46537c, 0x303b5f)
grid.position.y = 0.001
scene.add(grid)

const cubeSize = 1
const halfCube = cubeSize / 2
const gravity = 34
const spawnY = 30
const maxFalling = 70
const maxSettled = 700
const worldRadius = 10
const spawnEvery = 0.06

const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)
const cubeMaterial = new THREE.MeshStandardMaterial({
  color: 0x76a8ff,
  roughness: 0.34,
  metalness: 0.2,
})

const settledCubes = []
const fallingCubes = []
const columnHeights = new Map()

function gridKey(gx, gz) {
  return `${gx},${gz}`
}

function worldFromGrid(gx, gz) {
  return new THREE.Vector3(gx * cubeSize, 0, gz * cubeSize)
}

function spawnCube() {
  if (fallingCubes.length >= maxFalling) return

  const gx = THREE.MathUtils.randInt(-worldRadius, worldRadius)
  const gz = THREE.MathUtils.randInt(-worldRadius, worldRadius)
  const position = worldFromGrid(gx, gz)

  const mesh = new THREE.Mesh(cubeGeometry, cubeMaterial.clone())
  mesh.material.color.setHSL(0.55 + Math.random() * 0.13, 0.78, 0.62)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.position.set(position.x, spawnY + Math.random() * 6, position.z)

  scene.add(mesh)

  fallingCubes.push({
    mesh,
    gx,
    gz,
    vy: 0,
    spinX: THREE.MathUtils.randFloatSpread(0.03),
    spinY: THREE.MathUtils.randFloatSpread(0.03),
  })
}

function settleCube(cube) {
  const key = gridKey(cube.gx, cube.gz)
  const currentHeight = columnHeights.get(key) ?? 0
  const targetY = currentHeight + halfCube

  cube.mesh.position.y = targetY
  cube.mesh.rotation.x = 0
  cube.mesh.rotation.z = 0

  columnHeights.set(key, currentHeight + cubeSize)
  settledCubes.push(cube.mesh)

  if (settledCubes.length > maxSettled) {
    const oldest = settledCubes.shift()
    if (oldest) {
      scene.remove(oldest)
      oldest.material.dispose()
    }
  }
}

let spawnTimer = 0
const clock = new THREE.Clock()

function updateRain(delta) {
  spawnTimer += delta
  while (spawnTimer >= spawnEvery) {
    spawnCube()
    spawnTimer -= spawnEvery
  }

  for (let i = fallingCubes.length - 1; i >= 0; i -= 1) {
    const cube = fallingCubes[i]
    cube.vy -= gravity * delta
    cube.mesh.position.y += cube.vy * delta
    cube.mesh.rotation.x += cube.spinX
    cube.mesh.rotation.y += cube.spinY

    const key = gridKey(cube.gx, cube.gz)
    const currentHeight = columnHeights.get(key) ?? 0
    const collisionY = currentHeight + halfCube

    if (cube.mesh.position.y <= collisionY) {
      settleCube(cube)
      fallingCubes.splice(i, 1)
    }
  }
}

function animate() {
  requestAnimationFrame(animate)

  const delta = Math.min(clock.getDelta(), 0.033)
  updateRain(delta)
  controls.update()
  renderer.render(scene, camera)
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

for (let i = 0; i < 18; i += 1) {
  spawnCube()
}

animate()
