// orbit3d.js - عرض ثلاثي الأبعاد مع محاور متوافقة مع ثنائي الأبعاد وتسميات

var scene, camera, renderer, controls;
var planets = {};
var orbits = {};
var sunLight;
var labels = {};

function init3D(containerId) {
    var container = document.getElementById(containerId || 'threeContainer');
    if (!container) {
        console.error("حاوية Three.js غير موجودة!");
        return;
    }
    
    if (scene) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);

    var width = container.clientWidth;
    var height = container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(10, 15, 30);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    window.renderer = renderer;

    // OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controls.enableZoom = true;
    controls.target.set(0, 0, 0);
    controls.update();

    // إضاءة
    var ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    sunLight = new THREE.PointLight(0xffaa66, 1.5, 0, 2);
    scene.add(sunLight);

    // ============================================================
    // 1. المحاور الإحداثية (X, Y, Z) مع تسميات
    // ============================================================
    var maxOrbit = 40;
    if (typeof Astronomy !== 'undefined' && Astronomy.Body) {
        for (var i = 0; i < Astronomy.Body.length; i++) {
            var b = Astronomy.Body[i];
            if (b.a0 !== undefined && b.a0 > maxOrbit) maxOrbit = b.a0;
            else if (b.a !== undefined && b.a > maxOrbit) maxOrbit = b.a;
        }
    }
    var scaleFactor = 0.25;
    var axisLength = maxOrbit * scaleFactor * 1.3;
    
    var axesHelper = new THREE.AxesHelper(axisLength);
    scene.add(axesHelper);

    // دالة لإنشاء تسمية محور
    function createAxisLabel(text, color) {
        var canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, 64, 64);
        ctx.font = 'Bold 42px Arial';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 32, 32);
        var texture = new THREE.CanvasTexture(canvas);
        var material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
        var sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 2, 1);
        return sprite;
    }

    var labelX = createAxisLabel('X', '#ff5555');
    labelX.position.set(axisLength, 0, 0);
    scene.add(labelX);
    var labelY = createAxisLabel('Z', '#55ff55');
    labelY.position.set(0, axisLength, 0);
    scene.add(labelY);
    var labelZ = createAxisLabel('Y', '#5555ff');
    labelZ.position.set(0, 0, axisLength);
    scene.add(labelZ);

    // ============================================================
    // 2. الشمس (بعد تصغير الحجم)
    // ============================================================
    var sunGeometry = new THREE.SphereGeometry(0.00008, 32, 32);
    var sunMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffaa33, 
        emissive: 0x442200 
    });
    var sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sunMesh);

    // ============================================================
    // 3. إنشاء جميع الأجرام مع تسميات
    // ============================================================
    createAllBodies();

    if (!window._animationStarted) {
        animate();
        window._animationStarted = true;
    }
}

// ============================================================
// دالة إنشاء الأجرام مع تسميات
// ============================================================
function createAllBodies() {
    if (typeof Astronomy === 'undefined' || !Astronomy.Body) {
        console.warn("Astronomy غير محملة بعد!");
        return;
    }

    var colorMap = {
        'Sun': 0xffaa33,
        'Mercury': 0xbc9a6c,
        'Venus': 0xe6b800,
        'Earth': 0x2288ff,
        'Moon': 0xaaaaaa,
        'Mars': 0xcc6644,
        'Ceres': 0xbbaa88,
        'Pallas': 0x998877,
        'Juno': 0xaa9966,
        'Vesta': 0xbbaacc,
        'Ida': 0x887766,
        'Gaspra': 0x665544,
        'Comet_9P': 0x99aacc,
        'Comet_19P': 0x88bbdd,
        'Comet_67P': 0x77aacc,
        'Comet_81P': 0x6699bb,
        'Jupiter': 0xc99e6f,
        'Saturn': 0xf0e0a0,
        'Uranus': 0xccddff,
        'Neptune': 0x3366cc,
        'Pluto': 0xaa9977
    };

    // أحجام مكبرة (ضرب 2.5 مقارنة بالإصدار السابق)
    var sizeMap = {
        'Sun': 0.0008,
        'Mercury': 0.020,
        'Venus': 0.030,
        'Earth': 0.032,
        'Moon': 0.015,
        'Mars': 0.028,
        'Ceres': 0.018,
        'Pallas': 0.015,
        'Juno': 0.013,
        'Vesta': 0.018,
        'Ida': 0.010,
        'Gaspra': 0.008,
        'Comet_9P': 0.010,
        'Comet_19P': 0.012,
        'Comet_67P': 0.010,
        'Comet_81P': 0.010,
        'Jupiter': 0.090,
        'Saturn': 0.080,
        'Uranus': 0.060,
        'Neptune': 0.055,
        'Pluto': 0.015
    };

    var scaleFactor = 0.315;

    for (var i = 0; i < Astronomy.Body.length; i++) {
        var body = Astronomy.Body[i];
        var name = body.Name;
        if (name === 'Sun') continue;

        var orbitRadiusAU = null;
        if (body.a0 !== undefined) orbitRadiusAU = body.a0;
        else if (body.a !== undefined) orbitRadiusAU = body.a;
        else if (name === 'Moon') orbitRadiusAU = 0.00257;

        var size = sizeMap[name] || 0.15;
        var color = colorMap[name] || 0x888888;

        // كرة الكوكب
        var geometry = new THREE.SphereGeometry(size, 24, 24);
        var material = new THREE.MeshStandardMaterial({ 
            color: color, 
            roughness: 0.6, 
            metalness: 0.1 
        });
        var planet = new THREE.Mesh(geometry, material);
        scene.add(planet);
        planets[name] = planet;

        // ===== إضافة تسمية (Sprite) =====
        var labelCanvas = document.createElement('canvas');
        labelCanvas.width = 128;
        labelCanvas.height = 48;
        var ctx = labelCanvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, 128, 48);
        ctx.font = 'Bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // لون النص يتناسب مع لون الكوكب
        var hexColor = '#' + color.toString(16).padStart(6, '0');
        ctx.fillStyle = hexColor;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6;
        ctx.fillText(name, 64, 24);
        var texture = new THREE.CanvasTexture(labelCanvas);
        var labelMaterial = new THREE.SpriteMaterial({ 
            map: texture, 
            depthTest: false,
            transparent: true
        });
        var labelSprite = new THREE.Sprite(labelMaterial);
        labelSprite.scale.set(2.5, 1, 1);
        // نضع التسمية فوق الكوكب قليلاً
        labelSprite.position.set(0, size * 1.8, 0);
        planet.add(labelSprite);  // إرفاق التسمية بالكوكب لتتحرك معه
        labels[name] = labelSprite;

        // رسم المدار (دائرة)
        if (orbitRadiusAU !== null && orbitRadiusAU > 0) {
            var r = orbitRadiusAU * scaleFactor;
            if (r > 0.3) {
                var points = [];
                var segments = 128;
                for (var j = 0; j <= segments; j++) {
                    var angle = (j / segments) * Math.PI * 2;
                    var x = r * Math.cos(angle);
                    var z = r * Math.sin(angle);
                    points.push(new THREE.Vector3(x, 0, z));
                }
                var orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
                var orbitMaterial = new THREE.LineBasicMaterial({ 
                    color: (name === 'Earth') ? 0x4488ff : 0x446688,
                    transparent: true,
                    opacity: 0.3
                });
                var orbitLine = new THREE.LineLoop(orbitGeometry, orbitMaterial);
                scene.add(orbitLine);
                orbits[name] = orbitLine;
            }
        }
    }
}

// ============================================================
// تحديث مواقع الكواكب (مع تحويل الإحداثيات)
// ============================================================
function updatePlanetsPositions3D() {
    if (typeof sunLight === 'undefined' || sunLight === null || !scene) return;
    if (typeof Astronomy === 'undefined' || !Astronomy.Body) return;
    if (typeof AstroDateTime === 'undefined') return;
    
    var day = Astronomy.DayValue(AstroDateTime);
    var scaleFactor = 0.25;
    
    for (var name in planets) {
        var body = Astronomy[name];
        if (!body || body.Name === 'Sun') continue;
        
        try {
            var coords = body.EclipticCartesianCoordinates(day);
            if (coords) {
                // تحويل: (x_astro, y_astro, z_astro) → (x_astro, z_astro, y_astro)
                // بحيث يكون المستوى XZ هو مستوى المدار (كما في ثنائي الأبعاد)
                var px = coords.x * scaleFactor;
                var py = coords.z * scaleFactor;  // الارتفاع
                var pz = coords.y * scaleFactor;
                planets[name].position.set(px, py, pz);
            }
        } catch(e) {
            // تجاهل الأخطاء
        }
    }
    
    sunLight.position.set(0, 0, 0);
}

// ============================================================
// حلقة الرسم
// ============================================================
function animate() {
    requestAnimationFrame(animate);
    
    if (typeof AstroDateTime !== 'undefined' && Astronomy) {
        updatePlanetsPositions3D();
    }
    
    if (controls) controls.update();
    renderer.render(scene, camera);
}

// ============================================================
// تغيير حجم العارض
// ============================================================
function resizeRenderer3D() {
    if (!renderer) return;
    var container = renderer.domElement.parentElement;
    if (!container) return;
    var width = container.clientWidth;
    var height = container.clientHeight;
    if (width > 0 && height > 0) {
        renderer.setSize(width, height);
        if (camera) {
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        }
    }
}

// ============================================================
// تصدير الدوال
// ============================================================
window.init3D = init3D;
window.updatePlanetsPositions3D = updatePlanetsPositions3D;
window.resizeRenderer3D = resizeRenderer3D;
window.set3DMode = function(mode) {
    if (mode === 'geocentric') {
        console.warn("⚠️ الوضع الجغرافي غير مدعوم في 3D.");
    }
};