import './style.css'
import * as THREE from 'three'

const canvas = document.querySelector('#bg')

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x111111)

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.z = 5

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Cube
const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
const material = new THREE.MeshStandardMaterial({
  color: 0x4f8cff,
  metalness: 0.3,
  roughness: 0.4,
})
const cube = new THREE.Mesh(geometry, material)
scene.add(cube)

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const pointLight = new THREE.PointLight(0xffffff, 1.5)
pointLight.position.set(3, 3, 5)
scene.add(pointLight)

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Animation loop
function animate() {
  requestAnimationFrame(animate)

  cube.rotation.x += 0.01
  cube.rotation.y += 0.01

  renderer.render(scene, camera)
}

animate()