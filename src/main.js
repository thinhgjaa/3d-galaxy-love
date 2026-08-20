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
camera.position.set(0, 3, 7);
scene.add(camera);

// OrbitControls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.6;

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

let currentThemeIndex = 0;

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

updateFloatingText('Forever & Always 💖');

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
const defaultCameraPos = new THREE.Vector3(0, 3, 7);
const defaultTarget = new THREE.Vector3(0, 0, 0);

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
// Sử dụng file nhạc nội bộ được lưu tại public/music.mp3 (100% ổn định, không lo lỗi mạng/CORS)
const bgMusic = new Audio('/music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.65;
let musicStarted = false;

let audioContext = null;
let analyser = null;
let audioDataArray = null;

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
    initAudioAnalyser();
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }
    bgMusic.play().then(() => {
        musicStarted = true;
        const btnM = document.getElementById('btn-music');
        if (btnM) {
            btnM.classList.remove('muted');
            btnM.innerText = '🎵';
        }
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

const tick = () => {
    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // 0. Audio Visualizer (Phân tích tần số âm thanh)
    let bassFactor = 0;
    if (analyser && !bgMusic.paused && !bgMusic.muted) {
        analyser.getByteFrequencyData(audioDataArray);
        let bassSum = 0;
        for (let i = 0; i < 4; i++) {
            bassSum += audioDataArray[i];
        }
        bassFactor = bassSum / (4 * 255); // 0.0 đến 1.0
    }

    // Cập nhật vệt bụi sao ma thuật theo chuột
    updateFairyDust();

    // 1. Rotate galaxy (Quay êm dịu, tĩnh lặng, không nhảy theo nhạc)
    if (galaxyPoints) {
        galaxyPoints.rotation.y = elapsedTime * 0.08;
    }

    // 2. Rotate & Pulse Heart (Chỉ riêng quả tim thở nhịp nhàng kết hợp điệu nhạc)
    if (heartPoints) {
        heartPoints.rotation.y = elapsedTime * 0.12;

        // Nhịp thở êm ái của quả tim kết hợp nhịp bass nhẹ nhàng
        const audioPulse = bassFactor * 0.12;
        const breatheScale = 1.0 + Math.sin(elapsedTime * 1.5) * 0.06 + audioPulse;
        heartPoints.scale.set(breatheScale, breatheScale, breatheScale);
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
 * 13. UI CONTROLS WIRING
 * =========================================================================
 */
// 1. Nút đổi Theme màu
const btnTheme = document.getElementById('btn-theme');
if (btnTheme) {
    btnTheme.addEventListener('click', (e) => {
        e.stopPropagation();
        currentThemeIndex = (currentThemeIndex + 1) % colorThemes.length;
        const theme = colorThemes[currentThemeIndex];

        // Tái tạo lại Galaxy và Heart theo theme mới
        generateGalaxy();
        generateHeart();

        // Cập nhật màu đèn
        pointLight.color.set(theme.lightColor);

        // Cập nhật lại màu phát sáng của chữ
        const currentText = document.getElementById('custom-text-input')?.value || 'Forever & Always 💖';
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

// 5. Nút Bật/Tắt nhạc
const btnMusic = document.getElementById('btn-music');
if (btnMusic) {
    btnMusic.addEventListener('click', (e) => {
        e.stopPropagation();
        bgMusic.muted = !bgMusic.muted;
        if (bgMusic.muted) {
            btnMusic.classList.add('muted');
            btnMusic.innerText = '🔇';
        } else {
            btnMusic.classList.remove('muted');
            btnMusic.innerText = '🎵';
            if (!musicStarted) {
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
