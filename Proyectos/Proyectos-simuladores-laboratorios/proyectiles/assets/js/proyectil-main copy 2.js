/*
 * Archivo: proyectil-main.js
 * Nivel 3: Implementación de Cámara (Viewport) y Botón de Disparo.
 */

// --- CONFIGURACIÓN GLOBAL ---
const CANVAS_ID = 'gameCanvas';
const GRAVITY = 9.81;
const PIXELS_PER_METER = 10;
const GROUND_LEVEL_METERS = 5;
const GROUND_TEXTURE_PATH = 'assets/img/moon-texture.png';

// --- ¡NUEVO! OBJETO CÁMARA ---
// Este objeto rastreará la "vista" del mundo.
let camera = {
  x: 0,
  y: 0, // La altura Y de la cámara (en metros del mundo)
  followThreshold: 0.6, // Seguirá al proyectil si supera el 60% de la altura de la pantalla

  /**
   * Actualiza la posición de la cámara para seguir a un objetivo (proyectil).
   */
  update(target, canvasHeight) {
    if (!target) return;

    // Convertir la altura del mundo del objetivo a la altura de la pantalla
    const targetCanvasY = canvasHeight - (target.y - this.y) * PIXELS_PER_METER;
    const followLine = canvasHeight * (1 - this.followThreshold); // Línea al 60% superior

    if (targetCanvasY < followLine) {
      // El objetivo está por encima de la línea, mover la cámara hacia arriba
      const targetCameraY =
        target.y -
        (canvasHeight * (1 - this.followThreshold)) / PIXELS_PER_METER;
      this.y = targetCameraY;
    }

    // --- ¡LA REGLA DEL SUELO! ---
    // Esto implementa tu "no scroll hacia abajo".
    // La cámara NUNCA puede ir por debajo del nivel del suelo (0).
    if (this.y < 0) {
      this.y = 0;
    }
  },

  /**
   * Aplica la transformación de la cámara al contexto del canvas.
   * Mueve el "mundo" para que la cámara esté en su lugar.
   */
  applyTransform(ctx, canvasHeight) {
    ctx.save();
    // Mover la cámara hacia ARRIBA (Y positivo) significa
    // mover el canvas (translate) hacia ABAJO (Y positivo en canvas).
    const cameraCanvasY = this.y * PIXELS_PER_METER;
    ctx.translate(0, cameraCanvasY);
  },

  /**
   * Restaura el contexto del canvas
   */
  restoreTransform(ctx) {
    ctx.restore();
  },
};

// --- CLASES DEL JUEGO (ACTUALIZADAS) ---

class Projectile {
  // ... (constructor es igual) ...
  constructor(x, y, initialVelocity, angleDegrees, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    const angleRadians = (angleDegrees * Math.PI) / 180;
    this.vx = initialVelocity * Math.cos(angleRadians);
    this.vy = initialVelocity * Math.sin(angleRadians);
    this.time = 0;
    this.isFlying = true;
  }

  // ... (update es igual) ...
  update(deltaTime) {
    if (!this.isFlying) return;
    this.time += deltaTime;
    this.x = this.x + this.vx * deltaTime;
    this.y =
      this.y + this.vy * deltaTime - 0.5 * GRAVITY * deltaTime * deltaTime;
    this.vy = this.vy - GRAVITY * deltaTime;

    if (this.y <= GROUND_LEVEL_METERS) {
      this.y = GROUND_LEVEL_METERS;
      this.isFlying = false;
      console.log(`Proyectil aterrizó en X: ${this.x.toFixed(2)}m`);
    }
  }

  /**
   * ¡ACTUALIZADO! La función Draw ahora necesita saber dónde está la cámara.
   */
  draw(ctx, canvasHeight, camera) {
    ctx.fillStyle = this.color;

    // --- LÓGICA DE CÁMARA ---
    // Convertimos la posición del mundo (this.y) a la posición de la pantalla,
    // teniendo en cuenta el desplazamiento de la cámara (camera.y).
    const drawX = (this.x - camera.x) * PIXELS_PER_METER;
    const drawY = canvasHeight - (this.y - camera.y) * PIXELS_PER_METER;

    ctx.beginPath();
    ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Launcher {
  // ... (constructor es igual) ...
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.currentAngle = 45;
    this.currentVelocity = 25;
  }

  /**
   * ¡ACTUALIZADO! La función Draw también necesita la cámara.
   */
  draw(ctx, canvasHeight, camera) {
    ctx.fillStyle = this.color;

    // --- LÓGICA DE CÁMARA ---
    const drawX = (this.x - camera.x) * PIXELS_PER_METER;
    const drawY = canvasHeight - (this.y - camera.y) * PIXELS_PER_METER;

    ctx.beginPath();
    ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Dibuja el brazo indicador
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const angleRadians = (this.currentAngle * Math.PI) / 180;
    const armLength = (this.currentVelocity * PIXELS_PER_METER) / 2;
    ctx.beginPath();
    ctx.moveTo(drawX, drawY);
    ctx.lineTo(
      drawX + armLength * Math.cos(angleRadians),
      drawY - armLength * Math.sin(angleRadians)
    );
    ctx.stroke();
  }

  /**
   * ¡ACTUALIZADO! La lógica de arrastre debe compensar el scroll de la cámara.
   */
  updateAngleAndVelocity(mouseX, mouseY, canvasHeight, camera) {
    // Coordenada Y real del ratón en el mundo (compensando la cámara)
    const mouseWorldY = canvasHeight - mouseY + camera.y * PIXELS_PER_METER;

    const launcherCanvasX = this.x * PIXELS_PER_METER;
    // Coordenada Y real del lanzador en el mundo
    const launcherWorldY = this.y * PIXELS_PER_METER;

    const dx = mouseX - launcherCanvasX;
    const dy = launcherWorldY - mouseWorldY; // Invertido para que arriba sea positivo

    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    if (angle > 90 && angle < 180) angle = 90;
    if (angle < 0 || angle > 90) angle = 0;
    this.currentAngle = angle;

    const distance = Math.sqrt(dx * dx + dy * dy);
    this.currentVelocity = Math.max(
      5,
      Math.min(50, distance / (PIXELS_PER_METER / 2))
    );
  }
}

// --- GESTIÓN DEL JUEGO ---
let canvas, ctx;
let lastTime = 0;
let projectiles = [];
let launcher;
let isDraggingLauncher = false;
let groundPattern = null;

function init() {
  canvas = document.getElementById(CANVAS_ID);
  ctx = canvas.getContext('2d');

  // --- ¡NUEVO! Event listener para el botón de disparo ---
  document
    .getElementById('fireButton')
    .addEventListener('click', fireProjectile);

  window.addEventListener('resize', resizeCanvas);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);

  loadAssets();
}

function loadAssets() {
  // ... (sin cambios) ...
  const groundImage = new Image();
  groundImage.src = GROUND_TEXTURE_PATH;

  groundImage.onload = () => {
    groundPattern = ctx.createPattern(groundImage, 'repeat');
    startGame();
  };

  groundImage.onerror = () => {
    console.error(
      'Error: No se pudo cargar la textura del suelo en ' + GROUND_TEXTURE_PATH
    );
    startGame();
  };
}

function startGame() {
  launcher = new Launcher(2, GROUND_LEVEL_METERS, 8, '#FF0077');
  resizeCanvas();
  requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

/**
 * ¡ACTUALIZADO! La función Draw también necesita la cámara.
 */
function drawGround(camera) {
  // --- LÓGICA DE CÁMARA ---
  const groundCanvasY =
    canvas.height - (GROUND_LEVEL_METERS - camera.y) * PIXELS_PER_METER;

  if (groundPattern) {
    ctx.fillStyle = groundPattern;
    ctx.fillRect(
      0,
      groundCanvasY,
      canvas.width,
      canvas.height - groundCanvasY + camera.y * PIXELS_PER_METER
    );
  } else {
    ctx.fillStyle = '#808080';
    ctx.fillRect(
      0,
      groundCanvasY,
      canvas.width,
      canvas.height - groundCanvasY + camera.y * PIXELS_PER_METER
    );
  }
}

function gameLoop(currentTime) {
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  update(deltaTime || 0);
  draw();

  requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
  // Actualiza todos los proyectiles
  projectiles = projectiles.filter((p) => {
    p.update(deltaTime);
    return p.isFlying;
  });

  // --- ¡NUEVO! Actualiza la cámara para seguir al primer proyectil ---
  if (projectiles.length > 0) {
    camera.update(projectiles[0], canvas.height);
  }
}

function draw() {
  // Limpia el canvas (área visible)
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // --- ¡NUEVO! Aplica la transformación de la cámara ---
  // Todo lo que se dibuje después de esto será "movido" por la cámara
  camera.applyTransform(ctx, canvas.height);

  // 1. Dibuja el suelo
  drawGround(camera);

  // 2. Dibuja el lanzador
  launcher.draw(ctx, canvas.height, camera);

  // 3. Dibuja todos los proyectiles
  projectiles.forEach((p) => p.draw(ctx, canvas.height, camera));

  // --- ¡NUEVO! Restaura el canvas ---
  // Esto es para que futuras UI (como el HUD) no se vean afectadas por la cámara.
  camera.restoreTransform(ctx);

  // (Cualquier cosa dibujada aquí, como un puntaje, estaría fija en la pantalla)
}

function onMouseDown(event) {
  // Evita interactuar con el canvas si se hace clic en el botón
  if (event.target.id === 'fireButton') return;

  // ... (el resto de la lógica es similar) ...
  const mouseX = event.clientX;
  const mouseY = event.clientY;

  const launcherCanvasX = (launcher.x - camera.x) * PIXELS_PER_METER;
  const launcherCanvasY =
    canvas.height - (launcher.y - camera.y) * PIXELS_PER_METER;

  const distanceToLauncher = Math.sqrt(
    Math.pow(mouseX - launcherCanvasX, 2) +
      Math.pow(mouseY - launcherCanvasY, 2)
  );

  if (distanceToLauncher < launcher.radius * PIXELS_PER_METER * 2) {
    isDraggingLauncher = true;
  }
}

function onMouseMove(event) {
  if (isDraggingLauncher) {
    // ¡ACTUALIZADO! La función ahora necesita la cámara.
    launcher.updateAngleAndVelocity(
      event.clientX,
      event.clientY,
      canvas.height,
      camera
    );
  }
}

function onMouseUp(event) {
  if (isDraggingLauncher) {
    isDraggingLauncher = false;
    // ¡YA NO DISPARA! Solo suelta el cañón.
  }
}

// --- ¡NUEVA FUNCIÓN! ---
// Lógica de disparo, separada del mouse
function fireProjectile() {
  const newProjectile = new Projectile(
    launcher.x,
    launcher.y,
    launcher.currentVelocity,
    launcher.currentAngle,
    5,
    '#00BFFF'
  );
  projectiles.push(newProjectile);
}

// Inicia la aplicación
document.addEventListener('DOMContentLoaded', init);
