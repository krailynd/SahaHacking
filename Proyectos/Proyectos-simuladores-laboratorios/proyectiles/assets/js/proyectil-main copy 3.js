/*
 * Archivo: proyectil-main.js
 * Nivel 4: Lógica de cámara controlable, paneles de UI y HUD de datos.
 */

// --- CONFIGURACIÓN GLOBAL ---
const CANVAS_ID = 'gameCanvas';
const GRAVITY = 9.81;
const PIXELS_PER_METER = 10;
const GROUND_LEVEL_METERS = 5;
const GROUND_TEXTURE_PATH = 'assets/img/moon-texture.png';

// --- ESTADO GLOBAL DE LA UI ---
let isCameraFollowEnabled = true;

// --- Objeto Cámara (Actualizado) ---
let camera = {
  x: 0,
  y: 0,
  followThreshold: 0.6,

  update(target, canvasHeight) {
    if (!target) return;

    const targetCanvasY = canvasHeight - (target.y - this.y) * PIXELS_PER_METER;
    const followLine = canvasHeight * (1 - this.followThreshold);

    if (targetCanvasY < followLine) {
      const targetCameraY =
        target.y -
        (canvasHeight * (1 - this.followThreshold)) / PIXELS_PER_METER;
      this.y = targetCameraY;
    }

    // Regla del suelo: no scroll hacia abajo
    if (this.y < 0) {
      this.y = 0;
    }
  },

  /** ¡NUEVO! Resetea la cámara al suelo */
  reset() {
    // Podríamos hacerlo con una transición suave (lerp) en el futuro,
    // por ahora, es un reseteo instantáneo.
    this.y = 0;
  },

  applyTransform(ctx, canvasHeight) {
    ctx.save();
    const cameraCanvasY = this.y * PIXELS_PER_METER;
    ctx.translate(0, cameraCanvasY);
  },

  restoreTransform(ctx) {
    ctx.restore();
  },
};

// --- Clases de Juego (Sin cambios en su lógica interna) ---
class Projectile {
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

  draw(ctx, canvasHeight, camera) {
    ctx.fillStyle = this.color;
    const drawX = (this.x - camera.x) * PIXELS_PER_METER;
    const drawY = canvasHeight - (this.y - camera.y) * PIXELS_PER_METER;
    ctx.beginPath();
    ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Launcher {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.currentAngle = 45;
    this.currentVelocity = 25;
  }

  draw(ctx, canvasHeight, camera) {
    ctx.fillStyle = this.color;
    const drawX = (this.x - camera.x) * PIXELS_PER_METER;
    const drawY = canvasHeight - (this.y - camera.y) * PIXELS_PER_METER;
    ctx.beginPath();
    ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
    ctx.fill();

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

  updateAngleAndVelocity(mouseX, mouseY, canvasHeight, camera) {
    const mouseWorldY = canvasHeight - mouseY + camera.y * PIXELS_PER_METER;
    const launcherCanvasX = this.x * PIXELS_PER_METER;
    const launcherWorldY = this.y * PIXELS_PER_METER;
    const dx = mouseX - launcherCanvasX;
    const dy = launcherWorldY - mouseWorldY;
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

// --- GESTIÓN DEL JUEGO Y UI ---
let canvas, ctx;
let lastTime = 0;
let projectiles = [];
let launcher;
let isDraggingLauncher = false;
let groundPattern = null;
let dataPanelContent = null; // ¡NUEVO! Referencia al panel de datos

function init() {
  canvas = document.getElementById(CANVAS_ID);
  ctx = canvas.getContext('2d');

  // --- ¡NUEVO! Conectar todos los elementos de la UI ---
  dataPanelContent = document.getElementById('data-content');

  // Botón de disparo
  document
    .getElementById('fireButton')
    .addEventListener('click', fireProjectile);

  // Checkbox de seguir
  document.getElementById('follow-checkbox').addEventListener('change', (e) => {
    isCameraFollowEnabled = e.target.checked;
  });

  // Botones del HUD para mostrar/ocultar paneles
  document.querySelectorAll('.hud-button[data-panel]').forEach((button) => {
    button.addEventListener('click', (e) => {
      const panelId = e.target.getAttribute('data-panel');
      togglePanel(panelId);
    });
  });

  // Botones 'X' de los paneles para cerrarlos
  document.querySelectorAll('.close-btn').forEach((button) => {
    button.addEventListener('click', (e) => {
      const panelId = e.target.getAttribute('data-panel');
      togglePanel(panelId, false); // Forzar a cerrar
    });
  });

  // Listeners del Canvas
  window.addEventListener('resize', resizeCanvas);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);

  loadAssets();
}

// --- ¡NUEVA FUNCIÓN! Para mostrar/ocultar paneles ---
function togglePanel(panelId, forceState) {
  const panel = document.getElementById(panelId);
  if (!panel) return;

  // Si se 'forceState' (true/false) úsalo, si no, invierte el estado actual
  const newState =
    forceState === undefined ? panel.style.display === 'none' : forceState;

  panel.style.display = newState ? 'block' : 'none';
}

function loadAssets() {
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

function drawGround(camera) {
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
  projectiles = projectiles.filter((p) => {
    p.update(deltaTime);
    return p.isFlying || p.y > 0; // Mantener proyectiles en el array hasta que estén bajo el suelo (por si acaso)
  });

  // --- ¡LÓGICA DE CÁMARA ACTUALIZADA! ---
  if (isCameraFollowEnabled && projectiles.length > 0) {
    // Seguir al último proyectil disparado
    camera.update(projectiles[projectiles.length - 1], canvas.height);
  } else {
    // Si la casilla está desmarcada, resetea la cámara al suelo
    camera.reset();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  camera.applyTransform(ctx, canvas.height);

  drawGround(camera);
  launcher.draw(ctx, canvas.height, camera);
  projectiles.forEach((p) => p.draw(ctx, canvas.height, camera));

  camera.restoreTransform(ctx);

  // --- ¡NUEVO! Actualizar el panel de datos en cada frame ---
  updateDataPanel();
}

// --- ¡NUEVA FUNCIÓN! ---
function updateDataPanel() {
  if (projectiles.length > 0) {
    // Mostrar datos del último proyectil
    const p = projectiles[projectiles.length - 1];
    dataPanelContent.innerHTML = `
            <p>X: ${p.x.toFixed(2)} m</p>
            <p>Y: ${p.y.toFixed(2)} m</p>
            <p>Vel. X: ${p.vx.toFixed(2)} m/s</p>
            <p>Vel. Y: ${p.vy.toFixed(2)} m/s</p>
            <p>Estado: ${p.isFlying ? 'En Vuelo' : 'Aterrizado'}</p>
        `;
  } else {
    dataPanelContent.innerHTML = 'Esperando disparo...';
  }
}

function onMouseDown(event) {
  // Evitar interactuar si se hace clic en un elemento de UI
  if (event.target.closest('.floating-panel, .hud-bar')) return;

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
  }
}

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
