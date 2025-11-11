/*
 * Archivo: proyectil-main.js
 * Descripción: Lógica principal, motor de física y bucle de juego para el simulador.
 */

// --- CONFIGURACIÓN GLOBAL ---
const CANVAS_ID = 'gameCanvas';
const GRAVITY = 9.81; // m/s^2 (positiva, ya que va hacia abajo)
const PIXELS_PER_METER = 10; // Escala: 10 píxeles por metro

// --- CLASES DEL JUEGO ---

// Clase para el Proyectil (el "esférico")
class Projectile {
  constructor(x, y, initialVelocity, angleDegrees, radius, color) {
    this.x = x; // Posición X en el mundo (metros)
    this.y = y; // Posición Y en el mundo (metros)
    this.radius = radius;
    this.color = color;

    // Convertir ángulo de grados a radianes y descomponer velocidad
    const angleRadians = (angleDegrees * Math.PI) / 180;
    this.vx = initialVelocity * Math.cos(angleRadians); // Velocidad inicial X
    this.vy = initialVelocity * Math.sin(angleRadians); // Velocidad inicial Y

    this.time = 0; // Tiempo transcurrido desde el lanzamiento
    this.isFlying = true;
  }

  update(deltaTime) {
    if (!this.isFlying) return;

    this.time += deltaTime;

    // Ecuaciones de movimiento parabólico
    this.x = this.x + this.vx * deltaTime;
    this.y =
      this.y + this.vy * deltaTime - 0.5 * GRAVITY * deltaTime * deltaTime; // Actualiza Y por la gravedad
    this.vy = this.vy - GRAVITY * deltaTime; // La velocidad Y disminuye por la gravedad

    // Si el proyectil toca el suelo (o va por debajo), deténlo
    if (this.y <= 0) {
      this.y = 0; // Asegúrate de que no se hunda
      this.isFlying = false;
      console.log(`Proyectil aterrizó en X: ${this.x.toFixed(2)}m`);
    }
  }

  draw(ctx, canvasHeight) {
    ctx.fillStyle = this.color;
    // Convertir coordenadas del mundo a coordenadas del canvas
    // El eje Y del canvas es invertido (0 arriba, max abajo)
    const drawX = this.x * PIXELS_PER_METER;
    const drawY = canvasHeight - this.y * PIXELS_PER_METER;

    ctx.beginPath();
    ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Clase para el Lanzador (Cañón)
class Launcher {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.currentAngle = 45; // Ángulo inicial por defecto (grados)
    this.currentVelocity = 25; // Velocidad inicial por defecto (m/s)
  }

  draw(ctx, canvasHeight) {
    ctx.fillStyle = this.color;
    // Convertir coordenadas del mundo a coordenadas del canvas
    const drawX = this.x * PIXELS_PER_METER;
    const drawY = canvasHeight - this.y * PIXELS_PER_METER;

    ctx.beginPath();
    ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Dibuja un "brazo" para indicar el ángulo y la velocidad
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    const angleRadians = (this.currentAngle * Math.PI) / 180;
    const armLength = (this.currentVelocity * PIXELS_PER_METER) / 2; // Longitud proporcional a la velocidad
    ctx.beginPath();
    ctx.moveTo(drawX, drawY);
    ctx.lineTo(
      drawX + armLength * Math.cos(angleRadians),
      drawY - armLength * Math.sin(angleRadians)
    );
    ctx.stroke();
  }

  // Simula arrastrar el cañón para cambiar ángulo y velocidad
  updateAngleAndVelocity(mouseX, mouseY, canvasHeight) {
    const launcherCanvasX = this.x * PIXELS_PER_METER;
    const launcherCanvasY = canvasHeight - this.y * PIXELS_PER_METER;

    const dx = mouseX - launcherCanvasX;
    const dy = mouseY - launcherCanvasY;

    // Calcular ángulo
    let angle = (Math.atan2(-dy, dx) * 180) / Math.PI; // -dy porque el Y del canvas es inverso
    if (angle < 0) angle += 360; // Asegurarse de que el ángulo esté entre 0 y 360

    // Limitar a un rango razonable para un cañón (0 a 90 grados)
    if (angle > 90 && angle < 180) angle = 90;
    if (angle < 0 || angle > 90) angle = 0; // Limitar el rango de control a 0-90 grados para facilidad

    this.currentAngle = angle;

    // Calcular velocidad (basada en la distancia del mouse al cañón)
    const distance = Math.sqrt(dx * dx + dy * dy);
    this.currentVelocity = Math.max(
      5,
      Math.min(50, distance / (PIXELS_PER_METER / 2))
    ); // Min 5m/s, Max 50m/s
  }
}

// --- GESTIÓN DEL JUEGO ---
let canvas, ctx;
let lastTime = 0;
let projectiles = [];
let launcher;
let isDraggingLauncher = false;

function init() {
  canvas = document.getElementById(CANVAS_ID);
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Inicializa el lanzador a la izquierda, a nivel del suelo
  launcher = new Launcher(2, 0, 8, '#FF0077'); // Radio 8 píxeles

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);

  requestAnimationFrame(gameLoop); // Inicia el bucle de juego
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Dibuja el suelo (horizonte)
  drawGround();
}

function drawGround() {
  ctx.strokeStyle = '#2d5e5e'; /* Color del suelo */
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.stroke();
}

function gameLoop(currentTime) {
  const deltaTime = (currentTime - lastTime) / 1000; // Convertir a segundos
  lastTime = currentTime;

  update(deltaTime);
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
  ctx.fillStyle = '#1a1a2e'; // Color de fondo (por si se borra el estilo CSS)
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dibuja el suelo
  drawGround();

  // Dibuja el lanzador
  launcher.draw(ctx, canvas.height);

  // Dibuja todos los proyectiles
  projectiles.forEach((p) => p.draw(ctx, canvas.height));
}

function onMouseDown(event) {
  // Convierte coordenadas del ratón a coordenadas del mundo (aproximadamente)
  const mouseX = event.clientX;
  const mouseY = event.clientY;

  const launcherCanvasX = launcher.x * PIXELS_PER_METER;
  const launcherCanvasY = canvas.height - launcher.y * PIXELS_PER_METER;

  // Comprueba si el click está cerca del lanzador para arrastrar
  const distanceToLauncher = Math.sqrt(
    Math.pow(mouseX - launcherCanvasX, 2) +
      Math.pow(mouseY - launcherCanvasY, 2)
  );

  if (distanceToLauncher < launcher.radius * PIXELS_PER_METER * 2) {
    // Un área un poco más grande que el radio
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
    // Lanza un proyectil al soltar el ratón después de arrastrar
    const newProjectile = new Projectile(
      launcher.x,
      launcher.y,
      launcher.currentVelocity,
      launcher.currentAngle,
      5, // Radio del proyectil
      '#00BFFF' // Color cian del proyectil
    );
    projectiles.push(newProjectile);
  }
}

// Inicia la aplicación cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', init);
