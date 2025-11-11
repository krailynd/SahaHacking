/*
 * Archivo: proyectil-main.js
 * Nivel 8.1 (Corrección): Arregla el error de carga que hacía desaparecer el cañón y el suelo.
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

// --- Clases de Juego (sin cambios) ---
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
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.currentAngle = 45;
    this.currentVelocity = 25;
    this.image = null; // Se llenará en loadAssets
  }

  draw(ctx, canvasHeight, camera) {
    if (!this.image) {
      // --- INICIO DE FALLBACK (SI LA IMAGEN NO CARGA) ---
      // Si la imagen falla, dibuja un círculo simple para que el juego no se rompa
      ctx.fillStyle = this.color;
      const fallbackDrawX = (this.x - camera.x) * PIXELS_PER_METER;
      const fallbackDrawY =
        canvasHeight - (this.y - camera.y) * PIXELS_PER_METER;
      ctx.beginPath();
      ctx.arc(fallbackDrawX, fallbackDrawY, this.radius, 0, Math.PI * 2);
      ctx.fill();
      this.drawTrajectoryLine(ctx, canvasHeight, camera); // Dibuja la línea de trayectoria de todos modos
      return;
      // --- FIN DE FALLBACK ---
    }

    // --- DIBUJO NORMAL (SI LA IMAGEN SÍ CARGÓ) ---
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
    const step = 0.1;

    ctx.moveTo(
      (currentX - camera.x) * PIXELS_PER_METER,
      canvasHeight - (currentY - camera.y) * PIXELS_PER_METER
    );

    while (currentY >= GROUND_LEVEL_METERS) {
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

      if (time > 15) break; // Evita bucles infinitos
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  updateAngleAndVelocity(mouseX, mouseY, canvasHeight, camera) {
    const mouseWorldY = canvasHeight - mouseY + camera.y * PIXELS_PER_METER;
    const launcherWorldX = this.x + CANNON_PIVOT_OFFSET_X_METERS;
    const launcherWorldY = this.y + CANNON_PIVOT_OFFSET_Y_METERS;
    const dx = mouseX / PIXELS_PER_METER - (launcherWorldX - camera.x);
    const dy = mouseWorldY / PIXELS_PER_METER - (launcherWorldY - camera.y);
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
let launcher; // ¡Declarado aquí, pero no inicializado!
let isDraggingLauncher = false;
let groundPattern = null;
let myHistogramChart = null;
let cannonImage = new Image(); // Mantenemos la imagen global

function init() {
  canvas = document.getElementById(CANVAS_ID);
  ctx = canvas.getContext('2d');

  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  // --- ¡CAMBIO 1! ---
  // Crea el lanzador AHORA, antes de cargar assets.
  launcher = new Launcher(2, GROUND_LEVEL_METERS, 8, '#FF0077');

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

  loadAssets(); // Ahora 'launcher' ya existe
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
  let assetsToLoad = 2; // Suelo y Cañón
  function assetLoaded() {
    assetsToLoad--;
    if (assetsToLoad === 0) {
      startGame(); // Inicia el juego solo cuando AMBOS assets están listos
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
    // --- ¡CAMBIO 2! ---
    // Ahora 'launcher' existe y podemos asignarle la imagen de forma segura.
    launcher.image = cannonImage;
    assetLoaded();
  };
  cannonImage.onerror = () => {
    console.error(
      'Error: No se pudo cargar la imagen del cañón en ' + CANNON_IMAGE_PATH
    );
    // El fallback en launcher.draw() se encargará
    assetLoaded();
  };
}

function startGame() {
  // --- ¡CAMBIO 3! ---
  // Ya no creamos el launcher aquí, solo iniciamos el bucle.
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

  drawGround(camera);

  // Ahora 'launcher' existe y tiene 'draw' (ya sea el de la imagen o el fallback)
  launcher.draw(ctx, canvas.height, camera);
  projectiles.forEach((p) => p.draw(ctx, canvas.height, camera));

  camera.restoreTransform(ctx);
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

  const gradient = ctx.createLinearGradient(0, groundCanvasY, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
  gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(
    0,
    groundCanvasY,
    canvas.width,
    canvas.height - groundCanvasY + camera.y * PIXELS_PER_METER
  );

  ctx.strokeStyle = '#606060';
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

  const launcherPivotCanvasX =
    (launcher.x + CANNON_PIVOT_OFFSET_X_METERS - camera.x) * PIXELS_PER_METER;
  const launcherPivotCanvasY =
    canvas.height -
    (launcher.y + CANNON_PIVOT_OFFSET_Y_METERS - camera.y) * PIXELS_PER_METER;
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
        legend: { display: false },
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
