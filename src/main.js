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

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    powerPreference: "high-performance"
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor('#000000');
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.autoClear = false;

// Post Processing (UnrealBloomPass)
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(sizes.width, sizes.height), 1.4, 0.4, 0.85);
bloomPass.threshold = 0.0;
bloomPass.strength = 1.3;
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    composer.setSize(sizes.width, sizes.height);
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
 * 3. GALAXY GENERATION
 * =========================================================================
 */
const galaxyParams = {
    count: 65000,
    size: 0.01,
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
 * 4. 3D HEART SYSTEM
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
    const heartCount = 14000;
    const positions = new Float32Array(heartCount * 3);
    const colors = new Float32Array(heartCount * 3);

    const baseColor = new THREE.Color(theme.heartBase);
    const glowColor = new THREE.Color(theme.heartGlow);

    let count = 0;
    while (count < heartCount) {
        const x = (Math.random() - 0.5) * 3;
        const y = (Math.random() - 0.5) * 3;
        const z = (Math.random() - 0.5) * 3;

        // Phương trình 3D Heart: (x^2 + 2.25y^2 + z^2 - 1)^3 - x^2*z^3 - 0.1125*y^2*z^3 <= 0
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
        size: 0.013,
        transparent: true,
        opacity: 0.45,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    heartPoints = new THREE.Points(heartGeometry, heartMaterial);
    heartPoints.position.y = 2.4; // Tọa độ tâm trái tim phía trên ngân hà
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

    // Hiệu ứng phát sáng Neon cho chữ
    const theme = colorThemes[currentThemeIndex];
    ctx.font = 'bold 54px "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glow layers
    ctx.shadowColor = theme.heartBase;
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, 512, 128);

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
            opacity: 0.9,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        textSprite = new THREE.Sprite(material);
        textSprite.position.set(0, 3.8, 0);
        textSprite.scale.set(3.8, 0.95, 1);
        scene.add(textSprite);
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

class Meteor {
    constructor() {
        this.active = false;
        this.speed = 0.4;
        this.length = 2.5;

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(6); // 2 points (head, tail)
        const colors = new Float32Array(6);

        // Head bright white, tail theme-glow
        colors[0] = 1.0; colors[1] = 1.0; colors[2] = 1.0; // head
        colors[3] = 1.0; colors[4] = 0.3; colors[5] = 0.7; // tail

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            linewidth: 2
        });

        this.mesh = new THREE.Line(geometry, material);
        this.mesh.visible = false;
        meteorsGroup.add(this.mesh);

        this.direction = new THREE.Vector3(-1, -0.6, -0.8).normalize();
    }

    spawn(customPos = null) {
        this.active = true;
        this.mesh.visible = true;

        if (customPos) {
            this.mesh.position.copy(customPos);
        } else {
            // Random start position high and wide
            this.mesh.position.set(
                (Math.random() - 0.3) * 16,
                6 + Math.random() * 6,
                (Math.random() - 0.5) * 16
            );
        }

        this.speed = 0.25 + Math.random() * 0.25;
        this.updateGeometry();
    }

    updateGeometry() {
        const posAttr = this.mesh.geometry.attributes.position;
        const tail = this.direction.clone().multiplyScalar(-this.length);
        
        posAttr.setXYZ(0, 0, 0, 0); // Head
        posAttr.setXYZ(1, tail.x, tail.y, tail.z); // Tail
        posAttr.needsUpdate = true;
    }

    update() {
        if (!this.active) return;

        this.mesh.position.addScaledVector(this.direction, this.speed);

        // If it goes too far down/away, reset
        if (this.mesh.position.y < -4 || this.mesh.position.length() > 25) {
            this.active = false;
            this.mesh.visible = false;
        }
    }
}

const meteorPool = [];
for (let i = 0; i < 12; i++) {
    meteorPool.push(new Meteor());
}

let nextMeteorTime = 0;

const spawnMeteorShower = () => {
    let count = 0;
    for (const m of meteorPool) {
        if (!m.active && count < 4) {
            setTimeout(() => m.spawn(), count * 150);
            count++;
        }
    }
};

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
 * 10. AUDIO BACKGROUND
 * =========================================================================
 */
const bgMusic = new Audio('https://cdn.pixabay.com/download/audio/2022/02/10/audio_fc48af67b2.mp3?filename=space-ambience-108861.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5;
let musicStarted = false;

const startMusic = () => {
    if (!musicStarted) {
        bgMusic.play().then(() => {
            musicStarted = true;
        }).catch(e => console.warn(e));
        window.removeEventListener('pointerdown', startMusic);
    }
};
window.addEventListener('pointerdown', startMusic);

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

    // 1. Rotate galaxy
    if (galaxyPoints) {
        galaxyPoints.rotation.y = elapsedTime * 0.08;
    }

    // 2. Rotate & Breathe Heart
    if (heartPoints) {
        heartPoints.rotation.y = elapsedTime * 0.12;

        // Hiệu ứng thở (phồng lên xẹp xuống mượt mà từ giữa)
        const breatheScale = 1.0 + Math.sin(elapsedTime * 1.5) * 0.08;
        heartPoints.scale.set(breatheScale, breatheScale, breatheScale);
    }

    // 3. Floating Text Bobbing & Facing Camera
    if (textSprite) {
        textSprite.position.y = 3.8 + Math.sin(elapsedTime * 2.0) * 0.08;
    }

    // 4. Meteors update & periodic random spawn
    if (elapsedTime > nextMeteorTime) {
        const inactiveMeteor = meteorPool.find(m => !m.active);
        if (inactiveMeteor) {
            inactiveMeteor.spawn();
        }
        nextMeteorTime = elapsedTime + 2.5 + Math.random() * 4.0;
    }

    meteorPool.forEach(m => m.update());

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
