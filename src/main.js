import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const canvas = document.querySelector('#bg')

const hud = document.createElement('div')
hud.className = 'hud'
hud.innerHTML = `
  <h1>Solar System</h1>
  <p>Drag to orbit camera • Scroll to zoom • Right-click to pan</p>
  <ul>
    <li>Sun with emissive glow and point light.</li>
    <li>8 planets with individual orbit speeds.</li>
    <li>Earth moon + Saturn ring + star field.</li>
  </ul>
`
document.body.appendChild(hud)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x02040b)
scene.fog = new THREE.Fog(0x02040b, 120, 320)

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 42, 88)

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.target.set(0, 0, 0)
controls.minDistance = 15
controls.maxDistance = 240

scene.add(new THREE.AmbientLight(0x4a6bb8, 0.14))

const sunLight = new THREE.PointLight(0xfff2cf, 2.2, 420)
sunLight.castShadow = true
sunLight.shadow.mapSize.set(1024, 1024)
scene.add(sunLight)

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(8, 48, 48),
  new THREE.MeshStandardMaterial({
    color: 0xffb347,
    emissive: 0xff9b29,
    emissiveIntensity: 1.6,
    roughness: 0.9,
    metalness: 0.02,
  })
)
sun.castShadow = false
scene.add(sun)

const starGeometry = new THREE.BufferGeometry()
const starCount = 2200
const starPositions = new Float32Array(starCount * 3)
for (let i = 0; i < starCount; i += 1) {
  const radius = THREE.MathUtils.randFloat(160, 520)
  const theta = THREE.MathUtils.randFloat(0, Math.PI * 2)
  const phi = Math.acos(THREE.MathUtils.randFloatSpread(2))
  const x = radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)

  starPositions[i * 3] = x
  starPositions[i * 3 + 1] = y
  starPositions[i * 3 + 2] = z
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))

const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({
    color: 0xb9d3ff,
    size: 0.7,
    sizeAttenuation: true,
  })
)
scene.add(stars)

const orbitMaterial = new THREE.LineBasicMaterial({
  color: 0x2d3f65,
  transparent: true,
  opacity: 0.55,
})

function makeOrbit(radius) {
  const points = []
  for (let i = 0; i <= 96; i += 1) {
    const angle = (i / 96) * Math.PI * 2
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius))
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  return new THREE.LineLoop(geometry, orbitMaterial)
}

const planetSpecs = [
  { name: 'Mercury', size: 1.0, orbit: 12, orbitSpeed: 1.7, rotationSpeed: 0.01, color: 0xb8a88f },
  { name: 'Venus', size: 1.5, orbit: 18, orbitSpeed: 1.2, rotationSpeed: 0.008, color: 0xd2a771 },
  { name: 'Earth', size: 1.6, orbit: 24, orbitSpeed: 1, rotationSpeed: 0.02, color: 0x4e85ff },
  { name: 'Mars', size: 1.2, orbit: 31, orbitSpeed: 0.8, rotationSpeed: 0.018, color: 0xc06745 },
  { name: 'Jupiter', size: 4.2, orbit: 43, orbitSpeed: 0.43, rotationSpeed: 0.03, color: 0xc59d76 },
  { name: 'Saturn', size: 3.6, orbit: 56, orbitSpeed: 0.33, rotationSpeed: 0.024, color: 0xd5c08b },
  { name: 'Uranus', size: 2.6, orbit: 68, orbitSpeed: 0.25, rotationSpeed: 0.02, color: 0x88d2de },
  { name: 'Neptune', size: 2.5, orbit: 80, orbitSpeed: 0.2, rotationSpeed: 0.021, color: 0x5472ff },
]

const planets = []

for (const spec of planetSpecs) {
  const pivot = new THREE.Group()
  scene.add(pivot)

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(spec.size, 32, 32),
    new THREE.MeshStandardMaterial({
      color: spec.color,
      roughness: 0.85,
      metalness: 0.08,
    })
  )
  planet.position.x = spec.orbit
  planet.castShadow = true
  planet.receiveShadow = true
  pivot.add(planet)

  const orbit = makeOrbit(spec.orbit)
  scene.add(orbit)

  planets.push({ pivot, planet, spec })

  if (spec.name === 'Earth') {
    const moonPivot = new THREE.Group()
    planet.add(moonPivot)

    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xb8bfd3, roughness: 0.92, metalness: 0.02 })
    )
    moon.position.x = 3.2
    moon.castShadow = true
    moonPivot.add(moon)

    planets.push({
      pivot: moonPivot,
      planet: moon,
      spec: { orbitSpeed: 4.8, rotationSpeed: 0.015 },
    })
  }

  if (spec.name === 'Saturn') {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(spec.size * 1.35, spec.size * 2.15, 64),
      new THREE.MeshStandardMaterial({
        color: 0xb7a27c,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72,
        roughness: 0.95,
        metalness: 0.04,
      })
    )
    ring.rotation.x = Math.PI / 2.45
    planet.add(ring)
  }
}

const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)

  const delta = Math.min(clock.getDelta(), 0.033)
  const elapsed = clock.getElapsedTime()

  sun.rotation.y += 0.0035
  sunLight.position.copy(sun.position)

  for (const item of planets) {
    item.pivot.rotation.y += item.spec.orbitSpeed * delta * 0.35
    item.planet.rotation.y += item.spec.rotationSpeed
  }

  stars.rotation.y = elapsed * 0.008
  controls.update()
  renderer.render(scene, camera)
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

animate()
