import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

/**
 * =========================================================================
 * 1. COLOR THEMES (Bộ màu vũ trụ) & LOCALSTORAGE
 * =========================================================================
 */
const colorThemes = [
    {
        name: 'Romance Pink',
        insideColor: '#ff007f',
        outsideColor: '#100030',
        heartBase: '#ff0055',
        heartGlow: '#ff77aa',
        lightColor: '#ff007f',
        nebulaPrimary: '#ff007f',
        nebulaSecondary: '#9900ee'
    },
    {
        name: 'Deep Cyberpunk',
        insideColor: '#00f0ff',
        outsideColor: '#0d0033',
        heartBase: '#00d2ff',
        heartGlow: '#a855f7',
        lightColor: '#00e5ff',
        nebulaPrimary: '#00d2ff',
        nebulaSecondary: '#6c00ff'
    },
    {
        name: 'Emerald Aurora',
        insideColor: '#00ff88',
        outsideColor: '#021815',
        heartBase: '#00ffaa',
        heartGlow: '#70ff00',
        lightColor: '#00ff88',
        nebulaPrimary: '#00ff88',
        nebulaSecondary: '#00a3ff'
    },
    {
        name: 'Golden Sunset',
        insideColor: '#ffaa00',
        outsideColor: '#250800',
        heartBase: '#ff6600',
        heartGlow: '#ffdd00',
        lightColor: '#ffaa00',
        nebulaPrimary: '#ffaa00',
        nebulaSecondary: '#ff0055'
    }
];

let currentThemeIndex = 0;
try {
    const savedTheme = localStorage.getItem('galaxy_theme_index');
    if (savedTheme !== null) {
        const idx = parseInt(savedTheme, 10);
        if (!isNaN(idx) && idx >= 0 && idx < colorThemes.length) {
            currentThemeIndex = idx;
        }
    }
} catch (e) {}

/**
 * =========================================================================
 * 1.1 COSMIC FX CONFIG & LOCALSTORAGE (Cấu hình hiệu ứng liên tục)
 * =========================================================================
 */
let fxConfig = {
    showGalaxy: true,
    showHeart: true,
    showHeartRing: true,
    showStarfield: true,
    showSaturnRings: true,
    autoFireworks: false,
    autoMeteors: false,
    frequentComets: false,
    fairyDust: true,
    showPhotos: true,
    saturnTheme: 'gold',
    saturnSpeed: 0.08,
    saturnTilt: 'saturn',
    showConstellations: true,
    showSpaceIcons: true,
    audioVisualizer: true,
    soundFx: true,
    rotationSpeed: 0.6
};

try {
    const savedFx = localStorage.getItem('galaxy_fx_config');
    if (savedFx) {
        const parsed = JSON.parse(savedFx);
        fxConfig = { ...fxConfig, ...parsed };
    }
} catch (e) {}

let nextAutoFireworkTime = 0;

/**
 * =========================================================================
 * 2. BASE SETUP & SCENES
 * =========================================================================
 */
const canvas = document.createElement('canvas');
document.querySelector('#app').appendChild(canvas);

// Scene 1: Cho các vật thể phát sáng có hiệu ứng Bloom (Galaxy, Heart, Nebula, Stars, Meteors, Fireworks)
const scene = new THREE.Scene();

// Scene 2: Scene riêng cho Sprites (ảnh, emoji, nhãn chữ) để không bị cháy sáng
const sceneSprites = new THREE.Scene();

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 2.5, 7.2);
scene.add(camera);

// OrbitControls (Tối ưu vuốt đa điểm & Pinch-to-zoom điện thoại)
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.zoomSpeed = 0.85;
controls.target.set(0, 1.35, 0);
controls.autoRotate = (fxConfig.rotationSpeed > 0);
controls.autoRotateSpeed = fxConfig.rotationSpeed;
controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
};
controls.update();

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const initialTheme = colorThemes[currentThemeIndex];
const pointLight = new THREE.PointLight(initialTheme.lightColor, 2.2, 22);
pointLight.position.set(0, 2.8, 0);
scene.add(pointLight);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true // Cho phép chụp ảnh canvas xuất sắc
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setClearColor('#000000');
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.autoClear = false;

// Post Processing (Bloom Pass - Tối ưu êm dịu, không chói lóa)
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(Math.floor(sizes.width / 2), Math.floor(sizes.height / 2)),
    0.85,
    0.35,
    0.85
);
bloomPass.threshold = 0.08;
bloomPass.strength = 0.85;
bloomPass.radius = 0.35;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Resize handler
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    composer.setSize(sizes.width, sizes.height);
    bloomPass.setSize(Math.floor(sizes.width / 2), Math.floor(sizes.height / 2));
});


/**
 * =========================================================================
 * 3. GALAXY GENERATION (28.000 hạt ngân hà xoắn ốc)
 * =========================================================================
 */
const galaxyParams = {
    count: 28000,
    size: 0.016,
    radius: 6.5,
    branches: 4,
    spin: 1.2,
    randomness: 0.4,
    randomnessPower: 3.5
};

let galaxyGeometry = null;
let galaxyMaterial = null;
let galaxyPoints = null;

const generateGalaxy = () => {
    if (galaxyPoints !== null) {
        galaxyGeometry.dispose();
        galaxyMaterial.dispose();
        scene.remove(galaxyPoints);
    }

    const theme = colorThemes[currentThemeIndex];
    galaxyGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(galaxyParams.count * 3);
    const colors = new Float32Array(galaxyParams.count * 3);

    const colorInside = new THREE.Color(theme.insideColor);
    const colorOutside = new THREE.Color(theme.outsideColor);

    for (let i = 0; i < galaxyParams.count; i++) {
        const i3 = i * 3;
        const radius = Math.random() * galaxyParams.radius;
        const spinAngle = radius * galaxyParams.spin;
        const branchAngle = (i % galaxyParams.branches) / galaxyParams.branches * Math.PI * 2;

        const randomX = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius;
        const randomY = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius;
        const randomZ = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius;

        positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
        positions[i3 + 1] = randomY - 0.5;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

        const mixedColor = colorInside.clone();
        mixedColor.lerp(colorOutside, radius / galaxyParams.radius);

        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
    }

    galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    galaxyMaterial = new THREE.PointsMaterial({
        size: galaxyParams.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    galaxyPoints = new THREE.Points(galaxyGeometry, galaxyMaterial);
    galaxyPoints.visible = (fxConfig.showGalaxy !== false);
    scene.add(galaxyPoints);
};

generateGalaxy();

/**
 * =========================================================================
 * 3.1 DEEP COSMIC STARFIELD (Vòm sao lung linh hậu cảnh)
 * =========================================================================
 */
const starfieldCount = 2200;
const starfieldGeom = new THREE.BufferGeometry();
const starfieldPositions = new Float32Array(starfieldCount * 3);
const starfieldColors = new Float32Array(starfieldCount * 3);

for (let i = 0; i < starfieldCount; i++) {
    const i3 = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const radius = 18 + Math.random() * 22;

    starfieldPositions[i3] = Math.sin(phi) * Math.cos(theta) * radius;
    starfieldPositions[i3 + 1] = Math.sin(phi) * Math.sin(theta) * radius + 1.5;
    starfieldPositions[i3 + 2] = Math.cos(phi) * radius;

    const colType = Math.random();
    if (colType < 0.4) {
        starfieldColors[i3] = 1.0; starfieldColors[i3 + 1] = 0.95; starfieldColors[i3 + 2] = 1.0;
    } else if (colType < 0.7) {
        starfieldColors[i3] = 0.6; starfieldColors[i3 + 1] = 0.85; starfieldColors[i3 + 2] = 1.0;
    } else {
        starfieldColors[i3] = 1.0; starfieldColors[i3 + 1] = 0.65; starfieldColors[i3 + 2] = 0.9;
    }
}

starfieldGeom.setAttribute('position', new THREE.BufferAttribute(starfieldPositions, 3));
starfieldGeom.setAttribute('color', new THREE.BufferAttribute(starfieldColors, 3));

const starfieldMat = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const starfieldPoints = new THREE.Points(starfieldGeom, starfieldMat);
starfieldPoints.visible = (fxConfig.showStarfield !== false);
scene.add(starfieldPoints);

/**
 * =========================================================================
 * 4. 3D HEART SYSTEM (6.500 hạt trái tim tham số 3D)
 * =========================================================================
 */
let heartPoints = null;
let heartGeometry = null;
let heartMaterial = null;

const generateHeart = () => {
    if (heartPoints !== null) {
        heartGeometry.dispose();
        heartMaterial.dispose();
        scene.remove(heartPoints);
    }

    const theme = colorThemes[currentThemeIndex];
    heartGeometry = new THREE.BufferGeometry();
    const heartCount = 6500;
    const positions = new Float32Array(heartCount * 3);
    const colors = new Float32Array(heartCount * 3);

    const baseColor = new THREE.Color(theme.heartBase);
    const glowColor = new THREE.Color(theme.heartGlow);

    let count = 0;
    while (count < heartCount) {
        const x = (Math.random() - 0.5) * 3;
        const y = (Math.random() - 0.5) * 3;
        const z = (Math.random() - 0.5) * 3;

        const a = x * x + 2.25 * y * y + z * z - 1;
        const val = a * a * a - (x * x * z * z * z) - (0.1125 * y * y * z * z * z);

        if (val <= 0.0) {
            positions[count * 3] = x * 1.0;
            positions[count * 3 + 1] = z * 1.0;
            positions[count * 3 + 2] = y * 1.0;

            const mixedColor = baseColor.clone();
            if (Math.random() > 0.5) mixedColor.lerp(glowColor, Math.random());

            colors[count * 3] = mixedColor.r;
            colors[count * 3 + 1] = mixedColor.g;
            colors[count * 3 + 2] = mixedColor.b;

            count++;
        }
    }

    heartGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    heartGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    heartMaterial = new THREE.PointsMaterial({
        size: 0.018,
        transparent: true,
        opacity: 0.58,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    heartPoints = new THREE.Points(heartGeometry, heartMaterial);
    heartPoints.position.y = 2.4;
    heartPoints.visible = (fxConfig.showHeart !== false);
    scene.add(heartPoints);
};

generateHeart();

/**
 * =========================================================================
 * 4.1 SATURN-LIKE PLANETARY RING (Vành đai quanh Trái Tim)
 * =========================================================================
 */
let heartRingPoints = null;
let heartRingGeometry = null;
let heartRingMaterial = null;

const generateHeartRing = () => {
    if (heartRingPoints !== null) {
        heartRingGeometry.dispose();
        heartRingMaterial.dispose();
        scene.remove(heartRingPoints);
    }

    const theme = colorThemes[currentThemeIndex];
    heartRingGeometry = new THREE.BufferGeometry();
    const ringCount = 3800;
    const positions = new Float32Array(ringCount * 3);
    const colors = new Float32Array(ringCount * 3);

    const innerColor = new THREE.Color(theme.heartGlow);
    const outerColor = new THREE.Color(theme.insideColor);

    const innerRadius = 1.35;
    const outerRadius = 2.65;

    for (let i = 0; i < ringCount; i++) {
        const i3 = i * 3;
        let r = innerRadius + Math.random() * (outerRadius - innerRadius);
        if (r > 1.95 && r < 2.12 && Math.random() > 0.15) {
            r = (Math.random() > 0.5 ? 1.85 : 2.22) + Math.random() * 0.3;
        }

        const angle = Math.random() * Math.PI * 2;
        const thickness = (Math.random() - 0.5) * 0.06;

        positions[i3] = Math.cos(angle) * r;
        positions[i3 + 1] = thickness;
        positions[i3 + 2] = Math.sin(angle) * r;

        const ratio = (r - innerRadius) / (outerRadius - innerRadius);
        const col = innerColor.clone().lerp(outerColor, ratio);

        colors[i3] = col.r;
        colors[i3 + 1] = col.g;
        colors[i3 + 2] = col.b;
    }

    heartRingGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    heartRingGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    heartRingMaterial = new THREE.PointsMaterial({
        size: 0.014,
        transparent: true,
        opacity: 0.65,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    heartRingPoints = new THREE.Points(heartRingGeometry, heartRingMaterial);
    heartRingPoints.position.y = 2.4;
    heartRingPoints.visible = (fxConfig.showHeartRing !== false);
    scene.add(heartRingPoints);
};

generateHeartRing();

/**
 * =========================================================================
 * 4.2 3D AUDIO VISUALIZER WAVES RING (Vòng Sóng Âm Nhạc 3D Nhảy Múa)
 * =========================================================================
 */
const visualizerPointCount = 220;
let audioVisualizerGroup = null;
let audioVisualizerGeometry = null;
let audioVisualizerLine = null;
let audioVisualizerPoints = null;

const generateAudioVisualizerRing = () => {
    if (audioVisualizerGroup !== null) {
        audioVisualizerGeometry.dispose();
        scene.remove(audioVisualizerGroup);
    }

    audioVisualizerGroup = new THREE.Group();
    audioVisualizerGroup.position.y = 2.4;

    const positions = new Float32Array(visualizerPointCount * 3);
    const colors = new Float32Array(visualizerPointCount * 3);

    for (let i = 0; i < visualizerPointCount; i++) {
        const angle = (i / visualizerPointCount) * Math.PI * 2;
        const r = 2.05;
        positions[i * 3] = Math.cos(angle) * r;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = Math.sin(angle) * r;

        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.3;
        colors[i * 3 + 2] = 0.7;
    }

    audioVisualizerGeometry = new THREE.BufferGeometry();
    audioVisualizerGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    audioVisualizerGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const lineMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        linewidth: 2
    });

    const pointMat = new THREE.PointsMaterial({
        vertexColors: true,
        size: 0.038,
        transparent: true,
        opacity: 0.95,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    audioVisualizerLine = new THREE.LineLoop(audioVisualizerGeometry, lineMat);
    audioVisualizerPoints = new THREE.Points(audioVisualizerGeometry, pointMat);

    audioVisualizerGroup.add(audioVisualizerLine);
    audioVisualizerGroup.add(audioVisualizerPoints);
    audioVisualizerGroup.visible = !!fxConfig.audioVisualizer;
    scene.add(audioVisualizerGroup);
};

generateAudioVisualizerRing();

/**
 * =========================================================================
 * 5. DYNAMIC FLOATING 3D NEON TEXT (Dòng chữ phát sáng)
 * =========================================================================
 */
let textSprite = null;

const createTextTexture = (text) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const theme = colorThemes[currentThemeIndex];
    ctx.font = '600 46px "Outfit", "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = theme.heartGlow;
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 512, 128);

    return new THREE.CanvasTexture(canvas);
};

const updateFloatingText = (text) => {
    const texture = createTextTexture(text);
    if (!textSprite) {
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.94,
            depthWrite: false,
            blending: THREE.NormalBlending
        });
        textSprite = new THREE.Sprite(material);
        textSprite.position.set(0, 3.6, 0);
        textSprite.scale.set(3.6, 0.9, 1);
        sceneSprites.add(textSprite);
    } else {
        textSprite.material.map.dispose();
        textSprite.material.map = texture;
        textSprite.material.needsUpdate = true;
    }
};

let initialLoveText = 'Forever & Always 💖';
try {
    const savedText = localStorage.getItem('galaxy_love_text');
    if (savedText && savedText.trim()) {
        initialLoveText = savedText.trim();
    }
} catch (e) {}
updateFloatingText(initialLoveText);
const customTextInputInit = document.getElementById('custom-text-input');
if (customTextInputInit) {
    customTextInputInit.value = initialLoveText;
}

/**
 * =========================================================================
 * 5.1 CONSTELLATIONS: VIRGO & TAURUS (Chòm sao Xử Nữ ♍ & Kim Ngưu ♉)
 * =========================================================================
 */
const constellationsGroup = new THREE.Group();
constellationsGroup.visible = (fxConfig.showConstellations !== false);
scene.add(constellationsGroup);

const createConstellationStarTexture = (isOrange = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, isOrange ? '#ffbb66' : '#aaddff');
    grad.addColorStop(0.6, isOrange ? 'rgba(255, 120, 0, 0.4)' : 'rgba(100, 180, 255, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(64, 16); ctx.lineTo(64, 112);
    ctx.moveTo(16, 64); ctx.lineTo(112, 64);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
};

const constStarBlueTex = createConstellationStarTexture(false);
const constStarOrangeTex = createConstellationStarTexture(true);

const createConstellationLabelTexture = (text) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.font = '600 36px "Outfit", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 256, 64);
    return new THREE.CanvasTexture(canvas);
};

const buildConstellation = (title, stars, lines, offset, mainColor = '#00f0ff') => {
    const group = new THREE.Group();
    group.position.copy(offset);
    group.scale.set(0.48, 0.48, 0.48);

    const linePositions = [];
    lines.forEach(([i1, i2]) => {
        const p1 = stars[i1];
        const p2 = stars[i2];
        linePositions.push(p1.x, p1.y, p1.z);
        linePositions.push(p2.x, p2.y, p2.z);
    });

    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(mainColor),
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const lineMesh = new THREE.LineSegments(lineGeom, lineMat);
    group.add(lineMesh);

    const starSprites = [];
    stars.forEach((s) => {
        const tex = s.isOrange ? constStarOrangeTex : constStarBlueTex;
        const mat = new THREE.SpriteMaterial({
            map: tex,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending
        });
        const sprite = new THREE.Sprite(mat);
        sprite.position.set(s.x, s.y, s.z);
        const scale = (s.size || 0.45) * 0.55;
        sprite.scale.set(scale, scale, scale);
        sprite.userData = { baseScale: scale, phase: Math.random() * Math.PI * 2 };
        group.add(sprite);
        starSprites.push(sprite);
    });

    const labelTex = createConstellationLabelTexture(title);
    const labelMat = new THREE.SpriteMaterial({
        map: labelTex,
        transparent: true,
        opacity: 0.85,
        blending: THREE.NormalBlending
    });
    const labelSprite = new THREE.Sprite(labelMat);
    labelSprite.position.set(offset.x, offset.y + 1.2, offset.z);
    labelSprite.scale.set(1.5, 0.38, 1);
    labelSprite.userData = { parentOffset: offset };
    labelSprite.visible = (fxConfig.showConstellations !== false);
    sceneSprites.add(labelSprite);

    constellationsGroup.add(group);
    return { group, starSprites, labelSprite };
};

const virgoStars = [
    { x: 0.0, y: -1.2, z: 0.0, size: 0.75, name: 'Spica' },
    { x: -0.6, y: 0.2, z: 0.2, size: 0.5, name: 'Porrima' },
    { x: -1.1, y: 0.8, z: -0.1, size: 0.45, name: 'Auva' },
    { x: 0.4, y: 1.4, z: 0.3, size: 0.55, name: 'Vindemiatrix' },
    { x: -1.6, y: 1.2, z: 0.0, size: 0.4, name: 'Zavijava' },
    { x: -1.3, y: -0.4, z: -0.2, size: 0.45, name: 'Zaniah' },
    { x: 0.8, y: -0.6, z: 0.1, size: 0.45, name: 'Heze' },
    { x: 1.2, y: -1.6, z: -0.1, size: 0.4, name: 'Syrma' },
    { x: 1.8, y: -2.1, z: 0.2, size: 0.4, name: 'Rijl al Awwa' }
];
const virgoLines = [
    [0, 1], [1, 2], [2, 3], [2, 4], [1, 5], [5, 0], [0, 6], [6, 7], [7, 8]
];

const taurusStars = [
    { x: 0.0, y: 0.0, z: 0.0, size: 0.85, isOrange: true, name: 'Aldebaran' },
    { x: -0.7, y: 0.6, z: 0.1, size: 0.45, name: 'Ain' },
    { x: -0.4, y: -0.5, z: -0.1, size: 0.4, name: 'Hyadum I' },
    { x: -1.0, y: 0.2, z: 0.2, size: 0.4, name: 'Hyadum II' },
    { x: 1.5, y: 1.8, z: 0.3, size: 0.55, name: 'Elnath' },
    { x: 1.8, y: 0.5, z: -0.2, size: 0.5, name: 'Tianguan' },
    { x: -2.0, y: 1.5, z: 0.1, size: 0.6, name: 'Pleiades' }
];
const taurusLines = [
    [0, 1], [1, 3], [3, 2], [2, 0], [0, 5], [1, 4], [1, 6]
];

const virgoConstellation = buildConstellation('♍ Xử Nữ (Virgo)', virgoStars, virgoLines, new THREE.Vector3(-6.8, 3.4, -3.2), '#a855f7');
const taurusConstellation = buildConstellation('♉ Kim Ngưu (Taurus)', taurusStars, taurusLines, new THREE.Vector3(6.8, 3.4, -3.2), '#00f0ff');

/**
 * =========================================================================
 * 5.2 LOVE WORMHOLE PORTAL (Lỗ không gian tại tâm Trái Tim)
 * =========================================================================
 */
let isWarping = false;
let warpProgress = 0;

const createPortalVortexTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const cx = 256, cy = 256;
    for (let i = 0; i < 360; i += 2) {
        const rad = (i * Math.PI) / 180;
        const r1 = 25 + Math.random() * 35;
        const r2 = 190 + Math.random() * 60;
        const x1 = cx + Math.cos(rad) * r1;
        const y1 = cy + Math.sin(rad) * r1;
        const x2 = cx + Math.cos(rad + 1.2) * r2;
        const y2 = cy + Math.sin(rad + 1.2) * r2;

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, '#000000');
        grad.addColorStop(0.3, '#ff007f');
        grad.addColorStop(0.7, '#00f0ff');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 250);
    centerGrad.addColorStop(0, '#000000');
    centerGrad.addColorStop(0.2, '#050015');
    centerGrad.addColorStop(0.3, 'rgba(255, 0, 127, 0.95)');
    centerGrad.addColorStop(0.55, 'rgba(0, 240, 255, 0.6)');
    centerGrad.addColorStop(0.85, 'rgba(120, 0, 255, 0.2)');
    centerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = centerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 250, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
};

const portalVortexTexture = createPortalVortexTexture();

const wormholePortalGroup = new THREE.Group();
wormholePortalGroup.position.set(0, 2.4, 0);
wormholePortalGroup.scale.set(0.001, 0.001, 0.001);
wormholePortalGroup.visible = false;
scene.add(wormholePortalGroup);

const portalMat1 = new THREE.SpriteMaterial({
    map: portalVortexTexture,
    transparent: true,
    opacity: 0.98,
    blending: THREE.AdditiveBlending
});
const portalDisk1 = new THREE.Sprite(portalMat1);
portalDisk1.scale.set(3.4, 3.4, 3.4);
wormholePortalGroup.add(portalDisk1);

const portalRingGeom = new THREE.RingGeometry(0.3, 2.0, 48);
const portalRingMat = new THREE.MeshBasicMaterial({
    map: portalVortexTexture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const portalRingMesh = new THREE.Mesh(portalRingGeom, portalRingMat);
wormholePortalGroup.add(portalRingMesh);

const portalRingMesh2 = new THREE.Mesh(portalRingGeom.clone(), portalRingMat.clone());
portalRingMesh2.scale.set(0.65, 0.65, 0.65);
wormholePortalGroup.add(portalRingMesh2);

const warpStarsGroup = new THREE.Group();
warpStarsGroup.visible = false;
scene.add(warpStarsGroup);

const warpStarCount = 100;
const warpStarGeom = new THREE.BufferGeometry();
const warpPositions = new Float32Array(warpStarCount * 6);
const warpColors = new Float32Array(warpStarCount * 6);

for (let i = 0; i < warpStarCount; i++) {
    const i6 = i * 6;
    const rad = 0.3 + Math.random() * 4.5;
    const ang = Math.random() * Math.PI * 2;
    const x = Math.cos(ang) * rad;
    const y = Math.sin(ang) * rad + 2.4;
    const z = -12 + Math.random() * 24;

    warpPositions[i6] = x; warpPositions[i6 + 1] = y; warpPositions[i6 + 2] = z;
    warpPositions[i6 + 3] = x; warpPositions[i6 + 4] = y; warpPositions[i6 + 5] = z - 3.5;

    warpColors[i6] = 1; warpColors[i6 + 1] = 1; warpColors[i6 + 2] = 1;
    warpColors[i6 + 3] = 0; warpColors[i6 + 4] = 0.85; warpColors[i6 + 5] = 1;
}

warpStarGeom.setAttribute('position', new THREE.BufferAttribute(warpPositions, 3));
warpStarGeom.setAttribute('color', new THREE.BufferAttribute(warpColors, 3));

const warpStarMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
});
const warpStarsMesh = new THREE.LineSegments(warpStarGeom, warpStarMat);
warpStarsGroup.add(warpStarsMesh);

let warpFlightCurve = null;

const triggerWormhole = () => {
    if (isWarping) return;
    isWarping = true;
    warpProgress = 0;
    
    playWarpSound();

    const startP = camera.position.clone();
    const approachP = new THREE.Vector3(startP.x * 0.4, 2.4 + (startP.y - 2.4) * 0.3, Math.max(2.0, startP.z * 0.5));
    const heartCenterP = new THREE.Vector3(0, 2.4, 0.0);
    const exitBackP = new THREE.Vector3(0, 1.8, -4.5);
    const sweepSideP = new THREE.Vector3(4.2, 2.8, 2.0);
    const endDefaultP = defaultCameraPos.clone();

    warpFlightCurve = new THREE.CatmullRomCurve3([
        startP,
        approachP,
        heartCenterP,
        exitBackP,
        sweepSideP,
        endDefaultP
    ]);

    wormholePortalGroup.visible = true;
    wormholePortalGroup.scale.set(0.01, 0.01, 0.01);
    warpStarsGroup.visible = true;

    isCinemaMode = false;
    isResettingView = false;
    document.getElementById('btn-cinema')?.classList.remove('active');
};

/**
 * =========================================================================
 * 6. SHOOTING STARS / METEORS (Hệ thống Sao Băng)
 * =========================================================================
 */
const meteorsGroup = new THREE.Group();
scene.add(meteorsGroup);

const createMeteorHeadTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 200, 240, 0.8)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
};

const meteorHeadTexture = createMeteorHeadTexture();

class Meteor {
    constructor() {
        this.active = false;
        this.speed = 0.38;
        this.length = 6.8;

        this.group = new THREE.Group();
        this.group.visible = false;
        meteorsGroup.add(this.group);

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(6);
        const colors = new Float32Array(6);

        colors[0] = 1.0; colors[1] = 1.0; colors[2] = 1.0;
        colors[3] = 1.0; colors[4] = 0.4; colors[5] = 0.8;

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const lineMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        this.line = new THREE.Line(geometry, lineMaterial);
        this.group.add(this.line);

        const spriteMaterial = new THREE.SpriteMaterial({
            map: meteorHeadTexture,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        this.head = new THREE.Sprite(spriteMaterial);
        this.head.scale.set(0.22, 0.22, 0.22);
        this.group.add(this.head);

        this.direction = new THREE.Vector3(-1, -0.5, -0.6).normalize();
    }

    spawn(customPos = null) {
        this.active = true;
        this.group.visible = true;

        const theme = colorThemes[currentThemeIndex];
        const tailColor = new THREE.Color(theme.heartGlow);
        const colors = this.line.geometry.attributes.color;
        colors.setXYZ(0, 1.0, 1.0, 1.0);
        colors.setXYZ(1, tailColor.r * 0.4, tailColor.g * 0.4, tailColor.b * 0.4);
        colors.needsUpdate = true;

        if (customPos) {
            this.group.position.copy(customPos);
        } else {
            const startX = 6 + Math.random() * 8;
            const startY = 4.0 + Math.random() * 5.0;
            const startZ = -3 + (Math.random() - 0.5) * 8;
            this.group.position.set(startX, startY, startZ);
        }

        this.direction.set(
            -1.0 - Math.random() * 0.4,
            -0.42 - Math.random() * 0.25,
            -0.35 - Math.random() * 0.35
        ).normalize();

        this.length = 6.2 + Math.random() * 2.6; // Dài thướt tha, bay vút qua ngân hà
        this.speed = 0.32 + Math.random() * 0.22;
        this.updateGeometry();
    }

    updateGeometry() {
        const posAttr = this.line.geometry.attributes.position;
        const tail = this.direction.clone().multiplyScalar(-this.length);
        
        posAttr.setXYZ(0, 0, 0, 0);
        posAttr.setXYZ(1, tail.x, tail.y, tail.z);
        posAttr.needsUpdate = true;
    }

    update() {
        if (!this.active) return;

        this.group.position.addScaledVector(this.direction, this.speed);

        if (this.group.position.y < -3.5 || this.group.position.x < -12) {
            this.active = false;
            this.group.visible = false;
        }
    }
}

const meteorPool = [];
for (let i = 0; i < 10; i++) {
    meteorPool.push(new Meteor());
}

let nextMeteorTime = 1.5;

const spawnMeteorShower = () => {
    playSparkleChime();
    let count = 0;
    for (const m of meteorPool) {
        if (!m.active && count < 4) {
            setTimeout(() => m.spawn(), count * 200);
            count++;
        }
    }
};

/**
 * =========================================================================
 * 6.1 MAJESTIC COMET (Sao Chổi Đuôi Lụa Ánh Sáng)
 * =========================================================================
 */
const cometGroup = new THREE.Group();
scene.add(cometGroup);

const createCometStarTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 120);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.15, 'rgba(200, 245, 255, 0.9)');
    grad.addColorStop(0.4, 'rgba(80, 180, 255, 0.4)');
    grad.addColorStop(1, 'rgba(0, 100, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const flareH = ctx.createLinearGradient(0, 128, 256, 128);
    flareH.addColorStop(0, 'rgba(255, 255, 255, 0)');
    flareH.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
    flareH.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = flareH;
    ctx.fillRect(0, 125, 256, 6);

    const flareV = ctx.createLinearGradient(128, 0, 128, 256);
    flareV.addColorStop(0, 'rgba(255, 255, 255, 0)');
    flareV.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
    flareV.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = flareV;
    ctx.fillRect(125, 0, 6, 256);

    return new THREE.CanvasTexture(canvas);
};

const cometStarTexture = createCometStarTexture();

class MajesticComet {
    constructor() {
        this.active = false;
        this.progress = 0;
        this.duration = 10.0;
        this.history = [];
        this.maxHistory = 35;

        const headMat = new THREE.SpriteMaterial({
            map: cometStarTexture,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        this.head = new THREE.Sprite(headMat);
        this.head.scale.set(1.4, 1.4, 1.4);
        this.head.visible = false;
        cometGroup.add(this.head);

        this.ribbonSegments = 34;
        const ribbonGeom = new THREE.BufferGeometry();
        const positions = new Float32Array((this.ribbonSegments + 1) * 2 * 3);
        const colors = new Float32Array((this.ribbonSegments + 1) * 2 * 3);

        ribbonGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        ribbonGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const ribbonMat = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.ribbonMesh = new THREE.Mesh(ribbonGeom, ribbonMat);
        this.ribbonMesh.visible = false;
        cometGroup.add(this.ribbonMesh);

        this.startPos = new THREE.Vector3(15, 6.5, -9);
        this.midPos = new THREE.Vector3(0, 3.5, 0);
        this.endPos = new THREE.Vector3(-15, 5.5, 8);
    }

    spawn() {
        this.active = true;
        this.progress = 0;
        this.history = [];
        this.head.visible = true;
        this.ribbonMesh.visible = true;

        const flip = Math.random() > 0.5 ? 1 : -1;
        this.startPos.set(15 * flip, 5.5 + Math.random() * 2.5, -8 - Math.random() * 3);
        this.midPos.set(0, 2.8 + Math.random() * 1.5, (Math.random() - 0.5) * 3);
        this.endPos.set(-15 * flip, 4.5 + Math.random() * 2.5, 6 + Math.random() * 4);

        const initialPos = this.getPosition(0);
        for (let i = 0; i < this.maxHistory; i++) {
            this.history.push(initialPos.clone());
        }
    }

    getPosition(t) {
        const oneMinusT = 1 - t;
        const x = oneMinusT * oneMinusT * this.startPos.x + 2 * oneMinusT * t * this.midPos.x + t * t * this.endPos.x;
        const y = oneMinusT * oneMinusT * this.startPos.y + 2 * oneMinusT * t * this.midPos.y + t * t * this.endPos.y;
        const z = oneMinusT * oneMinusT * this.startPos.z + 2 * oneMinusT * t * this.midPos.z + t * t * this.endPos.z;
        return new THREE.Vector3(x, y, z);
    }

    update(delta) {
        if (!this.active) return;

        this.progress += delta / this.duration;
        if (this.progress >= 1.0) {
            this.active = false;
            this.head.visible = false;
            this.ribbonMesh.visible = false;
            return;
        }

        const currentPos = this.getPosition(this.progress);
        this.head.position.copy(currentPos);

        this.history.unshift(currentPos.clone());
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }

        const posAttr = this.ribbonMesh.geometry.attributes.position;
        const colAttr = this.ribbonMesh.geometry.attributes.color;
        const theme = colorThemes[currentThemeIndex];
        const tailColor = new THREE.Color(theme.heartGlow);

        const up = new THREE.Vector3(0, 1, 0);

        for (let i = 0; i < this.ribbonSegments; i++) {
            const p = this.history[i] || currentPos;
            const nextP = this.history[i + 1] || p;
            const tangent = nextP.clone().sub(p).normalize();
            if (tangent.lengthSq() < 0.001) tangent.set(1, 0, 0);

            const side = new THREE.Vector3().crossVectors(tangent, up).normalize();
            if (side.lengthSq() < 0.001) side.set(0, 1, 0);

            const ratio = i / this.ribbonSegments;
            const width = (0.1 + ratio * 1.1);

            const v1 = p.clone().addScaledVector(side, width * 0.5);
            const v2 = p.clone().addScaledVector(side, -width * 0.5);

            const idx = i * 2;
            posAttr.setXYZ(idx, v1.x, v1.y, v1.z);
            posAttr.setXYZ(idx + 1, v2.x, v2.y, v2.z);

            const alpha = Math.pow(1.0 - ratio, 1.8);
            const r = THREE.MathUtils.lerp(1.0, tailColor.r, ratio) * alpha;
            const g = THREE.MathUtils.lerp(1.0, tailColor.g, ratio) * alpha;
            const b = THREE.MathUtils.lerp(1.0, tailColor.b, ratio) * alpha;

            colAttr.setXYZ(idx, r, g, b);
            colAttr.setXYZ(idx + 1, r, g, b);
        }

        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
    }
}

const majesticComet = new MajesticComet();
let nextCometTime = 5.0;

/**
 * =========================================================================
 * 7. 3D HEART FIREWORKS & PARTICLE BURST ENGINE
 * =========================================================================
 */
const fireworksGroup = new THREE.Group();
scene.add(fireworksGroup);

const createFireworkTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 180, 230, 0.9)');
    grad.addColorStop(0.7, 'rgba(255, 0, 127, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
};

const fireworkTexture = createFireworkTexture();

class HeartFirework {
    constructor() {
        this.active = false;
        this.particleCount = 90;
        this.geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.particleCount * 3);
        this.colors = new Float32Array(this.particleCount * 3);
        this.velocities = [];
        this.life = 0;
        this.maxLife = 1.4;

        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

        this.material = new THREE.PointsMaterial({
            size: 0.12,
            map: fireworkTexture,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true
        });

        this.points = new THREE.Points(this.geometry, this.material);
        this.points.visible = false;
        fireworksGroup.add(this.points);
    }

    spawn(originPos, hexColor) {
        this.active = true;
        this.points.visible = true;
        this.life = 1.0;
        this.maxLife = 1.2 + Math.random() * 0.4;
        this.material.opacity = 1.0;

        const baseColor = new THREE.Color(hexColor);
        const colAttr = this.geometry.attributes.color;
        const posAttr = this.geometry.attributes.position;
        this.velocities = [];

        this.points.position.copy(originPos);

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            posAttr.setXYZ(i3, 0, 0, 0);

            // Công thức hình trái tim tham số 2D/3D bung nở
            const t = (i / this.particleCount) * Math.PI * 2;
            const hx = 16 * Math.pow(Math.sin(t), 3) / 16;
            const hy = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
            const hz = (Math.random() - 0.5) * 0.4;

            const speed = 0.035 + Math.random() * 0.025;
            this.velocities.push(new THREE.Vector3(hx * speed, hy * speed + 0.015, hz * speed));

            const pCol = baseColor.clone();
            if (Math.random() > 0.4) pCol.lerp(new THREE.Color('#ffffff'), Math.random() * 0.8);
            colAttr.setXYZ(i3, pCol.r, pCol.g, pCol.b);
        }

        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
    }

    update(delta) {
        if (!this.active) return;

        this.life -= delta / this.maxLife;
        this.material.opacity = Math.max(0, this.life);

        const posAttr = this.geometry.attributes.position;
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            const v = this.velocities[i];
            
            posAttr.array[i3] += v.x;
            posAttr.array[i3 + 1] += v.y;
            posAttr.array[i3 + 2] += v.z;

            // Trọng lực kéo hạt nhẹ xuống
            v.y -= 0.0006;
            v.multiplyScalar(0.975);
        }
        posAttr.needsUpdate = true;

        if (this.life <= 0) {
            this.active = false;
            this.points.visible = false;
        }
    }
}

const fireworkPool = [];
for (let i = 0; i < 15; i++) {
    fireworkPool.push(new HeartFirework());
}

const triggerHeartFirework = (worldPos = null) => {
    const theme = colorThemes[currentThemeIndex];
    const origin = worldPos ? worldPos.clone() : new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        1.5 + Math.random() * 2.5,
        (Math.random() - 0.5) * 4
    );

    const inactive = fireworkPool.find(f => !f.active);
    if (inactive) {
        const color = Math.random() > 0.4 ? theme.heartBase : theme.heartGlow;
        inactive.spawn(origin, color);
    }
};

const triggerDoubleHeartFirework = () => {
    triggerHeartFirework(new THREE.Vector3(-1.35, 2.0, (Math.random() - 0.5) * 1.5));
    setTimeout(() => {
        triggerHeartFirework(new THREE.Vector3(1.35, 2.3, (Math.random() - 0.5) * 1.5));
    }, 130);
};

// Xử lý Double-Tap trên thiết bị cảm ứng / Mobile
let lastTouchEndTime = 0;
let lastTouchEndPos = { x: 0, y: 0 };

window.addEventListener('touchend', (e) => {
    if (e.target.closest('#ui-controls') || e.target.closest('.text-modal') || e.target.closest('#btn-restore-ui')) {
        return;
    }
    const touch = e.changedTouches && e.changedTouches[0];
    if (!touch) return;

    const now = performance.now();
    const dt = now - lastTouchEndTime;
    const dx = Math.abs(touch.clientX - lastTouchEndPos.x);
    const dy = Math.abs(touch.clientY - lastTouchEndPos.y);

    if (dt < 330 && dx < 45 && dy < 45) {
        // Kích hoạt chùm pháo hoa tim đôi khi chạm 2 lần liên tiếp
        e.preventDefault();
        triggerDoubleHeartFirework();
        lastTouchEndTime = 0;
    } else {
        lastTouchEndTime = now;
        lastTouchEndPos = { x: touch.clientX, y: touch.clientY };
    }
}, { passive: false });

/**
 * =========================================================================
 * 7.1 WEB AUDIO SYNTHESIZER (Âm thanh hiệu ứng không gian)
 * =========================================================================
 */
let sfxAudioCtx = null;
let isSoundMuted = false;

const initSFXContext = () => {
    if (!sfxAudioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) sfxAudioCtx = new AudioCtx();
    }
    if (sfxAudioCtx && sfxAudioCtx.state === 'suspended') {
        sfxAudioCtx.resume().catch(() => {});
    }
};

// Đã tắt âm thanh pháo hoa theo yêu cầu
const playFireworkPop = () => {};

const playSparkleChime = () => {
    if (isSoundMuted || !fxConfig.soundFx) return;
    initSFXContext();
    if (!sfxAudioCtx) return;

    try {
        const now = sfxAudioCtx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = sfxAudioCtx.createOscillator();
            const gain = sfxAudioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);

            gain.gain.setValueAtTime(0, now + idx * 0.06);
            gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.06 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.45);

            osc.connect(gain);
            gain.connect(sfxAudioCtx.destination);

            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.46);
        });
    } catch (e) {}
};

const playWarpSound = () => {
    if (isSoundMuted) return;
    initSFXContext();
    if (!sfxAudioCtx) return;

    try {
        const now = sfxAudioCtx.currentTime;
        const osc = sfxAudioCtx.createOscillator();
        const gain = sfxAudioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 1.2);
        osc.frequency.exponentialRampToValueAtTime(220, now + 2.5);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 1.0);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

        osc.connect(gain);
        gain.connect(sfxAudioCtx.destination);

        osc.start(now);
        osc.stop(now + 2.5);
    } catch (e) {}
};

/**
 * =========================================================================
 * 8. ORBITING SPRITES & CUSTOM PHOTO SYSTEM
 * =========================================================================
 */
const photosGroup = new THREE.Group();
photosGroup.visible = (fxConfig.showPhotos !== false);
sceneSprites.add(photosGroup);

const spaceIconsGroup = new THREE.Group();
spaceIconsGroup.visible = (fxConfig.showSpaceIcons !== false);
sceneSprites.add(spaceIconsGroup);

const getAllOrbitSprites = () => {
    return [...photosGroup.children, ...spaceIconsGroup.children];
};

const addSpriteToOrbit = (texture, isCustom = false) => {
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: isCustom ? 0.95 : 0.65
    });

    const sprite = new THREE.Sprite(material);
    const radius = 2.5 + Math.random() * 5.5;
    const angle = Math.random() * Math.PI * 2;
    
    sprite.position.x = Math.cos(angle) * radius;
    sprite.position.z = Math.sin(angle) * radius;
    sprite.position.y = (Math.random() - 0.5) * 4.5;

    const baseScale = isCustom ? (0.7 + Math.random() * 0.3) : (0.18 + Math.random() * 0.25);
    sprite.scale.set(baseScale, baseScale, baseScale);

    sprite.userData = {
        radius: radius,
        angle: angle,
        speed: (Math.random() > 0.5 ? 1 : -1) * (0.04 + Math.random() * 0.1),
        originalScale: baseScale,
        isZoomed: false,
        isCustomPhoto: isCustom
    };

    if (isCustom) {
        photosGroup.add(sprite);
    } else {
        spaceIconsGroup.add(sprite);
    }

    return sprite;
};

const initDefaultSprites = () => {
    const emojis = ['🚀', '🪐', '🌟', '🛸', '🛰️', '🐱', '💖'];
    emojis.forEach((emoji) => {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const ctx = c.getContext('2d');
        ctx.font = '80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 64, 70);

        const tex = new THREE.CanvasTexture(c);
        const count = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
            addSpriteToOrbit(tex, false);
        }
    });

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/photos/cat.jpg', (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        for (let i = 0; i < 3; i++) {
            addSpriteToOrbit(tex, true);
        }
    });

    // Tải các ảnh người dùng đã lưu trong LocalStorage
    loadSavedPhotos();
};

const saveUploadedPhoto = (dataUrl) => {
    try {
        let saved = JSON.parse(localStorage.getItem('galaxy_uploaded_photos') || '[]');
        if (!Array.isArray(saved)) saved = [];
        saved.push(dataUrl);
        // Giới hạn lưu 6 ảnh để đảm bảo dung lượng LocalStorage luôn an toàn
        if (saved.length > 6) saved = saved.slice(saved.length - 6);
        localStorage.setItem('galaxy_uploaded_photos', JSON.stringify(saved));
    } catch (e) {
        console.warn('LocalStorage photo quota exceeded:', e);
    }
};

const loadSavedPhotos = () => {
    try {
        const saved = JSON.parse(localStorage.getItem('galaxy_uploaded_photos') || '[]');
        if (Array.isArray(saved) && saved.length > 0) {
            saved.forEach(dataUrl => {
                const img = new Image();
                img.src = dataUrl;
                img.onload = () => {
                    const tex = new THREE.Texture(img);
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.needsUpdate = true;
                    addSpriteToOrbit(tex, true);
                    addSpriteToOrbit(tex, true);
                };
            });
        }
    } catch (e) {}
};

initDefaultSprites();

const handlePhotoUpload = (files) => {
    Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                // Tối ưu kích thước ảnh để lưu LocalStorage nhẹ và tải nhanh
                const maxDim = 480;
                let w = img.width;
                let h = img.height;
                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }
                const c = document.createElement('canvas');
                c.width = w;
                c.height = h;
                const ctx = c.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const compressedDataUrl = c.toDataURL('image/jpeg', 0.82);

                const tex = new THREE.Texture(c);
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.needsUpdate = true;
                addSpriteToOrbit(tex, true);
                addSpriteToOrbit(tex, true);
                saveUploadedPhoto(compressedDataUrl);
                playSparkleChime();
            };
        };
        reader.readAsDataURL(file);
    });
};

/**
 * =========================================================================
 * 8.1 STAR WISHES / LOVE LETTERS CAPSULES (Những Vì Sao Ước Nguyện)
 * =========================================================================
 */
const defaultRomanticQuotes = [
    "Vũ trụ có hàng tỷ vì sao, nhưng với anh, em là ngôi sao sáng và đẹp nhất 💖",
    "Gặp được em giữa ngân hà rộng lớn này là điều kỳ diệu nhất cuộc đời anh ✨",
    "Mỗi nhịp đập của quả tim vũ trụ này đều là lời thì thầm: Anh Yêu Em 🪐",
    "Nguyện cùng em đi qua vạn năm ánh sáng, tay trong tay chẳng rời xa 💫",
    "Em là nguồn năng lượng rực rỡ nhất sưởi ấm cả dải ngân hà của anh 🌟",
    "Dù thời gian có trôi hay vũ trụ giãn nở, tình cảm này vẫn vẹn nguyên như ngày đầu 💖"
];

let customRomanticQuotes = [...defaultRomanticQuotes];
try {
    const savedWishes = localStorage.getItem('galaxy_star_wishes');
    if (savedWishes) {
        const parsed = JSON.parse(savedWishes);
        if (Array.isArray(parsed) && parsed.length > 0) {
            customRomanticQuotes = parsed;
        }
    }
} catch (e) {}

const starCapsulesGroup = new THREE.Group();
sceneSprites.add(starCapsulesGroup);
const starCapsulesList = [];

// Không sinh các đĩa sao vàng to che tầm nhìn, người dùng có thể nhấp nút 🌟 trên thanh công cụ
const initStarCapsules = () => {};
initStarCapsules();

const openStarWishModal = (quoteIndex = null) => {
    playSparkleChime();
    const wishModal = document.getElementById('star-wish-modal');
    const quoteTextEl = document.getElementById('wish-quote-text');
    const authorTextEl = document.getElementById('wish-author-text');
    if (!wishModal || !quoteTextEl) return;

    const list = customRomanticQuotes.length > 0 ? customRomanticQuotes : defaultRomanticQuotes;
    const idx = (quoteIndex !== null && quoteIndex >= 0) ? (quoteIndex % list.length) : Math.floor(Math.random() * list.length);
    quoteTextEl.textContent = `"${list[idx]}"`;

    const names = localStorage.getItem('galaxy_partner_names') || 'Anh & Em 💖';
    if (authorTextEl) authorTextEl.textContent = `💖 Gửi gắm từ: ${names}`;

    wishModal.classList.add('show');
};

/**
 * =========================================================================
 * 8.2 MEMORY SATURN RINGS 3D SYSTEM (Vòng Đai Sao Thổ Kỷ Niệm)
 * =========================================================================
 */
const defaultSaturnMemories = [
    {
        id: 'mem_1',
        title: 'Ngày Đầu Gặp Gỡ ☕',
        date: '14 Tháng 02 • Quán cà phê góc phố',
        quote: 'Khoảnh khắc ánh mắt ta chạm nhau, cả vũ trụ dường như ngừng quay.',
        image: '/photos/cat.jpg'
    },
    {
        id: 'mem_2',
        title: 'Dưới Cơn Mưa Đầu Mùa 🌧️',
        date: '20 Tháng 05 • Chiếc ô nhỏ che đôi mình',
        quote: 'Mưa ngoài kia có lớn bao nhiêu cũng chẳng bằng sự ấm áp khi nép vào vai anh.',
        image: '/photos/cat.jpg'
    },
    {
        id: 'mem_3',
        title: 'Chuyến Đi Xa Cùng Nhau 🌅',
        date: '08 Tháng 08 • Ngắm hoàng hôn trên biển',
        quote: 'Đi đâu không quan trọng, chỉ cần nơi đó có em ở bên cạnh.',
        image: '/photos/cat.jpg'
    },
    {
        id: 'mem_4',
        title: 'Mãi Yêu & Bên Nhau 💖',
        date: 'Vũ Trụ Vĩnh Cửu • Tương lai tươi đẹp',
        quote: 'Dù đi qua vạn năm ánh sáng, trái tim này vẫn mãi hướng về một mình em.',
        image: '/photos/cat.jpg'
    }
];

let saturnMemories = [...defaultSaturnMemories];
try {
    const savedMemories = localStorage.getItem('galaxy_saturn_memories_data');
    if (savedMemories) {
        const parsed = JSON.parse(savedMemories);
        if (Array.isArray(parsed) && parsed.length > 0) {
            saturnMemories = parsed;
        }
    }
} catch (e) {}

const saturnColorThemes = {
    gold: {
        inner: '#ffe680',
        mid: '#ffaa00',
        outer: '#ff5500',
        glow: '#ffd700',
        accent: '#ffcc00'
    },
    pink: {
        inner: '#ff88cc',
        mid: '#ff007f',
        outer: '#9900ee',
        glow: '#ff77aa',
        accent: '#ff0055'
    },
    cyan: {
        inner: '#80f7ff',
        mid: '#00f0ff',
        outer: '#0055ff',
        glow: '#00d2ff',
        accent: '#00e5ff'
    },
    purple: {
        inner: '#cc88ff',
        mid: '#aa00ff',
        outer: '#4400aa',
        glow: '#bb44ff',
        accent: '#9900ee'
    },
    rainbow: {
        inner: '#ff007f',
        mid: '#00f0ff',
        outer: '#ffd700',
        glow: '#ffffff',
        accent: '#ff44aa'
    }
};

const getSaturnTiltAngles = (tiltType) => {
    switch (tiltType) {
        case 'deep': return { x: 0.78, z: 0.40 };
        case 'flat': return { x: 0, z: 0 };
        case 'vertical': return { x: Math.PI / 2, z: 0 };
        case 'saturn':
        default: return { x: 0.49, z: 0.25 }; // 28 độ
    }
};

// Khởi tạo các nhóm 3D cho Vành đai Sao Thổ
const saturnMainGroup = new THREE.Group();
saturnMainGroup.position.set(0, 2.4, 0);
saturnMainGroup.visible = (fxConfig.showSaturnRings !== false);
scene.add(saturnMainGroup);

const saturnDustGroup = new THREE.Group();
saturnMainGroup.add(saturnDustGroup);

const saturnRibbonsGroup = new THREE.Group();
saturnMainGroup.add(saturnRibbonsGroup);

const saturnPhotosContainer = new THREE.Group();
saturnPhotosContainer.position.set(0, 2.4, 0);
saturnPhotosContainer.visible = (fxConfig.showSaturnRings !== false);
sceneSprites.add(saturnPhotosContainer);

const saturnPhotosGroup = new THREE.Group();
saturnPhotosContainer.add(saturnPhotosGroup);

let currentActiveMemoryIndex = 0;

// Cập nhật góc nghiêng Vành đai
const updateSaturnTilt = () => {
    const tilt = getSaturnTiltAngles(fxConfig.saturnTilt);
    saturnMainGroup.rotation.x = tilt.x;
    saturnMainGroup.rotation.z = tilt.z;
    saturnPhotosContainer.rotation.x = tilt.x;
    saturnPhotosContainer.rotation.z = tilt.z;
};

updateSaturnTilt();

// 1. Tạo bụi sao lấp lánh cho Vành đai (Saturn Dust Particles & Silk Ribbons)
const generateSaturnDustAndRibbons = () => {
    while (saturnDustGroup.children.length > 0) {
        const obj = saturnDustGroup.children[0];
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
        saturnDustGroup.remove(obj);
    }
    while (saturnRibbonsGroup.children.length > 0) {
        const obj = saturnRibbonsGroup.children[0];
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
        saturnRibbonsGroup.remove(obj);
    }

    const themeKey = fxConfig.saturnTheme || 'gold';
    const theme = saturnColorThemes[themeKey] || saturnColorThemes.gold;

    const particleCount = 3800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const innerRadius = 3.6;
    const outerRadius = 6.2;
    const cassiniInner = 4.7;
    const cassiniOuter = 4.95;

    const innerCol = new THREE.Color(theme.inner);
    const midCol = new THREE.Color(theme.mid);
    const outerCol = new THREE.Color(theme.outer);

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        let r = innerRadius + Math.random() * (outerRadius - innerRadius);

        // Khe hở Cassini Division
        if (r > cassiniInner && r < cassiniOuter && Math.random() > 0.12) {
            r = (Math.random() > 0.5 ? cassiniInner - 0.15 : cassiniOuter + 0.15) + (Math.random() - 0.5) * 0.25;
        }

        const angle = Math.random() * Math.PI * 2;
        const thickness = (Math.random() - 0.5) * 0.08 * (1.0 + (r - innerRadius) * 0.2);

        positions[i3] = Math.cos(angle) * r;
        positions[i3 + 1] = thickness;
        positions[i3 + 2] = Math.sin(angle) * r;

        let col = innerCol.clone();
        const ratio = (r - innerRadius) / (outerRadius - innerRadius);
        if (themeKey === 'rainbow') {
            col.setHSL((angle / (Math.PI * 2) + ratio * 0.5) % 1.0, 0.95, 0.65);
        } else {
            if (ratio < 0.5) {
                col.lerp(midCol, ratio * 2);
            } else {
                col = midCol.clone().lerp(outerCol, (ratio - 0.5) * 2);
            }
        }

        colors[i3] = col.r;
        colors[i3 + 1] = col.g;
        colors[i3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.022,
        vertexColors: true,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    saturnDustGroup.add(points);

    // Thêm các vòng lụa ánh sáng (Silk Ribbons) tăng độ mềm mại lộng lẫy
    const ribbonRadii = [3.9, 4.4, 5.2, 5.8];
    ribbonRadii.forEach((rad, idx) => {
        const ringGeom = new THREE.RingGeometry(rad - 0.04, rad + 0.04, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(idx % 2 === 0 ? theme.inner : theme.mid),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.18,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        saturnRibbonsGroup.add(ringMesh);
    });
};

generateSaturnDustAndRibbons();

// 2. Tạo Canvas Texture cho từng thẻ ảnh Polaroid trên Vành đai
const createMemoryPolaroidTexture = (memoryItem, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 340;
    const ctx = canvas.getContext('2d');

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const renderCard = (imgObj = null) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Khung Polaroid viền pha lê phát sáng
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255, 0, 127, 0.45)';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.roundRect(10, 10, 260, 320, 14);
        ctx.fill();
        ctx.restore();

        // Viền bóng mờ tinh tế
        ctx.strokeStyle = 'rgba(255, 180, 220, 0.8)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(10, 10, 260, 320, 14);
        ctx.stroke();

        // Khu vực vẽ ảnh
        const photoX = 22;
        const photoY = 22;
        const photoW = 236;
        const photoH = 205;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(photoX, photoY, photoW, photoH, 10);
        ctx.clip();

        if (imgObj && imgObj.complete && imgObj.naturalWidth > 0) {
            // Vẽ ảnh thật căn giữa theo tỷ lệ cover
            const imgAspect = imgObj.naturalWidth / imgObj.naturalHeight;
            const targetAspect = photoW / photoH;
            let drawW, drawH, drawX, drawY;

            if (imgAspect > targetAspect) {
                drawH = photoH;
                drawW = photoH * imgAspect;
                drawX = photoX - (drawW - photoW) / 2;
                drawY = photoY;
            } else {
                drawW = photoW;
                drawH = photoW / imgAspect;
                drawX = photoX;
                drawY = photoY - (drawH - photoH) / 2;
            }
            ctx.drawImage(imgObj, drawX, drawY, drawW, drawH);
        } else {
            // Gradient vũ trụ nghệ thuật nếu ảnh đang tải
            const grad = ctx.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH);
            grad.addColorStop(0, '#2d004d');
            grad.addColorStop(0.5, '#6a0080');
            grad.addColorStop(1, '#ff007f');
            ctx.fillStyle = grad;
            ctx.fillRect(photoX, photoY, photoW, photoH);

            ctx.font = '64px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💖', photoX + photoW / 2, photoY + photoH / 2);
        }
        ctx.restore();

        // Huy hiệu kỷ niệm số ở góc trên
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 127, 0.9)';
        ctx.beginPath();
        ctx.roundRect(photoX + 8, photoY + 8, 56, 22, 11);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🪐 #${index + 1}`, photoX + 36, photoY + 19);
        ctx.restore();

        // Tiêu đề kỷ niệm
        ctx.fillStyle = '#221128';
        ctx.font = 'bold 15px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const titleText = memoryItem.title || `Kỷ Niệm #${index + 1}`;
        ctx.fillText(titleText, 140, 252);

        // Ngày kỷ niệm
        ctx.fillStyle = '#c4207d';
        ctx.font = '500 12px "Outfit", sans-serif';
        const dateText = memoryItem.date || 'Khoảnh Khắc Ngọt Ngào';
        ctx.fillText(dateText, 140, 276);

        // Dòng lụa ngăn cách nhỏ
        ctx.strokeStyle = 'rgba(255, 0, 127, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(80, 296);
        ctx.lineTo(200, 296);
        ctx.stroke();

        texture.needsUpdate = true;
    };

    renderCard();

    if (memoryItem.image) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = memoryItem.image;
        img.onload = () => {
            renderCard(img);
        };
    }

    return texture;
};

// 3. Dựng các Sprite ảnh kỷ niệm trên quỹ đạo Vành đai
const buildSaturnMemorySprites = () => {
    while (saturnPhotosGroup.children.length > 0) {
        const sprite = saturnPhotosGroup.children[0];
        if (sprite.material) {
            if (sprite.material.map) sprite.material.map.dispose();
            sprite.material.dispose();
        }
        saturnPhotosGroup.remove(sprite);
    }

    const total = saturnMemories.length;
    if (total === 0) return;

    const orbitRadius = 4.85;

    saturnMemories.forEach((mem, idx) => {
        const angle = (idx / total) * Math.PI * 2;
        const tex = createMemoryPolaroidTexture(mem, idx);

        const mat = new THREE.SpriteMaterial({
            map: tex,
            transparent: true,
            opacity: 0.96
        });

        const sprite = new THREE.Sprite(mat);
        sprite.position.x = Math.cos(angle) * orbitRadius;
        sprite.position.z = Math.sin(angle) * orbitRadius;
        sprite.position.y = (Math.sin(angle * 3) * 0.12);

        const baseW = 1.35;
        const baseH = 1.65;
        sprite.scale.set(baseW, baseH, 1.0);

        sprite.userData = {
            isSaturnMemory: true,
            memoryIndex: idx,
            memoryData: mem,
            orbitAngle: angle,
            orbitRadius: orbitRadius,
            baseScale: { x: baseW, y: baseH },
            isZoomed: false
        };

        saturnPhotosGroup.add(sprite);
    });
};

buildSaturnMemorySprites();

// 4. Modal Chi Tiết Kỷ Niệm (Khi bấm vào ảnh trên Vành Đai)
const openMemoryDetailModal = (index) => {
    if (index < 0 || index >= saturnMemories.length) index = 0;
    currentActiveMemoryIndex = index;
    const mem = saturnMemories[index];
    if (!mem) return;

    playSparkleChime();

    const detailModal = document.getElementById('memory-detail-modal');
    const imgEl = document.getElementById('detail-memory-img');
    const titleEl = document.getElementById('detail-memory-title');
    const dateEl = document.getElementById('detail-memory-date');
    const quoteEl = document.getElementById('detail-memory-quote');

    if (imgEl) imgEl.src = mem.image || '/photos/cat.jpg';
    if (titleEl) titleEl.textContent = mem.title || `Kỷ Niệm #${index + 1}`;
    if (dateEl) dateEl.textContent = `🗓️ ${mem.date || 'Khoảnh khắc ngọt ngào'}`;
    if (quoteEl) quoteEl.textContent = `"${mem.quote || 'Tình yêu là điều kỳ diệu nhất giữa ngân hà.'}"`;

    if (detailModal) detailModal.classList.add('show');
};

// 5. Render danh sách kỷ niệm trong Modal Quản Lý
const renderSaturnMemoriesListUI = () => {
    const listContainer = document.getElementById('saturn-memories-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    if (saturnMemories.length === 0) {
        listContainer.innerHTML = '<div style="color: rgba(255,255,255,0.5); font-size: 0.85rem; padding: 12px;">Chưa có kỷ niệm nào trên vành đai. Hãy thêm kỷ niệm mới bên dưới!</div>';
        return;
    }

    saturnMemories.forEach((mem, idx) => {
        const itemRow = document.createElement('div');
        itemRow.className = 'memory-item-row';
        itemRow.innerHTML = `
            <img src="${mem.image || '/photos/cat.jpg'}" class="memory-thumb" alt="Thumb" />
            <div class="memory-item-info">
                <div class="memory-item-title">${idx + 1}. ${mem.title}</div>
                <div class="memory-item-date">${mem.date || ''}</div>
            </div>
            <button class="btn-delete-mem" data-index="${idx}">🗑️ Xóa</button>
        `;
        listContainer.appendChild(itemRow);
    });

    // Gắn sự kiện nút xóa
    listContainer.querySelectorAll('.btn-delete-mem').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const delIdx = parseInt(btn.getAttribute('data-index'), 10);
            if (!isNaN(delIdx) && delIdx >= 0 && delIdx < saturnMemories.length) {
                saturnMemories.splice(delIdx, 1);
                saveSaturnMemoriesToStorage();
                renderSaturnMemoriesListUI();
                buildSaturnMemorySprites();
                playSparkleChime();
            }
        });
    });
};

const saveSaturnMemoriesToStorage = () => {
    try {
        localStorage.setItem('galaxy_saturn_memories_data', JSON.stringify(saturnMemories));
    } catch (e) {
        console.warn('Could not save saturn memories to LocalStorage:', e);
    }
};

/**
 * =========================================================================
 * 8.3 POLAROID SPACE SNAPSHOT EXPORTER (Chụp Ảnh & Tạo Thiệp Kỷ Niệm)
 * =========================================================================
 */
const generateSpaceSnapshot = () => {
    playSparkleChime();
    const snapshotModal = document.getElementById('snapshot-modal');
    const snapshotCanvas = document.getElementById('snapshot-canvas');
    if (!snapshotCanvas || !snapshotModal) return;

    // Render cảnh 3D hiện tại sang canvas
    renderer.clear();
    composer.render();
    renderer.clearDepth();
    renderer.render(sceneSprites, camera);

    const polaroidWidth = 1080;
    const polaroidHeight = 1350;
    snapshotCanvas.width = polaroidWidth;
    snapshotCanvas.height = polaroidHeight;
    const ctx = snapshotCanvas.getContext('2d');

    // Khung Polaroid Trắng Sáng Cổ Điển
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, polaroidWidth, polaroidHeight);

    // Vẽ ảnh vũ trụ 3D vào khung
    const photoMarginX = 64;
    const photoMarginY = 64;
    const photoW = polaroidWidth - photoMarginX * 2;
    const photoH = 920;

    ctx.drawImage(renderer.domElement, photoMarginX, photoMarginY, photoW, photoH);

    // Viền mỏng xung quanh ảnh chụp
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(photoMarginX, photoMarginY, photoW, photoH);

    // Thêm chữ lãng mạn & Tên cặp đôi
    const loveText = document.getElementById('custom-text-input')?.value || initialLoveText;
    const partnerNames = localStorage.getItem('galaxy_partner_names') || 'Anh & Em 💖';
    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    ctx.font = '700 48px "Playfair Display", serif';
    ctx.fillStyle = '#111122';
    ctx.textAlign = 'center';
    ctx.fillText(loveText, polaroidWidth / 2, 1060);

    ctx.font = '600 32px "Outfit", sans-serif';
    ctx.fillStyle = '#ff007f';
    ctx.fillText(partnerNames, polaroidWidth / 2, 1125);

    ctx.font = '400 24px "Outfit", sans-serif';
    ctx.fillStyle = '#888899';
    ctx.fillText(`✨ Galaxy of Love • ${dateFormatted} ✨`, polaroidWidth / 2, 1180);

    snapshotModal.classList.add('show');
};

/**
 * =========================================================================
 * 9. CINEMA TOUR & SMOOTH RESET CONTROLLER
 * =========================================================================
 */
let isCinemaMode = false;
let isResettingView = false;
const defaultCameraPos = new THREE.Vector3(0, 2.5, 7.2);
const defaultTarget = new THREE.Vector3(0, 1.35, 0);

controls.addEventListener('start', () => {
    isResettingView = false;
    // Giữ nguyên Cinema Mode khi chạm/click vào màn hình
});

/**
 * =========================================================================
 * 10. AUDIO BACKGROUND & AUDIO VISUALIZER
 * =========================================================================
 */
const bgMusic = new Audio('/music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.65;
let musicStarted = false;

let audioContext = null;
let analyser = null;
let audioDataArray = null;

let ytPlayer = null;
let isUsingYouTube = false;
let isYTMuted = false;

const extractYouTubeId = (url) => {
    if (!url) return null;
    const trimmed = url.trim();
    if (trimmed.length === 11 && !trimmed.includes('/') && !trimmed.includes('.')) {
        return trimmed;
    }
    const match = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
};

const loadYouTubeAPI = (callback) => {
    if (window.YT && window.YT.Player) {
        callback();
        return;
    }
    if (!document.getElementById('yt-iframe-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        callback();
    };
};

const updateMusicButtonState = (muted) => {
    const btnM = document.getElementById('btn-music');
    if (!btnM) return;
    if (muted) {
        btnM.classList.add('muted');
        btnM.innerText = '🔇';
    } else {
        btnM.classList.remove('muted');
        btnM.innerText = '🎵';
    }
};

// Khôi phục trạng thái Âm Thanh Mute từ LocalStorage
try {
    const savedMuted = localStorage.getItem('galaxy_music_muted');
    if (savedMuted === 'true') {
        isSoundMuted = true;
        bgMusic.muted = true;
        isYTMuted = true;
        updateMusicButtonState(true);
    }
} catch (e) {}

const playYouTubeMusic = (videoId) => {
    loadYouTubeAPI(() => {
        bgMusic.pause();
        isUsingYouTube = true;
        isYTMuted = false;

        if (!ytPlayer) {
            ytPlayer = new window.YT.Player('yt-player', {
                height: '100',
                width: '100',
                videoId: videoId,
                playerVars: {
                    autoplay: 1,
                    loop: 1,
                    playlist: videoId,
                    controls: 0
                },
                events: {
                    onReady: (event) => {
                        event.target.setVolume(70);
                        event.target.playVideo();
                        musicStarted = true;
                        updateMusicButtonState(false);
                    },
                    onStateChange: (event) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            event.target.playVideo();
                        }
                    }
                }
            });
        } else {
            ytPlayer.loadVideoById(videoId);
            ytPlayer.setVolume(70);
            ytPlayer.unMute();
            ytPlayer.playVideo();
            musicStarted = true;
            updateMusicButtonState(false);
        }
    });
};

const switchToDefaultMusic = () => {
    isUsingYouTube = false;
    if (ytPlayer && ytPlayer.pauseVideo) {
        ytPlayer.pauseVideo();
    }
    bgMusic.currentTime = 0;
    bgMusic.muted = false;
    bgMusic.play().then(() => {
        musicStarted = true;
        updateMusicButtonState(false);
    }).catch(() => {});
};

const initAudioAnalyser = () => {
    if (audioContext) return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        audioContext = new AudioContextClass();

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        audioDataArray = new Uint8Array(analyser.frequencyBinCount);

        const source = audioContext.createMediaElementSource(bgMusic);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
    } catch (e) {}
};

const startMusic = () => {
    initSFXContext();
    if (isUsingYouTube) {
        if (ytPlayer && ytPlayer.playVideo) {
            ytPlayer.playVideo();
            musicStarted = true;
            updateMusicButtonState(false);
        }
        return;
    }
    initAudioAnalyser();
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }
    bgMusic.play().then(() => {
        musicStarted = true;
        updateMusicButtonState(false);
    }).catch(() => {});
};

window.addEventListener('pointerdown', () => { if (!musicStarted) startMusic(); }, { once: true });
window.addEventListener('click', () => { if (!musicStarted) startMusic(); }, { once: true });
window.addEventListener('keydown', () => { if (!musicStarted) startMusic(); }, { once: true });

/**
 * =========================================================================
 * 10.1 MAGIC FAIRY DUST TRAIL (Vệt bụi sao ma thuật theo chuột)
 * =========================================================================
 */
const fairyCanvas = document.getElementById('fairy-canvas');
const fairyCtx = fairyCanvas ? fairyCanvas.getContext('2d') : null;
const fairyDust = [];

const resizeFairyCanvas = () => {
    if (!fairyCanvas) return;
    fairyCanvas.width = window.innerWidth;
    fairyCanvas.height = window.innerHeight;
};
window.addEventListener('resize', resizeFairyCanvas);
resizeFairyCanvas();

let lastFairyTime = 0;

window.addEventListener('pointermove', (e) => {
    if (!fairyCtx || !fxConfig.fairyDust) return;
    const now = performance.now();
    if (now - lastFairyTime < 35 || fairyDust.length > 20) return;
    lastFairyTime = now;

    const theme = colorThemes[currentThemeIndex];
    fairyDust.push({
        x: e.clientX + (Math.random() - 0.5) * 8,
        y: e.clientY + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8 - 0.3,
        size: 11 + Math.random() * 6,
        alpha: 1.0,
        decay: 0.025 + Math.random() * 0.02,
        symbol: ['✨', '⭐', '💖', '🌟'][Math.floor(Math.random() * 4)],
        color: theme.heartGlow
    });
});

const updateFairyDust = () => {
    if (!fairyCtx || !fairyCanvas) return;
    fairyCtx.clearRect(0, 0, fairyCanvas.width, fairyCanvas.height);

    for (let i = fairyDust.length - 1; i >= 0; i--) {
        const p = fairyDust[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.size *= 0.98;

        if (p.alpha <= 0 || p.size < 2) {
            fairyDust.splice(i, 1);
            continue;
        }

        fairyCtx.globalAlpha = p.alpha;
        fairyCtx.font = `${Math.floor(p.size)}px sans-serif`;
        fairyCtx.textAlign = 'center';
        fairyCtx.textBaseline = 'middle';
        fairyCtx.fillText(p.symbol, p.x, p.y);
    }
};

/**
 * =========================================================================
 * 11. RAYCASTER & INTERACTION (Click / Double Click / Touch)
 * =========================================================================
 */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    if (event.target.closest('.ui-controls') || event.target.closest('.text-modal')) {
        return;
    }

    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = -(event.clientY / sizes.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // 1. Kiểm tra xem có click vào Ngôi Sao Ước Nguyện không
    const starIntersects = raycaster.intersectObjects(starCapsulesGroup.children, false);
    if (starIntersects.length > 0) {
        const clickedCap = starIntersects[0].object;
        openStarWishModal(clickedCap.userData.index);
        return;
    }

    // 1.5 Kiểm tra xem có click vào Thẻ Kỷ Niệm Vòng Đai Sao Thổ không
    if (saturnPhotosContainer && saturnPhotosContainer.visible && saturnPhotosGroup.children.length > 0) {
        const saturnIntersects = raycaster.intersectObjects(saturnPhotosGroup.children, false);
        if (saturnIntersects.length > 0) {
            const clickedMem = saturnIntersects[0].object;
            if (clickedMem.userData && clickedMem.userData.isSaturnMemory) {
                openMemoryDetailModal(clickedMem.userData.memoryIndex);
                return;
            }
        }
    }

    // 2. Kiểm tra xem có click trúng ảnh cá nhân/emoji không
    const activeSprites = [];
    if (photosGroup.visible) activeSprites.push(...photosGroup.children);
    if (spaceIconsGroup.visible) activeSprites.push(...spaceIconsGroup.children);
    
    const spriteIntersects = raycaster.intersectObjects(activeSprites, false);
    let clickedSprite = null;

    if (spriteIntersects.length > 0) {
        clickedSprite = spriteIntersects[0].object;
    }

    getAllOrbitSprites().forEach(sprite => {
        if (sprite === clickedSprite) {
            sprite.userData.isZoomed = !sprite.userData.isZoomed;
            if (sprite.userData.isZoomed) playSparkleChime();
        } else {
            sprite.userData.isZoomed = false;
        }
    });

    // 3. Tạo Pháo Hoa Trái Tim 3D tại vị trí click
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const targetPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, targetPoint);
    if (!targetPoint || isNaN(targetPoint.x)) {
        raycaster.ray.at(5, targetPoint);
    }
    triggerHeartFirework(targetPoint);
});

window.addEventListener('dblclick', (e) => {
    if (e.target.closest('.ui-controls') || e.target.closest('.text-modal')) return;
    spawnMeteorShower();
});

// Phím tắt bàn phím
window.addEventListener('keydown', (e) => {
    if (document.querySelector('.text-modal.show')) return;

    if (e.code === 'Space') {
        spawnMeteorShower();
    } else if (e.code === 'KeyF') {
        triggerHeartFirework();
    } else if (e.code === 'KeyS') {
        generateSpaceSnapshot();
    } else if (e.code === 'KeyC') {
        document.getElementById('btn-cinema')?.click();
    } else if (e.code === 'KeyH') {
        document.getElementById('btn-toggle-ui')?.click();
    }
});

/**
 * =========================================================================
 * 12. ANIMATION LOOP (tick)
 * =========================================================================
 */
const clock = new THREE.Clock();

let currentHeartScale = 1.0;
let currentRingScale = 1.0;
let smoothedBass = 0.0;

const tick = () => {
    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // 0. Audio Visualizer & YouTube Rhythm Engine
    let rawBass = 0;
    let isYTPlaying = false;
    try {
        if (isUsingYouTube && ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
            isYTPlaying = (ytPlayer.getPlayerState() === 1 && !isYTMuted);
        }
    } catch (e) {}

    if (isYTPlaying) {
        // Tạo nhịp phách âm nhạc hòa âm đa tầng cho YouTube
        const beatTime = elapsedTime * 2.2;
        const kick = Math.pow(Math.max(0, Math.sin(beatTime * Math.PI)), 4) * 0.65;
        const subBass = (Math.sin(elapsedTime * 4.0) * 0.5 + 0.5) * 0.3;
        rawBass = Math.min(1.0, kick + subBass);
    } else if (analyser && !bgMusic.paused && !bgMusic.muted) {
        analyser.getByteFrequencyData(audioDataArray);
        let bassSum = 0;
        const binsToCheck = Math.min(6, audioDataArray.length);
        for (let i = 0; i < binsToCheck; i++) {
            bassSum += audioDataArray[i];
        }
        rawBass = bassSum / (binsToCheck * 255);
    }

    if (rawBass > smoothedBass) {
        smoothedBass += (rawBass - smoothedBass) * 0.45;
    } else {
        smoothedBass += (rawBass - smoothedBass) * 0.14;
    }

    if (bloomPass) {
        bloomPass.strength = 0.85 + smoothedBass * 0.3;
    }

    updateFairyDust();

    // 0.3 Cập nhật Chòm sao Xử Nữ & Kim Ngưu (Nhấp nháy nhẹ nhàng, tinh tế)
    if (typeof virgoConstellation !== 'undefined' && typeof taurusConstellation !== 'undefined') {
        [virgoConstellation, taurusConstellation].forEach(c => {
            c.starSprites.forEach(s => {
                const scale = s.userData.baseScale * (1.0 + Math.sin(elapsedTime * 1.8 + s.userData.phase) * 0.1);
                s.scale.set(scale, scale, scale);
            });
            c.labelSprite.position.set(
                c.labelSprite.userData.parentOffset.x,
                c.labelSprite.userData.parentOffset.y + 1.2 + Math.sin(elapsedTime * 1.2) * 0.03,
                c.labelSprite.userData.parentOffset.z
            );
        });
    }

    // 0.4 Cập nhật Cổng Dịch Chuyển Wormhole
    if (isWarping && warpFlightCurve) {
        warpProgress += delta * 0.38;
        
        if (typeof portalRingMesh !== 'undefined' && typeof portalRingMesh2 !== 'undefined' && typeof portalDisk1 !== 'undefined') {
            portalRingMesh.rotation.z -= delta * 5.5;
            portalRingMesh2.rotation.z += delta * 4.0;
            portalDisk1.material.rotation += delta * 3.5;
        }

        const posAttr = warpStarsMesh.geometry.attributes.position;
        for (let i = 0; i < warpStarCount; i++) {
            const i6 = i * 6;
            posAttr.array[i6 + 2] += (0.8 + warpProgress * 3.5);
            posAttr.array[i6 + 5] += (0.8 + warpProgress * 3.5);
            if (posAttr.array[i6 + 2] > 16) {
                posAttr.array[i6 + 2] -= 32;
                posAttr.array[i6 + 5] -= 32;
            }
        }
        posAttr.needsUpdate = true;

        const clampedT = Math.min(1.0, Math.max(0.0, warpProgress));
        const currentCamPos = warpFlightCurve.getPointAt(clampedT);
        camera.position.copy(currentCamPos);

        if (clampedT < 0.45) {
            const p1 = clampedT / 0.45;
            const portalScale = Math.sin(p1 * Math.PI * 0.5) * 1.9;
            wormholePortalGroup.scale.set(portalScale, portalScale, portalScale);
            camera.fov = 75 + p1 * 30;
            camera.updateProjectionMatrix();
            controls.target.lerp(new THREE.Vector3(0, 2.4, 0), 0.15);
        } else if (clampedT < 0.58) {
            const flashEl = document.getElementById('wormhole-flash');
            if (flashEl && !flashEl.classList.contains('active')) {
                flashEl.classList.add('active');
                setTimeout(() => flashEl.classList.remove('active'), 550);
            }
            camera.fov = 75;
            camera.updateProjectionMatrix();
        } else {
            const p2 = (clampedT - 0.58) / 0.42;
            const portalShrink = Math.max(0, (1.0 - p2) * 1.9);
            wormholePortalGroup.scale.set(portalShrink, portalShrink, portalShrink);
            controls.target.lerp(defaultTarget, 0.08);
        }

        if (warpProgress >= 1.0) {
            isWarping = false;
            wormholePortalGroup.visible = false;
            warpStarsGroup.visible = false;
            warpFlightCurve = null;

            camera.position.copy(defaultCameraPos);
            controls.target.copy(defaultTarget);
            camera.fov = 75;
            camera.updateProjectionMatrix();
            controls.update();

            spawnMeteorShower();
        }
    }

    // 1. Rotate galaxy & starfield
    if (galaxyPoints) {
        galaxyPoints.rotation.y = elapsedTime * 0.08;
    }
    if (starfieldPoints) {
        starfieldPoints.rotation.y = elapsedTime * 0.015;
    }

    // 2. Rotate & Pulse Heart (Thở êm dịu, uyển chuyển, không bị giật)
    if (heartPoints) {
        heartPoints.rotation.y = elapsedTime * 0.08;

        const steadyBreathe = Math.sin(elapsedTime * 1.4) * 0.05;
        const bassAdd = smoothedBass * 0.08;
        const targetScale = 1.0 + steadyBreathe + bassAdd;

        currentHeartScale += (targetScale - currentHeartScale) * 0.1;
        heartPoints.scale.set(currentHeartScale, currentHeartScale, currentHeartScale);
    }

    // 2.1 Xoay Vành đai
    if (heartRingPoints) {
        heartRingPoints.rotation.y = elapsedTime * 0.05;
        const ringTarget = 1.0 + (currentHeartScale - 1.0) * 0.5;
        currentRingScale += (ringTarget - currentRingScale) * 0.08;
        heartRingPoints.scale.set(currentRingScale, currentRingScale, currentRingScale);
    }

    // 2.2 Cập nhật Vòng Sóng Âm Nhạc 3D (Audio Visualizer Waves Ring - Nhảy múa cả khi phát YouTube & MP3)
    if (audioVisualizerGeometry) {
        const posAttr = audioVisualizerGeometry.attributes.position;
        const colorAttr = audioVisualizerGeometry.attributes.color;
        const theme = colorThemes[currentThemeIndex];
        const baseCol = new THREE.Color(theme.heartGlow);
        const altCol = new THREE.Color(theme.insideColor);

        for (let i = 0; i < visualizerPointCount; i++) {
            const angle = (i / visualizerPointCount) * Math.PI * 2;
            let freqVal = 0;
            
            if (isYTPlaying) {
                // Hòa âm đa tần số chuyển động theo giai điệu YouTube
                const harmonic1 = Math.sin(angle * 7 + elapsedTime * 4.2) * 0.5 + 0.5;
                const harmonic2 = Math.cos(angle * 13 - elapsedTime * 3.5) * 0.5 + 0.5;
                const harmonic3 = Math.sin(angle * 3 + elapsedTime * 1.8) * 0.5 + 0.5;
                const rhythmPulse = (Math.sin(elapsedTime * 4.4 + angle * 4) * 0.5 + 0.5);
                
                freqVal = (harmonic1 * 0.45 + harmonic2 * 0.35 + harmonic3 * 0.2) * (0.4 + smoothedBass * 0.85) * (0.6 + rhythmPulse * 0.4);
            } else if (audioDataArray && audioDataArray.length > 0 && !bgMusic.paused && !bgMusic.muted) {
                const freqIdx = Math.min(audioDataArray.length - 1, Math.floor(Math.abs(Math.sin(angle)) * (audioDataArray.length / 2)));
                freqVal = audioDataArray[freqIdx] / 255;
            } else {
                // Nhịp thở êm đềm khi nhạc dừng
                freqVal = (Math.sin(angle * 4 + elapsedTime * 1.5) * 0.5 + 0.5) * 0.12;
            }

            const wave1 = Math.sin(angle * 6 + elapsedTime * 3.0) * 0.12;
            const wave2 = Math.cos(angle * 9 - elapsedTime * 2.2) * 0.07;
            const audioAmp = (freqVal * 0.5) + (smoothedBass * 0.28);
            const yVal = wave1 + wave2 + audioAmp;

            const r = 2.05 + Math.sin(angle * 4 + elapsedTime * 1.5) * 0.06 + (freqVal * 0.24);

            posAttr.setXYZ(i, Math.cos(angle) * r, yVal, Math.sin(angle) * r);

            const mixRatio = 0.5 + Math.sin(angle * 3 + elapsedTime * 2) * 0.5;
            const col = baseCol.clone().lerp(altCol, mixRatio);
            colorAttr.setXYZ(i, col.r, col.g, col.b);
        }
        posAttr.needsUpdate = true;
        colorAttr.needsUpdate = true;

        if (audioVisualizerGroup) {
            audioVisualizerGroup.rotation.y = elapsedTime * 0.06;
        }
    }

    // 3. Floating Text Bobbing
    if (textSprite) {
        textSprite.position.y = 3.6 + Math.sin(elapsedTime * 2.0) * 0.08;
    }

    // 3.5 Auto Continuous Heart Fireworks (Pháo hoa tim liên tục)
    if (fxConfig.autoFireworks && elapsedTime > nextAutoFireworkTime) {
        triggerHeartFirework();
        nextAutoFireworkTime = elapsedTime + 0.65 + Math.random() * 0.55;
    }

    // 4. Meteors update (Mưa sao băng liên tục hoặc định kỳ)
    if (elapsedTime > nextMeteorTime) {
        const inactiveMeteors = meteorPool.filter(m => !m.active);
        if (inactiveMeteors.length > 0) {
            inactiveMeteors[0].spawn();
            if (fxConfig.autoMeteors && inactiveMeteors.length > 1) {
                setTimeout(() => inactiveMeteors[1].spawn(), 180);
            }
            if (fxConfig.autoMeteors && inactiveMeteors.length > 2) {
                setTimeout(() => inactiveMeteors[2].spawn(), 340);
            }
        }
        const baseDelay = fxConfig.autoMeteors ? 0.35 : 2.2;
        const randDelay = fxConfig.autoMeteors ? 0.5 : 3.0;
        nextMeteorTime = elapsedTime + baseDelay + Math.random() * randDelay;
    }

    meteorPool.forEach(m => m.update());

    // 4.1 Majestic Comet update (Sao chổi thường xuyên hoặc định kỳ)
    if (elapsedTime > nextCometTime) {
        if (!majesticComet.active) {
            majesticComet.spawn();
        }
        const cometDelay = fxConfig.frequentComets ? 5.5 : 16.0;
        const cometRand = fxConfig.frequentComets ? 4.0 : 9.0;
        nextCometTime = elapsedTime + cometDelay + Math.random() * cometRand;
    }
    majesticComet.update(delta);

    // 5. Pháo hoa Trái Tim 3D update
    fireworkPool.forEach(f => f.update(delta));

    // 6. Floating Sprites Orbit
    getAllOrbitSprites().forEach(sprite => {
        const targetScale = sprite.userData.isZoomed ? (sprite.userData.isCustomPhoto ? 3.5 : 2.5) : sprite.userData.originalScale;
        sprite.scale.x += (targetScale - sprite.scale.x) * 0.1;
        sprite.scale.y += (targetScale - sprite.scale.y) * 0.1;
        sprite.scale.z += (targetScale - sprite.scale.z) * 0.1;

        if (!sprite.userData.isZoomed) {
            sprite.userData.angle += sprite.userData.speed * 0.02;
        }

        sprite.position.x = Math.cos(sprite.userData.angle) * sprite.userData.radius;
        sprite.position.z = Math.sin(sprite.userData.angle) * sprite.userData.radius;
        sprite.position.y += Math.sin(elapsedTime * Math.abs(sprite.userData.speed) * 8) * 0.004;
    });

    // 6.5 Saturn Memory Rings Rotation & Audio Response
    if (fxConfig.showSaturnRings !== false) {
        const saturnSpeed = (typeof fxConfig.saturnSpeed === 'number') ? fxConfig.saturnSpeed : 0.08;
        if (saturnMainGroup) {
            saturnMainGroup.rotation.y += saturnSpeed * delta;
        }
        if (saturnPhotosGroup) {
            saturnPhotosGroup.rotation.y += saturnSpeed * delta;
        }
        if (fxConfig.audioVisualizer && smoothedBass > 0.05 && saturnDustGroup) {
            const scaleAudio = 1.0 + smoothedBass * 0.06;
            saturnDustGroup.scale.set(scaleAudio, 1.0, scaleAudio);
        } else if (saturnDustGroup) {
            saturnDustGroup.scale.set(1.0, 1.0, 1.0);
        }
    }

    // 7. Cinema Tour Mode
    if (isCinemaMode) {
        controls.autoRotate = false;
        const ct = elapsedTime * 0.25;
        const radius = 6.5 + Math.sin(ct * 0.7) * 2.0;
        
        camera.position.x = Math.sin(ct) * radius;
        camera.position.z = Math.cos(ct) * radius;
        camera.position.y = 2.4 + Math.sin(ct * 1.3) * 1.8;

        controls.target.lerp(new THREE.Vector3(0, 2.2, 0), 0.05);
        controls.update();
    } else {
        controls.autoRotate = (!isResettingView && fxConfig.rotationSpeed > 0);
        controls.autoRotateSpeed = fxConfig.rotationSpeed;
    }

    // 8. Smooth Camera Reset View
    if (isResettingView) {
        camera.position.lerp(defaultCameraPos, 0.05);
        controls.target.lerp(defaultTarget, 0.05);
        if (camera.position.distanceTo(defaultCameraPos) < 0.1) {
            isResettingView = false;
        }
    }

    if (!isCinemaMode) {
        controls.update();
    }

    // 9. Multi-pass Rendering
    renderer.clear();
    composer.render();
    renderer.clearDepth();
    renderer.render(sceneSprites, camera);

    window.requestAnimationFrame(tick);
};

tick();

/**
 * =========================================================================
 * 13. UI CONTROLS WIRING & INTERACTIVE MODALS
 * =========================================================================
 */
// 1. Nút đổi Theme màu
const btnTheme = document.getElementById('btn-theme');
if (btnTheme) {
    btnTheme.addEventListener('click', (e) => {
        e.stopPropagation();
        currentThemeIndex = (currentThemeIndex + 1) % colorThemes.length;
        const theme = colorThemes[currentThemeIndex];

        try {
            localStorage.setItem('galaxy_theme_index', currentThemeIndex);
        } catch (err) {}

        generateGalaxy();
        generateHeart();
        generateHeartRing();
        generateAudioVisualizerRing();

        pointLight.color.set(theme.lightColor);

        const currentText = document.getElementById('custom-text-input')?.value || initialLoveText;
        updateFloatingText(currentText);
        playSparkleChime();
    });
}

// 2. Nút Cinema Tour
const btnCinema = document.getElementById('btn-cinema');
if (btnCinema) {
    btnCinema.addEventListener('click', (e) => {
        e.stopPropagation();
        isCinemaMode = !isCinemaMode;
        if (isCinemaMode) {
            btnCinema.classList.add('active');
            isResettingView = false;
        } else {
            btnCinema.classList.remove('active');
        }
    });
}

// 3. Nút mở Modal đổi lời nhắn
const btnText = document.getElementById('btn-text');
const textModal = document.getElementById('text-modal');
const customTextInput = document.getElementById('custom-text-input');
const btnSaveText = document.getElementById('btn-save-text');
const btnCancelText = document.getElementById('btn-cancel-text');

if (btnText && textModal) {
    btnText.addEventListener('click', (e) => {
        e.stopPropagation();
        textModal.classList.add('show');
        customTextInput.focus();
    });

    btnSaveText.addEventListener('click', (e) => {
        e.stopPropagation();
        const textVal = customTextInput.value.trim();
        if (textVal) {
            updateFloatingText(textVal);
            try {
                localStorage.setItem('galaxy_love_text', textVal);
            } catch (err) {}
        }
        textModal.classList.remove('show');
        playSparkleChime();
    });

    btnCancelText.addEventListener('click', (e) => {
        e.stopPropagation();
        textModal.classList.remove('show');
    });

    customTextInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            btnSaveText.click();
        }
    });
}


// 0. Nút Mở & Quản Lý Cấu Hình Hiệu Ứng Vũ Trụ (Liên Tục)
const btnSettings = document.getElementById('btn-settings');
const settingsModal = document.getElementById('settings-modal');
const toggleShowGalaxy = document.getElementById('toggle-show-galaxy');
const toggleShowHeart = document.getElementById('toggle-show-heart');
const toggleShowHeartRing = document.getElementById('toggle-show-heart-ring');
const toggleShowStarfield = document.getElementById('toggle-show-starfield');
const toggleSaturnRings = document.getElementById('toggle-saturn-rings');
const toggleAutoFireworks = document.getElementById('toggle-auto-fireworks');
const toggleAutoMeteors = document.getElementById('toggle-auto-meteors');
const toggleFrequentComets = document.getElementById('toggle-frequent-comets');
const toggleFairyDust = document.getElementById('toggle-fairy-dust');
const toggleShowPhotos = document.getElementById('toggle-show-photos');
const toggleShowConstellations = document.getElementById('toggle-show-constellations');
const toggleShowSpaceIcons = document.getElementById('toggle-show-space-icons');
const toggleAudioVisualizer = document.getElementById('toggle-audio-visualizer');
const toggleSoundFx = document.getElementById('toggle-sound-fx');
const selectRotationSpeed = document.getElementById('select-rotation-speed');
const btnSaveSettings = document.getElementById('btn-save-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');

const settingsCatBtns = document.querySelectorAll('.settings-cat-btn');
const settingsGroupSections = document.querySelectorAll('.settings-group-section');

// Chuyển đổi danh mục trong cài đặt
settingsCatBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsCatBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const cat = btn.getAttribute('data-cat');
        settingsGroupSections.forEach(sec => {
            if (cat === 'all' || sec.getAttribute('data-group') === cat) {
                sec.style.display = 'flex';
            } else {
                sec.style.display = 'none';
            }
        });
        playSparkleChime();
    });
});

const syncSettingsModalUI = () => {
    if (toggleShowGalaxy) toggleShowGalaxy.checked = (fxConfig.showGalaxy !== false);
    if (toggleShowHeart) toggleShowHeart.checked = (fxConfig.showHeart !== false);
    if (toggleShowHeartRing) toggleShowHeartRing.checked = (fxConfig.showHeartRing !== false);
    if (toggleShowStarfield) toggleShowStarfield.checked = (fxConfig.showStarfield !== false);
    if (toggleSaturnRings) toggleSaturnRings.checked = (fxConfig.showSaturnRings !== false);
    if (toggleAutoFireworks) toggleAutoFireworks.checked = !!fxConfig.autoFireworks;
    if (toggleAutoMeteors) toggleAutoMeteors.checked = !!fxConfig.autoMeteors;
    if (toggleFrequentComets) toggleFrequentComets.checked = !!fxConfig.frequentComets;
    if (toggleFairyDust) toggleFairyDust.checked = !!fxConfig.fairyDust;
    if (toggleShowPhotos) toggleShowPhotos.checked = (fxConfig.showPhotos !== false);
    if (toggleShowConstellations) toggleShowConstellations.checked = (fxConfig.showConstellations !== false);
    if (toggleShowSpaceIcons) toggleShowSpaceIcons.checked = (fxConfig.showSpaceIcons !== false);
    if (toggleAudioVisualizer) toggleAudioVisualizer.checked = !!fxConfig.audioVisualizer;
    if (toggleSoundFx) toggleSoundFx.checked = !!fxConfig.soundFx;
    if (selectRotationSpeed) selectRotationSpeed.value = String(fxConfig.rotationSpeed);
};

syncSettingsModalUI();

if (btnSettings && settingsModal) {
    btnSettings.addEventListener('click', (e) => {
        e.stopPropagation();
        syncSettingsModalUI();
        settingsModal.classList.add('show');
    });

    const applyAndSaveSettings = () => {
        if (toggleShowGalaxy) {
            fxConfig.showGalaxy = toggleShowGalaxy.checked;
            if (galaxyPoints) galaxyPoints.visible = fxConfig.showGalaxy;
        }
        if (toggleShowHeart) {
            fxConfig.showHeart = toggleShowHeart.checked;
            if (heartPoints) heartPoints.visible = fxConfig.showHeart;
        }
        if (toggleShowHeartRing) {
            fxConfig.showHeartRing = toggleShowHeartRing.checked;
            if (heartRingPoints) heartRingPoints.visible = fxConfig.showHeartRing;
        }
        if (toggleShowStarfield) {
            fxConfig.showStarfield = toggleShowStarfield.checked;
            if (starfieldPoints) starfieldPoints.visible = fxConfig.showStarfield;
        }
        if (toggleSaturnRings) {
            fxConfig.showSaturnRings = toggleSaturnRings.checked;
            if (saturnMainGroup) saturnMainGroup.visible = fxConfig.showSaturnRings;
            if (saturnPhotosContainer) saturnPhotosContainer.visible = fxConfig.showSaturnRings;
        }
        if (toggleAutoFireworks) fxConfig.autoFireworks = toggleAutoFireworks.checked;
        if (toggleAutoMeteors) fxConfig.autoMeteors = toggleAutoMeteors.checked;
        if (toggleFrequentComets) fxConfig.frequentComets = toggleFrequentComets.checked;
        if (toggleFairyDust) fxConfig.fairyDust = toggleFairyDust.checked;
        if (toggleShowPhotos) {
            fxConfig.showPhotos = toggleShowPhotos.checked;
            if (photosGroup) photosGroup.visible = fxConfig.showPhotos;
        }
        if (toggleShowConstellations) {
            fxConfig.showConstellations = toggleShowConstellations.checked;
            if (constellationsGroup) constellationsGroup.visible = fxConfig.showConstellations;
            if (typeof virgoConstellation !== 'undefined' && virgoConstellation?.labelSprite) {
                virgoConstellation.labelSprite.visible = fxConfig.showConstellations;
            }
            if (typeof taurusConstellation !== 'undefined' && taurusConstellation?.labelSprite) {
                taurusConstellation.labelSprite.visible = fxConfig.showConstellations;
            }
        }
        if (toggleShowSpaceIcons) {
            fxConfig.showSpaceIcons = toggleShowSpaceIcons.checked;
            if (spaceIconsGroup) spaceIconsGroup.visible = fxConfig.showSpaceIcons;
        }
        if (toggleAudioVisualizer) {
            fxConfig.audioVisualizer = toggleAudioVisualizer.checked;
            if (audioVisualizerGroup) audioVisualizerGroup.visible = fxConfig.audioVisualizer;
        }
        if (toggleSoundFx) fxConfig.soundFx = toggleSoundFx.checked;
        if (selectRotationSpeed) fxConfig.rotationSpeed = parseFloat(selectRotationSpeed.value) || 0;

        controls.autoRotate = (!isCinemaMode && !isResettingView && fxConfig.rotationSpeed > 0);
        controls.autoRotateSpeed = fxConfig.rotationSpeed;

        try {
            localStorage.setItem('galaxy_fx_config', JSON.stringify(fxConfig));
        } catch (err) {}
    };

    [toggleShowGalaxy, toggleShowHeart, toggleShowHeartRing, toggleShowStarfield, toggleSaturnRings, toggleAutoFireworks, toggleAutoMeteors, toggleFrequentComets, toggleFairyDust, toggleShowPhotos, toggleShowConstellations, toggleShowSpaceIcons, toggleAudioVisualizer, toggleSoundFx, selectRotationSpeed].forEach(el => {
        el?.addEventListener('change', () => {
            applyAndSaveSettings();
        });
    });

    btnSaveSettings?.addEventListener('click', (e) => {
        e.stopPropagation();
        applyAndSaveSettings();
        settingsModal.classList.remove('show');
        playSparkleChime();
    });

    btnCloseSettings?.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsModal.classList.remove('show');
    });
}

// 0.1 Nút & Modal Quản Lý Vòng Đai Sao Thổ Kỷ Niệm (Memory Saturn Rings)
const btnSaturnRing = document.getElementById('btn-saturn-ring');
const saturnModal = document.getElementById('saturn-modal');
const tabBtnMemories = document.getElementById('tab-btn-memories');
const tabBtnSettings = document.getElementById('tab-btn-settings');
const saturnPaneMemories = document.getElementById('saturn-tab-pane-memories');
const saturnPaneSettings = document.getElementById('saturn-tab-pane-settings');

const saturnUploadPreview = document.getElementById('saturn-upload-preview');
const saturnPhotoFile = document.getElementById('saturn-photo-file');
const saturnPreviewImg = document.getElementById('saturn-preview-img');
const saturnUploadLabel = document.getElementById('saturn-upload-label');
const saturnMemoryTitle = document.getElementById('saturn-memory-title');
const saturnMemoryDate = document.getElementById('saturn-memory-date');
const saturnMemoryNote = document.getElementById('saturn-memory-note');
const btnAddSaturnMemory = document.getElementById('btn-add-saturn-memory');

const toggleSaturnEnabledTab = document.getElementById('toggle-saturn-enabled-tab');
const selectSaturnTheme = document.getElementById('select-saturn-theme');
const selectSaturnSpeed = document.getElementById('select-saturn-speed');
const selectSaturnTilt = document.getElementById('select-saturn-tilt');
const btnSaveSaturnModal = document.getElementById('btn-save-saturn-modal');
const btnResetSaturnMemories = document.getElementById('btn-reset-saturn-memories');
const btnCloseSaturnModal = document.getElementById('btn-close-saturn-modal');

let currentUploadedMemoryImage = '';

const syncSaturnModalSettingsUI = () => {
    if (toggleSaturnEnabledTab) toggleSaturnEnabledTab.checked = (fxConfig.showSaturnRings !== false);
    if (selectSaturnTheme) selectSaturnTheme.value = fxConfig.saturnTheme || 'gold';
    if (selectSaturnSpeed) selectSaturnSpeed.value = String(fxConfig.saturnSpeed !== undefined ? fxConfig.saturnSpeed : 0.08);
    if (selectSaturnTilt) selectSaturnTilt.value = fxConfig.saturnTilt || 'saturn';
    renderSaturnMemoriesListUI();
};

if (btnSaturnRing && saturnModal) {
    btnSaturnRing.addEventListener('click', (e) => {
        e.stopPropagation();
        syncSaturnModalSettingsUI();
        saturnModal.classList.add('show');
        playSparkleChime();
    });
}

// Chuyển Tabs trong Modal Saturn
if (tabBtnMemories && tabBtnSettings) {
    tabBtnMemories.addEventListener('click', (e) => {
        e.stopPropagation();
        tabBtnMemories.classList.add('active');
        tabBtnSettings.classList.remove('active');
        saturnPaneMemories?.classList.add('active');
        saturnPaneSettings?.classList.remove('active');
    });

    tabBtnSettings.addEventListener('click', (e) => {
        e.stopPropagation();
        tabBtnSettings.classList.add('active');
        tabBtnMemories.classList.remove('active');
        saturnPaneSettings?.classList.add('active');
        saturnPaneMemories?.classList.remove('active');
    });
}

// Upload ảnh kỷ niệm
if (saturnUploadPreview && saturnPhotoFile) {
    saturnUploadPreview.addEventListener('click', (e) => {
        e.stopPropagation();
        saturnPhotoFile.click();
    });

    saturnPhotoFile.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.src = ev.target.result;
            img.onload = () => {
                const maxDim = 500;
                let w = img.width;
                let h = img.height;
                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }
                const c = document.createElement('canvas');
                c.width = w;
                c.height = h;
                const ctx = c.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                currentUploadedMemoryImage = c.toDataURL('image/jpeg', 0.85);

                if (saturnPreviewImg) {
                    saturnPreviewImg.src = currentUploadedMemoryImage;
                    saturnPreviewImg.style.display = 'block';
                }
                if (saturnUploadLabel) {
                    saturnUploadLabel.style.display = 'none';
                }
            };
        };
        reader.readAsDataURL(file);
    });
}

// Thêm Kỷ Niệm Mới vào Vòng Đai
if (btnAddSaturnMemory) {
    btnAddSaturnMemory.addEventListener('click', (e) => {
        e.stopPropagation();
        const title = saturnMemoryTitle?.value.trim() || `Kỷ Niệm #${saturnMemories.length + 1}`;
        const date = saturnMemoryDate?.value.trim() || 'Khoảnh khắc ngọt ngào 💖';
        const note = saturnMemoryNote?.value.trim() || 'Yêu em nhiều hơn mỗi ngày trôi qua.';
        const image = currentUploadedMemoryImage || '/photos/cat.jpg';

        const newMem = {
            id: 'mem_' + Date.now(),
            title: title,
            date: date,
            quote: note,
            image: image
        };

        saturnMemories.push(newMem);
        saveSaturnMemoriesToStorage();
        buildSaturnMemorySprites();
        renderSaturnMemoriesListUI();

        // Reset form
        if (saturnMemoryTitle) saturnMemoryTitle.value = '';
        if (saturnMemoryDate) saturnMemoryDate.value = '';
        if (saturnMemoryNote) saturnMemoryNote.value = '';
        if (saturnPreviewImg) {
            saturnPreviewImg.src = '';
            saturnPreviewImg.style.display = 'none';
        }
        if (saturnUploadLabel) {
            saturnUploadLabel.style.display = 'block';
        }
        currentUploadedMemoryImage = '';

        playSparkleChime();
    });
}

// Lưu Cài Đặt Vòng Đai Sao Thổ
if (btnSaveSaturnModal && saturnModal) {
    btnSaveSaturnModal.addEventListener('click', (e) => {
        e.stopPropagation();
        if (toggleSaturnEnabledTab) {
            fxConfig.showSaturnRings = toggleSaturnEnabledTab.checked;
            if (saturnMainGroup) saturnMainGroup.visible = fxConfig.showSaturnRings;
            if (saturnPhotosContainer) saturnPhotosContainer.visible = fxConfig.showSaturnRings;
            if (toggleSaturnRings) toggleSaturnRings.checked = fxConfig.showSaturnRings;
        }
        if (selectSaturnTheme) {
            fxConfig.saturnTheme = selectSaturnTheme.value;
            generateSaturnDustAndRibbons();
        }
        if (selectSaturnSpeed) {
            fxConfig.saturnSpeed = parseFloat(selectSaturnSpeed.value) || 0;
        }
        if (selectSaturnTilt) {
            fxConfig.saturnTilt = selectSaturnTilt.value;
            updateSaturnTilt();
        }

        try {
            localStorage.setItem('galaxy_fx_config', JSON.stringify(fxConfig));
        } catch (err) {}

        buildSaturnMemorySprites();
        saturnModal.classList.remove('show');
        playSparkleChime();
    });
}

// Khôi phục kỷ niệm mặc định
if (btnResetSaturnMemories) {
    btnResetSaturnMemories.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Bạn có chắc chắn muốn khôi phục danh sách kỷ niệm mặc định không?')) {
            saturnMemories = [...defaultSaturnMemories];
            saveSaturnMemoriesToStorage();
            renderSaturnMemoriesListUI();
            buildSaturnMemorySprites();
            playSparkleChime();
        }
    });
}

if (btnCloseSaturnModal && saturnModal) {
    btnCloseSaturnModal.addEventListener('click', (e) => {
        e.stopPropagation();
        saturnModal.classList.remove('show');
    });
}

// Điều khiển Modal Xem Chi Tiết Kỷ Niệm
const memoryDetailModal = document.getElementById('memory-detail-modal');
const btnPrevMemory = document.getElementById('btn-prev-memory');
const btnNextMemory = document.getElementById('btn-next-memory');
const btnOpenSaturnManager = document.getElementById('btn-open-saturn-manager');
const btnCloseDetailModal = document.getElementById('btn-close-detail-modal');
const btnCloseMemoryCorner = document.getElementById('btn-close-memory-corner');

if (btnPrevMemory) {
    btnPrevMemory.addEventListener('click', (e) => {
        e.stopPropagation();
        if (saturnMemories.length === 0) return;
        currentActiveMemoryIndex = (currentActiveMemoryIndex - 1 + saturnMemories.length) % saturnMemories.length;
        openMemoryDetailModal(currentActiveMemoryIndex);
    });
}

if (btnNextMemory) {
    btnNextMemory.addEventListener('click', (e) => {
        e.stopPropagation();
        if (saturnMemories.length === 0) return;
        currentActiveMemoryIndex = (currentActiveMemoryIndex + 1) % saturnMemories.length;
        openMemoryDetailModal(currentActiveMemoryIndex);
    });
}

if (btnOpenSaturnManager) {
    btnOpenSaturnManager.addEventListener('click', (e) => {
        e.stopPropagation();
        memoryDetailModal?.classList.remove('show');
        syncSaturnModalSettingsUI();
        saturnModal?.classList.add('show');
    });
}

if (btnCloseDetailModal && memoryDetailModal) {
    btnCloseDetailModal.addEventListener('click', (e) => {
        e.stopPropagation();
        memoryDetailModal.classList.remove('show');
    });
}

if (btnCloseMemoryCorner && memoryDetailModal) {
    btnCloseMemoryCorner.addEventListener('click', (e) => {
        e.stopPropagation();
        memoryDetailModal.classList.remove('show');
    });
}

// 5. Nút Những Vì Sao Ước Nguyện & Modal Thư Tình
const btnStarWishes = document.getElementById('btn-star-wishes');
const starWishModal = document.getElementById('star-wish-modal');
const btnNextWish = document.getElementById('btn-next-wish');
const btnCloseWish = document.getElementById('btn-close-wish');
const btnEditWishes = document.getElementById('btn-edit-wishes');
const wishesEditModal = document.getElementById('wishes-edit-modal');
const wishesTextarea = document.getElementById('wishes-textarea');
const btnSaveWishes = document.getElementById('btn-save-wishes');
const btnResetWishes = document.getElementById('btn-reset-wishes');
const btnCancelWishes = document.getElementById('btn-cancel-wishes');

if (btnStarWishes) {
    btnStarWishes.addEventListener('click', (e) => {
        e.stopPropagation();
        openStarWishModal();
    });
}

if (btnNextWish) {
    btnNextWish.addEventListener('click', (e) => {
        e.stopPropagation();
        openStarWishModal();
    });
}

if (btnCloseWish && starWishModal) {
    btnCloseWish.addEventListener('click', (e) => {
        e.stopPropagation();
        starWishModal.classList.remove('show');
    });
}

if (btnEditWishes && wishesEditModal && wishesTextarea) {
    btnEditWishes.addEventListener('click', (e) => {
        e.stopPropagation();
        starWishModal?.classList.remove('show');
        wishesTextarea.value = customRomanticQuotes.join('\n');
        wishesEditModal.classList.add('show');
    });

    btnSaveWishes?.addEventListener('click', (e) => {
        e.stopPropagation();
        const lines = wishesTextarea.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 0) {
            customRomanticQuotes = lines.slice(0, 25);
            try {
                localStorage.setItem('galaxy_star_wishes', JSON.stringify(customRomanticQuotes));
            } catch (err) {}
        }
        wishesEditModal.classList.remove('show');
        openStarWishModal();
    });

    btnResetWishes?.addEventListener('click', (e) => {
        e.stopPropagation();
        customRomanticQuotes = [...defaultRomanticQuotes];
        try {
            localStorage.removeItem('galaxy_star_wishes');
        } catch (err) {}
        wishesTextarea.value = customRomanticQuotes.join('\n');
    });

    btnCancelWishes?.addEventListener('click', (e) => {
        e.stopPropagation();
        wishesEditModal.classList.remove('show');
    });
}

// 7. Nút Chụp Ảnh & Tạo Thiệp Polaroid Kỷ Niệm
const btnSnapshot = document.getElementById('btn-snapshot');
const snapshotModal = document.getElementById('snapshot-modal');
const btnDownloadSnapshot = document.getElementById('btn-download-snapshot');
const btnCloseSnapshot = document.getElementById('btn-close-snapshot');

if (btnSnapshot) {
    btnSnapshot.addEventListener('click', (e) => {
        e.stopPropagation();
        generateSpaceSnapshot();
    });
}

if (btnDownloadSnapshot) {
    btnDownloadSnapshot.addEventListener('click', (e) => {
        e.stopPropagation();
        const canvasEl = document.getElementById('snapshot-canvas');
        if (!canvasEl) return;
        const link = document.createElement('a');
        link.download = `Galaxy_Of_Love_${Date.now()}.png`;
        link.href = canvasEl.toDataURL('image/png');
        link.click();
    });
}

if (btnCloseSnapshot && snapshotModal) {
    btnCloseSnapshot.addEventListener('click', (e) => {
        e.stopPropagation();
        snapshotModal.classList.remove('show');
    });
}

// 8. Nút Upload ảnh cá nhân
const btnUpload = document.getElementById('btn-upload');
const imageUploadInput = document.getElementById('image-upload-input');
if (btnUpload && imageUploadInput) {
    btnUpload.addEventListener('click', (e) => {
        e.stopPropagation();
        imageUploadInput.click();
    });

    imageUploadInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handlePhotoUpload(e.target.files);
            imageUploadInput.value = '';
        }
    });
}

// 9. Nút Đổi Nhạc & Presets
const btnChangeMusic = document.getElementById('btn-change-music');
const musicModal = document.getElementById('music-modal');
const youtubeUrlInput = document.getElementById('youtube-url-input');
const btnPlayYouTube = document.getElementById('btn-play-youtube');
const btnDefaultMusic = document.getElementById('btn-default-music');
const btnCancelMusic = document.getElementById('btn-cancel-music');

if (btnChangeMusic && musicModal) {
    btnChangeMusic.addEventListener('click', (e) => {
        e.stopPropagation();
        musicModal.classList.add('show');
        youtubeUrlInput.focus();
    });

    // Preset buttons
    document.querySelectorAll('.btn-preset-song').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = btn.getAttribute('data-url');
            const videoId = extractYouTubeId(url);
            if (videoId) {
                try {
                    localStorage.setItem('galaxy_yt_music', url);
                } catch (err) {}
                playYouTubeMusic(videoId);
                musicModal.classList.remove('show');
            }
        });
    });

    btnPlayYouTube.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = youtubeUrlInput.value.trim();
        const videoId = extractYouTubeId(url);
        if (videoId) {
            try {
                localStorage.setItem('galaxy_yt_music', url);
            } catch (err) {}
            playYouTubeMusic(videoId);
            musicModal.classList.remove('show');
        } else {
            alert('Vui lòng nhập link YouTube hợp lệ!');
        }
    });

    btnDefaultMusic.addEventListener('click', (e) => {
        e.stopPropagation();
        try {
            localStorage.removeItem('galaxy_yt_music');
        } catch (err) {}
        switchToDefaultMusic();
        musicModal.classList.remove('show');
    });

    btnCancelMusic.addEventListener('click', (e) => {
        e.stopPropagation();
        musicModal.classList.remove('show');
    });

    youtubeUrlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            btnPlayYouTube.click();
        }
    });
}

// 10. Nút Bật/Tắt Âm thanh
const btnMusic = document.getElementById('btn-music');
if (btnMusic) {
    btnMusic.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isUsingYouTube && ytPlayer) {
            if (isYTMuted) {
                ytPlayer.unMute();
                isYTMuted = false;
                isSoundMuted = false;
                updateMusicButtonState(false);
            } else {
                ytPlayer.mute();
                isYTMuted = true;
                isSoundMuted = true;
                updateMusicButtonState(true);
            }
        } else {
            bgMusic.muted = !bgMusic.muted;
            isSoundMuted = bgMusic.muted;
            updateMusicButtonState(bgMusic.muted);
            try {
                localStorage.setItem('galaxy_music_muted', isSoundMuted ? 'true' : 'false');
            } catch (err) {}
            if (!musicStarted && !bgMusic.muted) {
                startMusic();
            }
        }
    });
}

// 11. Nút Về toàn cảnh
const btnReset = document.getElementById('btn-reset-view');
if (btnReset) {
    btnReset.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isCinemaMode) {
            isCinemaMode = false;
            btnCinema?.classList.remove('active');
        }
        isResettingView = true;
        getAllOrbitSprites().forEach(sprite => {
            sprite.userData.isZoomed = false;
        });
    });
}

// 12. Nút Cổng Dịch Chuyển Wormhole
const btnWormhole = document.getElementById('btn-wormhole');
if (btnWormhole) {
    btnWormhole.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerWormhole();
    });
}

// 13. Nút Ẩn/Hiện Thanh Công Cụ (Zen Mode)
const btnToggleUI = document.getElementById('btn-toggle-ui');
const btnRestoreUI = document.getElementById('btn-restore-ui');
const uiControls = document.getElementById('ui-controls');
const hintBox = document.getElementById('hint-box');

if (btnToggleUI && btnRestoreUI && uiControls) {
    // Khôi phục trạng thái Zen Mode từ LocalStorage
    try {
        const savedZen = localStorage.getItem('galaxy_zen_mode');
        if (savedZen === 'true') {
            uiControls.classList.add('hidden');
            if (hintBox) hintBox.classList.add('hidden');
            btnRestoreUI.classList.add('show');
        }
    } catch (e) {}

    btnToggleUI.addEventListener('click', (e) => {
        e.stopPropagation();
        uiControls.classList.add('hidden');
        if (hintBox) hintBox.classList.add('hidden');
        btnRestoreUI.classList.add('show');
        try {
            localStorage.setItem('galaxy_zen_mode', 'true');
        } catch (err) {}
    });

    btnRestoreUI.addEventListener('click', (e) => {
        e.stopPropagation();
        uiControls.classList.remove('hidden');
        if (hintBox) hintBox.classList.remove('hidden');
        btnRestoreUI.classList.remove('show');
        try {
            localStorage.setItem('galaxy_zen_mode', 'false');
        } catch (err) {}
    });
}

// Đóng modal khi click ra ngoài vùng nội dung
document.querySelectorAll('.text-modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});

/**
 * =========================================================================
 * 14. LOADING SCREEN CONTROLLER
 * =========================================================================
 */
const initLoadingScreen = () => {
    const loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) return;

    const starsBg = loadingScreen.querySelector('.loading-stars-bg');
    if (starsBg) {
        const starCount = 65;
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'l-star';
            const size = Math.random() * 2.5 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 2.5}s`;
            star.style.animationDuration = `${Math.random() * 2.5 + 1.5}s`;
            if (Math.random() > 0.6) {
                star.style.boxShadow = `0 0 6px rgba(255, 120, 200, 0.9)`;
            }
            starsBg.appendChild(star);
        }
    }

    const loadingBar = document.getElementById('loading-bar');
    const loadingPercent = document.getElementById('loading-percent');

    let currentProgress = 0;
    const progressInterval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 14) + 8;
        if (currentProgress >= 100) {
            currentProgress = 100;
            clearInterval(progressInterval);

            if (loadingBar) loadingBar.style.width = '100%';
            if (loadingPercent) loadingPercent.textContent = '100%';

            setTimeout(() => {
                loadingScreen.classList.add('fade-out');
                setTimeout(() => {
                    loadingScreen.remove();
                }, 950);
            }, 350);
        } else {
            if (loadingBar) loadingBar.style.width = `${currentProgress}%`;
            if (loadingPercent) loadingPercent.textContent = `${currentProgress}%`;
        }
    }, 45);
};

initLoadingScreen();
