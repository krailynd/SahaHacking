/*
 * Archivo: proyectil-main.js
 * Nivel 9 (Corrección Mayor): Arregla la cámara X (límite derecho),
 * implementa suelo infinito y soluciona el error "se sale de su órbita"
 * (el proyectil ahora sigue la línea).
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

// --- Objeto Cámara (¡ACTUALIZADO!) ---
let camera = {
  x: 0,
  y: 0, // Posición del mundo (en metros)
  followThresholdX: 0.6, // Seguir si está en el 60% exterior (izq/der)
  followThresholdY: 0.6, // Seguir si está en el 60% superior

  update(target, canvasWidth, canvasHeight) {
    if (!target) return;

    // --- LÓGICA DE CÁMARA EJE Y (Vertical) ---
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
    } // Regla: No ir bajo el suelo

    // --- ¡NUEVO! LÓGICA DE CÁMARA EJE X (Horizontal) ---
    const targetCanvasX = (target.x - this.x) * PIXELS_PER_METER;
    const followLineXRight = canvasWidth * this.followThresholdX;
    const followLineXLeft = canvasWidth * (1 - this.followThresholdX);

    if (targetCanvasX > followLineXRight) {
      // El objetivo se mueve a la derecha, mover la cámara a la derecha
      const targetCameraX = target.x - followLineXRight / PIXELS_PER_METER;
      this.x = targetCameraX;
    } else if (targetCanvasX < followLineXLeft) {
      // El objetivo se mueve a la izquierda, mover la cámara a la izquierda
      const targetCameraX = target.x - followLineXLeft / PIXELS_PER_METER;
      this.x = targetCameraX;
    }

    // Regla: No mover la cámara a la izquierda del punto de inicio (opcional, pero bueno)
    if (this.x < 0) {
      this.x = 0;
    }
  },

  reset() {
    this.x = 0;
    this.y = 0;
  },

  // --- ¡ACTUALIZADO! El transform ahora maneja X e Y ---
  applyTransform(ctx, canvasHeight) {
    ctx.save();
    // Mueve el canvas en la dirección opuesta a la cámara
    ctx.translate(-this.x * PIXELS_PER_METER, this.y * PIXELS_PER_METER);
  },

  restoreTransform(ctx) {
    ctx.restore();
  },
};

// --- Clases de Juego ---
class Projectile {
  // ... (constructor sin cambios) ...
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
      // console.log(`Proyectil aterrizó en X: ${this.x.toFixed(2)}m`); // Eliminado para no spamear
      addLandingData(this.x);
    }
  }

  // ... (draw sin cambios) ...
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
  // ... (constructor sin cambios) ...
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
    if (!this.image) {
      // --- Fallback (sin cambios) ---
      ctx.fillStyle = this.color;
      const fallbackDrawX = (this.x - camera.x) * PIXELS_PER_METER;
      const fallbackDrawY =
        canvasHeight - (this.y - camera.y) * PIXELS_PER_METER;
      ctx.beginPath();
      ctx.arc(fallbackDrawX, fallbackDrawY, this.radius, 0, Math.PI * 2);
      ctx.fill();
      this.drawTrajectoryLine(ctx, canvasHeight, camera);
      return;
    }

    // --- Dibujo Normal (sin cambios) ---
    const drawX = (this.x - camera.x) * PIXELS_PER_METER;
    const drawY = canvasHeight - (this.y - camera.y) * PIXELS_PER_METER;
    const cannonWidthPx = CANNON_WIDTH_METERS * PIXELS_PER_METER;
    const cannonHeightPx = CANNON_HEIGHT_METERS * PIXELS_PER_METER;
    const pivotX = drawX + CANNON_PIVOT_OFFSET_X_METERS * PIXELS_PER_METER;
    const pivotY = drawY - CANNON_PIVOT_OFFSET_Y_METERS * PIXELS_PER_METER;

    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate((-this.currentAngle * Math.PI) / 180);
    ctx.drawImage(
      this.image,
      -CANNON_PIVOT_OFFSET_X_METERS * PIXELS_PER_METER,
      -(cannonHeightPx - CANNON_PIVOT_OFFSET_Y_METERS * PIXELS_PER_METER),
      cannonWidthPx,
      cannonHeightPx
    );
    ctx.restore();

    this.drawTrajectoryLine(ctx, canvasHeight, camera);
  }

  drawTrajectoryLine(ctx, canvasHeight, camera) {
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();

    // ¡IMPORTANTE! Usa la velocidad y ángulo ACTUALES para la predicción
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
      (currentX - camera.x) * PIXELS_PER_METER,
      canvasHeight - (currentY - camera.y) * PIXELS_PER_METER
    );

    while (currentY >= GROUND_LEVEL_METERS) {
      time += step;
      const vx = velocity * Math.cos((angle * Math.PI) / 180);
      const vy = velocity * Math.sin((angle * Math.PI) / 180);
      currentX = startX + vx * time;
      currentY = startY + vy * time - 0.5 * GRAVITY * time * time;

      ctx.lineTo(
        (currentX - camera.x) * PIXELS_PER_METER,
        canvasHeight - (currentY - camera.y) * PIXELS_PER_METER
      );

      if (time > 15) break;
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  updateAngleAndVelocity(mouseX, mouseY, canvasHeight, camera) {
    // --- Lógica de arrastre (sin cambios) ---
    const mouseCanvasY = mouseY; // Y del mouse en el canvas
    const mouseWorldY =
      canvasHeight - mouseCanvasY + camera.y * PIXELS_PER_METER; // Y del mouse en el mundo

    const launcherWorldX = this.x + CANNON_PIVOT_OFFSET_X_METERS;
    const launcherWorldY = this.y + CANNON_PIVOT_OFFSET_Y_METERS;

    // Coordenadas del mouse en el mundo relativas a la cámara
    const mouseWorldX =
      (mouseX + camera.x * PIXELS_PER_METER) / PIXELS_PER_METER;
    const mouseWorldY_v2 =
      (canvasHeight - mouseY + camera.y * PIXELS_PER_METER) / PIXELS_PER_METER;

    const dx = mouseWorldX - launcherWorldX;
    const dy = mouseWorldY_v2 - launcherWorldY;

    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    angle = Math.min(90, Math.max(0, angle));
    this.currentAngle = angle;

    const distance = Math.sqrt(dx * dx + dy * dy);
    this.currentVelocity = Math.max(5, Math.min(50, distance * 5));
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

function init() {
  canvas = document.getElementById(CANVAS_ID);
  ctx = canvas.getContext('2d');

  // Escala de alta resolución (sin cambios)
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  launcher = new Launcher(2, GROUND_LEVEL_METERS, 8, '#FF0077');

  // --- Conexión UI (sin cambios) ---
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

  // Listeners del Canvas (sin cambios)
  window.addEventListener('resize', resizeCanvas);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);

  loadAssets();
  initHistogram();
  selectLauncher(activeLauncherProfile.id);
}

// ... (togglePanel sin cambios) ...
function togglePanel(panelId, forceState) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  const newState =
    forceState === undefined ? panel.style.display === 'none' : forceState;
  panel.style.display = newState ? 'block' : 'none';
}

// ... (loadAssets sin cambios) ...
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

// ... (startGame sin cambios) ...
function startGame() {
  resizeCanvas(); // Llama a resize una vez al inicio
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
    // --- ¡ACTUALIZADO! Pasa las dimensiones del canvas a la cámara ---
    camera.update(
      projectiles[projectiles.length - 1],
      canvas.width / (window.devicePixelRatio || 1),
      canvas.height / (window.devicePixelRatio || 1)
    );
  } else if (!isCameraFollowEnabled && (camera.x !== 0 || camera.y !== 0)) {
    camera.reset();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pasa las dimensiones reales del canvas
  camera.applyTransform(ctx, canvas.height / (window.devicePixelRatio || 1));

  drawGround(camera);
  launcher.draw(ctx, canvas.height / (window.devicePixelRatio || 1), camera);
  projectiles.forEach((p) =>
    p.draw(ctx, canvas.height / (window.devicePixelRatio || 1), camera)
  );

  camera.restoreTransform(ctx);
}

// --- ¡ACTUALIZADO! El Suelo Infinito ---
function drawGround(camera) {
  const canvasHeight = canvas.height / (window.devicePixelRatio || 1);
  const canvasWidth = canvas.width / (window.devicePixelRatio || 1);

  // Coordenada Y donde empieza el suelo en el canvas (compensa la cámara Y)
  const groundCanvasY =
    canvasHeight - (GROUND_LEVEL_METERS - camera.y) * PIXELS_PER_METER;

  // Coordenada X del mundo visible (compensa la cámara X)
  const worldStartX = camera.x;
  const worldWidth = canvasWidth / PIXELS_PER_METER;

  if (groundPattern) {
    ctx.fillStyle = groundPattern;
    // Dibuja el rectángulo cubriendo toda la vista horizontal
    ctx.fillRect(
      worldStartX * PIXELS_PER_METER,
      groundCanvasY,
      worldWidth * PIXELS_PER_METER,
      canvasHeight - groundCanvasY + camera.y * PIXELS_PER_METER
    );
  } else {
    ctx.fillStyle = '#808080';
    ctx.fillRect(
      worldStartX * PIXELS_PER_METER,
      groundCanvasY,
      worldWidth * PIXELS_PER_METER,
      canvasHeight - groundCanvasY + camera.y * PIXELS_PER_METER
    );
  }

  // El gradiente y la línea del horizonte también deben cubrir el ancho
  const gradient = ctx.createLinearGradient(0, groundCanvasY, 0, canvasHeight);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(
    worldStartX * PIXELS_PER_METER,
    groundCanvasY,
    worldWidth * PIXELS_PER_METER,
    canvasHeight - groundCanvasY + camera.y * PIXELS_PER_METER
  );

  ctx.strokeStyle = '#606060';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(worldStartX * PIXELS_PER_METER, groundCanvasY);
  ctx.lineTo((worldStartX + worldWidth) * PIXELS_PER_METER, groundCanvasY);
  ctx.stroke();
}

function onMouseDown(event) {
  if (event.target.closest('.floating-panel, .hud-bar')) return;

  // --- Lógica de arrastre (sin cambios) ---
  const mouseX = event.clientX;
  const mouseY = event.clientY;
  const canvasHeight = canvas.height / (window.devicePixelRatio || 1);

  // Coordenadas del pivote en la PANTALLA
  const launcherPivotCanvasX =
    (launcher.x + CANNON_PIVOT_OFFSET_X_METERS - camera.x) * PIXELS_PER_METER;
  const launcherPivotCanvasY =
    canvasHeight -
    (launcher.y + CANNON_PIVOT_OFFSET_Y_METERS - camera.y) * PIXELS_PER_METER;
  const detectionRadius =
    (Math.max(CANNON_WIDTH_METERS, CANNON_HEIGHT_METERS) / 2) *
    PIXELS_PER_METER;

  const distanceToLauncher = Math.sqrt(
    Math.pow(mouseX - launcherPivotCanvasX, 2) +
      Math.pow(mouseY - launcherPivotCanvasY, 2)
  );

  if (distanceToLauncher < detectionRadius * 1.5) {
    // Área de detección un poco más grande
    isDraggingLauncher = true;
  }
}

function onMouseMove(event) {
  if (isDraggingLauncher) {
    launcher.updateAngleAndVelocity(
      event.clientX,
      event.clientY,
      canvas.height / (window.devicePixelRatio || 1),
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

// --- ¡ACTUALIZADO! fireProjectile ---
function fireProjectile() {
  // ¡¡¡LA CORRECCIÓN "se sale de su órbita"!!!
  // Ya no usamos la variabilidad para el disparo, solo para la predicción si quisiéramos.
  // Usamos EXACTAMENTE lo que el usuario ve en el cañón.
  const velocityToUse = launcher.currentVelocity;
  const angleToUse = launcher.currentAngle;

  // (La lógica de variabilidad de PhET se ha eliminado para cumplir con la solicitud del usuario)
  // const baseVel = activeLauncherProfile.baseVelocity;
  // const variability = activeLauncherProfile.variability;
  // const velocityToUse = normalRandom(baseVel, variability);

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

// --- ¡ACTUALIZADO! selectLauncher ---
function selectLauncher(launcherId) {
  activeLauncherProfile = launcherProfiles[launcherId];

  // --- ¡NUEVO! ---
  // ¡Actualiza la velocidad actual del cañón al cambiar de perfil!
  // Esto conecta los botones de PhET con nuestra lógica WYSIWYG.
  launcher.currentVelocity = activeLauncherProfile.baseVelocity;
  // (Podríamos también fijar un ángulo, pero lo dejaremos como está)

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

// ... (initHistogram sin cambios) ...
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

// ... (addLandingData sin cambios) ...
function addLandingData(x) {
  landingData.push(x);
  updateHistogram();
}

// ... (clearLandingData sin cambios) ...
function clearLandingData() {
  landingData = [];
  updateHistogram();
}

// ... (updateHistogram sin cambios) ...
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
