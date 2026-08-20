import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

/**
 * =========================================================================
 * 1. BASE SETUP & SCENES
 * =========================================================================
 */
const canvas = document.createElement('canvas');
document.querySelector('#app').appendChild(canvas);

// Scene 1: Cho các vật thể phát sáng có hiệu ứng Bloom (Galaxy, Heart, Stars, Meteors, Text)
const scene = new THREE.Scene();

// Scene 2: Scene riêng cho Sprites (ảnh, emoji) để không bị cháy sáng
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

// OrbitControls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 1.35, 0);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.6;
controls.update();

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const pointLight = new THREE.PointLight('#ff007f', 2, 20);
pointLight.position.set(0, 3, 0);
scene.add(pointLight);

// Renderer (Tối ưu PixelRatio max 1.5 để mượt mà trên màn hình độ phân giải cao/Retina)
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setClearColor('#000000');
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.autoClear = false;

// Post Processing (Chạy Bloom ở độ phân giải 1/2 để tăng tốc GPU gấp 4 lần)
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(Math.floor(sizes.width / 2), Math.floor(sizes.height / 2)),
    1.2,
    0.4,
    0.85
);
bloomPass.threshold = 0.0;
bloomPass.strength = 1.2;
bloomPass.radius = 0.5;

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
 * 2. COLOR THEMES (Bộ màu vũ trụ)
 * =========================================================================
 */
const colorThemes = [
    {
        name: 'Romance Pink',
        insideColor: '#ff007f',
        outsideColor: '#100030',
        heartBase: '#ff0055',
        heartGlow: '#ff77aa',
        lightColor: '#ff007f'
    },
    {
        name: 'Deep Cyberpunk',
        insideColor: '#00f0ff',
        outsideColor: '#0d0033',
        heartBase: '#00d2ff',
        heartGlow: '#a855f7',
        lightColor: '#00e5ff'
    },
    {
        name: 'Emerald Aurora',
        insideColor: '#00ff88',
        outsideColor: '#021815',
        heartBase: '#00ffaa',
        heartGlow: '#70ff00',
        lightColor: '#00ff88'
    },
    {
        name: 'Golden Sunset',
        insideColor: '#ffaa00',
        outsideColor: '#250800',
        heartBase: '#ff6600',
        heartGlow: '#ffdd00',
        lightColor: '#ffaa00'
    }
];

// Load saved theme index from localStorage if exists
let currentThemeIndex = 0;
try {
    const savedTheme = localStorage.getItem('galaxy_theme_index');
    if (savedTheme !== null) {
        const idx = parseInt(savedTheme, 10);
        if (!isNaN(idx) && idx >= 0 && idx < colorThemes.length) {
            currentThemeIndex = idx;
        }
    }
} catch (e) {
    console.warn('LocalStorage error:', e);
}

/**
 * =========================================================================
 * 3. GALAXY GENERATION (Tối ưu 28.000 hạt với kích thước vừa vặn)
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
    scene.add(galaxyPoints);
};

generateGalaxy();

/**
 * =========================================================================
 * 3.1 DEEP COSMIC STARFIELD (Vòm sao lung linh lấp đầy không gian phía trên)
 * =========================================================================
 */
const starfieldCount = 2200;
const starfieldGeom = new THREE.BufferGeometry();
const starfieldPositions = new Float32Array(starfieldCount * 3);
const starfieldColors = new Float32Array(starfieldCount * 3);

for (let i = 0; i < starfieldCount; i++) {
    const i3 = i * 3;
    // Phân bố sao trên hình cầu vòm bao quanh không gian vũ trụ
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const radius = 18 + Math.random() * 22;

    starfieldPositions[i3] = Math.sin(phi) * Math.cos(theta) * radius;
    starfieldPositions[i3 + 1] = Math.sin(phi) * Math.sin(theta) * radius + 1.5;
    starfieldPositions[i3 + 2] = Math.cos(phi) * radius;

    // Màu sắc sao: xanh pastel, hồng tím, trắng lấp lánh
    const colType = Math.random();
    if (colType < 0.4) {
        starfieldColors[i3] = 1.0; starfieldColors[i3 + 1] = 0.95; starfieldColors[i3 + 2] = 1.0; // Trắng sáng
    } else if (colType < 0.7) {
        starfieldColors[i3] = 0.6; starfieldColors[i3 + 1] = 0.85; starfieldColors[i3 + 2] = 1.0; // Xanh băng
    } else {
        starfieldColors[i3] = 1.0; starfieldColors[i3 + 1] = 0.65; starfieldColors[i3 + 2] = 0.9; // Hồng tím
    }
}

starfieldGeom.setAttribute('position', new THREE.BufferAttribute(starfieldPositions, 3));
starfieldGeom.setAttribute('color', new THREE.BufferAttribute(starfieldColors, 3));

const starfieldMat = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});

const starfieldPoints = new THREE.Points(starfieldGeom, starfieldMat);
scene.add(starfieldPoints);

/**
 * =========================================================================
 * 4. 3D HEART SYSTEM (Tối ưu 6.000 hạt đẹp mắt)
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
            let tx = x * 1.0;
            let ty = z * 1.0;
            let tz = y * 1.0;

            positions[count * 3] = tx;
            positions[count * 3 + 1] = ty;
            positions[count * 3 + 2] = tz;

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
        opacity: 0.55,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    heartPoints = new THREE.Points(heartGeometry, heartMaterial);
    heartPoints.position.y = 2.4;
    scene.add(heartPoints);
};

generateHeart();

/**
 * =========================================================================
 * 4.1 SATURN-LIKE PLANETARY RING (Vành đai Sao Thổ quanh Trái Tim)
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
        // Bán kính ngẫu nhiên với dải phân cách rãnh Cassini tinh tế
        let r = innerRadius + Math.random() * (outerRadius - innerRadius);
        if (r > 1.95 && r < 2.12 && Math.random() > 0.15) {
            r = (Math.random() > 0.5 ? 1.85 : 2.22) + Math.random() * 0.3;
        }

        const angle = Math.random() * Math.PI * 2;
        const thickness = (Math.random() - 0.5) * 0.06; // Độ mỏng dẹt của vành đai

        positions[i3] = Math.cos(angle) * r;
        positions[i3 + 1] = thickness;
        positions[i3 + 2] = Math.sin(angle) * r;

        // Gradient màu từ mép trong ra mép ngoài
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
    heartRingPoints.position.y = 2.4; // Tọa độ tâm trái tim
    // Vành đai nằm ngang hoàn toàn (song song mặt phẳng ngân hà)
    heartRingPoints.rotation.x = 0;
    heartRingPoints.rotation.z = 0;
    scene.add(heartRingPoints);
};

generateHeartRing();

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
    ctx.font = '600 46px "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Đổ bóng màu pastel nhẹ nhàng, không bị chói
    ctx.shadowColor = theme.heartGlow;
    ctx.shadowBlur = 12;
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
            opacity: 0.92,
            depthWrite: false,
            blending: THREE.NormalBlending // Dùng NormalBlending để chữ rõ nét và dịu mắt
        });
        textSprite = new THREE.Sprite(material);
        textSprite.position.set(0, 3.6, 0);
        textSprite.scale.set(3.6, 0.9, 1);
        // Đưa vào sceneSprites để không bị BloomPass làm lóa mắt
        sceneSprites.add(textSprite);
    } else {
        textSprite.material.map.dispose();
        textSprite.material.map = texture;
        textSprite.material.needsUpdate = true;
    }
};

// Load initial text from localStorage
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
    ctx.font = '600 36px "Segoe UI", Roboto, sans-serif';
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
    group.scale.set(0.48, 0.48, 0.48); // Thu nhỏ chòm sao vừa vặn, tinh tế

    // 1. Đường nối các sao (thanh mảnh, tinh tế)
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

    // 2. Các điểm sao phát sáng nhỏ xinh
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
        const scale = (s.size || 0.45) * 0.55; // Thu nhỏ điểm sao
        sprite.scale.set(scale, scale, scale);
        sprite.userData = { baseScale: scale, phase: Math.random() * Math.PI * 2 };
        group.add(sprite);
        starSprites.push(sprite);
    });

    // 3. Nhãn tên chòm sao nhỏ gọn
    const labelTex = createConstellationLabelTexture(title);
    const labelMat = new THREE.SpriteMaterial({
        map: labelTex,
        transparent: true,
        opacity: 0.85,
        blending: THREE.NormalBlending
    });
    const labelSprite = new THREE.Sprite(labelMat);
    labelSprite.position.set(offset.x, offset.y + 1.2, offset.z);
    labelSprite.scale.set(1.5, 0.38, 1); // Thu nhỏ nhãn tên
    labelSprite.userData = { parentOffset: offset };
    sceneSprites.add(labelSprite);

    constellationsGroup.add(group);
    return { group, starSprites, labelSprite };
};

// Chòm sao Xử Nữ (Virgo ♍)
const virgoStars = [
    { x: 0.0, y: -1.2, z: 0.0, size: 0.75, name: 'Spica' }, // Sao Giác (sáng nhất)
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

// Chòm sao Kim Ngưu (Taurus ♉)
const taurusStars = [
    { x: 0.0, y: 0.0, z: 0.0, size: 0.85, isOrange: true, name: 'Aldebaran' }, // Mắt bò đỏ cam
    { x: -0.7, y: 0.6, z: 0.1, size: 0.45, name: 'Ain' },
    { x: -0.4, y: -0.5, z: -0.1, size: 0.4, name: 'Hyadum I' },
    { x: -1.0, y: 0.2, z: 0.2, size: 0.4, name: 'Hyadum II' },
    { x: 1.5, y: 1.8, z: 0.3, size: 0.55, name: 'Elnath' }, // Sừng bắc
    { x: 1.8, y: 0.5, z: -0.2, size: 0.5, name: 'Tianguan' }, // Sừng nam
    { x: -2.0, y: 1.5, z: 0.1, size: 0.6, name: 'Pleiades' } // Thất Tinh
];
const taurusLines = [
    [0, 1], [1, 3], [3, 2], [2, 0], [0, 5], [1, 4], [1, 6]
];

const virgoConstellation = buildConstellation('♍ Xử Nữ (Virgo)', virgoStars, virgoLines, new THREE.Vector3(-6.8, 3.4, -3.2), '#a855f7');
const taurusConstellation = buildConstellation('♉ Kim Ngưu (Taurus)', taurusStars, taurusLines, new THREE.Vector3(6.8, 3.4, -3.2), '#00f0ff');

/**
 * =========================================================================
 * 5.2 LOVE WORMHOLE PORTAL (Lỗ không gian 3D trong tâm Trái Tim)
 * =========================================================================
 */
let isWarping = false;
let warpProgress = 0;
const warpStartCameraPos = new THREE.Vector3();
const warpTargetPos = new THREE.Vector3(0, 2.4, 0.0);

// Tạo đĩa xoáy lỗ không gian (Wormhole Portal Vortex)
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

// Group chứa Lỗ không gian đặt chính xác tại tâm quả tim (Y = 2.4)
const wormholePortalGroup = new THREE.Group();
wormholePortalGroup.position.set(0, 2.4, 0);
wormholePortalGroup.scale.set(0.001, 0.001, 0.001);
wormholePortalGroup.visible = false;
scene.add(wormholePortalGroup);

// 1. Mặt đĩa xoáy Sprite trung tâm
const portalMat1 = new THREE.SpriteMaterial({
    map: portalVortexTexture,
    transparent: true,
    opacity: 0.98,
    blending: THREE.AdditiveBlending
});
const portalDisk1 = new THREE.Sprite(portalMat1);
portalDisk1.scale.set(3.4, 3.4, 3.4);
wormholePortalGroup.add(portalDisk1);

// 2. Vành đai xoáy 3D Ring 1 (Xoay thuận chiều kim đồng hồ)
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

// 3. Vành đai xoáy 3D Ring 2 (Xoay ngược chiều, tạo chiều sâu hố đen)
const portalRingMesh2 = new THREE.Mesh(portalRingGeom.clone(), portalRingMat.clone());
portalRingMesh2.scale.set(0.65, 0.65, 0.65);
wormholePortalGroup.add(portalRingMesh2);

// Tia sao kéo dài tốc độ ánh sáng
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

// Đường bay cong mượt mà chuẩn điện ảnh (Catmull-Rom Spline Curve)
let warpFlightCurve = null;

const triggerWormhole = () => {
    if (isWarping) return;
    isWarping = true;
    warpProgress = 0;
    
    // Tạo đường cong CatmullRom liên tục mượt mà 100% từ vị trí hiện tại của camera
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

    // Kích hoạt hiển thị lỗ không gian mở to dần từ tâm trái tim
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

// Texture cho đầu phát sáng của sao băng
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
        this.speed = 0.35;
        this.length = 3.8;

        this.group = new THREE.Group();
        this.group.visible = false;
        meteorsGroup.add(this.group);

        // 1. Vệt đuôi sao băng (Line)
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(6);
        const colors = new Float32Array(6);

        // Đầu trắng sáng, đuôi hòa vào màu tinh vân
        colors[0] = 1.0; colors[1] = 1.0; colors[2] = 1.0;
        colors[3] = 1.0; colors[4] = 0.4; colors[5] = 0.8;

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const lineMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending
        });

        this.line = new THREE.Line(geometry, lineMaterial);
        this.group.add(this.line);

        // 2. Đầu sao băng phát sáng rực rỡ (Glow Sprite)
        const spriteMaterial = new THREE.SpriteMaterial({
            map: meteorHeadTexture,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });
        this.head = new THREE.Sprite(spriteMaterial);
        this.head.scale.set(0.4, 0.4, 0.4);
        this.group.add(this.head);

        this.direction = new THREE.Vector3(-1, -0.5, -0.6).normalize();
    }

    spawn(customPos = null) {
        this.active = true;
        this.group.visible = true;

        const theme = colorThemes[currentThemeIndex];
        // Cập nhật màu đuôi theo theme
        const tailColor = new THREE.Color(theme.heartGlow);
        const colors = this.line.geometry.attributes.color;
        colors.setXYZ(0, 1.0, 1.0, 1.0);
        colors.setXYZ(1, tailColor.r, tailColor.g, tailColor.b);
        colors.needsUpdate = true;

        if (customPos) {
            this.group.position.copy(customPos);
        } else {
            // Xuất hiện trong tầm mắt camera: góc cao bên phải hoặc phía trên
            const startX = 4 + Math.random() * 8;
            const startY = 3.5 + Math.random() * 4.5;
            const startZ = -2 + (Math.random() - 0.5) * 8;
            this.group.position.set(startX, startY, startZ);
        }

        // Hướng bay chéo từ trên xuống dưới, lướt ngang qua dải ngân hà
        this.direction.set(
            -1.0 - Math.random() * 0.4,
            -0.45 - Math.random() * 0.3,
            -0.4 - Math.random() * 0.4
        ).normalize();

        this.speed = 0.28 + Math.random() * 0.22;
        this.updateGeometry();
    }

    updateGeometry() {
        const posAttr = this.line.geometry.attributes.position;
        const tail = this.direction.clone().multiplyScalar(-this.length);
        
        posAttr.setXYZ(0, 0, 0, 0); // Head
        posAttr.setXYZ(1, tail.x, tail.y, tail.z); // Tail
        posAttr.needsUpdate = true;
    }

    update() {
        if (!this.active) return;

        this.group.position.addScaledVector(this.direction, this.speed);

        // Biến mất khi bay ra khỏi tầm nhìn
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

let nextMeteorTime = 1.5; // Xuất hiện sớm ngay sau khi mở web

const spawnMeteorShower = () => {
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
 * 6.1 MAJESTIC COMET (Sao Chổi Đuôi Lụa Ánh Sáng Kỳ Vĩ)
 * =========================================================================
 */
const cometGroup = new THREE.Group();
scene.add(cometGroup);

// Tạo Texture nhân sao chổi hình ngôi sao kim cương lấp lánh (Starburst Flare)
const createCometStarTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Hào quang tròn trung tâm
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 120);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.15, 'rgba(200, 245, 255, 0.9)');
    grad.addColorStop(0.4, 'rgba(80, 180, 255, 0.4)');
    grad.addColorStop(1, 'rgba(0, 100, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Tia sáng ngang sắc nét (Lens flare spike)
    const flareH = ctx.createLinearGradient(0, 128, 256, 128);
    flareH.addColorStop(0, 'rgba(255, 255, 255, 0)');
    flareH.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
    flareH.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = flareH;
    ctx.fillRect(0, 125, 256, 6);

    // Tia sáng dọc
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

        // 1. Đầu nhân sao chổi (Starburst Core)
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

        // 2. Dải đuôi ánh sáng mượt mà liên tục (Continuous Ribbon Mesh)
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

        // Cập nhật mảng lịch sử vị trí để vẽ dải đuôi uốn lượn
        this.history.unshift(currentPos.clone());
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }

        // Cập nhật hình học của Dải Đuôi Lụa (Ribbon)
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

            // Vector vuông góc để tạo độ rộng cho dải đuôi
            const side = new THREE.Vector3().crossVectors(tangent, up).normalize();
            if (side.lengthSq() < 0.001) side.set(0, 1, 0);

            // Độ rộng dải đuôi mở rộng dần từ 0.1 (ở đầu) đến 1.2 (ở đuôi)
            const ratio = i / this.ribbonSegments;
            const width = (0.1 + ratio * 1.1);

            const v1 = p.clone().addScaledVector(side, width * 0.5);
            const v2 = p.clone().addScaledVector(side, -width * 0.5);

            const idx = i * 2;
            posAttr.setXYZ(idx, v1.x, v1.y, v1.z);
            posAttr.setXYZ(idx + 1, v2.x, v2.y, v2.z);

            // Màu sắc gradient: đầu trắng sáng rực, đuôi hòa dần thành màu theme và mờ đi
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
let nextCometTime = 5.0; // Xuất hiện lần đầu sau 5 giây, sau đó định kỳ mỗi 18-28 giây

/**
 * =========================================================================
 * 7. CLICK PARTICLE BURST (Pháo hoa bung hạt khi click)
 * =========================================================================
 */
const burstParticles = [];
const maxBursts = 80;

// Tạo canvas texture hình ngôi sao / trái tim mini cho hạt pháo hoa
const createSparkleTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '40px sans-serif';
    ctx.fillText('✨', 32, 34);
    
    return new THREE.CanvasTexture(canvas);
};

const sparkleTexture = createSparkleTexture();
const burstMaterial = new THREE.SpriteMaterial({
    map: sparkleTexture,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending
});

class ParticleBurst {
    constructor() {
        this.mesh = new THREE.Sprite(burstMaterial.clone());
        this.mesh.visible = false;
        this.velocity = new THREE.Vector3();
        this.life = 0;
        this.maxLife = 1.0;
        scene.add(this.mesh);
    }

    spawn(position, color) {
        this.mesh.position.copy(position);
        this.mesh.visible = true;
        this.mesh.scale.set(0.2, 0.2, 0.2);
        this.mesh.material.color.set(color);
        this.mesh.material.opacity = 1.0;
        this.life = 1.0;
        this.maxLife = 0.8 + Math.random() * 0.5;

        // Vận tốc bung tròn 3D
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const speed = 0.04 + Math.random() * 0.08;

        this.velocity.set(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.sin(phi) * Math.sin(theta) * speed,
            Math.cos(phi) * speed
        );
    }

    update(delta) {
        if (this.life <= 0) return;

        this.life -= delta / this.maxLife;
        this.mesh.position.add(this.velocity);
        this.velocity.multiplyScalar(0.96); // Lực cản không khí

        this.mesh.material.opacity = Math.max(0, this.life);
        const s = 0.2 * this.life;
        this.mesh.scale.set(s, s, s);

        if (this.life <= 0) {
            this.mesh.visible = false;
        }
    }
}

for (let i = 0; i < maxBursts; i++) {
    burstParticles.push(new ParticleBurst());
}

const triggerClickBurst = (worldPos) => {
    const theme = colorThemes[currentThemeIndex];
    let spawned = 0;
    for (const p of burstParticles) {
        if (p.life <= 0 && spawned < 18) {
            const randomColor = Math.random() > 0.4 ? theme.heartBase : theme.heartGlow;
            p.spawn(worldPos, randomColor);
            spawned++;
        }
    }
};

/**
 * =========================================================================
 * 8. ORBITING SPRITES & CUSTOM PHOTO SYSTEM
 * =========================================================================
 */
let floatingSprites = new THREE.Group();
sceneSprites.add(floatingSprites);

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

    floatingSprites.add(sprite);
    return sprite;
};

// Khởi tạo các emojis mặc định
const initDefaultSprites = () => {
    const emojis = ['🚀', '👨‍🚀', '🪐', '🌟', '🛸', '🛰️', '🐶', '💖'];
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
        const count = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            addSpriteToOrbit(tex, false);
        }
    });

    // Thêm ảnh cat.jpg mặc định
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/cat.jpg', (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        for (let i = 0; i < 3; i++) {
            addSpriteToOrbit(tex, true);
        }
    });
};

initDefaultSprites();

// Xử lý upload ảnh cá nhân
const handlePhotoUpload = (files) => {
    Array.from(files).forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const tex = new THREE.Texture(img);
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.needsUpdate = true;
                
                // Thêm 2 bản thể bay trong không gian
                addSpriteToOrbit(tex, true);
                addSpriteToOrbit(tex, true);
            };
        };
        reader.readAsDataURL(file);
    });
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
    if (isCinemaMode) {
        isCinemaMode = false;
        document.getElementById('btn-cinema')?.classList.remove('active');
    }
});

/**
 * =========================================================================
 * 10. AUDIO BACKGROUND & AUDIO VISUALIZER (Nhạc nhảy theo Beat)
 * =========================================================================
 */
// 1. Nhạc mặc định nội bộ
const bgMusic = new Audio('/music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.65;
let musicStarted = false;

let audioContext = null;
let analyser = null;
let audioDataArray = null;

// 2. Trình phát YouTube IFrame API
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
    } catch (e) {
        console.warn("Audio analyser info:", e);
    }
};

const startMusic = () => {
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
    }).catch(e => {
        console.warn("Chờ tương tác từ người dùng để phát nhạc:", e);
    });
};

// Tự động phát nhạc ngay khi người dùng chạm, click hoặc nhấn phím bất kỳ
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
    if (!fairyCtx) return;
    const now = performance.now();
    // Giới hạn chỉ sinh hạt tối đa 1 lần mỗi 35ms để không làm nghẽn CPU
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
 * 11. RAYCASTER & INTERACTION (Click / Double Click)
 * =========================================================================
 */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    // Nếu click vào UI elements thì không tương tác 3D
    if (event.target.closest('.ui-controls') || event.target.closest('.text-modal')) {
        return;
    }

    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = -(event.clientY / sizes.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // Kiểm tra xem có click trúng Sprite không
    const intersects = raycaster.intersectObjects(floatingSprites.children, false);
    let clickedSprite = null;

    if (intersects.length > 0) {
        clickedSprite = intersects[0].object;
    }

    floatingSprites.children.forEach(sprite => {
        if (sprite === clickedSprite) {
            sprite.userData.isZoomed = !sprite.userData.isZoomed;
        } else {
            sprite.userData.isZoomed = false;
        }
    });

    // Tạo pháo hoa bung hạt tại vị trí click trong không gian 3D
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const targetPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, targetPoint);
    if (!targetPoint || isNaN(targetPoint.x)) {
        raycaster.ray.at(5, targetPoint);
    }
    triggerClickBurst(targetPoint);
});

// Click đúp gọi chùm sao băng
window.addEventListener('dblclick', (e) => {
    if (e.target.closest('.ui-controls') || e.target.closest('.text-modal')) return;
    spawnMeteorShower();
});

// Phím Space gọi sao băng
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !document.getElementById('text-modal').classList.contains('show')) {
        spawnMeteorShower();
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

    // 0. Audio Visualizer (Phân tích tần số âm bass theo nhịp điệu)
    let rawBass = 0;
    if (analyser && !bgMusic.paused && !bgMusic.muted) {
        analyser.getByteFrequencyData(audioDataArray);
        let bassSum = 0;
        const binsToCheck = Math.min(6, audioDataArray.length);
        for (let i = 0; i < binsToCheck; i++) {
            bassSum += audioDataArray[i];
        }
        rawBass = bassSum / (binsToCheck * 255); // 0.0 đến 1.0
    }

    // Làm mượt độ phản hồi của âm bass (nảy nhanh theo nhịp bass, nhả về êm dịu)
    if (rawBass > smoothedBass) {
        smoothedBass += (rawBass - smoothedBass) * 0.45;
    } else {
        smoothedBass += (rawBass - smoothedBass) * 0.14;
    }

    // Hiệu ứng Bloom phát quang rực rỡ nhảy theo nhịp nhạc Bass
    if (bloomPass) {
        bloomPass.strength = 1.15 + smoothedBass * 1.35;
    }

    // Cập nhật vệt bụi sao ma thuật theo chuột
    updateFairyDust();

    // 0.1 Cập nhật hiệu ứng chòm sao Xử Nữ & Kim Ngưu lấp lánh
    if (typeof virgoConstellation !== 'undefined' && typeof taurusConstellation !== 'undefined') {
        [virgoConstellation, taurusConstellation].forEach(c => {
            c.starSprites.forEach(s => {
                const scale = s.userData.baseScale * (1.0 + Math.sin(elapsedTime * 3.0 + s.userData.phase) * 0.18);
                s.scale.set(scale, scale, scale);
            });
            c.labelSprite.position.set(
                c.labelSprite.userData.parentOffset.x,
                c.labelSprite.userData.parentOffset.y + 1.2 + Math.sin(elapsedTime * 1.5) * 0.04,
                c.labelSprite.userData.parentOffset.z
            );
        });
    }

    // 0.2 Cập nhật hiệu ứng Cổng Dịch Chuyển Wormhole Ngay Tại Trái Tim (Spline Curve Flight)
    if (isWarping && warpFlightCurve) {
        warpProgress += delta * 0.38; // ~2.6 giây hành trình bay điện ảnh êm ru
        
        // Xoay đĩa lỗ không gian đa tầng với tốc độ cao
        if (typeof portalRingMesh !== 'undefined' && typeof portalRingMesh2 !== 'undefined' && typeof portalDisk1 !== 'undefined') {
            portalRingMesh.rotation.z -= delta * 5.5;
            portalRingMesh2.rotation.z += delta * 4.0;
            portalDisk1.material.rotation += delta * 3.5;
        }

        // Cập nhật các tia sao bay vút
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
        // Lấy tọa độ camera chính xác theo đường cong Spline liên tục mượt mà
        const currentCamPos = warpFlightCurve.getPointAt(clampedT);
        camera.position.copy(currentCamPos);

        // Điều khiển kích thước lỗ không gian & góc nhìn FOV linh hoạt
        if (clampedT < 0.45) {
            // Giai đoạn 1: Lao vào tâm - Portal mở rộng, FOV mở dãn
            const p1 = clampedT / 0.45;
            const portalScale = Math.sin(p1 * Math.PI * 0.5) * 1.9;
            wormholePortalGroup.scale.set(portalScale, portalScale, portalScale);
            camera.fov = 75 + p1 * 30;
            camera.updateProjectionMatrix();
            controls.target.lerp(new THREE.Vector3(0, 2.4, 0), 0.15);
        } else if (clampedT < 0.58) {
            // Giai đoạn 2: Xuyên qua hố đen - Chớp sáng nhẹ nhàng
            const flashEl = document.getElementById('wormhole-flash');
            if (flashEl && !flashEl.classList.contains('active')) {
                flashEl.classList.add('active');
                setTimeout(() => flashEl.classList.remove('active'), 550);
            }
            camera.fov = 75;
            camera.updateProjectionMatrix();
        } else {
            // Giai đoạn 3: Uốn lượn quay về - Portal khép lại, tiêu điểm hướng về tâm ngân hà
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

    // 1. Rotate galaxy & deep starfield (Quay êm dịu, tĩnh lặng)
    if (galaxyPoints) {
        galaxyPoints.rotation.y = elapsedTime * 0.08;
    }
    if (starfieldPoints) {
        starfieldPoints.rotation.y = elapsedTime * 0.015;
    }

    // 2. Rotate & Pulse Heart (Quả tim đập theo tiếng bass của nhạc HOẶC thở đều đặn êm ái)
    if (heartPoints) {
        heartPoints.rotation.y = elapsedTime * 0.12;

        let targetScale = 1.0;
        if (smoothedBass > 0.04) {
            // Khi có nhạc với tiếng bass: Đập nảy dứt khoát và sống động theo từng nhịp bass
            const bassPunch = Math.pow(smoothedBass, 1.25) * 0.24;
            const microBreathe = Math.sin(elapsedTime * 1.5) * 0.03;
            targetScale = 1.0 + bassPunch + microBreathe;
        } else {
            // Khi nhạc êm, tắt tiếng hoặc không có bass: Quả tim thở đều đặn, nhịp nhàng tự nhiên
            const steadyBreathe = Math.sin(elapsedTime * 1.6) * 0.075;
            targetScale = 1.0 + steadyBreathe;
        }

        // Nội suy mượt mà để quả tim chuyển động uyển chuyển không bị giật cục
        currentHeartScale += (targetScale - currentHeartScale) * 0.22;
        heartPoints.scale.set(currentHeartScale, currentHeartScale, currentHeartScale);
    }

    // 2.1 Xoay vành đai Sao Thổ quanh Trái Tim lấp lánh & đồng điệu nhịp thở
    if (heartRingPoints) {
        heartRingPoints.rotation.y = elapsedTime * 0.07;
        const ringTarget = 1.0 + (currentHeartScale - 1.0) * 0.6;
        currentRingScale += (ringTarget - currentRingScale) * 0.18;
        heartRingPoints.scale.set(currentRingScale, currentRingScale, currentRingScale);
    }

    // Đèn phát sáng ổn định, êm ái
    if (pointLight) {
        pointLight.intensity = 2.0;
    }

    // 3. Floating Text Bobbing & Facing Camera
    if (textSprite) {
        textSprite.position.y = 3.6 + Math.sin(elapsedTime * 2.0) * 0.08;
    }

    // 4. Meteors update & periodic random spawn (Tự động xuất hiện định kỳ mỗi 2 - 4.5 giây)
    if (elapsedTime > nextMeteorTime) {
        const inactiveMeteors = meteorPool.filter(m => !m.active);
        if (inactiveMeteors.length > 0) {
            inactiveMeteors[0].spawn();
            // 25% cơ hội xuất hiện thêm 1 vệt sao băng nữa bay cùng lúc
            if (Math.random() > 0.75 && inactiveMeteors.length > 1) {
                setTimeout(() => inactiveMeteors[1].spawn(), 300);
            }
        }
        nextMeteorTime = elapsedTime + 2.0 + Math.random() * 3.0;
    }

    meteorPool.forEach(m => m.update());

    // 4.1 Majestic Comet update (Sao Chổi kỳ vĩ lướt qua bầu trời mỗi 16 - 25 giây)
    if (elapsedTime > nextCometTime) {
        if (!majesticComet.active) {
            majesticComet.spawn();
        }
        nextCometTime = elapsedTime + 16.0 + Math.random() * 9.0;
    }
    majesticComet.update(delta);

    // 5. Particle Burst update
    burstParticles.forEach(p => p.update(delta));

    // 6. Floating Sprites Orbit & Zooming
    floatingSprites.children.forEach(sprite => {
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

    // 7. Cinema Tour Mode Animation
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
        controls.autoRotate = !isResettingView;
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
    composer.render(); // Scene 1 (Ngân hà, Trái tim, Chữ, Sao băng với Bloom)
    renderer.clearDepth();
    renderer.render(sceneSprites, camera); // Scene 2 (Hình ảnh rõ nét, không bị chói Bloom)

    window.requestAnimationFrame(tick);
};

tick();

/**
 * =========================================================================
 * 13. UI CONTROLS WIRING & LOCALSTORAGE PERSISTENCE
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

        // Tái tạo lại Galaxy, Heart và Vành đai Sao Thổ theo theme mới
        generateGalaxy();
        generateHeart();
        generateHeartRing();

        // Cập nhật màu đèn
        pointLight.color.set(theme.lightColor);

        // Cập nhật lại màu phát sáng của chữ
        const currentText = document.getElementById('custom-text-input')?.value || initialLoveText;
        updateFloatingText(currentText);
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

// 4. Nút Upload ảnh
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
            imageUploadInput.value = ''; // Reset input
        }
    });
}

// 4.1 Nút mở Modal Đổi Nhạc YouTube
const btnChangeMusic = document.getElementById('btn-change-music');
const musicModal = document.getElementById('music-modal');
const youtubeUrlInput = document.getElementById('youtube-url-input');
const btnPlayYouTube = document.getElementById('btn-play-youtube');
const btnDefaultMusic = document.getElementById('btn-default-music');
const btnCancelMusic = document.getElementById('btn-cancel-music');

// Load saved YouTube link if exists
try {
    const savedYT = localStorage.getItem('galaxy_yt_music');
    if (savedYT && youtubeUrlInput) {
        youtubeUrlInput.value = savedYT;
    }
} catch (err) {}

if (btnChangeMusic && musicModal) {
    btnChangeMusic.addEventListener('click', (e) => {
        e.stopPropagation();
        musicModal.classList.add('show');
        youtubeUrlInput.focus();
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

// 5. Nút Bật/Tắt Âm thanh (Hỗ trợ cả MP3 và YouTube)
const btnMusic = document.getElementById('btn-music');
if (btnMusic) {
    btnMusic.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isUsingYouTube && ytPlayer) {
            if (isYTMuted) {
                ytPlayer.unMute();
                isYTMuted = false;
                updateMusicButtonState(false);
            } else {
                ytPlayer.mute();
                isYTMuted = true;
                updateMusicButtonState(true);
            }
        } else {
            bgMusic.muted = !bgMusic.muted;
            updateMusicButtonState(bgMusic.muted);
            if (!musicStarted && !bgMusic.muted) {
                startMusic();
            }
        }
    });
}

// 6. Nút Về toàn cảnh
const btnReset = document.getElementById('btn-reset-view');
if (btnReset) {
    btnReset.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isCinemaMode) {
            isCinemaMode = false;
            btnCinema?.classList.remove('active');
        }
        isResettingView = true;

        // Thu nhỏ lại tất cả các hình ảnh nếu đang bị phóng to
        floatingSprites.children.forEach(sprite => {
            sprite.userData.isZoomed = false;
        });
    });
}

// 7. Nút Cổng Dịch Chuyển Không Gian (Wormhole Warp)
const btnWormhole = document.getElementById('btn-wormhole');
if (btnWormhole) {
    btnWormhole.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerWormhole();
    });
}

// 8. Nút Ẩn / Hiện Thanh Công Cụ & Hướng Dẫn (Zen Mode)
const btnToggleUI = document.getElementById('btn-toggle-ui');
const btnRestoreUI = document.getElementById('btn-restore-ui');
const uiControls = document.getElementById('ui-controls');
const hintBox = document.getElementById('hint-box');

if (btnToggleUI && btnRestoreUI && uiControls) {
    btnToggleUI.addEventListener('click', (e) => {
        e.stopPropagation();
        uiControls.classList.add('hidden');
        if (hintBox) hintBox.classList.add('hidden');
        btnRestoreUI.classList.add('show');
    });

    btnRestoreUI.addEventListener('click', (e) => {
        e.stopPropagation();
        uiControls.classList.remove('hidden');
        if (hintBox) hintBox.classList.remove('hidden');
        btnRestoreUI.classList.remove('show');
    });
}

/**
 * =========================================================================
 * 14. LOADING SCREEN CONTROLLER (Khởi tạo sao & Mở màn vũ trụ mượt mà)
 * =========================================================================
 */
const initLoadingScreen = () => {
    const loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) return;

    // Sinh các ngôi sao lấp lánh ngẫu nhiên trên màn hình chờ
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

            // Hoàn tất tải: Mờ dần màn hình loading và giải phóng
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

