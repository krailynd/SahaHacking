/*
 * Archivo: proyectil-main.js
 * Nivel 8: Implementación visual de cañón, línea de trayectoria y suelo.
 */

// --- CONFIGURACIÓN GLOBAL ---
const CANVAS_ID = 'gameCanvas';
const GRAVITY = 9.81;
const PIXELS_PER_METER = 10;
const GROUND_LEVEL_METERS = 5; // Altura del suelo en metros
const GROUND_TEXTURE_PATH = 'assets/img/moon-texture.png'; // Mantendremos esta por ahora
const CANNON_IMAGE_PATH = 'assets/img/circus-cannon.png'; // ¡NUEVO! Ruta de la imagen del cañón
const CANNON_WIDTH_METERS = 3; // Ancho del cañón en metros
const CANNON_HEIGHT_METERS = 2; // Alto del cañón en metros
const CANNON_PIVOT_OFFSET_X_METERS = 1.5; // Punto de pivote X (desde la izquierda de la imagen)
const CANNON_PIVOT_OFFSET_Y_METERS = 1.0; // Punto de pivote Y (desde abajo de la imagen)

// --- MODELO DE DATOS DE PHET ---
const launcherProfiles = [
  { id: 0, name: 'Catapult', baseVelocity: 22, variability: 1.8 },
  { id: 1, name: 'Howitzer', baseVelocity: 35, variability: 0.5 },
  { id: 2, name: 'Rifle', baseVelocity: 45, variability: 0.1 },
  { id: 3, name: 'Sling', baseVelocity: 15, variability: 3.0 },
  { id: 4, name: 'Cannon', baseVelocity: 30, variability: 1.0 },
  { id: 5, name: 'Mystery', baseVelocity: 28, variability: 5.0 },
];
let activeLauncherProfile = launcherProfiles[0];
let landingData = [];

// --- ESTADO GLOBAL DE LA UI ---
let isCameraFollowEnabled = true;

// --- Objeto Cámara (sin cambios) ---
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
    if (this.y < 0) {
      this.y = 0;
    }
  },
  reset() {
    this.y = 0;
  },
  applyTransform(ctx, canvasHeight) {
    ctx.save();
    ctx.translate(0, this.y * PIXELS_PER_METER);
  },
  restoreTransform(ctx) {
    ctx.restore();
  },
};

// --- Clases de Juego (Actualizadas) ---
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
      addLandingData(this.x);
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
    this.x = x; // Posición X del cañón
    this.y = y; // Posición Y de la base del cañón (sobre el suelo)
    this.radius = radius; // Radio (ya no se usa para dibujar, pero para colisiones/detección)
    this.color = color;
    this.currentAngle = 45;
    this.currentVelocity = 25;
    this.image = null; // ¡NUEVO! Aquí cargaremos la imagen del cañón
  }

  // ¡ACTUALIZADO! Dibuja la imagen del cañón con rotación
  draw(ctx, canvasHeight, camera) {
    if (!this.image) return; // No dibujar si la imagen no está cargada

    // Calcular posición en el canvas
    const drawX = (this.x - camera.x) * PIXELS_PER_METER;
    const drawY = canvasHeight - (this.y - camera.y) * PIXELS_PER_METER;

    // Convertir dimensiones del cañón de metros a píxeles
    const cannonWidthPx = CANNON_WIDTH_METERS * PIXELS_PER_METER;
    const cannonHeightPx = CANNON_HEIGHT_METERS * PIXELS_PER_METER;

    // Calcular el punto de pivote en el canvas
    const pivotX = drawX + CANNON_PIVOT_OFFSET_X_METERS * PIXELS_PER_METER;
    const pivotY = drawY - CANNON_PIVOT_OFFSET_Y_METERS * PIXELS_PER_METER; // Y se invierte en canvas

    ctx.save();
    ctx.translate(pivotX, pivotY); // Mover el origen al pivote
    ctx.rotate((-this.currentAngle * Math.PI) / 180); // Rotar (el ángulo es positivo hacia arriba, canvas es negativo)
    // Dibujar la imagen. La posición es relativa al nuevo origen (el pivote).
    ctx.drawImage(
      this.image,
      -CANNON_PIVOT_OFFSET_X_METERS * PIXELS_PER_METER,
      -(cannonHeightPx - CANNON_PIVOT_OFFSET_Y_METERS * PIXELS_PER_METER),
      cannonWidthPx,
      cannonHeightPx
    );
    ctx.restore();

    // --- ¡NUEVO! Dibuja la línea de trayectoria ---
    this.drawTrajectoryLine(ctx, canvasHeight, camera);
  }

  // ¡NUEVO! Función para dibujar la línea de trayectoria
  drawTrajectoryLine(ctx, canvasHeight, camera) {
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)'; // Línea amarilla translúcida
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Línea punteada
    ctx.beginPath();

    // El punto de partida es el "disparo" del cañón
    const startX =
      this.x +
      CANNON_PIVOT_OFFSET_X_METERS *
        Math.cos((this.currentAngle * Math.PI) / 180);
    const startY =
      this.y +
      CANNON_PIVOT_OFFSET_Y_METERS *
        Math.sin((this.currentAngle * Math.PI) / 180);

    let currentX = startX;
    let currentY = startY;
    let time = 0;
    const step = 0.1; // Pasos de tiempo para dibujar la curva

    // El eje Y en el canvas es invertido, así que hay que calcular bien
    ctx.moveTo(
      (currentX - camera.x) * PIXELS_PER_METER,
      canvasHeight - (currentY - camera.y) * PIXELS_PER_METER
    );

    // Simula la trayectoria paso a paso para dibujar la línea
    while (currentY >= GROUND_LEVEL_METERS || time < 5) {
      // Dibujar hasta que aterrice o por un tiempo máximo
      time += step;
      const vx =
        this.currentVelocity * Math.cos((this.currentAngle * Math.PI) / 180);
      const vy =
        this.currentVelocity * Math.sin((this.currentAngle * Math.PI) / 180);

      currentX = startX + vx * time;
      currentY = startY + vy * time - 0.5 * GRAVITY * time * time;

      ctx.lineTo(
        (currentX - camera.x) * PIXELS_PER_METER,
        canvasHeight - (currentY - camera.y) * PIXELS_PER_METER
      );

      if (
        currentX > camera.x + (canvas.width / PIXELS_PER_METER) * 2 ||
        currentY < -50
      )
        break; // Evitar líneas muy largas fuera de vista
    }
    ctx.stroke();
    ctx.setLineDash([]); // Restablecer a línea sólida para otros dibujos
  }

  // ... updateAngleAndVelocity (sin cambios) ...
  updateAngleAndVelocity(mouseX, mouseY, canvasHeight, camera) {
    const mouseWorldY = canvasHeight - mouseY + camera.y * PIXELS_PER_METER;
    // El punto de origen del ángulo es el pivote del cañón
    const launcherWorldX = this.x + CANNON_PIVOT_OFFSET_X_METERS;
    const launcherWorldY = this.y + CANNON_PIVOT_OFFSET_Y_METERS;

    const dx = mouseX / PIXELS_PER_METER - (launcherWorldX - camera.x);
    const dy = mouseWorldY / PIXELS_PER_METER - (launcherWorldY - camera.y);

    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    // Ajusta el ángulo para que 0 sea horizontal a la derecha y 90 vertical hacia arriba
    if (angle < 0) angle += 360;
    angle = Math.min(90, Math.max(0, angle)); // Limitar entre 0 y 90 grados

    this.currentAngle = angle;
    const distance = Math.sqrt(dx * dx + dy * dy);
    this.currentVelocity = Math.max(5, Math.min(50, distance * 5)); // Ajusta factor para sensibilidad de velocidad
  }
}

// --- GESTIÓN DEL JUEGO Y UI ---
let canvas, ctx;
let lastTime = 0;
let projectiles = [];
let launcher;
let isDraggingLauncher = false;
let groundPattern = null;
let myHistogramChart = null;

// ¡NUEVO! Variable para almacenar la imagen del cañón
let cannonImage = new Image();

function init() {
  canvas = document.getElementById(CANVAS_ID);
  ctx = canvas.getContext('2d');

  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  // --- Conectar UI ---
  document
    .getElementById('fireButton')
    .addEventListener('click', fireProjectile);
  document.getElementById('follow-checkbox').addEventListener('change', (e) => {
    isCameraFollowEnabled = e.target.checked;
  });
  document
    .getElementById('clear-data-btn')
    .addEventListener('click', clearLandingData);

  document.querySelectorAll('.hud-button[data-panel]').forEach((button) => {
    button.addEventListener('click', (e) => {
      const panelId = e.target.getAttribute('data-panel');
      togglePanel(panelId);
    });
  });
  document.querySelectorAll('.close-btn').forEach((button) => {
    button.addEventListener('click', (e) => {
      const panelId = e.target.getAttribute('data-panel');
      togglePanel(panelId, false);
    });
  });
  document
    .querySelectorAll('#launcher-selector .grid-btn')
    .forEach((button) => {
      button.addEventListener('click', (e) => {
        const launcherId = parseInt(
          e.target.getAttribute('data-launcher-id'),
          10
        );
        selectLauncher(launcherId);
      });
    });

  // Listeners del Canvas
  window.addEventListener('resize', resizeCanvas);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);

  loadAssets();
  initHistogram();
  // Inicializa el lanzador seleccionado por defecto
  selectLauncher(activeLauncherProfile.id);
}

function togglePanel(panelId, forceState) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  const newState =
    forceState === undefined ? panel.style.display === 'none' : forceState;
  panel.style.display = newState ? 'block' : 'none';
}

function loadAssets() {
  let assetsToLoad = 2; // Suelo y Cañón
  function assetLoaded() {
    assetsToLoad--;
    if (assetsToLoad === 0) {
      startGame();
    }
  }

  const groundImage = new Image();
  groundImage.src = GROUND_TEXTURE_PATH;
  groundImage.onload = () => {
    groundPattern = ctx.createPattern(groundImage, 'repeat');
    assetLoaded();
  };
  groundImage.onerror = () => {
    console.error(
      'Error: No se pudo cargar la textura del suelo en ' + GROUND_TEXTURE_PATH
    );
    assetLoaded(); // Permitir que el juego inicie incluso si falla
  };

  cannonImage.src = CANNON_IMAGE_PATH; // Carga la imagen del cañón
  cannonImage.onload = () => {
    launcher.image = cannonImage; // Asigna la imagen al lanzador
    assetLoaded();
  };
  cannonImage.onerror = () => {
    console.error(
      'Error: No se pudo cargar la imagen del cañón en ' + CANNON_IMAGE_PATH
    );
    // Si el cañón falla, dibuja un círculo simple como fallback
    launcher.draw = (ctx, canvasHeight, camera) => {
      ctx.fillStyle = launcher.color;
      const drawX = (launcher.x - camera.x) * PIXELS_PER_METER;
      const drawY = canvasHeight - (launcher.y - camera.y) * PIXELS_PER_METER;
      ctx.beginPath();
      ctx.arc(drawX, drawY, launcher.radius, 0, Math.PI * 2);
      ctx.fill();
      // También dibuja la línea de trayectoria incluso con el fallback
      launcher.drawTrajectoryLine(ctx, canvasHeight, camera);
    };
    assetLoaded();
  };
}

function startGame() {
  launcher = new Launcher(2, GROUND_LEVEL_METERS, 8, '#FF0077');
  launcher.image = cannonImage; // Asegura que la imagen esté asignada al lanzador
  resizeCanvas();
  requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);
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
    return p.isFlying || p.y > 0;
  });

  if (isCameraFollowEnabled && projectiles.length > 0) {
    camera.update(projectiles[projectiles.length - 1], canvas.height);
  } else {
    camera.reset();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  camera.applyTransform(ctx, canvas.height);

  // --- ¡ACTUALIZADO! Dibuja el suelo con un gradiente para mejor efecto 3D ---
  drawGround(camera); // Sigue usando la función, pero su contenido ha cambiado.

  launcher.draw(ctx, canvas.height, camera);
  projectiles.forEach((p) => p.draw(ctx, canvas.height, camera));
  camera.restoreTransform(ctx);
}

// --- ¡ACTUALIZADO! Función drawGround mejorada para "efecto 3D" ---
function drawGround(camera) {
  // Coordenada Y donde empieza el suelo en el canvas (compensa la cámara)
  const groundCanvasY =
    canvas.height - (GROUND_LEVEL_METERS - camera.y) * PIXELS_PER_METER;

  // 1. Dibuja el patrón lunar como antes
  if (groundPattern) {
    ctx.fillStyle = groundPattern;
    ctx.fillRect(
      0,
      groundCanvasY,
      canvas.width,
      canvas.height - groundCanvasY + camera.y * PIXELS_PER_METER
    );
  } else {
    ctx.fillStyle = '#808080'; // Fallback gris
    ctx.fillRect(
      0,
      groundCanvasY,
      canvas.width,
      canvas.height - groundCanvasY + camera.y * PIXELS_PER_METER
    );
  }

  // 2. ¡NUEVO! Dibuja un "borde" oscuro o una sombra para el efecto 3D
  // Esto simula que el suelo tiene profundidad o se oscurece al fondo
  const gradient = ctx.createLinearGradient(0, groundCanvasY, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)'); // Oscuro en el borde del suelo
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)'); // Transparente hacia abajo

  ctx.fillStyle = gradient;
  ctx.fillRect(
    0,
    groundCanvasY,
    canvas.width,
    canvas.height - groundCanvasY + camera.y * PIXELS_PER_METER
  );

  // 3. ¡NUEVO! Dibuja una línea en el horizonte para definir claramente el suelo
  ctx.strokeStyle = '#606060'; // Un gris más oscuro para la línea del horizonte
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundCanvasY);
  ctx.lineTo(canvas.width, groundCanvasY);
  ctx.stroke();
}

function onMouseDown(event) {
  if (event.target.closest('.floating-panel, .hud-bar')) return;
  const mouseX = event.clientX;
  const mouseY = event.clientY;

  // El área de detección del lanzador es su pivote, no todo el círculo
  const launcherPivotCanvasX =
    (launcher.x + CANNON_PIVOT_OFFSET_X_METERS - camera.x) * PIXELS_PER_METER;
  const launcherPivotCanvasY =
    canvas.height -
    (launcher.y + CANNON_PIVOT_OFFSET_Y_METERS - camera.y) * PIXELS_PER_METER;

  // Un área más generosa para arrastrar el cañón
  const detectionRadius =
    (Math.max(CANNON_WIDTH_METERS, CANNON_HEIGHT_METERS) / 2) *
    PIXELS_PER_METER;

  const distanceToLauncher = Math.sqrt(
    Math.pow(mouseX - launcherPivotCanvasX, 2) +
      Math.pow(mouseY - launcherPivotCanvasY, 2)
  );

  if (distanceToLauncher < detectionRadius) {
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

function normalRandom(mean, stdDev) {
  let u1 = 0,
    u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z * stdDev + mean;
}

function fireProjectile() {
  const baseVel = activeLauncherProfile.baseVelocity;
  const variability = activeLauncherProfile.variability;

  const velocityToUse = normalRandom(baseVel, variability);
  // Para simplificar, el ángulo siempre se ajustará con el mouse
  // Si no se está arrastrando, se usa el último ángulo establecido por el mouse o por defecto
  const angleToUse = launcher.currentAngle;

  const newProjectile = new Projectile(
    // El proyectil sale del pivote del cañón
    launcher.x + CANNON_PIVOT_OFFSET_X_METERS,
    launcher.y + CANNON_PIVOT_OFFSET_Y_METERS,
    velocityToUse,
    angleToUse,
    5,
    '#00BFFF'
  );
  projectiles.push(newProjectile);
}

function selectLauncher(launcherId) {
  activeLauncherProfile = launcherProfiles[launcherId];
  document.querySelectorAll('#launcher-selector .grid-btn').forEach((btn) => {
    btn.classList.toggle(
      'active',
      btn.getAttribute('data-launcher-id') == launcherId
    );
  });
  const info = document.getElementById('launcher-info');
  info.textContent = `Nombre: ${activeLauncherProfile.name}, V. base: ${activeLauncherProfile.baseVelocity} m/s, Variabilidad: ${activeLauncherProfile.variabilidad} m/s`;
  clearLandingData();
}

function initHistogram() {
  const ctx = document.getElementById('histogramChart').getContext('2d');
  myHistogramChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Distribución de Aterrizaje',
          data: [],
          backgroundColor: 'rgba(255, 0, 119, 0.5)',
          borderColor: '#FF0077',
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Conteo' } },
        x: { title: { display: true, text: 'Distancia (m)' } },
      },
      plugins: {
        legend: { display: false }, // No mostrar la leyenda
      },
    },
  });
}

function addLandingData(x) {
  landingData.push(x);
  updateHistogram();
}

function clearLandingData() {
  landingData = [];
  updateHistogram();
}

function updateHistogram() {
  if (!myHistogramChart) return;

  if (landingData.length === 0) {
    myHistogramChart.data.labels = [];
    myHistogramChart.data.datasets[0].data = [];
    myHistogramChart.update();
    document.getElementById('data-count').textContent = '0';
    return;
  }

  const minVal = Math.min(...landingData);
  const maxVal = Math.max(...landingData);
  const range = maxVal - minVal;

  // Determinar un tamaño de contenedor (bin) dinámicamente
  let binSize;
  if (range < 10) binSize = 0.5;
  else if (range < 30) binSize = 1;
  else if (range < 100) binSize = 2;
  else binSize = 5;

  const startBin = Math.floor(minVal / binSize) * binSize;
  const endBin = Math.ceil(maxVal / binSize) * binSize;

  const bins = new Map();
  for (let i = startBin; i <= endBin; i += binSize) {
    bins.set(i.toFixed(1), 0); // Usar el inicio del bin como clave
  }

  for (const x of landingData) {
    const binKey = (Math.floor(x / binSize) * binSize).toFixed(1);
    if (bins.has(binKey)) {
      bins.set(binKey, bins.get(binKey) + 1);
    } else {
      // Esto debería cubrir cualquier caso fuera del rango inicial (minX-maxX)
      // Aunque con un rango dinámico no debería pasar tan a menudo
      const closestBinKey = (Math.floor(x / binSize) * binSize).toFixed(1);
      bins.set(closestBinKey, (bins.get(closestBinKey) || 0) + 1);
    }
  }

  // Ordenar los bins por sus claves numéricas
  const sortedBins = new Map(
    [...bins.entries()].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
  );

  // Formatear las etiquetas de los bins para que muestren un rango
  const formattedLabels = [...sortedBins.keys()].map((key) => {
    const start = parseFloat(key);
    const end = start + binSize;
    return `${start.toFixed(1)}-${end.toFixed(1)}m`;
  });

  myHistogramChart.data.labels = formattedLabels;
  myHistogramChart.data.datasets[0].data = [...sortedBins.values()];
  myHistogramChart.update();

  document.getElementById('data-count').textContent =
    landingData.length.toString();
}

document.addEventListener('DOMContentLoaded', init);
