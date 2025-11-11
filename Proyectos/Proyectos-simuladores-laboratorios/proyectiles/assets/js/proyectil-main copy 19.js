/*
 * Archivo: proyectil-main.js
 * Descripción: Lógica del Nivel 11 (Predicción de Trayectoria y Física Determinista).
 */

// --- 1. CONFIGURACIÓN INICIAL ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const fireButton = document.getElementById('fireButton');

// Panel de Datos
const toggleDataButton = document.getElementById('toggleDataButton');
const dataPanel = document.getElementById('data-panel');
const dataVelocity = document.getElementById('data-velocity');
const dataAngle = document.getElementById('data-angle');
const dataTimeAir = document.getElementById('data-time-air'); // Nuevo
const dataPosX = document.getElementById('data-pos-x');
const dataPosY = document.getElementById('data-pos-y');
const dataPeakY = document.getElementById('data-peak-y'); // Nuevo

// Panel de Historial
const toggleHistoryButton = document.getElementById('toggleHistoryButton');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');

const GROUND_IMAGE_PATH =
  'https.p.turbosquid.com/ts-thumb/nS/afcoJN/XJcoNe48/showcase/jpg/1488644923/1920x1080/fit_q87/30f8d7ebf3c2b9d904b688ff1e71360ff683b57e/showcase.jpg';
let groundImage = new Image();
let groundImageLoaded = false;
let GROUND_Y;

// --- VARIABLES DE SIMULACIÓN ---
const GRAVITY = 500;
const INITIAL_VELOCITY = 700;
let isAiming = true;
let launchHistory = [];
let landedProjectiles = [];
let trajectoryPoints = []; // NUEVO: Para la línea de predicción

// Variables de estado en vivo
let timeInAir = 0;
let peakHeight = 0;

// --- NUEVO: Motor de Física de Paso Fijo ---
const FIXED_DELTA_TIME = 1 / 60; // Correr física a 60 FPS
let lastTime = 0;
let accumulatedTime = 0;

// --- Objeto Cañón ---
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

// --- 2. BUCLE PRINCIPAL DE JUEGO (REHECHO) ---
function gameLoop(currentTime) {
  // Convertir tiempo a segundos
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  // Acumular el tiempo transcurrido
  accumulatedTime += deltaTime;

  // Ejecutar la física en pasos fijos
  // Esto asegura que la simulación sea 100% determinista
  while (accumulatedTime >= FIXED_DELTA_TIME) {
    update(FIXED_DELTA_TIME); // Actualizar física
    accumulatedTime -= FIXED_DELTA_TIME;
  }

  // Dibujar el estado actual (se ejecuta una vez por fotograma)
  draw();

  requestAnimationFrame(gameLoop);
}

// --- 3. FUNCIÓN DE ACTUALIZACIÓN (FÍSICA) ---
// 'deltaTime' ahora es siempre FIXED_DELTA_TIME (aprox 0.0166s)
function update(deltaTime) {
  if (!projectile.active) {
    return; // No hacer nada si no hay proyectil activo
  }

  // 1. Actualizar estado en vivo
  timeInAir += deltaTime;
  const currentHeight = GROUND_Y - projectile.y;
  if (currentHeight > peakHeight) {
    peakHeight = currentHeight;
  }

  // 2. Aplicar Física
  projectile.vy += GRAVITY * deltaTime;
  projectile.x += projectile.vx * deltaTime;
  projectile.y += projectile.vy * deltaTime;

  // 3. Comprobar colisión
  if (projectile.y + projectile.radius > GROUND_Y) {
    projectile.active = false;
    projectile.y = GROUND_Y - projectile.radius;

    // Guardar datos finales en el historial
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

  // Dibujar suelo
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

  // Dibujar cañón
  drawCannon();

  // Dibujar marcas del historial
  for (const proj of landedProjectiles) {
    ctx.fillStyle = proj.color;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }

  // Dibujar proyectil activo
  if (projectile.active) {
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    updateLiveData(); // Actualizar datos en vivo
  } else {
    // NUEVO: Dibujar la línea de trayectoria si NO está disparando
    drawTrajectory();
  }
}

// Función para dibujar el cañón modelado
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

// --- 5. FUNCIONES DE EVENTOS ---

// Función de Disparo
function fireProjectile() {
  if (projectile.active) return;

  projectile.active = true;
  projectile.x = cannon.barrelEndX;
  projectile.y = cannon.barrelEndY;
  projectile.vx = INITIAL_VELOCITY * Math.cos(cannon.angle);
  projectile.vy = INITIAL_VELOCITY * Math.sin(cannon.angle);
  isAiming = true;

  // Resetear datos en vivo
  timeInAir = 0;
  peakHeight = 0;

  let angleInDegrees = Math.abs(cannon.angle * (180 / Math.PI)).toFixed(1);

  // Actualizar panel de datos
  dataVelocity.textContent = INITIAL_VELOCITY;
  dataAngle.textContent = angleInDegrees;
  dataPosX.textContent = '0.0';
  dataPosY.textContent = '0.0';
  dataTimeAir.textContent = '0.0';
  dataPeakY.textContent = '0.0';

  // Guardar los datos de este disparo
  projectile.launchData = {
    id: launchHistory.length + 1,
    angle: cannon.angle,
    velocity: INITIAL_VELOCITY,
  };
}

// Mover el cañón con el mouse
function onMouseMove(event) {
  if (!isAiming) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const dx = mouseX - cannon.x;
  const dy = mouseY - (cannon.y - 5); // Pivote
  cannon.angle = Math.atan2(dy, dx);
  cannon.angle = Math.max(-Math.PI / 2, Math.min(cannon.angle, 0));

  calculateTrajectory(); // NUEVO: Recalcular la línea al mover
}

// Función para bloquear la mira
function lockAim(event) {
  if (event.target === canvas) {
    isAiming = false;
    calculateTrajectory(); // NUEVO: Calcular la línea final al bloquear
  }
}

// Función de ajuste de ventana
function onResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  GROUND_Y = canvas.height - 50;
  cannon.y = GROUND_Y - 70;
  calculateTrajectory(); // NUEVO: Recalcular si la ventana cambia
}

// --- 6. NUEVAS FUNCIONES (TRAYECTORIA Y PANELES) ---

// NUEVO: Simula la trayectoria completa
function calculateTrajectory() {
  trajectoryPoints = []; // Limpiar puntos antiguos

  // Crear un proyectil de simulación
  let sim = {
    x: cannon.barrelEndX,
    y: cannon.barrelEndY,
    vx: INITIAL_VELOCITY * Math.cos(cannon.angle),
    vy: INITIAL_VELOCITY * Math.sin(cannon.angle),
  };

  // Simular 5 segundos (o hasta que toque el suelo)
  // Usamos el MISMO FIXED_DELTA_TIME que la física real
  for (let t = 0; t < 5; t += FIXED_DELTA_TIME) {
    // Aplicar física de simulación
    sim.vy += GRAVITY * FIXED_DELTA_TIME;
    sim.x += sim.vx * FIXED_DELTA_TIME;
    sim.y += sim.vy * FIXED_DELTA_TIME;

    // Guardar el punto
    trajectoryPoints.push({ x: sim.x, y: sim.y });

    // Detener si toca el suelo
    if (sim.y + projectile.radius > GROUND_Y) {
      break;
    }
  }
}

// NUEVO: Dibuja la línea de puntos
function drawTrajectory() {
  if (trajectoryPoints.length === 0) return;

  ctx.save();
  ctx.setLineDash([3, 6]); // Línea punteada
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; // Blanco semitransparente
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(trajectoryPoints[0].x, trajectoryPoints[0].y);

  for (let i = 1; i < trajectoryPoints.length; i++) {
    ctx.lineTo(trajectoryPoints[i].x, trajectoryPoints[i].y);
  }

  ctx.stroke();
  ctx.restore();
}

// Muestra/Oculta el panel de DATOS
function toggleDataPanel() {
  dataPanel.classList.toggle('hidden');
}

// Muestra/Oculta el panel de HISTORIAL
function toggleHistoryPanel() {
  historyPanel.classList.toggle('hidden');
}

// Actualiza los datos en vivo (X, Y, Tiempo, Altura)
function updateLiveData() {
  let relativeX = (projectile.x - cannon.x).toFixed(1);
  let relativeY = (GROUND_Y - projectile.y).toFixed(1);

  dataTimeAir.textContent = timeInAir.toFixed(2);
  dataPosX.textContent = relativeX;
  dataPosY.textContent = relativeY;
  dataPeakY.textContent = peakHeight.toFixed(1);
}

// Actualiza el panel de HISTORIAL (Con más datos)
function updateHistoryPanel() {
  historyList.innerHTML = '';

  for (let i = launchHistory.length - 1; i >= 0; i--) {
    const data = launchHistory[i];

    // Formatear datos
    const angleDeg = (Math.abs(data.angle) * (180 / Math.PI)).toFixed(1);
    const dist = data.distance.toFixed(1);
    const time = data.time.toFixed(2);
    const peak = data.peak.toFixed(1);

    // Crear el item de la lista
    const li = document.createElement('li');
    li.innerHTML = `<strong>Lanz. #${data.id}</strong><br>
                        Ángulo: ${angleDeg}° | Distancia: ${dist} m<br>
                        Tiempo: ${time} s | Altura Máx: ${peak} m`;

    historyList.appendChild(li);
  }
}

// --- 7. INICIALIZACIÓN ---
function loadAssets() {
  groundImage.src = GROUND_IMAGE_PATH;
  groundImage.onload = () => {
    groundImageLoaded = true;
  };
  groundImage.onerror = () => {
    console.error('No se pudo cargar la imagen del suelo.');
  };
}

// --- Poner todo en marcha ---
window.addEventListener('resize', onResize);
canvas.addEventListener('mousemove', onMouseMove);
fireButton.addEventListener('click', fireProjectile);
canvas.addEventListener('click', lockAim);
toggleDataButton.addEventListener('click', toggleDataPanel);
toggleHistoryButton.addEventListener('click', toggleHistoryPanel);

onResize();
loadAssets();
calculateTrajectory(); // Calcular la trayectoria inicial
requestAnimationFrame(gameLoop); // Iniciar el bucle de juego
