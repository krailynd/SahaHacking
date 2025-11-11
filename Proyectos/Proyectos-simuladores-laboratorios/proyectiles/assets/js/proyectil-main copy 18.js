/*
 * Archivo: proyectil-main.js
 * Descripción: Lógica del Nivel 10 (Historial de Disparos y Marcas).
 */

// --- 1. CONFIGURACIÓN INICIAL ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const fireButton = document.getElementById('fireButton');

// Elementos del Panel de Datos
const toggleDataButton = document.getElementById('toggleDataButton');
const dataPanel = document.getElementById('data-panel');
const dataVelocity = document.getElementById('data-velocity');
const dataAngle = document.getElementById('data-angle');
const dataPosX = document.getElementById('data-pos-x');
const dataPosY = document.getElementById('data-pos-y');

// NUEVO: Elementos del Panel de Historial
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
let lastTime;
let isAiming = true;

// NUEVO: Arrays para el historial
let launchHistory = []; // Guarda los datos (para el panel)
let landedProjectiles = []; // Guarda las posiciones (para las marcas)

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
  launchData: {}, // NUEVO: para guardar datos en el disparo
};

// --- 2. BUCLE PRINCIPAL DE JUEGO ---
function gameLoop(currentTime) {
  if (!lastTime) {
    lastTime = currentTime;
  }
  let deltaTime = (currentTime - lastTime) / 1000;
  if (isNaN(deltaTime) || deltaTime > 0.5) {
    deltaTime = 0;
  }
  lastTime = currentTime;

  update(deltaTime);
  draw();
  requestAnimationFrame(gameLoop);
}

// --- 3. FUNCIÓN DE ACTUALIZACIÓN (FÍSICA) ---
function update(deltaTime) {
  if (!projectile.active) {
    return; // No hacer nada si no hay proyectil activo
  }

  projectile.vy += GRAVITY * deltaTime;
  projectile.x += projectile.vx * deltaTime;
  projectile.y += projectile.vy * deltaTime;

  // MODIFICADO: Comprobar colisión con el suelo Y si estaba activo
  if (projectile.y + projectile.radius > GROUND_Y && projectile.active) {
    projectile.active = false; // Desactivar
    projectile.y = GROUND_Y - projectile.radius; // Posar en el suelo

    // --- NUEVO: Lógica de Historial ---

    // 1. Calcular distancia final
    const finalDistance = projectile.x - cannon.x;
    projectile.launchData.distance = finalDistance;

    // 2. Guardar datos en el historial
    launchHistory.push(projectile.launchData);

    // 3. Guardar marca visual en el suelo
    landedProjectiles.push({
      x: projectile.x,
      y: projectile.y,
      radius: projectile.radius,
      color: 'rgba(255, 171, 0, 0.5)', // Naranja semitransparente
    });

    // 4. Actualizar el panel de historial
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

  // NUEVO: Dibujar las marcas del historial en el suelo
  for (const proj of landedProjectiles) {
    ctx.fillStyle = proj.color;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }

  // Dibujar el proyectil activo
  if (projectile.active) {
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

    updateLiveData(); // Actualizar datos en vivo
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

// MODIFICADA: Función de Disparo
function fireProjectile() {
  if (projectile.active) return;

  projectile.active = true;
  projectile.x = cannon.barrelEndX;
  projectile.y = cannon.barrelEndY;
  projectile.vx = INITIAL_VELOCITY * Math.cos(cannon.angle);
  projectile.vy = INITIAL_VELOCITY * Math.sin(cannon.angle);
  isAiming = true;

  // Convertir ángulo a grados para mostrar
  let angleInDegrees = Math.abs(cannon.angle * (180 / Math.PI)).toFixed(1);

  // Actualizar panel de datos
  dataVelocity.textContent = INITIAL_VELOCITY;
  dataAngle.textContent = angleInDegrees;
  dataPosX.textContent = '0.0';
  dataPosY.textContent = '0.0';

  // NUEVO: Guardar los datos de este disparo
  projectile.launchData = {
    id: launchHistory.length + 1,
    angle: cannon.angle,
    velocity: INITIAL_VELOCITY,
    // la 'distance' se añade al impactar
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
}

// Función para bloquear la mira
function lockAim(event) {
  if (event.target === canvas) {
    isAiming = false;
  }
}

// Función de ajuste de ventana
function onResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  GROUND_Y = canvas.height - 50;
  cannon.y = GROUND_Y - 70;
}

// --- 6. NUEVAS FUNCIONES PARA PANELES ---

// Muestra/Oculta el panel de DATOS
function toggleDataPanel() {
  dataPanel.classList.toggle('hidden');
}

// Muestra/Oculta el panel de HISTORIAL
function toggleHistoryPanel() {
  historyPanel.classList.toggle('hidden');
}

// Actualiza los datos en vivo (X, Y)
function updateLiveData() {
  let relativeX = (projectile.x - cannon.x).toFixed(1);
  let relativeY = (GROUND_Y - projectile.y).toFixed(1);
  dataPosX.textContent = relativeX;
  dataPosY.textContent = relativeY;
}

// Actualiza el panel de HISTORIAL
function updateHistoryPanel() {
  // Limpiar lista anterior
  historyList.innerHTML = '';

  // Recorrer el historial al revés (primero el más nuevo)
  for (let i = launchHistory.length - 1; i >= 0; i--) {
    const data = launchHistory[i];

    // Formatear datos
    const angleDeg = (Math.abs(data.angle) * (180 / Math.PI)).toFixed(1);
    const dist = data.distance.toFixed(1);

    // Crear el item de la lista
    const li = document.createElement('li');
    li.innerHTML = `<strong>Lanz. #${data.id}</strong><br>
                        Ángulo: ${angleDeg}° | Distancia: ${dist} m`;

    // Añadir a la lista
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
toggleHistoryButton.addEventListener('click', toggleHistoryPanel); // NUEVO

onResize();
loadAssets();
requestAnimationFrame(gameLoop);
