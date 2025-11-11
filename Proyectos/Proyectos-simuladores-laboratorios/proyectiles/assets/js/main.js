// --- 1. Referencias a Elementos del DOM ---
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d'); // Contexto 2D para dibujar

// Controles
const angleInput = document.getElementById('angle');
const velocityInput = document.getElementById('velocity');
const launchButton = document.getElementById('launchButton');

// Etiquetas para mostrar valores
const angleValue = document.getElementById('angleValue');
const velocityValue = document.getElementById('velocityValue');

// --- 2. Constantes y Variables de Simulación ---
const g = 9.81; // Gravedad en m/s^2
let simulationId = null; // ID para controlar la animación
let projectile = {
  x: 0,
  y: 0,
  radius: 5,
};

// --- 3. Actualizar Vistas de Controles ---
// Muestra el valor actual del slider
angleInput.oninput = () => {
  angleValue.textContent = angleInput.value;
};
velocityInput.oninput = () => {
  velocityValue.textContent = velocityInput.value;
};

// --- 4. Función de Lanzamiento ---
launchButton.onclick = () => {
  // Detener cualquier animación anterior
  if (simulationId) {
    cancelAnimationFrame(simulationId);
  }

  // Obtener valores de los inputs
  const angleDeg = parseFloat(angleInput.value);
  const v0 = parseFloat(velocityInput.value);

  // Convertir ángulo a radianes para los cálculos (Math.sin/cos usan radianes)
  const angleRad = angleDeg * (Math.PI / 180);

  // Calcular componentes de velocidad inicial
  const v0x = v0 * Math.cos(angleRad);
  const v0y = v0 * Math.sin(angleRad);

  // Reiniciar el proyectil
  // Origen (0,0) en la esquina inferior izquierda del canvas
  projectile.x = 0;
  projectile.y = 0;

  let startTime = null; // Tiempo de inicio de la animación

  // --- 5. El Bucle de Animación (El corazón del simulador) ---
  function animate(currentTime) {
    if (!startTime) {
      startTime = currentTime; // Guardar el tiempo del primer fotograma
    }

    // Tiempo transcurrido en segundos
    const t = (currentTime - startTime) / 1000;

    // --- FÍSICA (Ecuaciones de movimiento) ---
    // x(t) = v0x * t
    projectile.x = v0x * t;

    // y(t) = (v0y * t) - (0.5 * g * t^2)
    projectile.y = v0y * t - 0.5 * g * t * t;

    // --- DIBUJO ---
    // Limpiar el canvas en cada fotograma
    clearCanvas();

    // Dibujar el proyectil en su nueva posición
    drawProjectile();

    // --- Condición de Parada ---
    // Si el proyectil sigue en el aire (y >= 0), solicitar el próximo fotograma
    if (projectile.y >= 0) {
      simulationId = requestAnimationFrame(animate);
    } else {
      console.log('Simulación terminada.');
    }
  }

  // Iniciar el bucle de animación
  simulationId = requestAnimationFrame(animate);
};

// --- 6. Funciones Auxiliares de Dibujo ---

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar el "suelo"
  ctx.fillStyle = '#4a2e19'; // Color tierra
  ctx.fillRect(0, canvas.height - 10, canvas.width, 10);
}

function drawProjectile() {
  // Convertir coordenadas de física (0,0 abajo-izquierda)
  // a coordenadas de canvas (0,0 arriba-izquierda)
  const drawX = projectile.x;
  const drawY = canvas.height - 10 - projectile.y; // -10 para que esté sobre el suelo

  ctx.beginPath();
  ctx.arc(drawX, drawY, projectile.radius, 0, Math.PI * 2);
  ctx.fillStyle = 'red';
  ctx.fill();
  ctx.closePath();
}

// Dibujar el estado inicial (el suelo)
clearCanvas();
