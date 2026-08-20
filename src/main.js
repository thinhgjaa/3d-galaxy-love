import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

/**
 * Base
 */
// Canvas
const canvas = document.createElement('canvas');
document.querySelector('#app').appendChild(canvas);

// Scene cho các vật thể phát sáng (Ngân hà, Trái tim)
const scene = new THREE.Scene();

// Scene riêng cho các hình ảnh (Sprites) để không bị hiệu ứng chói lóa (Bloom)
const sceneSprites = new THREE.Scene();

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xff007f, 2);
pointLight.position.set(0, 5, 0);
scene.add(pointLight);

/**
 * 1. Galaxy
 */
const parameters = {};
parameters.count = 60000;
parameters.size = 0.01;
parameters.radius = 6;
parameters.branches = 4;
parameters.spin = 1.2;
parameters.randomness = 0.4;
parameters.randomnessPower = 3.5;
parameters.insideColor = '#ff007f'; 
parameters.outsideColor = '#100030'; 

let galaxyPoints = null;

const generateGalaxy = () => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(parameters.count * 3);
    const colors = new Float32Array(parameters.count * 3);

    const colorInside = new THREE.Color(parameters.insideColor);
    const colorOutside = new THREE.Color(parameters.outsideColor);

    for(let i = 0; i < parameters.count; i++) {
        const i3 = i * 3;
        const radius = Math.random() * parameters.radius;
        const spinAngle = radius * parameters.spin;
        const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2;

        const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius;
        const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius;
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius;

        positions[i3    ] = Math.cos(branchAngle + spinAngle) * radius + randomX;
        positions[i3 + 1] = randomY - 0.5; // Offset slightly down
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

        const mixedColor = colorInside.clone();
        mixedColor.lerp(colorOutside, radius / parameters.radius);

        colors[i3    ] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: parameters.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    galaxyPoints = new THREE.Points(geometry, material);
    scene.add(galaxyPoints);
};

generateGalaxy();

/**
 * 2. Heart Particle System
 */
let heartPoints = null;
const generateHeart = () => {
    const heartGeometry = new THREE.BufferGeometry();
    const heartCount = 15000;
    const positions = new Float32Array(heartCount * 3);
    const colors = new Float32Array(heartCount * 3);
    
    // Core color
    const baseColor = new THREE.Color('#ff0055');
    const glowColor = new THREE.Color('#ff77aa');

    let count = 0;
    while (count < heartCount) {
        // Sinh tọa độ ngẫu nhiên trong bounding box [-1.5, 1.5]
        const x = (Math.random() - 0.5) * 3;
        const y = (Math.random() - 0.5) * 3;
        const z = (Math.random() - 0.5) * 3;

        // Phương trình 3D Heart: (x^2 + (9/4)y^2 + z^2 - 1)^3 - x^2*z^3 - (9/80)*y^2*z^3 <= 0
        const a = x*x + 2.25*y*y + z*z - 1;
        const val = a*a*a - (x*x*z*z*z) - (0.1125*y*y*z*z*z);

        if (val <= 0.0) { // Điểm nằm trong thể tích trái tim
            // Map sang tọa độ Three.js (Trục Z của phương trình trở thành trục Y của Three.js)
            let tx = x * 1.5;
            let ty = z * 1.5;
            let tz = y * 1.5;
            
            // Đẩy lên cao phía trên dải ngân hà
            ty += 2.5;

            positions[count*3] = tx;
            positions[count*3+1] = ty;
            positions[count*3+2] = tz;

            // Phối màu ngẫu nhiên
            const mixedColor = baseColor.clone();
            if (Math.random() > 0.6) mixedColor.lerp(glowColor, Math.random());

            colors[count*3] = mixedColor.r;
            colors[count*3+1] = mixedColor.g;
            colors[count*3+2] = mixedColor.b;
            
            count++;
        }
    }

    heartGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    heartGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.02,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    heartPoints = new THREE.Points(heartGeometry, material);
    scene.add(heartPoints);
};

generateHeart();


/**
 * 3. Orbiting 3D Text (Đã xóa)
 */


/**
 * 4. Rải rác các hình ảnh (Sprites) trong tinh hà
 */
const scatterSprites = () => {
    // Sử dụng Emojis vẽ lên Canvas để làm Texture cho nhanh và cute
    const emojis = ['🚀', '👨‍🚀', '🪐', '🌟', '🛸', '🛰️', '🐶', '💖'];
    const spritesGroup = new THREE.Group();
    
    emojis.forEach((emoji) => {
        // Tạo canvas
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.font = '80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 64, 70); // Y offset slightly for center
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.6 }); // Giảm opacity để bớt chói lóa
        
        // Tạo 3-5 hình cho mỗi loại emoji
        const count = 3 + Math.floor(Math.random() * 3);
        for(let i=0; i<count; i++) {
            const sprite = new THREE.Sprite(material);
            
            // Vị trí ngẫu nhiên rải rác xung quanh ngân hà
            const radius = 2 + Math.random() * 6; // Bán kính quỹ đạo
            const angle = Math.random() * Math.PI * 2;
            sprite.position.x = Math.cos(angle) * radius;
            sprite.position.z = Math.sin(angle) * radius;
            sprite.position.y = (Math.random() - 0.5) * 5; // Cao thấp ngẫu nhiên
            
            // Kích thước ngẫu nhiên (nhỏ lại để đỡ rối)
            const scale = 0.15 + Math.random() * 0.25;
            sprite.scale.set(scale, scale, scale);
            
            // Lưu trữ dữ liệu để dùng cho animation
            sprite.userData = {
                radius: radius,
                angle: angle,
                speed: (Math.random() > 0.5 ? 1 : -1) * (0.05 + Math.random() * 0.15),
                originalScale: scale,
                isZoomed: false
            };
            
            spritesGroup.add(sprite);
        }
    });
    
    sceneSprites.add(spritesGroup);
    
    // --- Thêm hình mèo (cat.jpg) ---
    const textureLoader = new THREE.TextureLoader();
    const photoTexture = textureLoader.load('/cat.jpg');
    photoTexture.colorSpace = THREE.SRGBColorSpace;
    const photoMaterial = new THREE.SpriteMaterial({ map: photoTexture, transparent: true, opacity: 0.95 });
    
    for(let i=0; i<4; i++) { // Thêm 4 khung ảnh
        const photoSprite = new THREE.Sprite(photoMaterial);
        
        const radius = 4 + Math.random() * 3; 
        const angle = Math.random() * Math.PI * 2;
        photoSprite.position.x = Math.cos(angle) * radius;
        photoSprite.position.z = Math.sin(angle) * radius;
        photoSprite.position.y = (Math.random() - 0.5) * 3;
        
        // Khung ảnh to hơn một chút so với các emoji nhưng vẫn nhỏ gọn
        const scale = 0.6 + Math.random() * 0.3;
        photoSprite.scale.set(scale, scale, scale);
        
        photoSprite.userData = {
            radius: radius,
            angle: angle,
            speed: (Math.random() > 0.5 ? 1 : -1) * (0.02 + Math.random() * 0.05),
            originalScale: scale,
            isZoomed: false
        };
        
        spritesGroup.add(photoSprite);
    }
    // ----------------------------------------

    return spritesGroup;
};

const floatingSprites = scatterSprites();

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

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
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 3, 7);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.autoRotate = true; 
controls.autoRotateSpeed = 0.8;

/**
 * Tương tác click chuột (Raycaster)
 */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    // Tính toán tọa độ chuột chuẩn hóa (-1 đến +1)
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = -(event.clientY / sizes.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (floatingSprites) {
        const intersects = raycaster.intersectObjects(floatingSprites.children, false);
        
        let clickedSprite = null;
        if (intersects.length > 0) {
            clickedSprite = intersects[0].object;
        }

        floatingSprites.children.forEach(sprite => {
            if (sprite === clickedSprite) {
                // Bật/tắt trạng thái phóng to khi click trúng
                sprite.userData.isZoomed = !sprite.userData.isZoomed;
            } else {
                // Thu nhỏ tất cả các hình khác
                sprite.userData.isZoomed = false; 
            }
        });
    }
});

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor('#000000');
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.autoClear = false; // Rất quan trọng để render 2 scene đè lên nhau

/**
 * Post Processing (Bloom for Neon effect)
 */
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(sizes.width, sizes.height), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.0; // Cho phép các điểm sáng nhỏ cũng glow
bloomPass.strength = 1.5; // Tăng cường độ phát sáng của ngân hà và trái tim
bloomPass.radius = 0.5;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Rotate galaxy
    if(galaxyPoints) {
        galaxyPoints.rotation.y = elapsedTime * 0.1;
    }
    
    // Rotate and pulse heart
    if(heartPoints) {
        // Xoay nhẹ nhàng quanh trục Y
        heartPoints.rotation.y = elapsedTime * 0.15;
        
        // Subtle breathing effect
        const scale = 1 + Math.sin(elapsedTime * 2) * 0.05;
        heartPoints.scale.set(scale, scale, scale);
    }
    
    // Animation cho các hình ảnh linh tinh (bay quanh ngân hà)
    if(floatingSprites) {
        floatingSprites.children.forEach(sprite => {
            // Xử lý phóng to/thu nhỏ mượt mà
            const targetScale = sprite.userData.isZoomed ? 3.0 : sprite.userData.originalScale;
            sprite.scale.x += (targetScale - sprite.scale.x) * 0.1;
            sprite.scale.y += (targetScale - sprite.scale.y) * 0.1;
            sprite.scale.z += (targetScale - sprite.scale.z) * 0.1;

            if (!sprite.userData.isZoomed) {
                // Chỉ bay tiếp khi không bị phóng to
                sprite.userData.angle += sprite.userData.speed * 0.02; 
            }
            
            // Cập nhật tọa độ X, Z tạo quỹ đạo tròn
            sprite.position.x = Math.cos(sprite.userData.angle) * sprite.userData.radius;
            sprite.position.z = Math.sin(sprite.userData.angle) * sprite.userData.radius;
            
            // Hiệu ứng nhấp nhô (bobbing) trên trục Y
            sprite.position.y += Math.sin(elapsedTime * Math.abs(sprite.userData.speed) * 10) * 0.005;
        });
    }

    controls.update();
    
    // Render 2 lớp: Lớp 1 (Ngân hà phát sáng), Lớp 2 (Hình ảnh bình thường)
    renderer.clear();
    composer.render(); // Render scene 1 với Bloom
    renderer.clearDepth(); // Xóa depth buffer để hình ảnh đè lên trên
    renderer.render(sceneSprites, camera); // Render scene 2 không có Bloom

    window.requestAnimationFrame(tick);
};

tick();
