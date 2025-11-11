/*
 * Archivo: proyectil-main.js
 * Descripción: Lógica principal, motor de física y bucle de juego para el simulador.
 * Nivel 2: Carga de texturas para el suelo.
 */

// --- CONFIGURACIÓN GLOBAL ---
const CANVAS_ID = 'gameCanvas';
const GRAVITY = 9.81; // m/s^2
const PIXELS_PER_METER = 10; // Escala

// --- NUEVA CONFIGURACIÓN DEL SUELO ---
const GROUND_LEVEL_METERS = 5; // Vamos a elevar el suelo a 5 metros de altura
const GROUND_TEXTURE_PATH = 'assets/img/moon-texture.png'; // Ruta a tu textura

// --- CLASES DEL JUEGO ---

// Clase para el Proyectil (el "esférico")
class Projectile {
  constructor(x, y, initialVelocity, angleDegrees, radius, color) {
    this.x = x; // Posición X en el mundo (metros)
    this.y = y; // Posición Y en el mundo (metros)
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

    // Ecuaciones de movimiento (igual que antes)
    this.x = this.x + this.vx * deltaTime;
    this.y =
      this.y + this.vy * deltaTime - 0.5 * GRAVITY * deltaTime * deltaTime;
    this.vy = this.vy - GRAVITY * deltaTime;

    // --- FÍSICA ACTUALIZADA ---
    // Ahora colisiona con el NIVEL DEL SUELO, no con 0
    if (this.y <= GROUND_LEVEL_METERS) {
      this.y = GROUND_LEVEL_METERS; // Asegúrate de que no se hunda
      this.isFlying = false;
      console.log(`Proyectil aterrizó en X: ${this.x.toFixed(2)}m`);
    }
  }

  draw(ctx, canvasHeight) {
    ctx.fillStyle = this.color;
    // El eje Y del canvas es invertido (0 arriba, max abajo)
    const drawX = this.x * PIXELS_PER_METER;
    const drawY = canvasHeight - this.y * PIXELS_PER_METER; // ¡Esta fórmula sigue funcionando!

    ctx.beginPath();
    ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Clase para el Lanzador (Cañón)
class Launcher {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y; // La altura Y ahora es importante
    this.radius = radius;
    this.color = color;
    this.currentAngle = 45;
    this.currentVelocity = 25;
  }

  draw(ctx, canvasHeight) {
    ctx.fillStyle = this.color;
    // Dibujar el lanzador en su posición Y correcta
    const drawX = this.x * PIXELS_PER_METER;
    const drawY = canvasHeight - this.y * PIXELS_PER_METER;

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

  updateAngleAndVelocity(mouseX, mouseY, canvasHeight) {
    const launcherCanvasX = this.x * PIXELS_PER_METER;
    const launcherCanvasY = canvasHeight - this.y * PIXELS_PER_METER;

    const dx = mouseX - launcherCanvasX;
    const dy = mouseY - launcherCanvasY;

    let angle = (Math.atan2(-dy, dx) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    // Limitar a un rango razonable (0 a 90 grados)
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
let groundPattern = null; // ¡NUEVO! Variable para guardar nuestro patrón de textura

// Esta función se llama primero
function init() {
  canvas = document.getElementById(CANVAS_ID);
  ctx = canvas.getContext('2d');

  // Configura los listeners
  window.addEventListener('resize', resizeCanvas);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);

  // ¡NUEVO! Carga los assets primero, y LUEGO inicia el juego
  loadAssets();
}

// ¡NUEVA FUNCIÓN! Para cargar imágenes, sonidos, etc.
function loadAssets() {
  console.log('Cargando assets...');
  const groundImage = new Image();
  groundImage.src = GROUND_TEXTURE_PATH;

  // Este evento se dispara CUANDO la imagen se ha cargado
  groundImage.onload = () => {
    console.log('¡Textura del suelo cargada!');
    // Crea el patrón repetible
    groundPattern = ctx.createPattern(groundImage, 'repeat');

    // Ahora que tenemos la textura, podemos iniciar el juego
    startGame();
  };

  // Manejo de error si no se encuentra la imagen
  groundImage.onerror = () => {
    console.error(
      'Error: No se pudo cargar la textura del suelo en ' + GROUND_TEXTURE_PATH
    );
    console.error(
      "Asegúrate de haber descargado una textura y guardado en la carpeta 'assets/img/moon-texture.png'"
    );
    // Inicia el juego igualmente, pero el suelo será de un color sólido
    startGame();
  };
}

// ¡NUEVA FUNCIÓN! Se llama después de que los assets están listos
function startGame() {
  // Inicializa el lanzador EN EL SUELO
  launcher = new Launcher(2, GROUND_LEVEL_METERS, 8, '#FF0077');

  // Asegúrate de que el canvas tenga el tamaño correcto
  resizeCanvas();

  // Inicia el bucle de juego
  requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// --- FUNCIÓN DE DIBUJO DEL SUELO ACTUALIZADA ---
function drawGround() {
  // Calcula dónde empieza el suelo en el canvas (coordenadas de píxeles)
  const groundCanvasY = canvas.height - GROUND_LEVEL_METERS * PIXELS_PER_METER;

  if (groundPattern) {
    // Dibuja el patrón de textura
    ctx.fillStyle = groundPattern;
    // Dibuja un rectángulo desde el nivel del suelo hasta el fondo de la pantalla
    ctx.fillRect(0, groundCanvasY, canvas.width, canvas.height - groundCanvasY);
  } else {
    // Si la textura falló en cargar, dibuja un suelo gris simple
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, groundCanvasY, canvas.width, canvas.height - groundCanvasY);
  }
}

function gameLoop(currentTime) {
  const deltaTime = (currentTime - lastTime) / 1000; // Convertir a segundos
  lastTime = currentTime;

  update(deltaTime || 0); // (|| 0) para evitar NaN en el primer frame
  draw();

  requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
  // Actualiza todos los proyectiles en vuelo
  projectiles = projectiles.filter((p) => {
    p.update(deltaTime);
    return p.isFlying; // Mantener solo los que siguen volando
  });
}

function draw() {
  // Limpia el canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // --- ORDEN DE DIBUJO ---
  // 1. Dibuja el suelo PRIMERO
  drawGround();

  // 2. Dibuja el lanzador (encima del suelo)
  launcher.draw(ctx, canvas.height);

  // 3. Dibuja todos los proyectiles (encima de todo)
  projectiles.forEach((p) => p.draw(ctx, canvas.height));
}

function onMouseDown(event) {
  const mouseX = event.clientX;
  const mouseY = event.clientY;

  const launcherCanvasX = launcher.x * PIXELS_PER_METER;
  const launcherCanvasY = canvas.height - launcher.y * PIXELS_PER_METER;

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
      canvas.height
    );
  }
}

function onMouseUp(event) {
  if (isDraggingLauncher) {
    isDraggingLauncher = false;
    // Lanza un proyectil desde la posición del lanzador
    const newProjectile = new Projectile(
      launcher.x,
      launcher.y, // Lanza desde la altura del suelo
      launcher.currentVelocity,
      launcher.currentAngle,
      5,
      '#00BFFF'
    );
    projectiles.push(newProjectile);
  }
}

// Inicia la aplicación cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', init);
