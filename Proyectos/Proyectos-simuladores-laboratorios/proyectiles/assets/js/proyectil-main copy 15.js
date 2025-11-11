/*
 * Archivo: proyectil-main.js
 * Descripción: Lógica del Nivel 5 (Física de Proyectil y Disparo).
 */

// --- 1. CONFIGURACIÓN INICIAL ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const fireButton = document.getElementById('fireButton'); // El botón

const GROUND_IMAGE_PATH =
  'https://p.turbosquid.com/ts-thumb/nS/afcoJN/XJcoNe48/showcase/jpg/1488644923/1920x1080/fit_q87/30f8d7ebf3c2b9d904b688ff1e71360ff683b57e/showcase.jpg';
let groundImage = new Image();
let groundImageLoaded = false;
let GROUND_Y; // Altura del suelo (se define en onResize)

// --- VARIABLES DE SIMULACIÓN ---
const GRAVITY = 500; // píxeles/s^2. Un valor positivo "jala" hacia abajo.
const INITIAL_VELOCITY = 700; // píxeles/s. Velocidad inicial de disparo.
let lastTime; // Para calcular el deltaTime

// --- Objeto Cañón ---
let cannon = {
  x: 100, // Posición base X
  y: 0, // Posición base Y (se actualizará)
  baseWidth: 80,
  baseHeight: 40,
  barrelLength: 100,
  barrelWidth: 30,
  angle: -0.5, // Ángulo en radianes (negativo es arriba-derecha)
  barrelEndX: 0, // Punta del cañón X
  barrelEndY: 0, // Punta del cañón Y
};

// --- NUEVO: Objeto Proyectil ---
let projectile = {
  x: 0,
  y: 0,
  vx: 0, // Velocidad en X
  vy: 0, // Velocidad en Y
  radius: 10,
  color: 'orange',
  active: false, // ¿Está en el aire?
};

// --- 2. BUCLE PRINCIPAL DE JUEGO ---
function gameLoop(currentTime) {
  if (!lastTime) {
    lastTime = currentTime;
  }
  // DeltaTime es el tiempo (en segundos) que pasó desde el último fotograma
  let deltaTime = (currentTime - lastTime) / 1000;
  if (isNaN(deltaTime) || deltaTime > 0.5) {
    deltaTime = 0; // Evita saltos grandes si la pestaña se pausa
  }
  lastTime = currentTime;

  // Actualiza la lógica (física)
  update(deltaTime);

  // Dibuja todo en pantalla
  draw();

  // Pide el siguiente fotograma
  requestAnimationFrame(gameLoop);
}

// --- 3. NUEVO: FUNCIÓN DE ACTUALIZACIÓN (FÍSICA) ---
function update(deltaTime) {
  // Solo actualizamos la física si el proyectil está activo
  if (!projectile.active) {
    return; // No hacer nada
  }

  // 1. Aplicar Gravedad (actualiza la velocidad vertical)
  projectile.vy += GRAVITY * deltaTime;

  // 2. Actualizar Posición (basado en la velocidad)
  projectile.x += projectile.vx * deltaTime;
  projectile.y += projectile.vy * deltaTime;

  // 3. Comprobar colisión con el suelo
  if (projectile.y + projectile.radius > GROUND_Y) {
    projectile.active = false; // Desactiva el proyectil
    projectile.y = GROUND_Y - projectile.radius; // Lo posa en el suelo
  }
}

// --- 4. FUNCIÓN DE DIBUJO ---
function draw() {
  // Limpiar el canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar el suelo
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

  // NUEVO: Dibujar el proyectil (si está activo)
  if (projectile.active) {
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
}

// Función para dibujar el cañón (sin cambios)
function drawCannon() {
  ctx.save();
  // Moverse a la base del cañón
  ctx.translate(cannon.x, cannon.y);

  // Dibujar la base
  ctx.fillStyle = '#666';
  ctx.fillRect(-cannon.baseWidth / 2, 0, cannon.baseWidth, cannon.baseHeight);

  // Ruedas de la base
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

  // Mover el "pivote" al centro del cañón
  ctx.translate(0, -5);
  ctx.rotate(cannon.angle);
  ctx.fillStyle = '#444';

  // Dibujar el cañón
  ctx.fillRect(
    0,
    -cannon.barrelWidth / 2,
    cannon.barrelLength,
    cannon.barrelWidth
  );

  // Calcular la punta del cañón (en coordenadas globales)
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

// NUEVA: Función de Disparo
function fireProjectile() {
  // 1. Activar el proyectil
  projectile.active = true;

  // 2. Ponerlo en la punta del cañón
  projectile.x = cannon.barrelEndX;
  projectile.y = cannon.barrelEndY;

  // 3. Darle velocidad inicial basada en el ángulo del cañón
  projectile.vx = INITIAL_VELOCITY * Math.cos(cannon.angle);
  projectile.vy = INITIAL_VELOCITY * Math.sin(cannon.angle);
}

// Mover el cañón con el mouse (sin cambios)
function onMouseMove(event) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // Calcular ángulo
  const dx = mouseX - cannon.x;
  const dy = mouseY - cannon.y;
  cannon.angle = Math.atan2(dy, dx);

  // Limitar el ángulo (ej: entre -90 y 0 grados)
  cannon.angle = Math.max(-Math.PI / 2, Math.min(cannon.angle, 0));
}

// Ajustar el canvas al tamaño de la ventana (actualizado)
function onResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Redefinir el suelo
  GROUND_Y = canvas.height - 100; // El suelo está 100px por encima del fondo

  // Actualizar la posición Y base del cañón
  cannon.y = GROUND_Y;
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
fireButton.addEventListener('click', fireProjectile); // Conectar el botón

onResize(); // Llamar una vez para configurar el tamaño inicial
loadAssets();
requestAnimationFrame(gameLoop); // Iniciar el bucle de juego
