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
    cosmicSeason: 'spring',
    autoFireworks: true,
    autoMeteors: true,
    frequentComets: true,
    fairyDust: true,
    showPhotos: false,
    saturnTheme: 'rainbow',
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

const isPortrait = () => window.innerWidth < window.innerHeight;

// Camera (Tối ưu FOV & khoảng cách cho cả điện thoại dọc và màn hình ngang)
const camera = new THREE.PerspectiveCamera(
    isPortrait() ? 80 : 75,
    sizes.width / sizes.height,
    0.1,
    100
);
const initialCamPos = isPortrait() ? new THREE.Vector3(0, 2.8, 8.8) : new THREE.Vector3(0, 2.5, 7.2);
camera.position.copy(initialCamPos);
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
const pointLight = new THREE.PointLight(initialTheme.lightColor, 1.1, 18);
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
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
renderer.setClearColor('#000000');
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.autoClear = false;

// Post Processing (Bloom Pass - Tinh chỉnh êm dịu, trong trẻo, không chói lóa)
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(Math.floor(sizes.width / 2), Math.floor(sizes.height / 2)),
    0.68,
    0.28,
    0.85
);
bloomPass.threshold = 0.12;
bloomPass.strength = 0.68;
bloomPass.radius = 0.28;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// Resize handler (Tự động canh chỉnh khi xoay màn hình điện thoại hoặc thay đổi kích thước)
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.fov = (sizes.width < sizes.height) ? 80 : 75;
    camera.updateProjectionMatrix();

    if (typeof defaultCameraPos !== 'undefined') {
        if (sizes.width < sizes.height) {
            defaultCameraPos.set(0, 2.8, 8.8);
        } else {
            defaultCameraPos.set(0, 2.5, 7.2);
        }
    }

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));

    composer.setSize(sizes.width, sizes.height);
    bloomPass.setSize(Math.floor(sizes.width / 2), Math.floor(sizes.height / 2));
});


/**
 * =========================================================================
 * 3. GALAXY GENERATION (Ngân hà xoắn ốc sắc nét, tinh xảo & không bị nhòe)
 * =========================================================================
 */
const galaxyParams = {
    count: 24000,
    size: 0.013,
    radius: 8.0,
    branches: 4,
    spin: 1.25,
    randomness: 0.28,
    randomnessPower: 4.2
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
        vertexColors: true,
        transparent: true,
        opacity: 0.85
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
 * 4. 3D CRYSTAL HEART GENERATION (Trái Tim Pha Lê Đa Tầng Lộng Lẫy)
 * =========================================================================
 */
let heartPoints = null;

// Texture hạt phát sáng mềm mịn cho trái tim (không bị vuông cạnh, tạo độ lung linh như tinh thể pha lê)
let heartParticleTexture = null;
const getHeartParticleTexture = () => {
    if (heartParticleTexture) return heartParticleTexture;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
    grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.35)');
    grad.addColorStop(0.85, 'rgba(255, 255, 255, 0.08)');
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    heartParticleTexture = new THREE.CanvasTexture(canvas);
    return heartParticleTexture;
};

// Hàm tính toán toạ độ 3D Trái Tim Điêu Khắc (True 3D Dual-Lobe Heart with Sculpted Cleft)
const sampleHeart3D = (u, phi, scale = 0.086, scaleZ = 0.068, jitterAmount = 0.006) => {
    const sinU = Math.sin(u);
    const cosU = Math.cos(u);
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    // 1. Dáng 2D chuẩn trái tim thanh thoát
    const x0 = 16 * Math.pow(sinU, 3);
    let y0 = 13 * cosU - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u);

    // 2. Điêu khắc khe tim hình chữ V sâu & mềm mại (Top Cleft Notch)
    // Tăng độ sâu và độ thon của khe trên u = 0, giúp 2 bầu tim tách biệt rõ ràng và duyên dáng
    const cleftProximity = Math.exp(-Math.pow(u / 0.48, 2));
    y0 -= cleftProximity * 0.95;

    // 3. Độ dày phồng 3D đa chiều & Rãnh giữa trước/sau (Anatomical Central Groove)
    const lobeDist = Math.abs(sinU);
    let maxThickness = 6.2 * Math.pow(lobeDist, 0.45) * (0.85 + 0.15 * cosU);
    const grooveFactor = Math.exp(-Math.pow(x0 / 3.2, 2));
    // Rãnh giữa lõm nhẹ tạo chiều sâu 3D khi xoay
    maxThickness *= (1.0 - 0.28 * grooveFactor);

    // 4. Toạ độ 3D thực thụ (2 bầu tim tròn trịa, không bị suy biến thành trục dọc)
    const x = x0 * (0.35 + 0.65 * cosPhi) * scale;
    const y = y0 * scale;
    const z = maxThickness * sinPhi * scaleZ;

    const jitter = (Math.random() - 0.5) * jitterAmount;

    return {
        x: x + jitter,
        y: y + jitter,
        z: z + jitter,
        u,
        phi,
        cleftProximity,
        grooveFactor,
        lobeDist
    };
};

const generateHeart = () => {
    if (heartPoints !== null) {
        while (heartPoints.children.length > 0) {
            const child = heartPoints.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
            heartPoints.remove(child);
        }
        scene.remove(heartPoints);
    }

    heartPoints = new THREE.Group();
    heartPoints.position.y = 2.4;
    heartPoints.visible = (fxConfig.showHeart !== false);

    const theme = colorThemes[currentThemeIndex];
    const baseColor = new THREE.Color(theme.heartBase);
    const glowColor = new THREE.Color(theme.heartGlow);
    const insideColor = new THREE.Color(theme.insideColor || '#ff99cc');
    const lightColor = new THREE.Color(theme.lightColor || '#ffffff');
    const whiteColor = new THREE.Color('#ffffff');
    const particleTex = getHeartParticleTexture();

    // =========================================================================
    // 1. PRECISION 3D DIAMOND SURFACE SHELL (9.000 hạt bề mặt điêu khắc siêu mịn)
    // =========================================================================
    const surfaceCount = 9000;
    const surfaceGeom = new THREE.BufferGeometry();
    const surfacePos = new Float32Array(surfaceCount * 3);
    const surfaceCols = new Float32Array(surfaceCount * 3);

    for (let i = 0; i < surfaceCount; i++) {
        // Phân bổ s đều đặn -> u không bị dồn cục tại x=0
        const s = 2 * Math.random() - 1;
        const u = Math.sign(s) * Math.asin(Math.pow(Math.abs(s), 0.55)) * 2;
        const phi = (Math.random() - 0.5) * Math.PI;

        const pt = sampleHeart3D(u, phi, 0.086, 0.068, 0.008);
        surfacePos[i * 3] = pt.x;
        surfacePos[i * 3 + 1] = pt.y;
        surfacePos[i * 3 + 2] = pt.z;

        // Gradient màu sắc tinh tế:
        // Đỉnh 2 bầu tim & viền ngoài: Ánh sáng rực rỡ (glowColor / insideColor)
        // Rãnh khe tim & đáy: Màu đậm đà có độ sâu huyền ảo (baseColor / ruby tone), không bị cháy sáng
        const normY = (pt.y + 1.4) / 2.6;
        let col = baseColor.clone().lerp(glowColor, normY);

        if (pt.cleftProximity > 0.4) {
            // Khu vực rãnh khe tim: Phối màu mềm dịu, có độ sâu tương phản 3D
            col = baseColor.clone().lerp(insideColor, 0.35 + 0.3 * (1 - pt.cleftProximity));
        }

        // Tinh thể kim cương lấp lánh (Diamond Sparkles)
        if (Math.random() > 0.86) {
            col.lerp(whiteColor, 0.55);
        }

        surfaceCols[i * 3] = col.r;
        surfaceCols[i * 3 + 1] = col.g;
        surfaceCols[i * 3 + 2] = col.b;
    }

    surfaceGeom.setAttribute('position', new THREE.BufferAttribute(surfacePos, 3));
    surfaceGeom.setAttribute('color', new THREE.BufferAttribute(surfaceCols, 3));

    const surfaceMat = new THREE.PointsMaterial({
        size: 0.024,
        map: particleTex,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    const surfaceMesh = new THREE.Points(surfaceGeom, surfaceMat);
    heartPoints.add(surfaceMesh);

    // =========================================================================
    // 2. SOLID CRYSTAL VOLUME (5.500 hạt lòng khối 3D trong suốt đa tầng)
    // =========================================================================
    const volumeCount = 5500;
    const volumeGeom = new THREE.BufferGeometry();
    const volumePos = new Float32Array(volumeCount * 3);
    const volumeCols = new Float32Array(volumeCount * 3);

    for (let i = 0; i < volumeCount; i++) {
        const s = 2 * Math.random() - 1;
        const u = Math.sign(s) * Math.asin(Math.pow(Math.abs(s), 0.55)) * 2;
        const phi = (Math.random() - 0.5) * Math.PI;
        const r = Math.pow(Math.random(), 0.6) * 0.90; // Phân bổ lớp lõi

        const pt = sampleHeart3D(u, phi, 0.086, 0.068, 0.005);
        volumePos[i * 3] = pt.x * r;
        volumePos[i * 3 + 1] = pt.y * r;
        volumePos[i * 3 + 2] = pt.z * r;

        const col = glowColor.clone().lerp(baseColor, r * 0.75);
        volumeCols[i * 3] = col.r;
        volumeCols[i * 3 + 1] = col.g;
        volumeCols[i * 3 + 2] = col.b;
    }

    volumeGeom.setAttribute('position', new THREE.BufferAttribute(volumePos, 3));
    volumeGeom.setAttribute('color', new THREE.BufferAttribute(volumeCols, 3));

    const volumeMat = new THREE.PointsMaterial({
        size: 0.019,
        map: particleTex,
        transparent: true,
        opacity: 0.52,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    const volumeMesh = new THREE.Points(volumeGeom, volumeMat);
    heartPoints.add(volumeMesh);

    // =========================================================================
    // 3. RAZOR-SHARP CONTOUR SILHOUETTE (2.500 hạt viền sắc nét định hình đường cong tim)
    // =========================================================================
    const contourCount = 2500;
    const contourGeom = new THREE.BufferGeometry();
    const contourPos = new Float32Array(contourCount * 3);
    const contourCols = new Float32Array(contourCount * 3);

    for (let i = 0; i < contourCount; i++) {
        const u = (i / contourCount) * Math.PI * 2 - Math.PI;
        const pt = sampleHeart3D(u, 0, 0.086, 0.068, 0.002);

        contourPos[i * 3] = pt.x;
        contourPos[i * 3 + 1] = pt.y;
        contourPos[i * 3 + 2] = (Math.random() - 0.5) * 0.035;

        const col = glowColor.clone().lerp(insideColor, Math.random() * 0.6);
        if (Math.random() > 0.8) col.lerp(whiteColor, 0.4);

        contourCols[i * 3] = col.r;
        contourCols[i * 3 + 1] = col.g;
        contourCols[i * 3 + 2] = col.b;
    }

    contourGeom.setAttribute('position', new THREE.BufferAttribute(contourPos, 3));
    contourGeom.setAttribute('color', new THREE.BufferAttribute(contourCols, 3));

    const contourMat = new THREE.PointsMaterial({
        size: 0.023,
        map: particleTex,
        transparent: true,
        opacity: 0.90,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    const contourMesh = new THREE.Points(contourGeom, contourMat);
    heartPoints.add(contourMesh);

    // =========================================================================
    // 4. SCULPTED CLEFT RIDGE & SULCUS HIGHLIGHT (1.500 hạt viền khe tim phát sáng lung linh)
    // =========================================================================
    const cleftCount = 1500;
    const cleftGeom = new THREE.BufferGeometry();
    const cleftPos = new Float32Array(cleftCount * 3);
    const cleftCols = new Float32Array(cleftCount * 3);

    for (let i = 0; i < cleftCount; i++) {
        // Tập trung dọc theo rãnh chữ V của khe tim phía trên và rãnh giữa trước/sau
        const u = (Math.random() - 0.5) * 0.95;
        const phi = (Math.random() - 0.5) * Math.PI * 0.7;
        const pt = sampleHeart3D(u, phi, 0.086, 0.068, 0.004);

        cleftPos[i * 3] = pt.x;
        cleftPos[i * 3 + 1] = pt.y;
        cleftPos[i * 3 + 2] = pt.z;

        // Điểm xuyết tinh thể lấp lánh như giọt sương mai trên khe tim
        const col = glowColor.clone().lerp(lightColor, Math.random() * 0.7);
        if (Math.random() > 0.6) {
            col.lerp(whiteColor, 0.6);
        }

        cleftCols[i * 3] = col.r;
        cleftCols[i * 3 + 1] = col.g;
        cleftCols[i * 3 + 2] = col.b;
    }

    cleftGeom.setAttribute('position', new THREE.BufferAttribute(cleftPos, 3));
    cleftGeom.setAttribute('color', new THREE.BufferAttribute(cleftCols, 3));

    const cleftMat = new THREE.PointsMaterial({
        size: 0.021,
        map: particleTex,
        transparent: true,
        opacity: 0.88,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    const cleftMesh = new THREE.Points(cleftGeom, cleftMat);
    heartPoints.add(cleftMesh);

    // =========================================================================
    // 5. AMBIENT FLOATING FAIRY STARDUST (800 hạt bụi sao lơ lửng quanh tim)
    // =========================================================================
    const stardustCount = 800;
    const stardustGeom = new THREE.BufferGeometry();
    const stardustPos = new Float32Array(stardustCount * 3);
    const stardustCols = new Float32Array(stardustCount * 3);

    for (let i = 0; i < stardustCount; i++) {
        const s = 2 * Math.random() - 1;
        const u = Math.sign(s) * Math.asin(Math.pow(Math.abs(s), 0.55)) * 2;
        const phi = (Math.random() - 0.5) * Math.PI;
        const auraDist = 1.06 + Math.random() * 0.28;

        const pt = sampleHeart3D(u, phi, 0.086, 0.068, 0.04);
        stardustPos[i * 3] = pt.x * auraDist;
        stardustPos[i * 3 + 1] = pt.y * auraDist;
        stardustPos[i * 3 + 2] = pt.z * auraDist;

        const col = insideColor.clone().lerp(whiteColor, Math.random() * 0.65);
        stardustCols[i * 3] = col.r;
        stardustCols[i * 3 + 1] = col.g;
        stardustCols[i * 3 + 2] = col.b;
    }

    stardustGeom.setAttribute('position', new THREE.BufferAttribute(stardustPos, 3));
    stardustGeom.setAttribute('color', new THREE.BufferAttribute(stardustCols, 3));

    const stardustMat = new THREE.PointsMaterial({
        size: 0.016,
        map: particleTex,
        transparent: true,
        opacity: 0.70,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    const stardustMesh = new THREE.Points(stardustGeom, stardustMat);
    heartPoints.add(stardustMesh);

    // =========================================================================
    // 6. ENERGY ORBITING RIBBONS (2 Dải lụa năng lượng mềm mại)
    // =========================================================================
    const ribbonRadii = [1.45, 1.7];
    const ribbonTilts = [0.45, -0.4];
    ribbonRadii.forEach((rad, idx) => {
        const ringGeom = new THREE.RingGeometry(rad - 0.02, rad + 0.02, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(idx === 0 ? theme.heartGlow : theme.insideColor),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.14,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.rotation.x = Math.PI / 2 + ribbonTilts[idx];
        ringMesh.rotation.y = idx * 0.8;
        ringMesh.userData = { speed: (idx % 2 === 0 ? 0.3 : -0.25) };
        heartPoints.add(ringMesh);
    });

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
        if (savedText.includes('NỔ TUNG') || savedText.includes('BÙNG NỔ')) {
            initialLoveText = 'Forever & Always 💖';
            localStorage.setItem('galaxy_love_text', initialLoveText);
        } else {
            initialLoveText = savedText.trim();
        }
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
    // Khởi tạo các điểm mốc mượt mà chuẩn điện ảnh
    const approachP = new THREE.Vector3(startP.x * 0.45, 2.4 + (startP.y - 2.4) * 0.4, Math.max(3.2, startP.z * 0.55));
    const entryP = new THREE.Vector3(0, 2.4, 1.4);
    const heartCenterP = new THREE.Vector3(0, 2.4, -0.4);
    const exitBackP = new THREE.Vector3(0, 2.1, -4.8);
    const sweepSideP = new THREE.Vector3(4.6, 2.7, 1.8);
    const settleP = new THREE.Vector3(1.8, 2.6, 6.4);
    const endDefaultP = defaultCameraPos.clone();

    warpFlightCurve = new THREE.CatmullRomCurve3([
        startP,
        approachP,
        entryP,
        heartCenterP,
        exitBackP,
        sweepSideP,
        settleP,
        endDefaultP
    ], false, 'centripetal', 0.5);

    wormholePortalGroup.visible = true;
    wormholePortalGroup.scale.set(0.01, 0.01, 0.01);
    warpStarsGroup.visible = true;

    controls.enabled = false;
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
    if (isSoundMuted || !fxConfig.soundFx) return;
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
 * 8.2 SATURN RINGS 3D SYSTEM (Vành Đai Sao Thổ 3D Lộng Lẫy)
 * =========================================================================
 */
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

// Khởi tạo nhóm 3D cho Vành đai Sao Thổ
const saturnMainGroup = new THREE.Group();
saturnMainGroup.position.set(0, 2.4, 0);
saturnMainGroup.visible = (fxConfig.showSaturnRings !== false);
scene.add(saturnMainGroup);

const saturnDustGroup = new THREE.Group();
saturnMainGroup.add(saturnDustGroup);

const saturnRibbonsGroup = new THREE.Group();
saturnMainGroup.add(saturnRibbonsGroup);

// Cập nhật góc nghiêng Vành đai
const updateSaturnTilt = () => {
    const tilt = getSaturnTiltAngles(fxConfig.saturnTilt);
    saturnMainGroup.rotation.x = tilt.x;
    saturnMainGroup.rotation.z = tilt.z;
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

    const particleCount = 4200;
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
    const rainbowRibbonColors = ['#ff007f', '#00f0ff', '#ffaa00', '#a855f7'];
    ribbonRadii.forEach((rad, idx) => {
        const ringGeom = new THREE.RingGeometry(rad - 0.04, rad + 0.04, 64);
        const ribbonColorHex = (themeKey === 'rainbow') 
            ? rainbowRibbonColors[idx % rainbowRibbonColors.length]
            : (idx % 2 === 0 ? theme.inner : theme.mid);
        const ringMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(ribbonColorHex),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.24,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        saturnRibbonsGroup.add(ringMesh);
    });
};

generateSaturnDustAndRibbons();

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
 * 8.4 COSMIC SEASONS SYSTEM (Bốn Mùa Thiên Hà: Xuân 🌸 / Hạ 🌌 / Thu 🍂 / Đông ❄️)
 * =========================================================================
 */
const cosmicSeasonsGroup = new THREE.Group();
scene.add(cosmicSeasonsGroup);

let seasonalParticles = [];
let seasonalGeometry = null;
let seasonalMaterial = null;
let seasonalPoints = null;
let seasonalType = 'spring';

// Tạo texture cho từng mùa bằng HTML5 Canvas thủ tục
const createSeasonTexture = (season) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (season === 'spring') {
        // Cánh hoa anh đào màu hồng phấn mềm mại
        ctx.save();
        ctx.translate(64, 64);
        ctx.beginPath();
        ctx.moveTo(0, -38);
        ctx.bezierCurveTo(28, -38, 38, -10, 24, 25);
        ctx.bezierCurveTo(12, 45, 0, 50, 0, 50);
        ctx.bezierCurveTo(0, 50, -12, 45, -24, 25);
        ctx.bezierCurveTo(-38, -10, -28, -38, 0, -38);
        ctx.closePath();

        const grad = ctx.createRadialGradient(0, -10, 5, 0, 10, 48);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.35, '#ffb7d5');
        grad.addColorStop(0.85, '#ff4fa7');
        grad.addColorStop(1, 'rgba(255, 0, 127, 0.9)');
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(255, 105, 180, 0.8)';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
    } else if (season === 'summer') {
        // Đom đóm vũ trụ phát quang ngọc bích / hoàng kim
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 58);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.2, '#70ff94');
        grad.addColorStop(0.55, '#00e5ff');
        grad.addColorStop(0.85, 'rgba(0, 229, 255, 0.35)');
        grad.addColorStop(1, 'rgba(0, 255, 140, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(64, 64, 60, 0, Math.PI * 2);
        ctx.fill();
    } else if (season === 'autumn') {
        // Chiếc lá phong vàng kim / đỏ cam ánh sáng
        ctx.save();
        ctx.translate(64, 64);
        ctx.beginPath();
        ctx.moveTo(0, -42);
        ctx.lineTo(14, -20);
        ctx.lineTo(38, -26);
        ctx.lineTo(26, -4);
        ctx.lineTo(44, 18);
        ctx.lineTo(18, 16);
        ctx.lineTo(22, 38);
        ctx.lineTo(0, 28);
        ctx.lineTo(-22, 38);
        ctx.lineTo(-18, 16);
        ctx.lineTo(-44, 18);
        ctx.lineTo(-26, -4);
        ctx.lineTo(-38, -26);
        ctx.lineTo(-14, -20);
        ctx.closePath();

        const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 45);
        grad.addColorStop(0, '#fff3a8');
        grad.addColorStop(0.4, '#ff9900');
        grad.addColorStop(0.85, '#e62200');
        grad.addColorStop(1, 'rgba(230, 34, 0, 0.9)');
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(255, 140, 0, 0.85)';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
    } else if (season === 'winter') {
        // Tinh thể bông tuyết pha lê 6 cánh phát sáng lung linh
        ctx.save();
        ctx.translate(64, 64);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = 'rgba(150, 230, 255, 0.95)';
        ctx.shadowBlur = 14;

        for (let i = 0; i < 6; i++) {
            ctx.rotate(Math.PI / 3);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -44);
            // Nhánh phụ 1
            ctx.moveTo(0, -22);
            ctx.lineTo(14, -32);
            ctx.moveTo(0, -22);
            ctx.lineTo(-14, -32);
            // Nhánh phụ 2
            ctx.moveTo(0, -34);
            ctx.lineTo(10, -42);
            ctx.moveTo(0, -34);
            ctx.lineTo(-10, -42);
            ctx.stroke();
        }

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
};

const setCosmicSeason = (seasonKey) => {
    seasonalType = seasonKey;
    fxConfig.cosmicSeason = seasonKey;

    while (cosmicSeasonsGroup.children.length > 0) {
        const obj = cosmicSeasonsGroup.children[0];
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (obj.material.map) obj.material.map.dispose();
            obj.material.dispose();
        }
        cosmicSeasonsGroup.remove(obj);
    }
    seasonalParticles = [];

    if (seasonKey === 'none') {
        return;
    }

    let count = 650;
    let size = 0.18;
    if (seasonKey === 'summer') { count = 450; size = 0.22; }
    if (seasonKey === 'autumn') { count = 550; size = 0.20; }
    if (seasonKey === 'winter') { count = 800; size = 0.16; }

    seasonalGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const radius = 2.5 + Math.random() * 12.5;
        const angle = Math.random() * Math.PI * 2;
        const y = (Math.random() - 0.5) * 10 + 2.0;

        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 1] = y;
        positions[i3 + 2] = Math.sin(angle) * radius;

        colors[i3] = 1.0;
        colors[i3 + 1] = 1.0;
        colors[i3 + 2] = 1.0;

        seasonalParticles.push({
            radius: radius,
            angle: angle,
            speed: (0.15 + Math.random() * 0.45) * (Math.random() > 0.4 ? 1 : -1),
            verticalSpeed: 0.15 + Math.random() * 0.45,
            wobbleSpeed: 1.0 + Math.random() * 3.0,
            wobbleOffset: Math.random() * Math.PI * 2,
            wobbleAmp: 0.08 + Math.random() * 0.18,
            blinkSpeed: 1.5 + Math.random() * 4.0,
            y: y
        });
    }

    seasonalGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    seasonalGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const tex = createSeasonTexture(seasonKey);
    seasonalMaterial = new THREE.PointsMaterial({
        size: size,
        map: tex,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    seasonalPoints = new THREE.Points(seasonalGeometry, seasonalMaterial);
    cosmicSeasonsGroup.add(seasonalPoints);
};

setCosmicSeason(fxConfig.cosmicSeason || 'spring');

/**
 * =========================================================================
 * 8.5 SUPERNOVA LOVE BURST ENGINE (Siêu Tân Tinh Bùng Nổ Tình Yêu)
 * =========================================================================
 */
let isSupernovaRunning = false;
let supernovaState = 'idle'; // 'implosion' | 'explosion' | 'rebirth'
let supernovaTimer = 0;

// Shockwave Ring 3D
const shockwaveGeom = new THREE.RingGeometry(0.1, 0.45, 64);
const shockwaveMat = new THREE.MeshBasicMaterial({
    color: 0xff00aa,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});
const supernovaShockwave = new THREE.Mesh(shockwaveGeom, shockwaveMat);
supernovaShockwave.position.set(0, 2.4, 0);
supernovaShockwave.rotation.x = Math.PI / 2;
scene.add(supernovaShockwave);

// Supernova Explosion Particles
const supernovaParticleCount = 4500;
const supernovaGeom = new THREE.BufferGeometry();
const supernovaPositions = new Float32Array(supernovaParticleCount * 3);
const supernovaColors = new Float32Array(supernovaParticleCount * 3);
const supernovaVelocities = [];

for (let i = 0; i < supernovaParticleCount; i++) {
    supernovaPositions[i * 3] = 0;
    supernovaPositions[i * 3 + 1] = 2.4;
    supernovaPositions[i * 3 + 2] = 0;

    supernovaColors[i * 3] = 1;
    supernovaColors[i * 3 + 1] = 0.2;
    supernovaColors[i * 3 + 2] = 0.8;

    supernovaVelocities.push({
        vx: 0, vy: 0, vz: 0,
        drag: 0.965,
        life: 0,
        maxLife: 1
    });
}

supernovaGeom.setAttribute('position', new THREE.BufferAttribute(supernovaPositions, 3));
supernovaGeom.setAttribute('color', new THREE.BufferAttribute(supernovaColors, 3));

const supernovaMat = new THREE.PointsMaterial({
    size: 0.035,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
});

const supernovaPoints = new THREE.Points(supernovaGeom, supernovaMat);
scene.add(supernovaPoints);

// Âm thanh Siêu Tân Tinh (Implosion Sweep + Detonation Boom)
const playSupernovaImplosionSound = () => {
    if (isSoundMuted || !fxConfig.soundFx) return;
    initSFXContext();
    if (!sfxAudioCtx) return;
    try {
        const now = sfxAudioCtx.currentTime;
        const osc = sfxAudioCtx.createOscillator();
        const gain = sfxAudioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 1.25);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.45, now + 0.9);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
        osc.connect(gain);
        gain.connect(sfxAudioCtx.destination);
        osc.start(now);
        osc.stop(now + 1.35);
    } catch (e) {}
};

const playSupernovaDetonationSound = () => {
    if (isSoundMuted || !fxConfig.soundFx) return;
    initSFXContext();
    if (!sfxAudioCtx) return;
    try {
        const now = sfxAudioCtx.currentTime;
        
        // Deep sub boom
        const osc = sfxAudioCtx.createOscillator();
        const gain = sfxAudioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(95, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + 1.8);
        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
        osc.connect(gain);
        gain.connect(sfxAudioCtx.destination);
        osc.start(now);
        osc.stop(now + 2.3);

        // Sparkle arpeggio
        [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00].forEach((freq, idx) => {
            const sOsc = sfxAudioCtx.createOscillator();
            const sGain = sfxAudioCtx.createGain();
            sOsc.type = 'triangle';
            sOsc.frequency.setValueAtTime(freq, now + idx * 0.09);
            sGain.gain.setValueAtTime(0.28, now + idx * 0.09);
            sGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.9);
            sOsc.connect(sGain);
            sGain.connect(sfxAudioCtx.destination);
            sOsc.start(now + idx * 0.09);
            sOsc.stop(now + idx * 0.09 + 1.0);
        });
    } catch (e) {}
};

const triggerSupernovaLoveBurst = () => {
    if (isSupernovaRunning) return;
    isSupernovaRunning = true;
    supernovaState = 'implosion';
    supernovaTimer = 0;

    playSupernovaImplosionSound();

    // Rung lắc màn hình
    const appEl = document.getElementById('app');
    if (appEl) {
        appEl.classList.remove('screen-shake');
        void appEl.offsetWidth;
        appEl.classList.add('screen-shake');
    }
};

/**
 * =========================================================================
 * 9. CINEMA TOUR & SMOOTH RESET CONTROLLER
 * =========================================================================
 */
let isCinemaMode = false;
let isResettingView = false;
const defaultCameraPos = (window.innerWidth < window.innerHeight)
    ? new THREE.Vector3(0, 2.8, 8.8)
    : new THREE.Vector3(0, 2.5, 7.2);
const defaultTarget = new THREE.Vector3(0, 1.35, 0);

controls.addEventListener('start', () => {
    isResettingView = false;
    // Giữ nguyên Cinema Mode khi chạm/click vào màn hình
});

/**
 * =========================================================================
 * 10. AUDIO BACKGROUND & AUDIO VISUALIZER (Thư mục Audio & Playlist)
 * =========================================================================
 */
const defaultPlaylist = [
    {
        id: 'why-not-me',
        title: 'Why Not Me',
        artist: 'Enrique Iglesias',
        src: '/audio/why-not-me.mp3',
        sourceType: 'local'
    },
    {
        id: 'melody-of-universe',
        title: 'Melody of Universe',
        artist: 'Galaxy Ambient & Love',
        src: '/audio/music.mp3',
        sourceType: 'local'
    }
];

let localPlaylist = [...defaultPlaylist];
let currentTrackIndex = 0;
let isShuffleMode = false;
let isLoopMode = true;
let isPlayerSeeking = false;

const bgMusic = new Audio(localPlaylist[0].src);
bgMusic.loop = false;
bgMusic.volume = 0.65;
let musicStarted = false;

let audioContext = null;
let analyser = null;
let audioDataArray = null;

let ytPlayer = null;
let isUsingYouTube = false;
let isYTMuted = false;

const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

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

const updatePlayerUIState = () => {
    const disc = document.getElementById('player-disc');
    const playBtn = document.getElementById('btn-player-play');
    const isPlaying = isUsingYouTube 
        ? (ytPlayer && ytPlayer.getPlayerState && ytPlayer.getPlayerState() === 1) 
        : (!bgMusic.paused && !bgMusic.ended);

    if (disc) {
        if (isPlaying) {
            disc.classList.remove('paused');
        } else {
            disc.classList.add('paused');
        }
    }

    if (playBtn) {
        playBtn.innerText = isPlaying ? '⏸️' : '▶️';
    }

    // Cập nhật equalizer animation trên playlist item
    document.querySelectorAll('.playlist-item').forEach((item, idx) => {
        if (idx === currentTrackIndex && !isUsingYouTube) {
            item.classList.add('active');
            if (isPlaying) {
                item.classList.add('playing');
            } else {
                item.classList.remove('playing');
            }
        } else {
            item.classList.remove('active', 'playing');
        }
    });
};

const updateNowPlayingCard = () => {
    const titleEl = document.getElementById('player-current-title');
    const artistEl = document.getElementById('player-current-artist');
    const badgeEl = document.getElementById('player-status-badge');
    const countEl = document.getElementById('local-song-count');

    if (countEl) countEl.innerText = localPlaylist.length;

    if (isUsingYouTube) {
        if (titleEl) titleEl.innerText = 'YouTube Audio Stream';
        if (artistEl) artistEl.innerText = 'Đang phát trực tuyến từ YouTube';
        if (badgeEl) {
            badgeEl.innerText = '📺 YouTube';
            badgeEl.className = 'player-badge live';
        }
    } else {
        const cur = localPlaylist[currentTrackIndex] || defaultPlaylist[0];
        if (titleEl) titleEl.innerText = cur.title;
        if (artistEl) artistEl.innerText = `${cur.artist} • ${cur.src.startsWith('blob:') ? 'Tệp người dùng' : cur.src}`;
        if (badgeEl) {
            badgeEl.innerText = '🎵 Local Audio';
            badgeEl.className = 'player-badge live';
        }
    }
    updatePlayerUIState();
};

const renderLocalPlaylist = () => {
    const listEl = document.getElementById('local-playlist-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    localPlaylist.forEach((track, index) => {
        const item = document.createElement('div');
        item.className = `playlist-item ${index === currentTrackIndex && !isUsingYouTube ? 'active' : ''}`;
        item.innerHTML = `
            <span class="playlist-track-num">${index + 1}</span>
            <div class="playlist-track-info">
                <div class="playlist-track-title">${track.title}</div>
                <div class="playlist-track-meta">${track.artist}</div>
            </div>
            <div class="playlist-playing-bars">
                <span class="eq-bar"></span>
                <span class="eq-bar"></span>
                <span class="eq-bar"></span>
            </div>
            <span class="playlist-play-icon">${index === currentTrackIndex && !isUsingYouTube && !bgMusic.paused ? '🔊' : '▶'}</span>
        `;

        item.addEventListener('click', (e) => {
            e.stopPropagation();
            playLocalTrack(index);
        });

        listEl.appendChild(item);
    });
};

const playLocalTrack = (index) => {
    if (index < 0 || index >= localPlaylist.length) return;
    currentTrackIndex = index;
    isUsingYouTube = false;
    if (ytPlayer && ytPlayer.pauseVideo) {
        ytPlayer.pauseVideo();
    }

    const track = localPlaylist[currentTrackIndex];
    bgMusic.src = track.src;
    bgMusic.currentTime = 0;
    bgMusic.muted = isSoundMuted;

    initAudioAnalyser();
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }

    bgMusic.play().then(() => {
        musicStarted = true;
        updateMusicButtonState(isSoundMuted);
        updateNowPlayingCard();
        renderLocalPlaylist();
    }).catch(() => {
        updateNowPlayingCard();
        renderLocalPlaylist();
    });
};

const nextTrack = () => {
    if (isUsingYouTube) return;
    if (isShuffleMode && localPlaylist.length > 1) {
        let randIdx = currentTrackIndex;
        while (randIdx === currentTrackIndex) {
            randIdx = Math.floor(Math.random() * localPlaylist.length);
        }
        playLocalTrack(randIdx);
    } else {
        const nextIdx = (currentTrackIndex + 1) % localPlaylist.length;
        playLocalTrack(nextIdx);
    }
};

const prevTrack = () => {
    if (isUsingYouTube) return;
    if (bgMusic.currentTime > 3) {
        bgMusic.currentTime = 0;
        return;
    }
    const prevIdx = (currentTrackIndex - 1 + localPlaylist.length) % localPlaylist.length;
    playLocalTrack(prevIdx);
};

const togglePlayPause = () => {
    if (isUsingYouTube) {
        if (ytPlayer) {
            const state = ytPlayer.getPlayerState ? ytPlayer.getPlayerState() : -1;
            if (state === 1) {
                ytPlayer.pauseVideo();
            } else {
                ytPlayer.playVideo();
            }
            setTimeout(updatePlayerUIState, 300);
        }
    } else {
        if (bgMusic.paused) {
            startMusic();
        } else {
            bgMusic.pause();
        }
        setTimeout(updatePlayerUIState, 100);
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
        updateNowPlayingCard();

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
                        updatePlayerUIState();
                    },
                    onStateChange: (event) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            event.target.playVideo();
                        }
                        updatePlayerUIState();
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
            updatePlayerUIState();
        }
    });
};

const switchToDefaultMusic = () => {
    isUsingYouTube = false;
    if (ytPlayer && ytPlayer.pauseVideo) {
        ytPlayer.pauseVideo();
    }
    playLocalTrack(0);
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
            updatePlayerUIState();
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
        updateNowPlayingCard();
    }).catch(() => {});
};

// Event listeners cho bgMusic
bgMusic.addEventListener('play', updatePlayerUIState);
bgMusic.addEventListener('pause', updatePlayerUIState);
bgMusic.addEventListener('ended', () => {
    if (isLoopMode) {
        nextTrack();
    } else {
        updatePlayerUIState();
    }
});

bgMusic.addEventListener('timeupdate', () => {
    if (isPlayerSeeking) return;
    const curTimeEl = document.getElementById('player-current-time');
    const durTimeEl = document.getElementById('player-duration-time');
    const progressBar = document.getElementById('player-progress-bar');

    if (curTimeEl) curTimeEl.innerText = formatTime(bgMusic.currentTime);
    if (durTimeEl && bgMusic.duration && !isNaN(bgMusic.duration)) {
        durTimeEl.innerText = formatTime(bgMusic.duration);
    }
    if (progressBar && bgMusic.duration && !isNaN(bgMusic.duration) && bgMusic.duration > 0) {
        progressBar.value = (bgMusic.currentTime / bgMusic.duration) * 100;
    }
});

// Mở khóa âm thanh an toàn và tức thì trên mọi trình duyệt di động (iOS Safari & Chrome Android)
const unlockAudioOnTouch = () => {
    if (!musicStarted && !isSoundMuted) {
        startMusic();
    }
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }
    if (sfxAudioCtx && sfxAudioCtx.state === 'suspended') {
        sfxAudioCtx.resume().catch(() => {});
    }
};

['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'].forEach(evt => {
    window.addEventListener(evt, unlockAudioOnTouch, { passive: true });
});

// Tự động khôi phục AudioContext và nhạc khi người dùng quay lại tab trình duyệt trên điện thoại
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && musicStarted && !isSoundMuted) {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().catch(() => {});
        }
        if (sfxAudioCtx && sfxAudioCtx.state === 'suspended') {
            sfxAudioCtx.resume().catch(() => {});
        }
        if (bgMusic.paused && !isUsingYouTube) {
            bgMusic.play().catch(() => {});
        }
    }
});

/**
 * =========================================================================
 * 10.1 MAGIC FAIRY DUST TRAIL (Vệt bụi sao ma thuật theo chuột & ngón tay)
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

const spawnFairyDustAt = (clientX, clientY) => {
    if (!fairyCtx || !fxConfig.fairyDust) return;
    const now = performance.now();
    if (now - lastFairyTime < 28 || fairyDust.length > 25) return;
    lastFairyTime = now;

    const theme = colorThemes[currentThemeIndex];
    fairyDust.push({
        x: clientX + (Math.random() - 0.5) * 8,
        y: clientY + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8 - 0.3,
        size: 11 + Math.random() * 6,
        alpha: 1.0,
        decay: 0.025 + Math.random() * 0.02,
        symbol: ['✨', '⭐', '💖', '🌟'][Math.floor(Math.random() * 4)],
        color: theme.heartGlow
    });
};

window.addEventListener('pointermove', (e) => {
    spawnFairyDustAt(e.clientX, e.clientY);
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
        spawnFairyDustAt(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: true });

window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
        spawnFairyDustAt(e.touches[0].clientX, e.touches[0].clientY);
    }
}, { passive: true });

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
    } else if (e.code === 'KeyW') {
        triggerWormhole();
    } else if (e.code === 'KeyB' || e.code === 'KeyX') {
        triggerSupernovaLoveBurst();
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
    if (document.hidden) {
        // Tự động tạm dừng render khi người dùng ẩn tab/khóa máy để tiết kiệm 100% pin & GPU
        window.requestAnimationFrame(tick);
        return;
    }

    const delta = Math.min(0.1, clock.getDelta());
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

    // 0.4 Cập nhật Cổng Dịch Chuyển Wormhole (Cinematic Smooth Flight & FOV Interpolation)
    if (isWarping && warpFlightCurve) {
        warpProgress += delta * 0.30;
        const p = Math.min(1.0, Math.max(0.0, warpProgress));
        // S-curve EaseInOut for hyper-smooth speed profile
        const easeT = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

        if (typeof portalRingMesh !== 'undefined' && typeof portalRingMesh2 !== 'undefined' && typeof portalDisk1 !== 'undefined') {
            const spinMult = 1.0 + Math.sin(easeT * Math.PI) * 2.5;
            portalRingMesh.rotation.z -= delta * 5.0 * spinMult;
            portalRingMesh2.rotation.z += delta * 4.0 * spinMult;
            portalDisk1.material.rotation += delta * 3.5 * spinMult;
        }

        // Warp stars particle motion & opacity
        if (warpStarsMesh && warpStarsMesh.geometry) {
            const posAttr = warpStarsMesh.geometry.attributes.position;
            const starSpeed = (0.8 + Math.sin(easeT * Math.PI) * 4.2);
            for (let i = 0; i < warpStarCount; i++) {
                const i6 = i * 6;
                posAttr.array[i6 + 2] += starSpeed;
                posAttr.array[i6 + 5] += starSpeed;
                if (posAttr.array[i6 + 2] > 16) {
                    posAttr.array[i6 + 2] -= 32;
                    posAttr.array[i6 + 5] -= 32;
                }
            }
            posAttr.needsUpdate = true;
            if (warpStarMat) {
                warpStarMat.opacity = Math.sin(easeT * Math.PI) * 0.95;
            }
        }

        // Camera position along curve
        const currentCamPos = warpFlightCurve.getPointAt(easeT);
        camera.position.copy(currentCamPos);

        // Dynamic forward-facing camera look target
        if (easeT < 0.72) {
            const forwardT = Math.min(1.0, easeT + 0.08);
            const forwardLook = warpFlightCurve.getPointAt(forwardT);
            controls.target.lerp(forwardLook, 0.22);
        } else {
            const returnP = (easeT - 0.72) / 0.28;
            controls.target.lerp(defaultTarget, returnP * 0.15 + 0.08);
        }
        camera.lookAt(controls.target);

        // Smooth cinematic FOV breathing (no sudden jumps!)
        const fovSpread = Math.sin(easeT * Math.PI) * 26.0;
        camera.fov = 75 + fovSpread;
        camera.updateProjectionMatrix();

        // Portal scale expansion & collapse
        if (easeT < 0.55) {
            const pScale = Math.sin((easeT / 0.55) * Math.PI * 0.5) * 2.2;
            wormholePortalGroup.scale.set(pScale, pScale, pScale);
        } else {
            const shrinkRatio = Math.max(0, (1.0 - (easeT - 0.55) / 0.45));
            const pScale = shrinkRatio * 2.2;
            wormholePortalGroup.scale.set(pScale, pScale, pScale);
        }

        // Event Horizon flash trigger (clean 1-time trigger)
        if (easeT >= 0.44 && easeT <= 0.54) {
            const flashEl = document.getElementById('wormhole-flash');
            if (flashEl && !flashEl.classList.contains('active')) {
                flashEl.classList.add('active');
                setTimeout(() => flashEl.classList.remove('active'), 600);
            }
        }

        if (warpProgress >= 1.0) {
            isWarping = false;
            wormholePortalGroup.visible = false;
            warpStarsGroup.visible = false;
            warpFlightCurve = null;

            controls.enabled = true;
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

    // 2. Rotate & Realistic Double Heartbeat Pulse (Nhịp đập "Thình... Thịch" sống động như hơi thở thật)
    if (heartPoints) {
        heartPoints.rotation.y = elapsedTime * 0.08;

        // Xoay nhẹ các dải lụa năng lượng ôm quanh tim
        heartPoints.children.forEach(child => {
            if (child.isMesh && child.userData && child.userData.speed) {
                child.rotation.z += child.userData.speed * delta;
            }
        });

        // Nhịp tim đập đôi chân thực (Lub-Dub Heartbeat Rhythm)
        const heartRate = 1.25; // ~75 nhịp/phút
        const cycle = (elapsedTime * heartRate) % 1.0;
        let heartBeat = 0;
        if (cycle < 0.14) {
            // Lub (Co bóp chính mạnh mẽ, ấm áp)
            heartBeat = Math.sin((cycle / 0.14) * Math.PI) * 0.095;
        } else if (cycle > 0.18 && cycle < 0.32) {
            // Dub (Co bóp phụ tiếp nối)
            heartBeat = Math.sin(((cycle - 0.18) / 0.14) * Math.PI) * 0.048;
        } else {
            // Nhịp thở êm đềm giữa các chu kỳ
            heartBeat = Math.sin(cycle * Math.PI * 2) * 0.012;
        }

        const bassAdd = smoothedBass * 0.11;
        const targetScale = 1.0 + heartBeat + bassAdd;

        currentHeartScale += (targetScale - currentHeartScale) * 0.14;
        if (!isSupernovaRunning) {
            heartPoints.scale.set(currentHeartScale, currentHeartScale, currentHeartScale);
        }
    }

    // 2.1 Xoay Vành đai
    if (heartRingPoints) {
        heartRingPoints.rotation.y = elapsedTime * 0.05;
        const ringTarget = 1.0 + (currentHeartScale - 1.0) * 0.5;
        currentRingScale += (ringTarget - currentRingScale) * 0.08;
        if (!isSupernovaRunning) {
            heartRingPoints.scale.set(currentRingScale, currentRingScale, currentRingScale);
        }
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

    // 6.5 Saturn Rings Smooth Rotation (Không đập theo nhạc)
    if (fxConfig.showSaturnRings !== false && saturnMainGroup) {
        const saturnSpeed = (typeof fxConfig.saturnSpeed === 'number') ? fxConfig.saturnSpeed : 0.08;
        saturnMainGroup.rotation.y += saturnSpeed * delta;
    }

    // 6.6 Cosmic Seasons Simulation (Bốn Mùa Thiên Hà)
    if (seasonalPoints && seasonalParticles.length > 0 && fxConfig.cosmicSeason !== 'none') {
        const posAttr = seasonalGeometry.attributes.position;
        const count = seasonalParticles.length;

        for (let i = 0; i < count; i++) {
            const p = seasonalParticles[i];
            p.angle += p.speed * delta * 0.4;
            
            if (seasonalType === 'spring') {
                // Cánh hoa anh đào lượn sóng và rơi chầm chậm
                p.y -= p.verticalSpeed * delta * 0.75;
                const wobble = Math.sin(elapsedTime * p.wobbleSpeed + p.wobbleOffset) * p.wobbleAmp;
                const r = p.radius + wobble;
                posAttr.setXYZ(i, Math.cos(p.angle) * r, p.y, Math.sin(p.angle) * r);
                if (p.y < -3.5) p.y = 8.5;
            } else if (seasonalType === 'summer') {
                // Đom đóm dập dờn 3D
                const wobbleY = Math.sin(elapsedTime * p.wobbleSpeed + p.wobbleOffset) * 0.02;
                p.y += wobbleY;
                const r = p.radius + Math.cos(elapsedTime * p.blinkSpeed + p.wobbleOffset) * 0.15;
                posAttr.setXYZ(i, Math.cos(p.angle) * r, p.y, Math.sin(p.angle) * r);
                if (p.y < -2.0) p.y = 7.0;
                if (p.y > 7.5) p.y = -1.5;
            } else if (seasonalType === 'autumn') {
                // Lá phong xoay và rơi cuốn theo gió thu
                p.y -= p.verticalSpeed * delta * 0.85;
                const r = p.radius + Math.sin(elapsedTime * 2.5 + p.wobbleOffset) * 0.25;
                posAttr.setXYZ(i, Math.cos(p.angle) * r, p.y, Math.sin(p.angle) * r);
                if (p.y < -3.5) p.y = 8.5;
            } else if (seasonalType === 'winter') {
                // Bông tuyết pha lê rơi thẳng đều lấp lánh
                p.y -= p.verticalSpeed * delta * 0.9;
                const r = p.radius + Math.sin(elapsedTime * 1.5 + p.wobbleOffset) * 0.08;
                posAttr.setXYZ(i, Math.cos(p.angle) * r, p.y, Math.sin(p.angle) * r);
                if (p.y < -4.0) p.y = 9.0;
            }
        }
        posAttr.needsUpdate = true;
    }

    // 6.7 Supernova Love Burst Physics Simulation
    if (isSupernovaRunning) {
        supernovaTimer += delta;

        if (supernovaState === 'implosion') {
            // Giai đoạn 1: Hút toàn bộ vào tâm (0 -> 1.3s)
            const progress = Math.min(1.0, supernovaTimer / 1.3);
            const scaleDown = 1.0 - Math.pow(progress, 2.5) * 0.92;

            if (heartPoints) heartPoints.scale.set(scaleDown, scaleDown, scaleDown);
            if (heartRingPoints) heartRingPoints.scale.set(scaleDown, scaleDown, scaleDown);
            if (galaxyPoints) galaxyPoints.scale.set(scaleDown, scaleDown, scaleDown);
            if (saturnMainGroup) saturnMainGroup.scale.set(scaleDown, scaleDown, scaleDown);
            if (audioVisualizerGroup) audioVisualizerGroup.scale.set(scaleDown, scaleDown, scaleDown);
            if (textSprite) textSprite.scale.set(3.6 * scaleDown, 0.9 * scaleDown, 1 * scaleDown);

            if (supernovaShockwave) {
                supernovaShockwave.material.opacity = progress * 0.8;
                supernovaShockwave.scale.set(1.0 - progress * 0.7, 1.0 - progress * 0.7, 1.0);
            }

            if (supernovaTimer >= 1.3) {
                // CHUYỂN SANG BÙNG NỔ!
                supernovaState = 'explosion';
                supernovaTimer = 0;

                playSupernovaDetonationSound();

                // Flash & Heavy Screen Shake on Detonation
                const flashEl = document.getElementById('supernova-flash');
                if (flashEl) {
                    flashEl.classList.remove('fade-out');
                    flashEl.classList.add('active');
                    setTimeout(() => {
                        flashEl.classList.remove('active');
                        flashEl.classList.add('fade-out');
                    }, 200);
                }
                const appEl = document.getElementById('app');
                if (appEl) {
                    appEl.classList.remove('screen-shake');
                    void appEl.offsetWidth;
                    appEl.classList.add('screen-shake');
                }

                // Kích nổ 4.500 hạt Siêu Tân Tinh
                supernovaMat.opacity = 1.0;
                const posAttr = supernovaGeom.attributes.position;
                const colAttr = supernovaGeom.attributes.color;

                for (let i = 0; i < supernovaParticleCount; i++) {
                    const i3 = i * 3;
                    posAttr.setXYZ(i, 0, 2.4, 0);

                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos((Math.random() * 2) - 1);
                    const speed = 7.0 + Math.random() * 22.0;

                    supernovaVelocities[i] = {
                        vx: Math.sin(phi) * Math.cos(theta) * speed,
                        vy: Math.sin(phi) * Math.sin(theta) * speed * 0.85 + (Math.random() - 0.2) * 4.0,
                        vz: Math.cos(phi) * speed,
                        drag: 0.955 + Math.random() * 0.025,
                        life: 1.0,
                        maxLife: 2.5 + Math.random() * 2.5
                    };

                    const colorChoice = Math.random();
                    if (colorChoice < 0.35) {
                        colAttr.setXYZ(i, 1.0, 0.0, 0.5); // Neon Pink
                    } else if (colorChoice < 0.65) {
                        colAttr.setXYZ(i, 1.0, 0.85, 0.0); // Gold
                    } else if (colorChoice < 0.85) {
                        colAttr.setXYZ(i, 0.0, 0.95, 1.0); // Cyan
                    } else {
                        colAttr.setXYZ(i, 1.0, 1.0, 1.0); // Pure Light
                    }
                }
                posAttr.needsUpdate = true;
                colAttr.needsUpdate = true;

                // Tăng Bloom rực rỡ
                if (bloomPass) bloomPass.strength = 2.8;
            }
        } else if (supernovaState === 'explosion') {
            // Giai đoạn 2: Bùng nổ hạt & lan tỏa sóng xung kích (0 -> 3.2s)
            const explMinScale = 0.001;
            if (heartPoints) heartPoints.scale.set(explMinScale, explMinScale, explMinScale);
            if (heartRingPoints) heartRingPoints.scale.set(explMinScale, explMinScale, explMinScale);
            if (galaxyPoints) galaxyPoints.scale.set(explMinScale, explMinScale, explMinScale);
            if (saturnMainGroup) saturnMainGroup.scale.set(explMinScale, explMinScale, explMinScale);
            if (audioVisualizerGroup) audioVisualizerGroup.scale.set(explMinScale, explMinScale, explMinScale);
            if (textSprite) textSprite.scale.set(3.6 * explMinScale, 0.9 * explMinScale, 1 * explMinScale);

            const posAttr = supernovaGeom.attributes.position;

            for (let i = 0; i < supernovaParticleCount; i++) {
                const v = supernovaVelocities[i];
                if (v.life > 0) {
                    posAttr.setXYZ(
                        i,
                        posAttr.getX(i) + v.vx * delta,
                        posAttr.getY(i) + v.vy * delta,
                        posAttr.getZ(i) + v.vz * delta
                    );
                    v.vx *= v.drag;
                    v.vy *= v.drag;
                    v.vz *= v.drag;
                    v.life -= delta / v.maxLife;
                }
            }
            posAttr.needsUpdate = true;

            // Mở rộng shockwave ring
            if (supernovaShockwave) {
                const shockScale = 1.0 + supernovaTimer * 28.0;
                supernovaShockwave.scale.set(shockScale, shockScale, shockScale);
                supernovaShockwave.material.opacity = Math.max(0, 1.0 - supernovaTimer / 2.2);
            }

            // Hồi phục dần độ sáng bloom
            if (bloomPass && bloomPass.strength > 0.85) {
                bloomPass.strength -= delta * 0.65;
            }

            if (supernovaTimer >= 3.2) {
                supernovaState = 'rebirth';
                supernovaTimer = 0;
            }
        } else if (supernovaState === 'rebirth') {
            // Giai đoạn 3: Tái sinh & Trở về trạng thái thanh bình (0 -> 2.0s)
            const rebProgress = Math.min(1.0, supernovaTimer / 1.8);
            const smoothScale = 0.08 + (1.0 - 0.08) * Math.sin(rebProgress * Math.PI * 0.5);

            if (heartPoints) heartPoints.scale.set(smoothScale, smoothScale, smoothScale);
            if (heartRingPoints) heartRingPoints.scale.set(smoothScale, smoothScale, smoothScale);
            if (galaxyPoints) galaxyPoints.scale.set(smoothScale, smoothScale, smoothScale);
            if (saturnMainGroup) saturnMainGroup.scale.set(smoothScale, smoothScale, smoothScale);
            if (audioVisualizerGroup) audioVisualizerGroup.scale.set(smoothScale, smoothScale, smoothScale);
            if (textSprite) textSprite.scale.set(3.6 * smoothScale, 0.9 * smoothScale, 1 * smoothScale);

            supernovaMat.opacity = Math.max(0, 1.0 - rebProgress);

            if (supernovaTimer >= 1.8) {
                isSupernovaRunning = false;
                supernovaState = 'idle';
                supernovaMat.opacity = 0;
                if (supernovaShockwave) supernovaShockwave.material.opacity = 0;

                if (heartPoints) heartPoints.scale.set(1, 1, 1);
                if (heartRingPoints) heartRingPoints.scale.set(1, 1, 1);
                if (galaxyPoints) galaxyPoints.scale.set(1, 1, 1);
                if (saturnMainGroup) saturnMainGroup.scale.set(1, 1, 1);
                if (audioVisualizerGroup) audioVisualizerGroup.scale.set(1, 1, 1);
                if (textSprite) textSprite.scale.set(3.6, 0.9, 1);
                playSparkleChime();
            }
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

    if (!isCinemaMode && !isWarping) {
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
const btnSeason = document.getElementById('btn-season');
const btnSupernova = document.getElementById('btn-supernova');
const selectCosmicSeason = document.getElementById('select-cosmic-season');
const btnTriggerSupernovaSettings = document.getElementById('btn-trigger-supernova-settings');
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

const seasonOrder = ['spring', 'summer', 'autumn', 'winter', 'none'];
const seasonIcons = { spring: '🌸', summer: '🌌', autumn: '🍂', winter: '❄️', none: '✨' };

const updateSeasonButtonUI = () => {
    if (btnSeason) {
        btnSeason.textContent = seasonIcons[fxConfig.cosmicSeason] || '🌸';
    }
};
updateSeasonButtonUI();

if (btnSeason) {
    btnSeason.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentIdx = seasonOrder.indexOf(fxConfig.cosmicSeason || 'spring');
        const nextSeason = seasonOrder[(currentIdx + 1) % seasonOrder.length];
        setCosmicSeason(nextSeason);
        updateSeasonButtonUI();
        if (selectCosmicSeason) selectCosmicSeason.value = nextSeason;
        try {
            localStorage.setItem('galaxy_fx_config', JSON.stringify(fxConfig));
        } catch (err) {}
        playSparkleChime();
    });
}

if (btnSupernova) {
    btnSupernova.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerSupernovaLoveBurst();
    });
}

if (btnTriggerSupernovaSettings) {
    btnTriggerSupernovaSettings.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsModal?.classList.remove('show');
        triggerSupernovaLoveBurst();
    });
}

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
    if (selectCosmicSeason) selectCosmicSeason.value = fxConfig.cosmicSeason || 'spring';
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
        if (selectCosmicSeason) {
            fxConfig.cosmicSeason = selectCosmicSeason.value;
            setCosmicSeason(fxConfig.cosmicSeason);
            updateSeasonButtonUI();
        }
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

    [selectCosmicSeason, toggleShowGalaxy, toggleShowHeart, toggleShowHeartRing, toggleShowStarfield, toggleSaturnRings, toggleAutoFireworks, toggleAutoMeteors, toggleFrequentComets, toggleFairyDust, toggleShowPhotos, toggleShowConstellations, toggleShowSpaceIcons, toggleAudioVisualizer, toggleSoundFx, selectRotationSpeed].forEach(el => {
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
// 0.1 Nút & Modal Cài Đặt Vòng Đai Sao Thổ 3D (Saturn Rings)
const btnSaturnRing = document.getElementById('btn-saturn-ring');
const saturnModal = document.getElementById('saturn-modal');
const toggleSaturnEnabledTab = document.getElementById('toggle-saturn-enabled-tab');
const selectSaturnTheme = document.getElementById('select-saturn-theme');
const selectSaturnSpeed = document.getElementById('select-saturn-speed');
const selectSaturnTilt = document.getElementById('select-saturn-tilt');
const btnSaveSaturnModal = document.getElementById('btn-save-saturn-modal');
const btnCloseSaturnModal = document.getElementById('btn-close-saturn-modal');

const syncSaturnModalSettingsUI = () => {
    if (toggleSaturnEnabledTab) toggleSaturnEnabledTab.checked = (fxConfig.showSaturnRings !== false);
    if (selectSaturnTheme) selectSaturnTheme.value = fxConfig.saturnTheme || 'rainbow';
    if (selectSaturnSpeed) selectSaturnSpeed.value = String(fxConfig.saturnSpeed !== undefined ? fxConfig.saturnSpeed : 0.08);
    if (selectSaturnTilt) selectSaturnTilt.value = fxConfig.saturnTilt || 'saturn';
};

if (btnSaturnRing && saturnModal) {
    btnSaturnRing.addEventListener('click', (e) => {
        e.stopPropagation();
        syncSaturnModalSettingsUI();
        saturnModal.classList.add('show');
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

        saturnModal.classList.remove('show');
        playSparkleChime();
    });
}

if (btnCloseSaturnModal && saturnModal) {
    btnCloseSaturnModal.addEventListener('click', (e) => {
        e.stopPropagation();
        saturnModal.classList.remove('show');
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

// 9. Nút Đổi Nhạc, Trình Phát & Danh Sách Bài Hát
const btnChangeMusic = document.getElementById('btn-change-music');
const musicModal = document.getElementById('music-modal');
const youtubeUrlInput = document.getElementById('youtube-url-input');
const btnPlayYouTube = document.getElementById('btn-play-youtube');
const btnDefaultMusic = document.getElementById('btn-default-music');
const btnCancelMusic = document.getElementById('btn-cancel-music');

const tabBtnLocal = document.getElementById('tab-btn-local');
const tabBtnYt = document.getElementById('tab-btn-yt');
const tabLocalMusic = document.getElementById('tab-local-music');
const tabYtMusic = document.getElementById('tab-youtube-music');

const btnTriggerUploadAudio = document.getElementById('btn-trigger-upload-audio');
const audioUploadInput = document.getElementById('audio-upload-input');

const btnPlayerPlay = document.getElementById('btn-player-play');
const btnPlayerNext = document.getElementById('btn-player-next');
const btnPlayerPrev = document.getElementById('btn-player-prev');
const btnPlayerShuffle = document.getElementById('btn-player-shuffle');
const btnPlayerLoop = document.getElementById('btn-player-loop');
const playerProgressBar = document.getElementById('player-progress-bar');
const playerVolumeSlider = document.getElementById('player-volume-slider');
const playerVolumePercent = document.getElementById('player-volume-percent');

// Khởi tạo hiển thị ban đầu của Playlist và Now Playing Card
renderLocalPlaylist();
updateNowPlayingCard();

if (btnChangeMusic && musicModal) {
    btnChangeMusic.addEventListener('click', (e) => {
        e.stopPropagation();
        renderLocalPlaylist();
        updateNowPlayingCard();
        musicModal.classList.add('show');
    });

    // Chuyển tab giữa Thư Mục Audio và YouTube
    if (tabBtnLocal && tabBtnYt && tabLocalMusic && tabYtMusic) {
        tabBtnLocal.addEventListener('click', (e) => {
            e.stopPropagation();
            tabBtnLocal.classList.add('active');
            tabBtnYt.classList.remove('active');
            tabLocalMusic.classList.add('active');
            tabYtMusic.classList.remove('active');
        });

        tabBtnYt.addEventListener('click', (e) => {
            e.stopPropagation();
            tabBtnYt.classList.add('active');
            tabBtnLocal.classList.remove('active');
            tabYtMusic.classList.add('active');
            tabLocalMusic.classList.remove('active');
        });
    }

    // Tải tệp âm thanh từ máy tính cá nhân
    if (btnTriggerUploadAudio && audioUploadInput) {
        btnTriggerUploadAudio.addEventListener('click', (e) => {
            e.stopPropagation();
            audioUploadInput.click();
        });

        audioUploadInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            let firstNewIndex = -1;
            Array.from(files).forEach((file) => {
                const url = URL.createObjectURL(file);
                const cleanName = file.name.replace(/\.[^/.]+$/, "");
                const newTrack = {
                    id: `user-track-${Date.now()}-${Math.random()}`,
                    title: cleanName,
                    artist: 'Nhạc Tải Lên (Cá Nhân)',
                    src: url,
                    sourceType: 'user'
                };
                localPlaylist.push(newTrack);
                if (firstNewIndex === -1) {
                    firstNewIndex = localPlaylist.length - 1;
                }
            });

            renderLocalPlaylist();
            if (firstNewIndex !== -1) {
                playLocalTrack(firstNewIndex);
            }
            audioUploadInput.value = '';
        });
    }

    // Thanh tua thời gian nhạc (Seek bar)
    if (playerProgressBar) {
        playerProgressBar.addEventListener('input', (e) => {
            isPlayerSeeking = true;
            if (bgMusic.duration && !isNaN(bgMusic.duration)) {
                const curTimeEl = document.getElementById('player-current-time');
                const seekSec = (parseFloat(e.target.value) / 100) * bgMusic.duration;
                if (curTimeEl) curTimeEl.innerText = formatTime(seekSec);
            }
        });

        playerProgressBar.addEventListener('change', (e) => {
            if (bgMusic.duration && !isNaN(bgMusic.duration)) {
                bgMusic.currentTime = (parseFloat(e.target.value) / 100) * bgMusic.duration;
            }
            isPlayerSeeking = false;
        });
    }

    // Nút điều khiển trình phát chính
    if (btnPlayerPlay) {
        btnPlayerPlay.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePlayPause();
        });
    }

    if (btnPlayerNext) {
        btnPlayerNext.addEventListener('click', (e) => {
            e.stopPropagation();
            nextTrack();
        });
    }

    if (btnPlayerPrev) {
        btnPlayerPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            prevTrack();
        });
    }

    if (btnPlayerShuffle) {
        btnPlayerShuffle.addEventListener('click', (e) => {
            e.stopPropagation();
            isShuffleMode = !isShuffleMode;
            btnPlayerShuffle.classList.toggle('active', isShuffleMode);
        });
    }

    if (btnPlayerLoop) {
        btnPlayerLoop.addEventListener('click', (e) => {
            e.stopPropagation();
            isLoopMode = !isLoopMode;
            btnPlayerLoop.classList.toggle('active', isLoopMode);
        });
    }

    // Thanh chỉnh âm lượng
    if (playerVolumeSlider) {
        playerVolumeSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            bgMusic.volume = val;
            if (playerVolumePercent) {
                playerVolumePercent.innerText = `${Math.round(val * 100)}%`;
            }
            if (ytPlayer && ytPlayer.setVolume) {
                ytPlayer.setVolume(Math.round(val * 100));
            }
        });
    }

    // Preset buttons YouTube
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

    if (btnPlayYouTube) {
        btnPlayYouTube.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = youtubeUrlInput ? youtubeUrlInput.value.trim() : '';
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
    }

    if (btnDefaultMusic) {
        btnDefaultMusic.addEventListener('click', (e) => {
            e.stopPropagation();
            try {
                localStorage.removeItem('galaxy_yt_music');
            } catch (err) {}
            switchToDefaultMusic();
        });
    }

    if (btnCancelMusic) {
        btnCancelMusic.addEventListener('click', (e) => {
            e.stopPropagation();
            musicModal.classList.remove('show');
        });
    }

    if (youtubeUrlInput) {
        youtubeUrlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                btnPlayYouTube?.click();
            }
        });
    }
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

// 11.1 Nút Chế Độ Toàn Màn Hình (Fullscreen)
const btnFullscreen = document.getElementById('btn-fullscreen');
if (btnFullscreen) {
    btnFullscreen.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            btnFullscreen.classList.add('active');
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            }
            btnFullscreen.classList.remove('active');
        }
        playSparkleChime();
    });

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            btnFullscreen.classList.remove('active');
        } else {
            btnFullscreen.classList.add('active');
        }
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

    let isDismissed = false;
    const dismissLoading = () => {
        if (isDismissed) return;
        isDismissed = true;
        clearInterval(progressInterval);
        if (loadingBar) loadingBar.style.width = '100%';
        if (loadingPercent) loadingPercent.textContent = '100%';

        loadingScreen.classList.add('fade-out');
        setTimeout(() => {
            loadingScreen.remove();
        }, 850);

        if (!musicStarted && !isSoundMuted) {
            startMusic();
        }
    };

    // Chạm/Click vào màn hình loading để bắt đầu ngay lập tức
    loadingScreen.addEventListener('click', dismissLoading, { passive: true });
    loadingScreen.addEventListener('touchstart', dismissLoading, { passive: true });

    let currentProgress = 0;
    const progressInterval = setInterval(() => {
        if (isDismissed) return;
        currentProgress += Math.floor(Math.random() * 18) + 12;
        if (currentProgress >= 100) {
            currentProgress = 100;
            if (loadingBar) loadingBar.style.width = '100%';
            if (loadingPercent) loadingPercent.textContent = '100%';
            dismissLoading();
        } else {
            if (loadingBar) loadingBar.style.width = `${currentProgress}%`;
            if (loadingPercent) loadingPercent.textContent = `${currentProgress}%`;
        }
    }, 40);
};

initLoadingScreen();
