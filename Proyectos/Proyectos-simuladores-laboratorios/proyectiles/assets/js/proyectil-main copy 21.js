/*
 * Archivo: proyectil-main.js
 * Descripción: Lógica del Nivel 14 (Paneles Arrastrables y Cinta Métrica).
 */

// --- 1. CONFIGURACIÓN INICIAL ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const fireButton = document.getElementById('fireButton');

// DOM: Panel de Datos
const toggleDataButton = document.getElementById('toggleDataButton');
const dataPanel = document.getElementById('data-panel');
const dataVelocity = document.getElementById('data-velocity');
// ... (resto de campos de datos) ...
const dataAngle = document.getElementById('data-angle');
const dataTimeAir = document.getElementById('data-time-air');
const dataPosX = document.getElementById('data-pos-x');
const dataPosY = document.getElementById('data-pos-y');
const dataPeakY = document.getElementById('data-peak-y');

// DOM: Panel de Historial
const toggleHistoryButton = document.getElementById('toggleHistoryButton');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');

// DOM: Panel de Configuración
const toggleSettingsButton = document.getElementById('toggleSettingsButton');
const settingsPanel = document.getElementById('settings-panel');
// ... (resto de inputs de config) ...
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

// NUEVO: Botón de Medir
const toggleMeasureButton = document.getElementById('toggleMeasureButton');

const GROUND_IMAGE_PATH =
  'https.p.turbosquid.com/ts-thumb/nS/afcoJN/XJcoNe48/showcase/jpg/1488644923/1920x1080/fit_q87/30f8d7ebf3c2b9d904b688ff1e71360ff683b57e/showcase.jpg';
let groundImage = new Image();
let groundImageLoaded = false;
let GROUND_Y;

// --- VARIABLES DE SIMULACIÓN ---
const DEFAULT_GRAVITY = 500;
let simParams = {
  gravity: DEFAULT_GRAVITY,
  velocity: 700,
  cannonModelHeight: 70,
};

let isAiming = true;
let launchHistory = [];
let landedProjectiles = [];
let trajectoryPoints = [];
let timeInAir = 0;
let peakHeight = 0;
let showMeasureTape = false; // NUEVO: Estado de la cinta métrica

// Física de Paso Fijo
const FIXED_DELTA_TIME = 1 / 60;
let lastTime = 0;
let accumulatedTime = 0;

// Objetos
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

// --- 3. FÍSICA (Sin Cambios) ---
function update(deltaTime) {
  if (!projectile.active) {
    return;
  }
  timeInAir += deltaTime;
  const currentHeight = GROUND_Y - projectile.y;
  if (currentHeight > peakHeight) {
    peakHeight = currentHeight;
  }
  projectile.vy += simParams.gravity * deltaTime;
  projectile.x += projectile.vx * deltaTime;
  projectile.y += projectile.vy * deltaTime;
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

// --- 4. FUNCIÓN DE DIBUJO (Actualizada) ---
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

  // NUEVO: Dibujar la cinta métrica si está activa
  if (showMeasureTape) {
    drawMeasureTape();
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

// Dibujar Cañón (Sin Cambios)
function drawCannon() {
  ctx.save();
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

// --- 5. FUNCIONES DE EVENTOS (Sin Cambios) ---
function fireProjectile() {
  if (projectile.active) return;
  projectile.active = true;
  projectile.x = cannon.barrelEndX;
  projectile.y = cannon.barrelEndY;
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
function onMouseMove(event) {
  if (!isAiming) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const dx = mouseX - cannon.x;
  const dy = mouseY - (cannon.y - 5);
  cannon.angle = Math.atan2(dy, dx);
  cannon.angle = Math.max(-Math.PI / 2, Math.min(cannon.angle, 0));
  updateSettingsInputs();
  calculateTrajectory();
}
function lockAim(event) {
  // MODIFICADO: No bloquear mira si estamos arrastrando un panel
  if (event.target === canvas) {
    isAiming = false;
    calculateTrajectory();
  }
}
function onResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  GROUND_Y = canvas.height - 50;
  cannon.y = GROUND_Y - simParams.cannonModelHeight;
  calculateTrajectory();
}

// --- 6. FUNCIONES DE LÓGICA (Actualizadas) ---

// --- Conversión ---
function radToDeg(rad) {
  return Math.abs(rad * (180 / Math.PI));
}
function degToRad(deg) {
  return -Math.abs(deg * (Math.PI / 180));
}

// --- Sincronización de Inputs ---
function updateSimFromInputs() {
  simParams.gravity = parseFloat(inputGravity.value) || DEFAULT_GRAVITY;
  simParams.velocity = parseFloat(inputVelocity.value) || 0;
  cannon.angle = degToRad(parseFloat(inputAngle.value)) || 0;
  cannon.x = parseFloat(inputCannonX.value) || 0;
  simParams.cannonModelHeight = parseFloat(inputCannonHeight.value) || 0;
  onResize();
}
function updateSettingsInputs() {
  inputGravity.value = simParams.gravity.toFixed(0);
  inputVelocity.value = simParams.velocity.toFixed(0);
  inputAngle.value = radToDeg(cannon.angle).toFixed(1);
  inputCannonX.value = cannon.x.toFixed(0);
  inputCannonHeight.value = simParams.cannonModelHeight.toFixed(0);
}

// --- Trayectoria ---
function calculateTrajectory() {
  drawCannon(); // Recalcular punta del cañón
  trajectoryPoints = [];
  let sim = {
    x: cannon.barrelEndX,
    y: cannon.barrelEndY,
    vx: simParams.velocity * Math.cos(cannon.angle),
    vy: simParams.velocity * Math.sin(cannon.angle),
  };
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
  ctx.moveTo(cannon.barrelEndX, cannon.barrelEndY);
  for (let i = 0; i < trajectoryPoints.length; i++) {
    ctx.lineTo(trajectoryPoints[i].x, trajectoryPoints[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

// --- NUEVO: Cinta Métrica ---
function drawMeasureTape() {
  ctx.save();
  ctx.strokeStyle = '#FFFF00'; // Amarillo
  ctx.fillStyle = '#FFFF00';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';

  // Dibuja la línea base
  const tapeY = GROUND_Y + 15; // Un poco debajo del suelo
  ctx.beginPath();
  ctx.moveTo(cannon.x, tapeY);
  ctx.lineTo(canvas.width, tapeY);
  ctx.stroke();

  // Dibuja las marcas (ticks)
  for (let dist = 0; cannon.x + dist < canvas.width; dist += 50) {
    const xPos = cannon.x + dist;
    const isMajorTick = dist % 100 === 0;
    const tickHeight = isMajorTick ? 10 : 5;

    // Dibuja el tick (hacia arriba)
    ctx.beginPath();
    ctx.moveTo(xPos, tapeY);
    ctx.lineTo(xPos, tapeY - tickHeight);
    ctx.stroke();

    // Dibuja el texto para marcas mayores
    if (isMajorTick && dist > 0) {
      ctx.fillText(dist + 'px', xPos, tapeY + 15); // Texto debajo
    }
  }
  ctx.restore();
}

// --- Paneles ---
function toggleDataPanel() {
  dataPanel.classList.toggle('hidden');
}
function toggleHistoryPanel() {
  historyPanel.classList.toggle('hidden');
}
function toggleSettingsPanel() {
  settingsPanel.classList.toggle('hidden');
}
function toggleMeasureTool() {
  showMeasureTape = !showMeasureTape;
} // NUEVO

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

// --- NUEVO: Lógica para Paneles Arrastrables ---
function makePanelDraggable(panel) {
  let header = panel.querySelector('.panel-header');
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;

  header.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // Posición inicial del mouse
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Llama a las funciones al mover el mouse o soltarlo
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // Calcula el desplazamiento
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Establece la nueva posición del panel
    panel.style.top = panel.offsetTop - pos2 + 'px';
    panel.style.left = panel.offsetLeft - pos1 + 'px';
  }

  function closeDragElement() {
    // Deja de mover al soltar el botón
    document.onmouseup = null;
    document.onmousemove = null;
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
  toggleSettingsButton.addEventListener('click', toggleSettingsPanel);
  toggleMeasureButton.addEventListener('click', toggleMeasureTool); // NUEVO

  // Listeners de Configuración
  inputGravity.addEventListener('change', updateSimFromInputs);
  inputVelocity.addEventListener('change', updateSimFromInputs);
  inputAngle.addEventListener('change', () => {
    isAiming = false;
    updateSimFromInputs();
  });
  inputCannonX.addEventListener('change', updateSimFromInputs);
  inputCannonHeight.addEventListener('change', updateSimFromInputs);
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

  // NUEVO: Activar que los paneles sean arrastrables
  makePanelDraggable(dataPanel);
  makePanelDraggable(settingsPanel);
  makePanelDraggable(historyPanel);
}

function init() {
  loadAssets();
  setupEventListeners();
  onResize();
  updateSettingsInputs();
  calculateTrajectory();
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
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
