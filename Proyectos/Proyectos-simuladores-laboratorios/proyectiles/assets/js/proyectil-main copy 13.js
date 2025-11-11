/*
 * Archivo: proyectil-main.js
 * Descripción: Nivel 4 (Modelado de un Cañón funcional).
 */

// --- 1. CONFIGURACIÓN ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GROUND_IMAGE_PATH =
  'https://p.turbosquid.com/ts-thumb/nS/afcoJN/XJcoNe48/showcase/jpg/1488644923/1920x1080/fit_q87/30f8d7ebf3c2b9d904b688ff1e71360ff683b57e/showcase.jpg';
let groundImage = new Image();
let groundImageLoaded = false;

let GROUND_Y;

// --- Objeto Cañón y Mouse ---
let cannon;
let mouse = { x: 0, y: 0 };
const CANNON_X_POSITION = 60; // Posición X fija del cañón

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

  update(deltaTime); // Llamamos a la función de actualización
  draw();
  requestAnimationFrame(gameLoop);
}

// --- Clase para modelar el Cañón ---
class Cannon {
  constructor(x, y) {
    this.x = x; // Posición del pivote (centro de la base)
    this.y = y; // Posición del pivote (sobre el suelo)
    this.angle = 0; // Ángulo en radianes (0 es horizontal)

    // Dimensiones del modelo
    this.barrelLength = 40;
    this.barrelWidth = 20;
    this.baseRadius = 15;
  }

  /**
   * Actualiza el ángulo del cañón para apuntar al mouse.
   */
  update(mouseX, mouseY) {
    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    let newAngle = Math.atan2(dy, dx); // Ángulo hacia el mouse

    // Lógica para limitar el ángulo (que no apunte al suelo)
    if (newAngle > 0) {
      // El mouse está "debajo" del cañón
      newAngle = 0; // Limita a 0 grados (recto)
    }
    if (newAngle < -Math.PI / 2) {
      // El mouse está demasiado "arriba"
      newAngle = -Math.PI / 2; // Limita a -90 grados (recto arriba)
    }

    this.angle = newAngle;
  }

  /**
   * Dibuja el cañón modelado en el canvas.
   */
  draw(ctx) {
    // 1. Dibujar la base (semicírculo)
    ctx.fillStyle = '#FF0077'; // Color rosa/rojo
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.baseRadius, Math.PI, 0); // Semicírculo sobre el suelo
    ctx.fill();

    // 2. Dibujar el barril (el que rota)
    // Usamos save/restore para que la rotación solo afecte al barril
    ctx.save();
    ctx.translate(this.x, this.y); // Mover el origen al pivote
    ctx.rotate(this.angle); // Rotar el canvas

    // Dibujar el rectángulo del barril
    ctx.fillStyle = '#555555'; // Gris oscuro
    ctx.fillRect(0, -this.barrelWidth / 2, this.barrelLength, this.barrelWidth);

    ctx.restore(); // Restaurar el canvas a su estado original (sin rotación)
  }
}

// --- 3. FUNCIÓN DE ACTUALIZACIÓN ---
function update(deltaTime) {
  // Si el cañón existe, actualiza su ángulo
  if (cannon) {
    cannon.update(mouse.x, mouse.y);
  }
}

// --- 4. FUNCIÓN DE DIBUJO ---
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
}

// --- 5. EVENTOS ---
function onResize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  GROUND_Y = canvas.height - 50;

  // Crea o actualiza la posición del cañón
  if (!cannon) {
    // Crea el cañón por primera vez
    cannon = new Cannon(CANNON_X_POSITION, GROUND_Y);
  } else {
    // Si ya existe, solo actualiza su altura
    cannon.y = GROUND_Y;
  }
}

// Event listener para el mouse
function onMouseMove(event) {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
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
window.addEventListener('resize', onResize);
window.addEventListener('mousemove', onMouseMove); // Escucha el mouse

onResize();
loadAssets();
requestAnimationFrame(gameLoop);
