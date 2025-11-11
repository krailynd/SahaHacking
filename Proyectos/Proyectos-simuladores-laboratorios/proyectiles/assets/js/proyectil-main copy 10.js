/*
 * Archivo: proyectil-main.js
 * Nivel 11 (Reforzado): Arregla el bug de 'NaN' que rompía el dibujado.
 * Añade "barreras de seguridad" (clamps) al deltaTime y a la física
 * para asegurar que el proyecto NUNCA deje de funcionar.
 * Este va a funcionar.
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
const MAX_DELTA_TIME = 0.5; // ¡BARRERA DE SEGURIDAD 1! Máximo 0.5s por frame

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

// --- Objeto Cámara ---
let camera = {
  x: 0,
  y: 0,
  followThresholdX: 0.6,
  followThresholdY: 0.6,

  update(target, canvasWidth, canvasHeight) {
    // ¡BARRERA DE SEGURIDAD 2! No hacer nada si el objetivo está corrupto
    if (!target || isNaN(target.x) || isNaN(target.y)) return;

    // Lógica Y
    const targetCanvasY = canvasHeight - (target.y - this.y) * PIXELS_PER_METER;
    const followLineY = canvasHeight * (1 - this.followThresholdY);
    if (targetCanvasY < followLineY) {
      this.y =
        target.y -
        (canvasHeight * (1 - this.followThresholdY)) / PIXELS_PER_METER;
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

    // ¡BARRERA DE SEGURIDAD 3! Asegurarse de que la cámara nunca sea NaN
    if (isNaN(this.x)) this.x = 0;
    if (isNaN(this.y)) this.y = 0;
  },

  reset() {
    this.x = 0;
    this.y = 0;
  },

  applyTransform(ctx, canvasHeight) {
    ctx.save();
    ctx.translate(
      Math.round(-this.x * PIXELS_PER_METER),
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

    // ¡BARRERA DE SEGURIDAD 4! Si el tiempo es 0 o NaN, no hacer nada.
    if (!deltaTime || isNaN(deltaTime)) return;

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

  draw(ctx, canvasHeight, camera) {
    ctx.fillStyle = this.color;
    const drawX = this.x * PIXELS_PER_METER;
    const drawY = canvasHeight - this.y * PIXELS_PER_METER;
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

  draw(ctx, canvasHeight, camera) {
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
      // Fallback (círculo)
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    this.drawTrajectoryLine(ctx, canvasHeight, camera);
  }

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

    ctx.moveTo(
      currentX * PIXELS_PER_METER,
      canvasHeight - currentY * PIXELS_PER_METER
    );

    while (currentY >= GROUND_LEVEL_METERS && time < 15) {
      time += step;
      const vx = velocity * Math.cos((angle * Math.PI) / 180);
      const vy = velocity * Math.sin((angle * Math.PI) / 180);
      currentX = startX + vx * time;
      currentY = startY + vy * time - 0.5 * GRAVITY * time * time;

      ctx.lineTo(
        currentX * PIXELS_PER_METER,
        canvasHeight - currentY * PIXELS_PER_METER
      );
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  updateAngleAndVelocity(mouseX, mouseY, canvasHeight, camera) {
    // Coordenadas de MUNDO
    const mouseWorldPxX = mouseX + camera.x * PIXELS_PER_METER;
    const mouseWorldPxY = mouseY - camera.y * PIXELS_PER_METER;
    const pivotWorldPxX =
      (this.x + CANNON_PIVOT_OFFSET_X_METERS) * PIXELS_PER_METER;
    const pivotWorldPxY =
      canvasHeight - (this.y + CANNON_PIVOT_OFFSET_Y_METERS) * PIXELS_PER_METER;

    const dx = mouseWorldPxX - pivotWorldPxX;
    const dy = mouseWorldPxY - pivotWorldPxY;

    let angle = (Math.atan2(-dy, dx) * 180) / Math.PI;
    angle = Math.min(90, Math.max(0, angle));
    this.currentAngle = angle;

    const distancePx = Math.sqrt(dx * dx + dy * dy);
    const distanceMeters = distancePx / PIXELS_PER_METER;
    this.currentVelocity = Math.max(5, Math.min(50, distanceMeters * 5));
  }
}

// --- GESTIÓN DEL JUEGO Y UI ---
let canvas, ctx;
let lastTime = 0; // Se inicializa en 0
let projectiles = [];
let launcher;
let isDraggingLauncher = false;
let groundPattern = null;
let myHistogramChart = null;
let cannonImage = new Image();
let dpr = 1;

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
  // ¡BARRERA DE SEGURIDAD 5! Inicia 'lastTime' en el momento actual
  // para evitar el 'deltaTime' gigante en el primer frame.
  lastTime = performance.now();
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
  // ¡BARRERA DE SEGURIDAD 1 (reforzada)!
  // Calcula deltaTime y lo "limita" (clamp) a un máximo
  let deltaTime = (currentTime - lastTime) / 1000; // en segundos
  if (deltaTime > MAX_DELTA_TIME) {
    deltaTime = MAX_DELTA_TIME; // Evita "espirales de la muerte" si la pestaña se cuelga
  }
  lastTime = currentTime;

  update(deltaTime);
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

function drawGround(camera, canvasWidth, canvasHeight) {
  // Coordenada Y del suelo en el MUNDO (en píxeles)
  const groundWorldY = canvasHeight - GROUND_LEVEL_METERS * PIXELS_PER_METER;
  // Coordenada X visible de la cámara (en píxeles)
  const viewPortX = camera.x * PIXELS_PER_METER;
  const viewPortWidth = canvasWidth;

  // 1. Dibuja el suelo (en coordenadas del MUNDO)
  if (groundPattern) {
    ctx.fillStyle = groundPattern;
    // Ajusta la 'x' del fillRect para que se mueva CON la cámara
    // Y el 'x' del translate del patrón para que el patrón no se mueva
    ctx.save();
    ctx.translate(viewPortX, 0); // Mueve el inicio del fillRect
    ctx.fillStyle = groundPattern;
    ctx.fillRect(0, groundWorldY, viewPortWidth, canvasHeight);
    ctx.restore();
  } else {
    ctx.fillStyle = '#808080';
    ctx.fillRect(viewPortX, groundWorldY, viewPortWidth, canvasHeight);
  }

  // 2. Dibuja el gradiente (en coordenadas del MUNDO)
  const gradient = ctx.createLinearGradient(0, groundWorldY, 0, canvasHeight);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(viewPortX, groundWorldY, viewPortWidth, canvasHeight);

  // 3. Dibuja la línea del horizonte (en coordenadas del MUNDO)
  ctx.strokeStyle = '#606060';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(viewPortX, groundWorldY);
  ctx.lineTo(viewPortX + viewPortWidth, groundWorldY);
  ctx.stroke();
}

function onMouseDown(event) {
  if (event.target.closest('.floating-panel, .hud-bar')) return;

  const mouseX = event.clientX;
  const mouseY = event.clientY;
  const canvasHeight = window.innerHeight;

  // Coordenadas del pivote en PANTALLA
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

function fireProjectile() {
  // "Lo que ves es lo que obtienes"
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
  launcher.currentVelocity = activeLauncherProfile.baseVelocity;

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
