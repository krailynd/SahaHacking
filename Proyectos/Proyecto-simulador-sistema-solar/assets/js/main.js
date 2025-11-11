// ======= CONFIGURACIÓN DEL JUEGO =======
let timeScale = 1.0;
let isPaused = false;
let isFollowing = false;
let followTarget = null;

// ESCALA AUMENTADA (3x más grande)
const AU = 120; // Era 40, ahora 120
const SIZE_SCALE = 2.0; // Era 1.5, ahora 2.0

// Sistema de nave espacial
let spaceship = null;
let shipVelocity = new THREE.Vector3();
let isTraveling = false;
let travelTarget = null;
let travelStartPos = new THREE.Vector3();
let travelProgress = 0;
let travelDuration = 5; // segundos base

// Datos de planetas (distancias ajustadas)
const planetsData = [
  {
    name: 'Mercurio',
    distAU: 0.5,
    size: 1.5 * SIZE_SCALE,
    periodDays: 88,
    rotationHours: 1407.6,
    color: 0x8c7853,
    emissive: 0x0,
    inclination: 7.0,
    moons: [],
  },
  {
    name: 'Venus',
    distAU: 0.72,
    size: 3.0 * SIZE_SCALE,
    periodDays: 225,
    rotationHours: 5832.5,
    color: 0xffc649,
    emissive: 0x221100,
    inclination: 3.4,
    moons: [],
  },
  {
    name: 'Tierra',
    distAU: 1.0,
    size: 3.2 * SIZE_SCALE,
    periodDays: 365,
    rotationHours: 24,
    color: 0x6b93d6,
    emissive: 0x001122,
    inclination: 0.0,
    moons: [
      {
        name: 'Luna',
        distAU: 0.15,
        size: 0.9 * SIZE_SCALE,
        periodDays: 27.3,
        rotationHours: 655.7,
        color: 0xc0c0c0,
      },
    ],
  },
  {
    name: 'Marte',
    distAU: 1.52,
    size: 1.7 * SIZE_SCALE,
    periodDays: 687,
    rotationHours: 24.6,
    color: 0xcd5c5c,
    emissive: 0x110000,
    inclination: 1.8,
    moons: [
      {
        name: 'Fobos',
        distAU: 0.025,
        size: 0.25 * SIZE_SCALE,
        periodDays: 0.32,
        rotationHours: 7.6,
        color: 0x8b7355,
      },
      {
        name: 'Deimos',
        distAU: 0.045,
        size: 0.2 * SIZE_SCALE,
        periodDays: 1.26,
        rotationHours: 30.3,
        color: 0x696969,
      },
    ],
  },
  {
    name: 'Júpiter',
    distAU: 5.2,
    size: 8.0 * SIZE_SCALE,
    periodDays: 4332,
    rotationHours: 9.9,
    color: 0xd8ca9d,
    emissive: 0x221100,
    inclination: 1.3,
    moons: [
      {
        name: 'Io',
        distAU: 0.18,
        size: 1.2 * SIZE_SCALE,
        periodDays: 1.77,
        rotationHours: 42.5,
        color: 0xffff99,
      },
      {
        name: 'Europa',
        distAU: 0.3,
        size: 1.0 * SIZE_SCALE,
        periodDays: 3.55,
        rotationHours: 85.2,
        color: 0xb0e0e6,
      },
      {
        name: 'Ganimedes',
        distAU: 0.48,
        size: 1.5 * SIZE_SCALE,
        periodDays: 7.15,
        rotationHours: 171.7,
        color: 0x8fbc8f,
      },
      {
        name: 'Calisto',
        distAU: 0.85,
        size: 1.3 * SIZE_SCALE,
        periodDays: 16.7,
        rotationHours: 400.5,
        color: 0x2f4f4f,
      },
    ],
  },
  {
    name: 'Saturno',
    distAU: 9.58,
    size: 7.0 * SIZE_SCALE,
    periodDays: 10759,
    rotationHours: 10.7,
    color: 0xfad5a5,
    emissive: 0x221100,
    inclination: 2.5,
    hasRings: true,
    moons: [
      {
        name: 'Mimas',
        distAU: 0.12,
        size: 0.4 * SIZE_SCALE,
        periodDays: 0.94,
        rotationHours: 22.6,
        color: 0xc0c0c0,
      },
      {
        name: 'Titán',
        distAU: 0.6,
        size: 1.5 * SIZE_SCALE,
        periodDays: 15.9,
        rotationHours: 382.7,
        color: 0xdeb887,
      },
    ],
  },
  {
    name: 'Urano',
    distAU: 19.2,
    size: 5.5 * SIZE_SCALE,
    periodDays: 30687,
    rotationHours: 17.2,
    color: 0x4fd0e3,
    emissive: 0x001122,
    inclination: 0.8,
    moons: [
      {
        name: 'Miranda',
        distAU: 0.1,
        size: 0.3 * SIZE_SCALE,
        periodDays: 1.41,
        rotationHours: 33.9,
        color: 0xa9a9a9,
      },
      {
        name: 'Ariel',
        distAU: 0.15,
        size: 0.4 * SIZE_SCALE,
        periodDays: 2.52,
        rotationHours: 60.5,
        color: 0xdddddd,
      },
    ],
  },
  {
    name: 'Neptuno',
    distAU: 30.0,
    size: 5.3 * SIZE_SCALE,
    periodDays: 60190,
    rotationHours: 16.1,
    color: 0x4b70dd,
    emissive: 0x000011,
    inclination: 1.8,
    moons: [
      {
        name: 'Tritón',
        distAU: 0.3,
        size: 0.9 * SIZE_SCALE,
        periodDays: 5.88,
        rotationHours: 141.0,
        color: 0xe6e6fa,
      },
    ],
  },
];

// ======= SETUP THREE.JS =======
const container = document.getElementById('canvasWrap');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.00005);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  50000
);
camera.position.set(0, 400, 1200);

// ======= CONTROLES SIMPLIFICADOS =======
let mouseDown = false;
let mouseX = 0,
  mouseY = 0;
let targetRotationX = 0,
  targetRotationY = 0;
let rotationX = 0,
  rotationY = 0;
let cameraDistance = 1200;

renderer.domElement.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    mouseDown = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
  }
});

renderer.domElement.addEventListener('mouseup', () => {
  mouseDown = false;
});

renderer.domElement.addEventListener('mousemove', (e) => {
  if (mouseDown) {
    const deltaX = e.clientX - mouseX;
    const deltaY = e.clientY - mouseY;

    targetRotationY += deltaX * 0.005;
    targetRotationX += deltaY * 0.005;
    targetRotationX = Math.max(
      -Math.PI / 2,
      Math.min(Math.PI / 2, targetRotationX)
    );

    mouseX = e.clientX;
    mouseY = e.clientY;
  }
});

renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  cameraDistance += e.deltaY * 0.5;
  cameraDistance = Math.max(100, Math.min(10000, cameraDistance));
});

// ======= ILUMINACIÓN =======
const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
scene.add(ambientLight);

const sunGeometry = new THREE.SphereGeometry(25, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({
  color: 0xffdd00,
  transparent: false,
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

const sunLight = new THREE.PointLight(0xffffee, 4, 0, 0);
sunLight.position.set(0, 0, 0);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0x404040, 1.2);
fillLight.position.set(200, 200, 200);
scene.add(fillLight);

// ======= ESTRELLAS =======
function createStarField() {
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.5,
    transparent: true,
    opacity: 0.9,
  });

  const starsVertices = [];
  const numStars = 3000;

  for (let i = 0; i < numStars; i++) {
    const radius = 10000 + Math.random() * 30000;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    starsVertices.push(x, y, z);
  }

  starsGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(starsVertices, 3)
  );
  const starField = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starField);
}
createStarField();

// ======= NAVE ESPACIAL =======
function createSpaceship() {
  const shipGroup = new THREE.Group();

  // Cuerpo principal (cono)
  const bodyGeometry = new THREE.ConeGeometry(3, 10, 8);
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ffff,
    emissive: 0x00aaaa,
    emissiveIntensity: 0.5,
    shininess: 100,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.rotation.x = Math.PI;
  shipGroup.add(body);

  // Alas
  const wingGeometry = new THREE.BoxGeometry(12, 0.5, 3);
  const wingMaterial = new THREE.MeshPhongMaterial({
    color: 0x0088aa,
    emissive: 0x004466,
    emissiveIntensity: 0.3,
  });
  const wing = new THREE.Mesh(wingGeometry, wingMaterial);
  wing.position.y = -2;
  shipGroup.add(wing);

  // Motor (luz trasera)
  const engineGlow = new THREE.PointLight(0x00ffff, 2, 20);
  engineGlow.position.set(0, 5, 0);
  shipGroup.add(engineGlow);

  // Estela de partículas
  const trailGeometry = new THREE.BufferGeometry();
  const trailMaterial = new THREE.PointsMaterial({
    color: 0x00ffff,
    size: 2,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
  });
  const trailParticles = new THREE.Points(trailGeometry, trailMaterial);
  shipGroup.add(trailParticles);

  shipGroup.position.set(150, 0, 0);
  scene.add(shipGroup);

  return shipGroup;
}

spaceship = createSpaceship();

// ======= ÓRBITAS =======
function createOrbitLine(radius, inclinationDeg = 0) {
  const points = [];
  const segments = 128;
  const inclinationRad = THREE.MathUtils.degToRad(inclinationDeg);

  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    let x = Math.cos(theta) * radius;
    let y = 0;
    let z = Math.sin(theta) * radius;

    if (inclinationRad !== 0) {
      const newY = y * Math.cos(inclinationRad) - z * Math.sin(inclinationRad);
      const newZ = y * Math.sin(inclinationRad) + z * Math.cos(inclinationRad);
      y = newY;
      z = newZ;
    }

    points.push(new THREE.Vector3(x, y, z));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.2,
  });
  return new THREE.Line(geometry, material);
}

// ======= TEXTURAS =======
function createPlanetTexture(color) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, `#${color.toString(16).padStart(6, '0')}`);
  gradient.addColorStop(
    1,
    `#${Math.floor(color * 0.3)
      .toString(16)
      .padStart(6, '0')}`
  );

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const radius = Math.random() * 6 + 1;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(
      Math.random() * 100
    )}, ${Math.floor(Math.random() * 100)}, 0.15)`;
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

function createSaturnRings(innerRadius, outerRadius) {
  const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
  const ringMaterial = new THREE.MeshPhongMaterial({
    color: 0xcccccc,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
  });
  const rings = new THREE.Mesh(ringGeometry, ringMaterial);
  rings.rotation.x = Math.PI / 2;
  return rings;
}

// ======= PLANETAS =======
const celestialBodies = [];
const planetPivots = {};
const planetMeshes = {};

planetsData.forEach((planetData) => {
  const planetPivot = new THREE.Object3D();
  scene.add(planetPivot);

  const orbitLine = createOrbitLine(
    planetData.distAU * AU,
    planetData.inclination || 0
  );
  scene.add(orbitLine);

  if (planetData.inclination) {
    planetPivot.rotation.x = THREE.MathUtils.degToRad(planetData.inclination);
  }

  const planetGeometry = new THREE.SphereGeometry(planetData.size, 32, 32);
  const planetTexture = createPlanetTexture(planetData.color);
  const planetMaterial = new THREE.MeshPhongMaterial({
    map: planetTexture,
    color: planetData.color,
    emissive: planetData.emissive || 0x000000,
    emissiveIntensity: 0.2,
    shininess: 40,
  });

  const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
  planetMesh.position.set(planetData.distAU * AU, 0, 0);
  planetMesh.castShadow = true;
  planetMesh.receiveShadow = true;
  planetPivot.add(planetMesh);

  planetPivots[planetData.name] = planetPivot;
  planetMeshes[planetData.name] = planetMesh;

  if (planetData.hasRings) {
    const rings = createSaturnRings(
      planetData.size * 1.3,
      planetData.size * 2.2
    );
    planetMesh.add(rings);
  }

  const orbitalOmega = (2 * Math.PI * timeScale) / planetData.periodDays;
  const rotationalOmega =
    (2 * Math.PI * timeScale) / (planetData.rotationHours / 24);

  celestialBodies.push({
    pivot: planetPivot,
    mesh: planetMesh,
    orbitalOmega: orbitalOmega,
    rotationalOmega: rotationalOmega,
    originalOrbitalPeriod: planetData.periodDays,
    originalRotationPeriod: planetData.rotationHours / 24,
    name: planetData.name,
  });

  if (planetData.moons && planetData.moons.length > 0) {
    planetData.moons.forEach((moonData) => {
      const moonPivot = new THREE.Object3D();
      planetMesh.add(moonPivot);

      const moonGeometry = new THREE.SphereGeometry(moonData.size, 16, 16);
      const moonTexture = createPlanetTexture(moonData.color);
      const moonMaterial = new THREE.MeshPhongMaterial({
        map: moonTexture,
        color: moonData.color,
        shininess: 20,
      });

      const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
      moonMesh.position.set(moonData.distAU * AU, 0, 0);
      moonMesh.castShadow = true;
      moonMesh.receiveShadow = true;
      moonPivot.add(moonMesh);

      const moonOrbitalOmega = (2 * Math.PI * timeScale) / moonData.periodDays;
      const moonRotationalOmega =
        (2 * Math.PI * timeScale) / (moonData.rotationHours / 24);

      celestialBodies.push({
        pivot: moonPivot,
        mesh: moonMesh,
        orbitalOmega: moonOrbitalOmega,
        rotationalOmega: moonRotationalOmega,
        originalOrbitalPeriod: moonData.periodDays,
        originalRotationPeriod: moonData.rotationHours / 24,
        name: moonData.name,
        isMoon: true,
      });
    });
  }
});

// Agregar Sol a los destinos
planetPivots['Sol'] = new THREE.Object3D();
planetMeshes['Sol'] = sun;
scene.add(planetPivots['Sol']);

// ======= SISTEMA DE NAVEGACIÓN =======
function navigateToPlanet(planetName) {
  if (isTraveling) return;

  const targetPivot = planetPivots[planetName];
  const targetMesh = planetMeshes[planetName];

  if (!targetPivot || !targetMesh) return;

  // Activar botón
  document
    .querySelectorAll('.nav-button')
    .forEach((btn) => btn.classList.remove('active'));
  event.target.classList.add('active');

  // Obtener posición del destino
  const targetPosition = new THREE.Vector3();
  if (planetName === 'Sol') {
    targetPosition.set(0, 0, 0);
  } else {
    targetMesh.getWorldPosition(targetPosition);
  }

  // Calcular distancia y duración del viaje
  const distance = spaceship.position.distanceTo(targetPosition);
  travelDuration = (distance / 100) * (1 / timeScale); // Ajustado por escala de tiempo

  // Configurar viaje
  isTraveling = true;
  travelTarget = targetPosition.clone();
  travelStartPos = spaceship.position.clone();
  travelProgress = 0;

  // UI
  document.getElementById('statusText').textContent = 'VIAJANDO';
  document.getElementById('targetPlanet').textContent =
    planetName.toUpperCase();
  document.getElementById('travelInfo').classList.add('active');

  // Orientar nave hacia el objetivo
  spaceship.lookAt(targetPosition);
}

// ======= CONTROL DE TIEMPO =======
const timeSlider = document.getElementById('timeSlider');
const timeSpeedDisplay = document.getElementById('timeSpeed');

timeSlider.addEventListener('input', (e) => {
  timeScale = parseFloat(e.target.value);
  timeSpeedDisplay.textContent = timeScale.toFixed(1);
  updateSpeeds();
});

function updateSpeeds() {
  celestialBodies.forEach((body) => {
    body.orbitalOmega = (2 * Math.PI * timeScale) / body.originalOrbitalPeriod;
    body.rotationalOmega =
      (2 * Math.PI * timeScale) / body.originalRotationPeriod;
  });
}

// ======= ANIMACIÓN =======
const clock = new THREE.Clock();
let frameCount = 0;

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = clock.getDelta();
  frameCount++;

  // Actualizar rotación de cámara suave
  rotationX += (targetRotationX - rotationX) * 0.1;
  rotationY += (targetRotationY - rotationY) * 0.1;

  // Sistema de viaje de nave
  if (isTraveling) {
    travelProgress += (deltaTime / travelDuration) * timeScale;

    if (travelProgress >= 1) {
      travelProgress = 1;
      isTraveling = false;
      document.getElementById('statusText').textContent = 'EN ÓRBITA';
      document.getElementById('travelInfo').classList.remove('active');

      // Quitar clase active de botones
      setTimeout(() => {
        document
          .querySelectorAll('.nav-button')
          .forEach((btn) => btn.classList.remove('active'));
      }, 500);
    }

    // Interpolación suave (ease-in-out)
    const easeProgress =
      travelProgress < 0.5
        ? 2 * travelProgress * travelProgress
        : 1 - Math.pow(-2 * travelProgress + 2, 2) / 2;

    spaceship.position.lerpVectors(travelStartPos, travelTarget, easeProgress);
    spaceship.lookAt(travelTarget);

    // Actualizar UI
    document.getElementById('travelProgress').textContent = Math.floor(
      travelProgress * 100
    );

    // Velocidad simulada
    const velocity =
      spaceship.position.distanceTo(travelTarget) /
      (travelDuration * (1 - travelProgress));
    document.getElementById('speedText').textContent =
      Math.floor(velocity * 100) + ' km/s';
  } else {
    document.getElementById('speedText').textContent = '0 km/s';
  }

  // Animar planetas
  if (!isPaused) {
    celestialBodies.forEach((body) => {
      body.pivot.rotation.y += body.orbitalOmega * deltaTime;
      body.mesh.rotation.y += body.rotationalOmega * deltaTime;
    });

    if (frameCount % 2 === 0) {
      sun.rotation.y += 0.002 * deltaTime * timeScale;
    }
  }

  // Actualizar posición de cámara (sigue a la nave)
  const shipPos = spaceship.position.clone();
  const cameraOffset = new THREE.Vector3(
    Math.sin(rotationY) * Math.cos(rotationX) * cameraDistance,
    Math.sin(rotationX) * cameraDistance,
    Math.cos(rotationY) * Math.cos(rotationX) * cameraDistance
  );

  camera.position.copy(shipPos).add(cameraOffset);
  camera.lookAt(shipPos);

  // Efecto de motor de nave
  if (isTraveling) {
    const engineGlow = spaceship.children.find((child) => child.isLight);
    if (engineGlow) {
      engineGlow.intensity = 2 + Math.sin(frameCount * 0.2) * 0.5;
    }
  }

  renderer.render(scene, camera);
}

animate();

// ======= RESPONSIVO =======
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ======= FUNCIONES GLOBALES =======
window.navigateToPlanet = navigateToPlanet;
