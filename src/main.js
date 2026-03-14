import './style.css'
import * as THREE from 'three'

const canvas = document.querySelector('#bg')
const hud = document.createElement('div')
hud.className = 'hud'
hud.innerHTML = `
  <h1>Three.js Playground</h1>
  <p>Ideas you can build next:</p>
  <ul>
    <li>Swap the cube for a glTF model (character, car, room).</li>
    <li>Add camera controls, postprocessing bloom, and particles.</li>
    <li>Plug in real physics with cannon-es or rapier.</li>
  </ul>
`
document.body.appendChild(hud)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x070b1a)
scene.fog = new THREE.Fog(0x070b1a, 10, 35)

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
)
camera.position.set(0, 4, 12)

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true

const hemi = new THREE.HemisphereLight(0xc2d8ff, 0x2f241b, 0.85)
scene.add(hemi)

const keyLight = new THREE.DirectionalLight(0xffffff, 1.2)
keyLight.position.set(5, 12, 4)
keyLight.castShadow = true
keyLight.shadow.mapSize.set(1024, 1024)
scene.add(keyLight)

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({
    color: 0x141926,
    roughness: 0.95,
    metalness: 0.05,
  })
)
floor.rotation.x = -Math.PI / 2
floor.position.y = -2
floor.receiveShadow = true
scene.add(floor)

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1.8, 1.8, 1.8),
  new THREE.MeshStandardMaterial({
    color: 0x6f86ff,
    emissive: 0x161a3b,
    metalness: 0.45,
    roughness: 0.3,
  })
)
cube.castShadow = true
scene.add(cube)

const orbitGroup = new THREE.Group()
scene.add(orbitGroup)

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.38, 24, 24),
  new THREE.MeshStandardMaterial({ color: 0x8fdbff, emissive: 0x0e283a })
)
moon.position.x = 3
moon.castShadow = true
orbitGroup.add(moon)

const trailGeometry = new THREE.RingGeometry(2.95, 3.05, 64)
const trailMaterial = new THREE.MeshBasicMaterial({
  color: 0x2e4b77,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.55,
})
const orbitTrail = new THREE.Mesh(trailGeometry, trailMaterial)
orbitTrail.rotation.x = Math.PI / 2
scene.add(orbitTrail)

const balls = []
const gravity = -12

for (let i = 0; i < 6; i += 1) {
  const radius = 0.23 + Math.random() * 0.18
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 20, 20),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.55 + Math.random() * 0.25, 0.78, 0.58),
      metalness: 0.15,
      roughness: 0.45,
    })
  )

  ball.castShadow = true
  ball.position.set(
    (Math.random() - 0.5) * 7,
    Math.random() * 5 + 2,
    (Math.random() - 0.5) * 7
  )

  scene.add(ball)
  balls.push({
    mesh: ball,
    radius,
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * 2.7,
      Math.random() * 1.6,
      (Math.random() - 0.5) * 2.7
    ),
  })
}

const bounds = 9
const restitution = 0.72
const friction = 0.985

const clock = new THREE.Clock()

function stepPhysics(delta) {
  for (const body of balls) {
    body.velocity.y += gravity * delta
    body.mesh.position.addScaledVector(body.velocity, delta)

    if (body.mesh.position.y - body.radius <= -2) {
      body.mesh.position.y = -2 + body.radius
      body.velocity.y *= -restitution
      body.velocity.x *= friction
      body.velocity.z *= friction
    }

    if (Math.abs(body.mesh.position.x) + body.radius >= bounds) {
      body.mesh.position.x = Math.sign(body.mesh.position.x) * (bounds - body.radius)
      body.velocity.x *= -restitution
    }

    if (Math.abs(body.mesh.position.z) + body.radius >= bounds) {
      body.mesh.position.z = Math.sign(body.mesh.position.z) * (bounds - body.radius)
      body.velocity.z *= -restitution
    }
  }
}

function animate() {
  requestAnimationFrame(animate)

  const delta = Math.min(clock.getDelta(), 0.033)
  const elapsed = clock.getElapsedTime()

  cube.rotation.x += 0.75 * delta
  cube.rotation.y += 0.95 * delta
  cube.position.y = Math.sin(elapsed * 1.5) * 0.35

  orbitGroup.rotation.y += 0.8 * delta
  moon.position.y = Math.sin(elapsed * 2.2) * 0.55 + 0.5

  camera.position.x = Math.sin(elapsed * 0.23) * 2.1
  camera.lookAt(0, 0.5, 0)

  stepPhysics(delta)
  renderer.render(scene, camera)
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

animate()
