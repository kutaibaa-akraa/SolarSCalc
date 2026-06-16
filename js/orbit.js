// orbit.js - رسم ثنائي الأبعاد للنظام الشمسي مع شبكة ومدارات وترقيم ودعم الوضعين Helio/Geo

var canvas, ctx;
var planetScreenPos = {};      // مواقع الكواكب على الشاشة (بكسل) - يتم تحديثها من calculate.js
var sunScreenPos = null;       // موقع الشمس على الشاشة (مهم في الوضع geocentric)
var currentOrbitMode = "helio";
var zoomLevel = 1.0;
var maxDistHelio = 15;         // أقصى مسافة معروضة (AU) - لتشمل نبتون وبلوتو
var maxDistGeo = 15;          // في الوضع geocentric نعرض حتى 2.5 AU حول الأرض

// نصف قطر مدار كل كوكب (نصف المحور الرئيسي بوحدة AU) - نأخذه من Astronomy إن أمكن
// سيتم تعبئتها من دالة التهيئة
var planetOrbitRadii = {};

// ألوان المدارات (نفس لون الكوكب أو باهتة)
var orbitColor = "#555555";

function initCanvas() {
    canvas = document.getElementById('solarCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 400;
    canvas.addEventListener('wheel', onCanvasWheel);
    
    // تهيئة أنصاف أقطار المدارات من كائن Astronomy
    if (typeof Astronomy !== 'undefined' && Astronomy.Body) {
        for (var i = 0; i < Astronomy.Body.length; i++) {
            var p = Astronomy.Body[i];
            // استخراج a (نصف المحور الرئيسي) من خصائص الكوكب
            if (p.a0 !== undefined) {
                planetOrbitRadii[p.Name] = p.a0;
            } else if (p.Name === "Sun") {
                planetOrbitRadii[p.Name] = 0;
            } else if (p.Name === "Earth") {
                planetOrbitRadii[p.Name] = 1.0;
            } else if (p.Name === "Moon") {
                planetOrbitRadii[p.Name] = 0.00257; // تقريباً 384400 كم = 0.00257 AU
            } else {
                // محاولة تقدير (للكويكبات والمذنبات)
                if (p.a !== undefined) planetOrbitRadii[p.Name] = p.a;
                else planetOrbitRadii[p.Name] = 1.0;
            }
        }
    } else {
        // قيم افتراضية في حال لم يتم تحميل Astronomy بعد
        planetOrbitRadii = {
            'Mercury': 0.387, 'Venus': 0.723, 'Earth': 1.0, 'Mars': 1.524,
            'Jupiter': 5.203, 'Saturn': 9.537, 'Uranus': 19.191, 'Neptune': 30.069,
            'Pluto': 39.482, 'Ceres': 2.767, 'Pallas': 2.771, 'Juno': 2.670,
            'Vesta': 2.362, 'Moon': 0.00257
        };
    }
    
    redrawCanvas();
}

function onCanvasWheel(e) {
    e.preventDefault();
    var delta = e.deltaY > 0 ? -0.1 : 0.1;
    zoomLevel = Math.min(5, Math.max(0.3, zoomLevel + delta));
    redrawCanvas();
}

function zoomIn() {
    zoomLevel = Math.min(5, zoomLevel + 0.2);
    redrawCanvas();
}

function zoomOut() {
    zoomLevel = Math.max(0.3, zoomLevel - 0.2);
    redrawCanvas();
}

function resetZoom() {
    zoomLevel = 1.0;
    redrawCanvas();
}

// تحويل إحداثيات AU إلى بكسل على الشاشة (مع تطبيق التكبير)
function auToPixel(x, y, centerX, centerY, scale) {
    return { x: centerX + x * scale, y: centerY + y * scale };
}

/**
 * redrawCanvas()
 * 
 * الوظيفة الأساسية لرسم النظام الشمسي ثنائي الأبعاد على عنصر Canvas.
 * تعرض هذه الدالة منظراً علوياً من القطب الشمالي للمجموعة الشمسية،
 * مع شبكة إحداثية متعامدة (X, Y) بوحدة الوحدة الفلكية (AU).
 * 
 * تعتمد على المتغيرات العامة:
 *   - currentOrbitMode: "helio" (مركزه الشمس) أو "geo" (مركزه الأرض)
 *   - zoomLevel: عامل التكبير الحالي
 *   - planetScreenPos: مواقع الكواكب بالبكسل (يتم تحديثها من UpdateOrbitVisuals)
 *   - planetOrbitRadii: أنصاف أقطار المدارات لكل جرم (بوحدة AU)
 * 
 * يتم تحديث هذه الدالة تلقائياً عند تغيير الزمن أو نظام الإحداثيات أو التكبير.
 */

function redrawCanvas() {
    // 1. التحقق من وجود سياق الرسم (context)
    if (!ctx) return;

    // 2. مسح اللوحة بالكامل
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 3. تعيين خلفية داكنة من متغيرات CSS
    const bg = getComputedStyle(document.documentElement)
        .getPropertyValue('--canvas-bg').trim() || '#2A2C2E';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 4. تحديد مركز الرسم (نقطة الأصل في الإحداثيات)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // 5. حساب مقياس الرسم بناءً على الوضع الحالي (heliocentric / geocentric) ومستوى التكبير
    const maxDist = (currentOrbitMode === "helio") ? maxDistHelio : maxDistGeo;
    const dynamicMaxDist = maxDist / zoomLevel;
    const scale = Math.min(centerX / dynamicMaxDist, centerY / dynamicMaxDist);

    // ================================================================
    // الجزء الأول: رسم الشبكة الإحداثية (خطوط أفقية وعمودية باهتة)
    // ================================================================
    ctx.save();  // حفظ حالة الرسم الحالية

    // إعدادات الخطوط الأساسية
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;  // شفافية منخفضة لتجنب التداخل مع الكواكب

    // تحديد الفاصل بين الخطوط (يتكيف مع مستوى التكبير)
    let stepAU = 1.0;
    if (dynamicMaxDist < 10) stepAU = 1.0;
    else if (dynamicMaxDist < 20) stepAU = 2.0;
    else if (dynamicMaxDist < 40) stepAU = 5.0;
    else stepAU = 10.0;

    // --------------------
    // 5.1 الخطوط الرأسية (قيم X ثابتة)
    // --------------------
    for (let x = -dynamicMaxDist; x <= dynamicMaxDist; x += stepAU) {
        const px = centerX + x * scale;  // إسقاط قيمة X إلى بكسل على الشاشة
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, canvas.height);
        ctx.stroke();
    }

    // --------------------
    // 5.2 الخطوط الأفقية (قيم Y ثابتة) مع تصحيح الاتجاه (Y للأعلى)
    // --------------------
    for (let y = -dynamicMaxDist; y <= dynamicMaxDist; y += stepAU) {
        const py = centerY - y * scale;  // عكس الإشارة لجعل القيم الموجبة للأعلى
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(canvas.width, py);
        ctx.stroke();
    }

    // --------------------
    // 5.3 المحوران الرئيسيان (خطوط أكثر وضوحاً)
    // --------------------
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = "#AAAAAA";
    ctx.lineWidth = 1;

    // المحور الأفقي (X)
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();

    // المحور العمودي (Y)
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();

    // ================================================================
    // الجزء الثاني: ترقيم المحاور (عرض قيم الإحداثيات بوحدة AU)
    // ================================================================
    ctx.font = "10px monospace";
    ctx.fillStyle = "#CCCCCC";
    ctx.globalAlpha = 0.8;

    // --------------------
    // 6.1 ترقيم المحور X (أفقي)
    // --------------------
    for (let x = -dynamicMaxDist; x <= dynamicMaxDist; x += stepAU) {
        if (Math.abs(x) < 0.01) continue;  // تخطي الصفر (يتوسطه مركز الرسم)
        const px = centerX + x * scale;
        ctx.fillText(x.toFixed(1), px - 8, centerY - 4);
    }

    // --------------------
    // 6.2 ترقيم المحور Y (عمودي، مع عكس الإشارة)
    // --------------------
    for (let y = -dynamicMaxDist; y <= dynamicMaxDist; y += stepAU) {
        if (Math.abs(y) < 0.01) continue;
        const py = centerY - y * scale;  // عكس الإشارة لتتناسب مع الاتجاه للأعلى
        ctx.fillText(y.toFixed(1), centerX + 4, py - 2);
    }

    ctx.globalAlpha = 1.0;  // إعادة الشفافية للقيم الطبيعية

    // ================================================================
    // الجزء الثالث: معلومات توضيحية على الرسم (زاوية عليا يمنى)
    // ================================================================
    // نص يوضح طبيعة الرسم (منظر علوي من القطب الشمالي)
    ctx.fillStyle = "#CCCCCC";
    ctx.font = "12px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    const infoX = canvas.width - 10;
    const infoY = 10;
    ctx.fillText("☀ منظر علوي من القطب الشمالي", infoX, infoY);

    // توضيح ألوان المحاور (أحمر لـ X، أخضر لـ Y)
    ctx.font = "11px Arial";
    ctx.fillStyle = "#FF6666";  // أحمر فاتح
    ctx.fillText("X ← →", infoX, infoY + 18);
    ctx.fillStyle = "#66FF66";  // أخضر فاتح
    ctx.fillText("Y ↑ ↓", infoX, infoY + 34);

    // إضافة وحدة القياس
    ctx.fillStyle = "#AAAAAA";
    ctx.font = "10px Arial";
    ctx.fillText("الوحدة: AU", infoX, infoY + 52);

    // ================================================================
    // الجزء الرابع: رسم المدارات (دوائر حول الشمس أو حول موقع الشمس في الوضع geo)
    // ================================================================
    /**
     * دالة مساعدة لرسم دائرة مدارية حول نقطة معينة (بالبكسل)
     * @param {number} cx - مركز الدائرة X (بالبكسل)
     * @param {number} cy - مركز الدائرة Y (بالبكسل)
     * @param {number} radiusAU - نصف القطر بوحدة AU
     * @param {string} color - لون الدائرة (اختياري)
     */
    function drawOrbit(cx, cy, radiusAU, color) {
        const radiusPx = radiusAU * scale;
        ctx.beginPath();
        ctx.arc(cx, cy, radiusPx, 0, 2 * Math.PI);
        ctx.strokeStyle = color || "#555555";
        ctx.lineWidth = 0.8;
        ctx.setLineDash([5, 5]);  // خطوط منقطة لتمييز المدارات
        ctx.stroke();
        ctx.setLineDash([]);      // إعادة تعيين
    }

    if (currentOrbitMode === "helio") {
        // الوضع الشمسي: جميع المدارات تتمركز حول نقطة الأصل (مركز الرسم)
        for (const name in planetOrbitRadii) {
            const r = planetOrbitRadii[name];
            if (r > 0 && r < dynamicMaxDist) {
                drawOrbit(centerX, centerY, r, "#777777");
            }
        }
    } else if (currentOrbitMode === "geo" && sunScreenPos !== null) {
        // الوضع الأرضي: المدارات تتمركز حول موقع الشمس الحالي (المتحرك)
        for (const name in planetOrbitRadii) {
            const r = planetOrbitRadii[name];
            if (r > 0) {
                // نتحقق من أن المدار يقع ضمن نطاق الرؤية
                const distFromCenter = Math.hypot(sunScreenPos.x - centerX, sunScreenPos.y - centerY) / scale;
                if (r + distFromCenter < dynamicMaxDist) {
                    drawOrbit(sunScreenPos.x, sunScreenPos.y, r, "#777777");
                }
            }
        }
    }

    // ================================================================
    // الجزء الخامس: رسم الجرم المركزي (الشمس أو الأرض)
    // ================================================================
    ctx.setLineDash([]);  // إلغاء أي خطوط منقطة متبقية

    if (currentOrbitMode === "helio") {
        // الشمس في المركز
        ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--canvas-sun').trim() || '#FDB813';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
        ctx.fill();
        // تسمية الشمس
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("الشمس", centerX, centerY - 14);
    } else if (currentOrbitMode === "geo") {
        // الأرض في المركز (في الوضع الجغرافي)
        ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--canvas-earth').trim() || '#66D9EF';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("الأرض", centerX, centerY - 12);
    }

    // ================================================================
    // الجزء السادس: رسم الكواكب والأجرام الأخرى
    // ================================================================
    // خريطة الألوان لكل جرم (من متغيرات CSS)
    const planetColors = {
        'Sun': '--canvas-sun',
        'Mercury': '--canvas-mercury',
        'Venus': '--canvas-venus',
        'Earth': '--canvas-earth',
        'Mars': '--canvas-mars',
        'Jupiter': '--canvas-jupiter',
        'Saturn': '--canvas-saturn',
        'Ceres': '--stel-warning',
        'Pallas': '--stel-warning',
        'Juno': '--stel-warning',
        'Vesta': '--stel-warning',
        'Uranus': '--stel-info',
        'Neptune': '--stel-info',
        'Pluto': '--stel-number'
    };

    // التكرار على جميع الكواكب المسجلة في planetScreenPos
    for (const name in planetScreenPos) {
        const pos = planetScreenPos[name];
        if (!pos) continue;

        // تجنب رسم الجرم المركزي مرة أخرى (مكرر مع الجزء الخامس)
        if (currentOrbitMode === "helio" && name === 'Sun') continue;
        if (currentOrbitMode === "geo" && name === 'Earth') continue;

        // اختيار اللون المناسب
        const colorVar = planetColors[name] || '--stel-accent';
        ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue(colorVar).trim() || '#aaaaaa';

        // حجم الرمز (الكواكب الكبيرة مثل المشتري وزحل لها حجم أكبر)
        const radius = (name === 'Jupiter' || name === 'Saturn') ? 6 : 4;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
        ctx.fill();

        // كتابة اسم الكوكب بجانبه
        ctx.fillStyle = "#CCCCCC";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(name, pos.x, pos.y - 8);
    }

    ctx.restore();  // استعادة حالة الرسم السابقة
}

// يتم استدعاء هذه الدالة من calculate.js بعد تحديث الإحداثيات
function updateOrbitMode(mode) {
    currentOrbitMode = mode;
    // إعادة الرسم فوراً
    redrawCanvas();
}

// دالة لتحديث موقع الشمس في الوضع geocentric (يتم استدعاؤها من UpdateOrbitVisuals)
function setSunScreenPosition(x_px, y_px) {
    sunScreenPos = { x: x_px, y: y_px };
}

// تصدير الدوال للاستخدام الخارجي
window.initCanvas = initCanvas;
window.redrawCanvas = redrawCanvas;
window.updateOrbitMode = updateOrbitMode;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.resetZoom = resetZoom;
window.setSunScreenPosition = setSunScreenPosition;