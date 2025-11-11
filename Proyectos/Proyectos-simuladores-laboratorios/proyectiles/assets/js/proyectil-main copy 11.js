/*
 * Archivo: proyectil-main.js
 * Nivel 10 (El Arreglo Definitivo): Corrige el error de "doble corrección" de la cámara.
 * El cañón, el suelo y el proyectil ahora se dibujan en coordenadas del mundo,
 * y la cámara maneja el desplazamiento.
 * El mouse ahora traduce correctamente de coordenadas de pantalla a mundo.
 */

// --- CONFIGURACIÓN GLOBAL ---
const CANVAS_ID = 'gameCanvas';
const GRAVITY = 9.81;
const PIXELS_PER_METER = 10;
const GROUND_LEVEL_METERS = 5;
const GROUND_TEXTURE_PATH = 'assets/img/moon-texture.png';
const CANNON_IMAGE_PATH = 'assets/img/circus-cannon.png';
const CANNON_WIDTH_METERS = 3;
const CANNON_HEIGHT_METERS = 2;
const CANNON_PIVOT_OFFSET_X_METERS = 1.5;
const CANNON_PIVOT_OFFSET_Y_METERS = 1.0;

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

// --- Objeto Cámara (Actualizado) ---
let camera = {
  x: 0,
  y: 0, // Posición del mundo (en metros)
  followThresholdX: 0.6,
  followThresholdY: 0.6,

  update(target, canvasWidth, canvasHeight) {
    if (!target) return;

    // Lógica Y
    const targetCanvasY = canvasHeight - (target.y - this.y) * PIXELS_PER_METER;
    const followLineY = canvasHeight * (1 - this.followThresholdY);
    if (targetCanvasY < followLineY) {
      const targetCameraY =
        target.y -
        (canvasHeight * (1 - this.followThresholdY)) / PIXELS_PER_METER;
      this.y = targetCameraY;
    }
    if (this.y < 0) {
      this.y = 0;
    }

    // Lógica X
    const targetCanvasX = (target.x - this.x) * PIXELS_PER_METER;
    const followLineXRight = canvasWidth * this.followThresholdX;
    const followLineXLeft = canvasWidth * (1 - this.followThresholdX);

    if (targetCanvasX > followLineXRight) {
      this.x = target.x - followLineXRight / PIXELS_PER_METER;
    } else if (targetCanvasX < followLineXLeft) {
      this.x = target.x - followLineXLeft / PIXELS_PER_METER;
    }
    if (this.x < 0) {
      this.x = 0;
    }
  },

  reset() {
    this.x = 0;
    this.y = 0;
  },

  applyTransform(ctx, canvasHeight) {
    ctx.save();
    // Mueve el canvas al revés de la cámara
    ctx.translate(
      Math.round(-this.x * PIXELS_PER_METER), // Redondea para evitar "temblores"
      Math.round(this.y * PIXELS_PER_METER)
    );
  },

  restoreTransform(ctx) {
    ctx.restore();
  },
};

// --- Clases de Juego ---
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
      addLandingData(this.x);
    }
  }

  // --- ¡CORREGIDO! ---
  // Dibuja en coordenadas del MUNDO. La cámara se encarga del resto.
  draw(ctx, canvasHeight, camera) {
    ctx.fillStyle = this.color;
    const drawX = this.x * PIXELS_PER_METER;
    const drawY = canvasHeight - this.y * PIXELS_PER_METER; // Y se invierte
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
    this.image = null;
  }

  // --- ¡CORREGIDO! ---
  draw(ctx, canvasHeight, camera) {
    // --- Dibujo Normal ---
    // Coordenadas del MUNDO
    const drawX = this.x * PIXELS_PER_METER;
    const drawY = canvasHeight - this.y * PIXELS_PER_METER;
    const cannonWidthPx = CANNON_WIDTH_METERS * PIXELS_PER_METER;
    const cannonHeightPx = CANNON_HEIGHT_METERS * PIXELS_PER_METER;
    const pivotX = drawX + CANNON_PIVOT_OFFSET_X_METERS * PIXELS_PER_METER;
    const pivotY = drawY - CANNON_PIVOT_OFFSET_Y_METERS * PIXELS_PER_METER;

    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate((-this.currentAngle * Math.PI) / 180);

    if (this.image) {
      ctx.drawImage(
        this.image,
        -CANNON_PIVOT_OFFSET_X_METERS * PIXELS_PER_METER,
        -(cannonHeightPx - CANNON_PIVOT_OFFSET_Y_METERS * PIXELS_PER_METER),
        cannonWidthPx,
        cannonHeightPx
      );
    } else {
      // --- Fallback (si la imagen no cargó) ---
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2); // Dibuja en el pivote
      ctx.fill();
    }
    ctx.restore();

    this.drawTrajectoryLine(ctx, canvasHeight, camera);
  }

  // --- ¡CORREGIDO! ---
  drawTrajectoryLine(ctx, canvasHeight, camera) {
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();

    const velocity = this.currentVelocity;
    const angle = this.currentAngle;
    const startX =
      this.x + CANNON_PIVOT_OFFSET_X_METERS * Math.cos((angle * Math.PI) / 180);
    const startY =
      this.y + CANNON_PIVOT_OFFSET_Y_METERS * Math.sin((angle * Math.PI) / 180);

    let currentX = startX;
    let currentY = startY;
    let time = 0;
    const step = 0.1;

    // Dibuja en coordenadas del MUNDO
    ctx.moveTo(
      currentX * PIXELS_PER_METER,
      canvasHeight - currentY * PIXELS_PER_METER
    );

    while (currentY >= GROUND_LEVEL_METERS) {
      time += step;
      const vx = velocity * Math.cos((angle * Math.PI) / 180);
      const vy = velocity * Math.sin((angle * Math.PI) / 180);
      currentX = startX + vx * time;
      currentY = startY + vy * time - 0.5 * GRAVITY * time * time;

      ctx.lineTo(
        currentX * PIXELS_PER_METER,
        canvasHeight - currentY * PIXELS_PER_METER
      );

      if (time > 15) break;
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // --- ¡CORREGIDO! ---
  updateAngleAndVelocity(mouseX, mouseY, canvasHeight, camera) {
    // mouseX/Y son coordenadas de PANTALLA
    // Necesitamos convertirlas a coordenadas de MUNDO

    // 1. Coordenadas del mouse en el mundo (en píxeles)
    const mouseWorldPxX = mouseX + camera.x * PIXELS_PER_METER;
    const mouseWorldPxY = mouseY - camera.y * PIXELS_PER_METER;

    // 2. Coordenadas del pivote en el mundo (en píxeles)
    const pivotWorldPxX =
      (this.x + CANNON_PIVOT_OFFSET_X_METERS) * PIXELS_PER_METER;
    const pivotWorldPxY =
      canvasHeight - (this.y + CANNON_PIVOT_OFFSET_Y_METERS) * PIXELS_PER_METER;

    // 3. Diferencia (delta)
    const dx = mouseWorldPxX - pivotWorldPxX;
    const dy = mouseWorldPxY - pivotWorldPxY; // El eje Y del mouse ya está invertido

    let angle = (Math.atan2(-dy, dx) * 180) / Math.PI; // -dy para que 'arriba' sea positivo
    angle = Math.min(90, Math.max(0, angle));
    this.currentAngle = angle;

    const distancePx = Math.sqrt(dx * dx + dy * dy);
    const distanceMeters = distancePx / PIXELS_PER_METER; // Convertir de nuevo a metros
    this.currentVelocity = Math.max(5, Math.min(50, distanceMeters * 5)); // Sensibilidad
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
let cannonImage = new Image();
let dpr = 1; // Device Pixel Ratio

function init() {
  canvas = document.getElementById(CANVAS_ID);
  ctx = canvas.getContext('2d');

  dpr = window.devicePixelRatio || 1;

  launcher = new Launcher(2, GROUND_LEVEL_METERS, 8, '#FF0077');

  // Conectar UI
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
    button.addEventListener('click', (e) =>
      togglePanel(e.target.getAttribute('data-panel'))
    );
  });
  document.querySelectorAll('.close-btn').forEach((button) => {
    button.addEventListener('click', (e) =>
      togglePanel(e.target.getAttribute('data-panel'), false)
    );
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

  window.addEventListener('resize', resizeCanvas);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);

  loadAssets();
  initHistogram();
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
  let assetsToLoad = 2;
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
    assetLoaded();
  };
  cannonImage.src = CANNON_IMAGE_PATH;
  cannonImage.onload = () => {
    launcher.image = cannonImage;
    assetLoaded();
  };
  cannonImage.onerror = () => {
    console.error(
      'Error: No se pudo cargar la imagen del cañón en ' + CANNON_IMAGE_PATH
    );
    assetLoaded();
  };
}

function startGame() {
  resizeCanvas();
  requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
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
    camera.update(
      projectiles[projectiles.length - 1],
      window.innerWidth,
      window.innerHeight
    );
  } else if (!isCameraFollowEnabled && (camera.x !== 0 || camera.y !== 0)) {
    camera.reset();
  }
}

function draw() {
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;

  ctx.clearRect(0, 0, canvasWidth * dpr, canvasHeight * dpr);

  camera.applyTransform(ctx, canvasHeight);

  drawGround(camera, canvasWidth, canvasHeight);
  launcher.draw(ctx, canvasHeight, camera);
  projectiles.forEach((p) => p.draw(ctx, canvasHeight, camera));

  camera.restoreTransform(ctx);
}

// --- ¡CORREGIDO! ---
function drawGround(camera, canvasWidth, canvasHeight) {
  // Coordenada Y del suelo en el MUNDO (en píxeles)
  const groundWorldY = canvasHeight - GROUND_LEVEL_METERS * PIXELS_PER_METER;

  // Coordenada X visible de la cámara (en píxeles)
  const viewPortX = camera.x * PIXELS_PER_METER;
  const viewPortWidth = canvasWidth;

  if (groundPattern) {
    ctx.fillStyle = groundPattern;
    // Dibuja el suelo. Importante: ¡El 'x' e 'y' están en coordenadas del MUNDO!
    // La cámara ya movió el canvas.
    ctx.fillRect(viewPortX, groundWorldY, viewPortWidth, canvasHeight);
  } else {
    ctx.fillStyle = '#808080';
    ctx.fillRect(viewPortX, groundWorldY, viewPortWidth, canvasHeight);
  }

  // Gradiente (también en coordenadas del mundo)
  const gradient = ctx.createLinearGradient(0, groundWorldY, 0, canvasHeight);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(viewPortX, groundWorldY, viewPortWidth, canvasHeight);

  // Línea del horizonte (también en coordenadas del mundo)
  ctx.strokeStyle = '#606060';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(viewPortX, groundWorldY);
  ctx.lineTo(viewPortX + viewPortWidth, groundWorldY);
  ctx.stroke();
}

// --- ¡CORREGIDO! ---
function onMouseDown(event) {
  if (event.target.closest('.floating-panel, .hud-bar')) return;

  // Coordenadas del mouse en PANTALLA (en píxeles)
  const mouseX = event.clientX;
  const mouseY = event.clientY;
  const canvasHeight = window.innerHeight;

  // Coordenadas del pivote en PANTALLA (en píxeles)
  const pivotScreenX =
    (launcher.x + CANNON_PIVOT_OFFSET_X_METERS - camera.x) * PIXELS_PER_METER;
  const pivotScreenY =
    canvasHeight -
    (launcher.y + CANNON_PIVOT_OFFSET_Y_METERS - camera.y) * PIXELS_PER_METER;

  const detectionRadius =
    (Math.max(CANNON_WIDTH_METERS, CANNON_HEIGHT_METERS) / 2) *
    PIXELS_PER_METER;

  const distanceToLauncher = Math.sqrt(
    Math.pow(mouseX - pivotScreenX, 2) + Math.pow(mouseY - pivotScreenY, 2)
  );

  if (distanceToLauncher < detectionRadius * 1.5) {
    isDraggingLauncher = true;
  }
}

function onMouseMove(event) {
  if (isDraggingLauncher) {
    // Pasa las coordenadas de PANTALLA
    launcher.updateAngleAndVelocity(
      event.clientX,
      event.clientY,
      window.innerHeight,
      camera
    );
  }
}

function onMouseUp(event) {
  if (isDraggingLauncher) {
    isDraggingLauncher = false;
  }
}

// ... (normalRandom sin cambios) ...
function normalRandom(mean, stdDev) {
  let u1 = 0,
    u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z * stdDev + mean;
}

// --- ¡CORREGIDO! ---
function fireProjectile() {
  // "Lo que ves es lo que obtienes" (WYSIWYG)
  // Usa los valores actuales del cañón, que fueron definidos por el mouse o el preajuste.
  const velocityToUse = launcher.currentVelocity;
  const angleToUse = launcher.currentAngle;

  const newProjectile = new Projectile(
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

  // Actualiza la velocidad del cañón
  launcher.currentVelocity = activeLauncherProfile.baseVelocity;
  // (Podríamos añadir un `launcher.currentAngle` si quisiéramos)

  // Actualiza UI
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

// ... (initHistogram, addLandingData, clearLandingData, updateHistogram sin cambios) ...
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
      plugins: { legend: { display: false } },
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
  let binSize;
  if (range < 10) binSize = 0.5;
  else if (range < 30) binSize = 1;
  else if (range < 100) binSize = 2;
  else binSize = 5;
  const startBin = Math.floor(minVal / binSize) * binSize;
  const endBin = Math.ceil(maxVal / binSize) * binSize;
  const bins = new Map();
  for (let i = startBin; i <= endBin; i += binSize) {
    bins.set(i.toFixed(1), 0);
  }
  for (const x of landingData) {
    const binKey = (Math.floor(x / binSize) * binSize).toFixed(1);
    if (bins.has(binKey)) {
      bins.set(binKey, bins.get(binKey) + 1);
    } else {
      const closestBinKey = (Math.floor(x / binSize) * binSize).toFixed(1);
      bins.set(closestBinKey, (bins.get(closestBinKey) || 0) + 1);
    }
  }
  const sortedBins = new Map(
    [...bins.entries()].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
  );
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
