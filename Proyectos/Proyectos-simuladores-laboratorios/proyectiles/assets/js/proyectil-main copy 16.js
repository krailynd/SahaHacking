/*
 * Archivo: proyectil-main.js
 * Descripción: Lógica del Nivel 8 (Arreglo de Posición del Cañón).
 */

// --- 1. CONFIGURACIÓN INICIAL ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const fireButton = document.getElementById('fireButton');

const GROUND_IMAGE_PATH =
  'https.p.turbosquid.com/ts-thumb/nS/afcoJN/XJcoNe48/showcase/jpg/1488644923/1920x1080/fit_q87/30f8d7ebf3c2b9d904b688ff1e71360ff683b57e/showcase.jpg';
let groundImage = new Image();
let groundImageLoaded = false;
let GROUND_Y; // Altura del suelo (se define en onResize)

// --- VARIABLES DE SIMULACIÓN ---
const GRAVITY = 500;
const INITIAL_VELOCITY = 700;
let lastTime;
let isAiming = true; // Estado para controlar la mira

// --- Objeto Cañón (Con base) ---
let cannon = {
  x: 100,
  y: 0, // Se define en onResize
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
    return;
  }

  // Aplicar Gravedad
  projectile.vy += GRAVITY * deltaTime;

  // Actualizar Posición
  projectile.x += projectile.vx * deltaTime;
  projectile.y += projectile.vy * deltaTime;

  // Comprobar colisión con el suelo
  if (projectile.y + projectile.radius > GROUND_Y) {
    projectile.active = false;
    projectile.y = GROUND_Y - projectile.radius;
  }
}

// --- 4. FUNCIÓN DE DIBUJO ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar el suelo (imagen 3D)
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

  // Dibujar el cañón
  drawCannon();

  // Dibujar el proyectil (si está activo)
  if (projectile.active) {
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
}

// Función para dibujar el cañón modelado
function drawCannon() {
  ctx.save();
  // Se mueve a cannon.y (que ahora es GROUND_Y - 70)
  ctx.translate(cannon.x, cannon.y);

  // Dibuja la base (de y=0 a y=40)
  ctx.fillStyle = '#666';
  ctx.fillRect(-cannon.baseWidth / 2, 0, cannon.baseWidth, cannon.baseHeight);

  // Dibuja las ruedas (centradas en y=55, radio 15)
  // El fondo de las ruedas queda en y=70
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

  // Dibuja el pivote (en y=-5)
  ctx.translate(0, -5);
  ctx.rotate(cannon.angle);
  ctx.fillStyle = '#444';

  // Dibuja el tubo
  ctx.fillRect(
    0,
    -cannon.barrelWidth / 2,
    cannon.barrelLength,
    cannon.barrelWidth
  );

  // Calcula la punta
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
  if (projectile.active) return; // No disparar si ya hay uno en el aire

  projectile.active = true;
  projectile.x = cannon.barrelEndX;
  projectile.y = cannon.barrelEndY;
  projectile.vx = INITIAL_VELOCITY * Math.cos(cannon.angle);
  projectile.vy = INITIAL_VELOCITY * Math.sin(cannon.angle);

  // Reactivar la mira para el siguiente disparo
  isAiming = true;
}

// Mover el cañón con el mouse
function onMouseMove(event) {
  if (!isAiming) return; // No mover si la mira está bloqueada

  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // El cálculo del ángulo debe ser relativo al pivote del cañón
  // El pivote está en (cannon.x, cannon.y - 5)
  const dx = mouseX - cannon.x;
  const dy = mouseY - (cannon.y - 5); // Corregido para el pivote
  cannon.angle = Math.atan2(dy, dx);

  // Limitar el ángulo (entre -90 y 0 grados)
  cannon.angle = Math.max(-Math.PI / 2, Math.min(cannon.angle, 0));
}

// Función para bloquear la mira al hacer clic
function lockAim(event) {
  if (event.target === canvas) {
    isAiming = false; // Bloquea la mira
  }
}

// FUNCIÓN CORREGIDA (Nivel 8)
function onResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // 1. EL SUELO (Colisión)
  // Lo ponemos bajo, a 50px del borde.
  GROUND_Y = canvas.height - 50;

  // 2. EL ARREGLO (Posición del Cañón)
  // El modelo mide 70px de alto (base+ruedas) y se dibuja hacia abajo.
  // Así que lo anclamos 70px POR ENCIMA del suelo (GROUND_Y).
  cannon.y = GROUND_Y - 70;
}

// --- 6. INICIALIZACIÓN ---
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

onResize(); // Configurar tamaño inicial
loadAssets(); // Cargar imágenes
requestAnimationFrame(gameLoop); // Iniciar el bucle
