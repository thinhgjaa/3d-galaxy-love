// Let's test heart shaping for maximum beauty, width, roundness, and cleft definition
function sampleSculptedHeart(u, v, options = {}) {
    // u in [-PI, PI] - parameter along heart contour
    // v in [-PI/2, PI/2] - parameter across 3D depth
    
    const sinU = Math.sin(u);
    const cosU = Math.cos(u);
    const sinV = Math.sin(v);
    const cosV = Math.cos(v);

    // 1. Base 2D Heart Silhouette
    // 16 * sin^3(u)
    const xBase = 16 * Math.pow(sinU, 3);
    
    // Y profile: 13*cos(u) - 5*cos(2u) - 2*cos(3u) - cos(4u)
    let yBase = 13 * cosU - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u);

    // Enhanced Top Cleft (Khe tim mềm mại, uốn lượn sâu quyến rũ)
    // When u is near 0, we create a gorgeous sculptured notch
    const cleftDist = Math.abs(u);
    const cleftDepth = Math.exp(-Math.pow(u / 0.52, 2)) * 1.8; // Smooth deep dip
    yBase -= cleftDepth;

    // 2. 3D Volumetric Depth Profile (Z)
    // Heart is thickest at the upper lobes (|u| around 0.6 - 1.2), tapering down to the tip (|u| -> PI)
    const lobeThickness = Math.pow(Math.abs(sinU), 0.6) * (7.5 + 2.5 * Math.cos(u));
    // Center indentation in Z (front and back cleft groove)
    const centerGrooveZ = 1.0 - 0.35 * Math.exp(-Math.pow(xBase / 3.5, 2));
    const zBase = lobeThickness * centerGrooveZ * sinV;

    // 3. Horizontal X width preservation
    // cos(v) gives depth curvature; we use (0.55 + 0.45*cosV) so width is never squashed!
    const widthFactor = 0.55 + 0.45 * cosV;
    const x3D = xBase * widthFactor;

    // Scaling factors for stunning visual proportions (Wide, plump, romantic)
    const scaleX = 0.098; // Wider lobes
    const scaleY = 0.088;
    const scaleZ = 0.075; // Plump 3D volume

    const x = x3D * scaleX;
    const y = yBase * scaleY;
    const z = zBase * scaleZ;

    return {
        x, y, z,
        u, v,
        cleftDepth,
        cleftFactor: Math.exp(-Math.pow(u / 0.52, 2)),
        isLobePeak: (cleftDist > 0.5 && cleftDist < 1.1)
    };
}

let pts = [];
for (let i = 0; i < 10000; i++) {
    const s = 2 * Math.random() - 1;
    const u = Math.sign(s) * Math.asin(Math.pow(Math.abs(s), 0.6)) * 2;
    const v = (Math.random() - 0.5) * Math.PI;
    pts.push(sampleSculptedHeart(u, v));
}

let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
pts.forEach(p => {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
});

console.log(`Dimensions: X: [${minX.toFixed(2)}, ${maxX.toFixed(2)}] (Width: ${(maxX-minX).toFixed(2)})`);
console.log(`Dimensions: Y: [${minY.toFixed(2)}, ${maxY.toFixed(2)}] (Height: ${(maxY-minY).toFixed(2)})`);
console.log(`Dimensions: Z: [${minZ.toFixed(2)}, ${maxZ.toFixed(2)}] (Depth: ${(maxZ-minZ).toFixed(2)})`);

const cleftBottom = sampleSculptedHeart(0, 0);
const lobePeak = sampleSculptedHeart(0.75, 0);
console.log("Cleft notch Y:", cleftBottom.y.toFixed(3), "Lobe peak Y:", lobePeak.y.toFixed(3), "Dip height:", (lobePeak.y - cleftBottom.y).toFixed(3));
