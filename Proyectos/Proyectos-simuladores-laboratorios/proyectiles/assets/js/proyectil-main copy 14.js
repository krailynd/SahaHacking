/*
 * Archivo: proyectil-main.js
 * Descripción: Nivel 5 (Implementación de Física y Disparo).
 */

// --- 1. CONFIGURACIÓN ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Constantes de Física ---
const PIXELS_PER_METER = 30; // 30 píxeles = 1 metro
const GRAVITY = 9.8 * PIXELS_PER_METER; // Gravedad en Píxeles/s^2

// --- Carga de Assets ---
const GROUND_IMAGE_PATH =
  'https://p.turbosquid.com/ts-thumb/nS/afcoJN/XJcoNe48/showcase/jpg/1488644923/1920x1080/fit_q87/30f8d7ebf3c2b9d904b688ff1e71360ff683b57e/showcase.jpg';
let groundImage = new Image();
let groundImageLoaded = false;

// --- Estado del Juego ---
let GROUND_Y;
let cannon;
let projectiles = []; // ¡NUEVO! Array para guardar los "esféricos"
let mouse = { x: 0, y: 0 };
const CANNON_X_POSITION = 60;

// --- 2. EL BUCLE DE JUEGO ---
let lastTime;
function gameLoop(currentTime) {
  if (!lastTime) {
    lastTime = currentTime;
  }
  let deltaTime = (currentTime - lastTime) / 1000;
  if (isNaN(deltaTime) || deltaTime > 0.5) {
    deltaTime = 0;
  }
  lastTime = currentTime;

  update(deltaTime); // Actualiza la física
  draw(); // Dibuja todo
  requestAnimationFrame(gameLoop);
}

// --- 3. CLASES (Cañón y Proyectil) ---

class Cannon {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = -0.78; // 45 grados por defecto
    this.velocity = 150; // Velocidad de disparo por defecto

    // Modelo del cañón
    this.barrelLength = 40;
    this.barrelWidth = 20;
    this.baseRadius = 15;
  }

  update(mouseX, mouseY) {
    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    let newAngle = Math.atan2(dy, dx);

    // Limitar ángulo
    if (newAngle > -0.1) {
      // -0.1 radianes (casi horizontal)
      newAngle = -0.1;
    }
    if (newAngle < -Math.PI / 2) {
      // -90 grados
      newAngle = -Math.PI / 2;
    }
    this.angle = newAngle;

    // La velocidad se basa en la distancia del mouse
    const distance = Math.sqrt(dx * dx + dy * dy);
    this.velocity = Math.max(100, Math.min(distance * 1.5, 400));
  }

  draw(ctx) {
    // 1. Dibujar la base
    ctx.fillStyle = '#FF0077';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.baseRadius, Math.PI, 0);
    ctx.fill();

    // 2. Dibujar el barril (rotado)
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = '#555555';
    ctx.fillRect(0, -this.barrelWidth / 2, this.barrelLength, this.barrelWidth);
    ctx.restore();
  }

  /**
   * ¡NUEVO! Crea y devuelve un nuevo proyectil.
   */
  fire() {
    // Calcular el punto de inicio (la punta del barril)
    const startX = this.x + Math.cos(this.angle) * this.barrelLength;
    const startY = this.y + Math.sin(this.angle) * this.barrelLength;

    console.log('¡Disparando!');
    return new Projectile(startX, startY, this.angle, this.velocity);
  }
}

/**
 * ¡NUEVO! Clase para el "Esférico"
 */
class Projectile {
  constructor(x, y, angle, velocity) {
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.color = '#00BFFF'; // Esférico azul

    // Descomponer velocidad y ángulo
    this.vx = Math.cos(angle) * velocity; // Velocidad X
    this.vy = Math.sin(angle) * velocity; // Velocidad Y (negativa = hacia arriba)

    this.isFlying = true;
  }

  /**
   * Actualiza la física del proyectil en cada frame.
   */
  update(deltaTime) {
    if (!this.isFlying) return;

    // Aplicar velocidad
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    // Aplicar gravedad (la gravedad es positiva, tira hacia abajo)
    this.vy += GRAVITY * deltaTime;

    // Comprobar si tocó el suelo
    if (this.y + this.radius > GROUND_Y) {
      this.y = GROUND_Y - this.radius; // Clavarlo al suelo
      this.isFlying = false; // Detener el movimiento
    }
  }

  /**
   * Dibuja el proyectil.
   */
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- 4. FUNCIONES DE ACTUALIZACIÓN Y DIBUJO ---
function update(deltaTime) {
  if (cannon) {
    cannon.update(mouse.x, mouse.y);
  }

  // Actualizar cada proyectil en el aire
  projectiles.forEach((p) => p.update(deltaTime));
}

function draw() {
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
  if (cannon) {
    cannon.draw(ctx);
  }

  // Dibujar cada proyectil
  projectiles.forEach((p) => p.draw(ctx));
}

// --- 5. EVENTOS ---
function onResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  GROUND_Y = canvas.height - 50;

  if (!cannon) {
    cannon = new Cannon(CANNON_X_POSITION, GROUND_Y);
  } else {
    cannon.y = GROUND_Y;
  }
}

function onMouseMove(event) {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
}

/**
 * ¡NUEVO! Función que se llama al hacer clic en el botón.
 */
function fireProjectile() {
  if (!cannon) return;
  const newProjectile = cannon.fire();
  projectiles.push(newProjectile);
}

// --- Función para cargar assets ---
function loadAssets() {
  groundImage.src = GROUND_IMAGE_PATH;
  groundImage.onload = () => {
    groundImageLoaded = true;
    console.log('Suelo 3D cargado.');
  };
  groundImage.onerror = () => {
    console.error('No se pudo cargar la imagen del suelo.');
  };
}

// --- 6. INICIAR TODO ---
function init() {
  console.log('Iniciando Nivel 5...');
  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', onMouseMove);

  // ¡NUEVO! Conectar el botón
  const fireBtn = document.getElementById('fireButton');
  if (fireBtn) {
    fireBtn.addEventListener('click', fireProjectile);
  } else {
    console.error('No se encontró el botón de disparo.');
  }

  onResize();
  loadAssets();

  // Iniciar el bucle de juego de forma segura
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

// Espera a que el HTML esté listo para iniciar el script
document.addEventListener('DOMContentLoaded', init);
