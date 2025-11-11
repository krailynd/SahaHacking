/*
 * Archivo: proyectil-main.js
 * Descripción: Lógica del Nivel 12 (Panel de Configuración y Variables).
 */

// --- 1. CONFIGURACIÓN INICIAL ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const fireButton = document.getElementById('fireButton');

// DOM: Panel de Datos
const toggleDataButton = document.getElementById('toggleDataButton');
const dataPanel = document.getElementById('data-panel');
const dataVelocity = document.getElementById('data-velocity');
const dataAngle = document.getElementById('data-angle');
const dataTimeAir = document.getElementById('data-time-air');
const dataPosX = document.getElementById('data-pos-x');
const dataPosY = document.getElementById('data-pos-y');
const dataPeakY = document.getElementById('data-peak-y');

// DOM: Panel de Historial
const toggleHistoryButton = document.getElementById('toggleHistoryButton');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');

// DOM: NUEVO Panel de Configuración
const toggleSettingsButton = document.getElementById('toggleSettingsButton');
const settingsPanel = document.getElementById('settings-panel');
const inputGravity = document.getElementById('input-gravity');
const resetGravity = document.getElementById('reset-gravity');
const inputVelocity = document.getElementById('input-velocity');
const velDown = document.getElementById('vel-down');
const velUp = document.getElementById('vel-up');
const inputAngle = document.getElementById('input-angle');
const angleDown = document.getElementById('angle-down');
const angleUp = document.getElementById('angle-up');
const inputCannonX = document.getElementById('input-cannon-x');
const cannonXDown = document.getElementById('cannon-x-down');
const cannonXUp = document.getElementById('cannon-x-up');
const inputCannonHeight = document.getElementById('input-cannon-height');
const cannonHDown = document.getElementById('cannon-h-down');
const cannonHUp = document.getElementById('cannon-h-up');

const GROUND_IMAGE_PATH =
  'https.p.turbosquid.com/ts-thumb/nS/afcoJN/XJcoNe48/showcase/jpg/1488644923/1920x1080/fit_q87/30f8d7ebf3c2b9d904b688ff1e71360ff683b57e/showcase.jpg';
let groundImage = new Image();
let groundImageLoaded = false;
let GROUND_Y;

// --- VARIABLES DE SIMULACIÓN ---
// Constantes reemplazadas por un objeto de parámetros
const DEFAULT_GRAVITY = 500;
let simParams = {
  gravity: DEFAULT_GRAVITY,
  velocity: 700,
  cannonModelHeight: 70, // La altura del modelo (base+ruedas)
};

let isAiming = true;
let launchHistory = [];
let landedProjectiles = [];
let trajectoryPoints = [];

// Variables de estado en vivo
let timeInAir = 0;
let peakHeight = 0;

// Motor de Física de Paso Fijo
const FIXED_DELTA_TIME = 1 / 60;
let lastTime = 0;
let accumulatedTime = 0;

// --- Objeto Cañón (ahora su X es variable) ---
let cannon = {
  x: 100,
  y: 0,
  baseWidth: 80,
  baseHeight: 40,
  barrelLength: 100,
  barrelWidth: 30,
  angle: -0.5,
  barrelEndX: 0,
  barrelEndY: 0,
};

// --- Objeto Proyectil ---
let projectile = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 10,
  color: 'orange',
  active: false,
  launchData: {},
};

// --- 2. BUCLE PRINCIPAL DE JUEGO (Sin Cambios) ---
function gameLoop(currentTime) {
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  accumulatedTime += deltaTime;
  while (accumulatedTime >= FIXED_DELTA_TIME) {
    update(FIXED_DELTA_TIME);
    accumulatedTime -= FIXED_DELTA_TIME;
  }
  draw();
  requestAnimationFrame(gameLoop);
}

// --- 3. FUNCIÓN DE ACTUALIZACIÓN (FÍSICA) ---
function update(deltaTime) {
  if (!projectile.active) {
    return;
  }
  timeInAir += deltaTime;
  const currentHeight = GROUND_Y - projectile.y;
  if (currentHeight > peakHeight) {
    peakHeight = currentHeight;
  }

  // FÍSICA: Usa la variable de gravedad
  projectile.vy += simParams.gravity * deltaTime;
  projectile.x += projectile.vx * deltaTime;
  projectile.y += projectile.vy * deltaTime;

  // Colisión
  if (projectile.y + projectile.radius > GROUND_Y) {
    projectile.active = false;
    projectile.y = GROUND_Y - projectile.radius;

    const finalDistance = projectile.x - cannon.x;
    projectile.launchData.distance = finalDistance;
    projectile.launchData.time = timeInAir;
    projectile.launchData.peak = peakHeight;

    launchHistory.push(projectile.launchData);
    landedProjectiles.push({
      x: projectile.x,
      y: projectile.y,
      radius: projectile.radius,
      color: 'rgba(255, 171, 0, 0.5)',
    });

    updateHistoryPanel();
  }
}

// --- 4. FUNCIÓN DE DIBUJO ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (groundImageLoaded) {
    ctx.drawImage(
      groundImage,
      0,
      GROUND_Y,
      canvas.width,
      canvas.height - GROUND_Y
    );
  } else {
    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
  }
  drawCannon();
  for (const proj of landedProjectiles) {
    ctx.fillStyle = proj.color;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
  if (projectile.active) {
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    updateLiveData();
  } else {
    drawTrajectory();
  }
}

// Dibujar Cañón (Ahora usa la altura variable)
function drawCannon() {
  ctx.save();
  // cannon.y se establece en onResize
  ctx.translate(cannon.x, cannon.y);
  ctx.fillStyle = '#666';
  ctx.fillRect(-cannon.baseWidth / 2, 0, cannon.baseWidth, cannon.baseHeight);
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(
    -cannon.baseWidth / 2 + 15,
    cannon.baseHeight + 15,
    15,
    0,
    Math.PI * 2
  );
  ctx.arc(
    cannon.baseWidth / 2 - 15,
    cannon.baseHeight + 15,
    15,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.translate(0, -5);
  ctx.rotate(cannon.angle);
  ctx.fillStyle = '#444';
  ctx.fillRect(
    0,
    -cannon.barrelWidth / 2,
    cannon.barrelLength,
    cannon.barrelWidth
  );
  const puntaX = cannon.barrelLength;
  const puntaY = 0;
  const worldMatrix = ctx.getTransform();
  cannon.barrelEndX =
    worldMatrix.a * puntaX + worldMatrix.c * puntaY + worldMatrix.e;
  cannon.barrelEndY =
    worldMatrix.b * puntaX + worldMatrix.d * puntaY + worldMatrix.f;
  ctx.restore();
}

// --- 5. FUNCIONES DE EVENTOS (Actualizadas) ---

// Disparo (usa velocidad variable)
function fireProjectile() {
  if (projectile.active) return;

  projectile.active = true;
  projectile.x = cannon.barrelEndX;
  projectile.y = cannon.barrelEndY;
  // Usa la velocidad de los parámetros
  projectile.vx = simParams.velocity * Math.cos(cannon.angle);
  projectile.vy = simParams.velocity * Math.sin(cannon.angle);
  isAiming = true;

  timeInAir = 0;
  peakHeight = 0;

  let angleInDegrees = radToDeg(cannon.angle);

  dataVelocity.textContent = simParams.velocity;
  dataAngle.textContent = angleInDegrees.toFixed(1);
  dataPosX.textContent = '0.0';
  dataPosY.textContent = '0.0';
  dataTimeAir.textContent = '0.0';
  dataPeakY.textContent = '0.0';

  projectile.launchData = {
    id: launchHistory.length + 1,
    angle: cannon.angle,
    velocity: simParams.velocity,
  };
}

// Mover con Mouse (Actualiza el input)
function onMouseMove(event) {
  if (!isAiming) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // El pivote está en (cannon.x, cannon.y - 5)
  const dx = mouseX - cannon.x;
  const dy = mouseY - (cannon.y - 5);
  cannon.angle = Math.atan2(dy, dx);
  cannon.angle = Math.max(-Math.PI / 2, Math.min(cannon.angle, 0));

  updateSettingsInputs(); // Sincroniza el input con el mouse
  calculateTrajectory();
}

// Bloquear Mira
function lockAim(event) {
  if (event.target === canvas) {
    isAiming = false;
    calculateTrajectory();
  }
}

// Ajuste de Ventana (Usa altura de cañón variable)
function onResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  GROUND_Y = canvas.height - 50;

  // Ancla el cañón usando la altura del modelo
  cannon.y = GROUND_Y - simParams.cannonModelHeight;

  calculateTrajectory();
}

// --- 6. NUEVAS FUNCIONES (CONFIGURACIÓN Y PANELES) ---

// --- Funciones de conversión ---
function radToDeg(rad) {
  return Math.abs(rad * (180 / Math.PI));
}
function degToRad(deg) {
  // Asegurarse de que el ángulo sea negativo (apuntando hacia arriba)
  return -Math.abs(deg * (Math.PI / 180));
}

// --- Funciones de Sincronización ---

// Lee los inputs y actualiza las variables de simulación
function updateSimFromInputs() {
  simParams.gravity = parseFloat(inputGravity.value) || DEFAULT_GRAVITY;
  simParams.velocity = parseFloat(inputVelocity.value) || 0;
  cannon.angle = degToRad(parseFloat(inputAngle.value)) || 0;
  cannon.x = parseFloat(inputCannonX.value) || 0;
  simParams.cannonModelHeight = parseFloat(inputCannonHeight.value) || 0;

  // Actualizar la posición Y del cañón
  onResize(); // Esto recalcula todo, incluyendo la trayectoria
}

// Lee las variables de simulación y actualiza los inputs
function updateSettingsInputs() {
  inputGravity.value = simParams.gravity.toFixed(0);
  inputVelocity.value = simParams.velocity.toFixed(0);
  inputAngle.value = radToDeg(cannon.angle).toFixed(1);
  inputCannonX.value = cannon.x.toFixed(0);
  inputCannonHeight.value = simParams.cannonModelHeight.toFixed(0);
}

// --- Funciones de Trayectoria ---
function calculateTrajectory() {
  trajectoryPoints = [];
  let sim = {
    x: cannon.barrelEndX,
    y: cannon.barrelEndY,
    vx: simParams.velocity * Math.cos(cannon.angle),
    vy: simParams.velocity * Math.sin(cannon.angle),
  };

  // Re-calcular la punta del cañón primero
  // (Necesario si X o Altura cambiaron)
  drawCannon();

  // Simular usando las variables actuales
  for (let t = 0; t < 5; t += FIXED_DELTA_TIME) {
    sim.vy += simParams.gravity * FIXED_DELTA_TIME;
    sim.x += sim.vx * FIXED_DELTA_TIME;
    sim.y += sim.vy * FIXED_DELTA_TIME;

    trajectoryPoints.push({ x: sim.x, y: sim.y });
    if (sim.y + projectile.radius > GROUND_Y) {
      break;
    }
  }
}
function drawTrajectory() {
  if (trajectoryPoints.length === 0) return;
  ctx.save();
  ctx.setLineDash([3, 6]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cannon.barrelEndX, cannon.barrelEndY); // Empezar siempre desde la punta
  for (let i = 0; i < trajectoryPoints.length; i++) {
    ctx.lineTo(trajectoryPoints[i].x, trajectoryPoints[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

// --- Funciones de Paneles ---
function toggleDataPanel() {
  dataPanel.classList.toggle('hidden');
}
function toggleHistoryPanel() {
  historyPanel.classList.toggle('hidden');
}
function toggleSettingsPanel() {
  settingsPanel.classList.toggle('hidden');
}

function updateLiveData() {
  let relativeX = (projectile.x - cannon.x).toFixed(1);
  let relativeY = (GROUND_Y - projectile.y).toFixed(1);
  dataTimeAir.textContent = timeInAir.toFixed(2);
  dataPosX.textContent = relativeX;
  dataPosY.textContent = relativeY;
  dataPeakY.textContent = peakHeight.toFixed(1);
}

function updateHistoryPanel() {
  historyList.innerHTML = '';
  for (let i = launchHistory.length - 1; i >= 0; i--) {
    const data = launchHistory[i];
    const angleDeg = radToDeg(data.angle).toFixed(1);
    const dist = data.distance.toFixed(1);
    const time = data.time.toFixed(2);
    const peak = data.peak.toFixed(1);
    const li = document.createElement('li');
    li.innerHTML = `<strong>Lanz. #${data.id}</strong> (V=${data.velocity})<br>
                        Ángulo: ${angleDeg}° | Distancia: ${dist} px<br>
                        Tiempo: ${time} s | Altura Máx: ${peak} px`;
    historyList.appendChild(li);
  }
}

// --- 7. INICIALIZACIÓN Y LISTENERS ---
function setupEventListeners() {
  window.addEventListener('resize', onResize);
  canvas.addEventListener('mousemove', onMouseMove);
  fireButton.addEventListener('click', fireProjectile);
  canvas.addEventListener('click', lockAim);
  toggleDataButton.addEventListener('click', toggleDataPanel);
  toggleHistoryButton.addEventListener('click', toggleHistoryPanel);

  // NUEVOS Listeners de Configuración
  toggleSettingsButton.addEventListener('click', toggleSettingsPanel);

  // Inputs (llaman a la simulación al cambiar)
  inputGravity.addEventListener('change', updateSimFromInputs);
  inputVelocity.addEventListener('change', updateSimFromInputs);
  inputAngle.addEventListener('change', () => {
    isAiming = false;
    updateSimFromInputs();
  });
  inputCannonX.addEventListener('change', updateSimFromInputs);
  inputCannonHeight.addEventListener('change', updateSimFromInputs);

  // Botones Stepper (+/-)
  resetGravity.addEventListener('click', () => {
    inputGravity.value = DEFAULT_GRAVITY;
    updateSimFromInputs();
  });
  velDown.addEventListener('click', () => {
    inputVelocity.value = parseFloat(inputVelocity.value) - 10;
    updateSimFromInputs();
  });
  velUp.addEventListener('click', () => {
    inputVelocity.value = parseFloat(inputVelocity.value) + 10;
    updateSimFromInputs();
  });
  angleDown.addEventListener('click', () => {
    inputAngle.value = parseFloat(inputAngle.value) - 1;
    isAiming = false;
    updateSimFromInputs();
  });
  angleUp.addEventListener('click', () => {
    inputAngle.value = parseFloat(inputAngle.value) + 1;
    isAiming = false;
    updateSimFromInputs();
  });
  cannonXDown.addEventListener('click', () => {
    inputCannonX.value = parseFloat(inputCannonX.value) - 5;
    updateSimFromInputs();
  });
  cannonXUp.addEventListener('click', () => {
    inputCannonX.value = parseFloat(inputCannonX.value) + 5;
    updateSimFromInputs();
  });
  cannonHDown.addEventListener('click', () => {
    inputCannonHeight.value = parseFloat(inputCannonHeight.value) - 5;
    updateSimFromInputs();
  });
  cannonHUp.addEventListener('click', () => {
    inputCannonHeight.value = parseFloat(inputCannonHeight.value) + 5;
    updateSimFromInputs();
  });
}

function init() {
  loadAssets();
  setupEventListeners();
  onResize(); // Configurar tamaño inicial
  updateSettingsInputs(); // Poner valores iniciales en los inputs
  calculateTrajectory(); // Calcular la trayectoria inicial
  lastTime = performance.now(); // Iniciar el temporizador
  requestAnimationFrame(gameLoop); // Iniciar el bucle de juego
}

function loadAssets() {
  groundImage.src = GROUND_IMAGE_PATH;
  groundImage.onload = () => {
    groundImageLoaded = true;
  };
  groundImage.onerror = () => {
    console.error('No se pudo cargar la imagen del suelo.');
  };
}

// Iniciar todo
init();
