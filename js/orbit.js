// orbit.js - رسم ثنائي الأبعاد للنظام الشمسي مع شبكة ومدارات وترقيم ودعم الوضعين Helio/Geo

var canvas, ctx;
var planetScreenPos = {};      // مواقع الكواكب على الشاشة (بكسل) - يتم تحديثها من calculate.js
var sunScreenPos = null;       // موقع الشمس على الشاشة (مهم في الوضع geocentric)
var currentOrbitMode = "helio";
var zoomLevel = 1.0;
var maxDistHelio = 15;         // أقصى مسافة معروضة (AU) - لتشمل نبتون وبلوتو
var maxDistGeo = 2.5;          // في الوضع geocentric نعرض حتى 2.5 AU حول الأرض

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

function redrawCanvas() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // خلفية داكنة
    var bg = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim() || '#2A2C2E';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    
    // تحديد أقصى مسافة معروضة حسب الوضع
    var maxDist = (currentOrbitMode === "helio") ? maxDistHelio : maxDistGeo;
    var dynamicMaxDist = maxDist / zoomLevel;
    var scale = Math.min(centerX / dynamicMaxDist, centerY / dynamicMaxDist);
    
    // ------------------------------------------------------------
    // 1. رسم الشبكة (خطوط أفقية وعمودية باهتة)
    // ------------------------------------------------------------
    ctx.save();
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;
    
    // تحديد الفاصل بين الخطوط (يتغير مع التكبير)
    var stepAU = 1.0;
    if (dynamicMaxDist < 10) stepAU = 1.0;
    else if (dynamicMaxDist < 20) stepAU = 2.0;
    else if (dynamicMaxDist < 40) stepAU = 5.0;
    else stepAU = 10.0;
    
    // رسم خطوط رأسية (X ثابت)
    for (var x = -dynamicMaxDist; x <= dynamicMaxDist; x += stepAU) {
        var px = centerX + x * scale;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, canvas.height);
        ctx.stroke();
    }
    // رسم خطوط أفقية (Y ثابت)
    for (var y = -dynamicMaxDist; y <= dynamicMaxDist; y += stepAU) {
        var py = centerY + y * scale;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(canvas.width, py);
        ctx.stroke();
    }
    
    // رسم المحورين الرئيسيين بخط أكثر وضوحاً
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = "#AAAAAA";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();
    
    // ------------------------------------------------------------
    // 2. ترقيم المحاور (إظهار قيم الإحداثيات بوحدة AU)
    // ------------------------------------------------------------
    ctx.font = "10px monospace";
    ctx.fillStyle = "#CCCCCC";
    ctx.globalAlpha = 0.8;
    for (var x = -dynamicMaxDist; x <= dynamicMaxDist; x += stepAU) {
        if (Math.abs(x) < 0.01) continue; // لا نضع صفراً مكرراً
        var px = centerX + x * scale;
        ctx.fillText(x.toFixed(1), px - 8, centerY - 4);
    }
    for (var y = -dynamicMaxDist; y <= dynamicMaxDist; y += stepAU) {
        if (Math.abs(y) < 0.01) continue;
        var py = centerY + y * scale;
        ctx.fillText(y.toFixed(1), centerX + 4, py - 2);
    }
    ctx.globalAlpha = 1.0;
    
    // ------------------------------------------------------------
    // 3. رسم المدارات (دوائر حول الشمس أو حول موقع الشمس في الوضع geo)
    // ------------------------------------------------------------
    var sunX_au = 0, sunY_au = 0;
    if (currentOrbitMode === "helio") {
        // في الوضع heliocentric، الشمس ثابتة عند (0,0)
        sunX_au = 0;
        sunY_au = 0;
    } else if (currentOrbitMode === "geo" && sunScreenPos !== null) {
        // في الوضع geocentric، الشمس متحركة في إحداثيات مركزية الأرض
        // sunScreenPos يحوي إحداثيات الشمس بالبكسل، نحتاج إلى إحداثياتها بوحدة AU
        // ولكننا نستخدم directly البكسل لعملية الرسم
    }
    
    // دالة لرسم دائرة مدارية حول نقطة معينة (بالبكسل)
    function drawOrbit(centerX_px, centerY_px, radius_au, color) {
        var radius_px = radius_au * scale;
        ctx.beginPath();
        ctx.arc(centerX_px, centerY_px, radius_px, 0, 2 * Math.PI);
        ctx.strokeStyle = color || "#555555";
        ctx.lineWidth = 0.8;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]); // إعادة تعيين
    }
    
    if (currentOrbitMode === "helio") {
        // رسم دوائر مدارية حول مركز الرسم (الشمس)
        for (var name in planetOrbitRadii) {
            var r = planetOrbitRadii[name];
            if (r > 0 && r < dynamicMaxDist) {
                drawOrbit(centerX, centerY, r, "#777777");
            }
        }
    } else if (currentOrbitMode === "geo" && sunScreenPos !== null) {
        // الوضع geocentric: نرسم المدارات حول موقع الشمس الحالي على الشاشة
        // sunScreenPos هو {x, y} بالبكسل من آخر تحديث
        for (var name in planetOrbitRadii) {
            var r = planetOrbitRadii[name];
            if (r > 0 && (r + Math.hypot(sunScreenPos.x - centerX, sunScreenPos.y - centerY) / scale) < dynamicMaxDist) {
                drawOrbit(sunScreenPos.x, sunScreenPos.y, r, "#777777");
            }
        }
    }
    
    // ------------------------------------------------------------
    // 4. رسم الجرم المركزي (الشمس أو الأرض) ونقطة مركز الرسم
    // ------------------------------------------------------------
    ctx.setLineDash([]);
    if (currentOrbitMode === "helio") {
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--canvas-sun').trim() || '#FDB813';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("الشمس", centerX - 12, centerY - 12);
    } else if (currentOrbitMode === "geo") {
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--canvas-earth').trim() || '#66D9EF';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("الأرض", centerX - 10, centerY - 10);
    }
    
    // ------------------------------------------------------------
    // 5. رسم الكواكب (باستخدام المصفوفة planetScreenPos)
    // ------------------------------------------------------------
    var planetColors = {
        'Sun': '--canvas-sun', 'Mercury': '--canvas-mercury', 'Venus': '--canvas-venus',
        'Earth': '--canvas-earth', 'Mars': '--canvas-mars', 'Jupiter': '--canvas-jupiter',
        'Saturn': '--canvas-saturn', 'Ceres': '--stel-warning', 'Pallas': '--stel-warning',
        'Juno': '--stel-warning', 'Vesta': '--stel-warning', 'Uranus': '--stel-info',
        'Neptune': '--stel-info', 'Pluto': '--stel-number'
    };
    
    for (var name in planetScreenPos) {
        var pos = planetScreenPos[name];
        if (!pos) continue;
        // لا نرسم الجرم المركزي مرة أخرى (الشمس أو الأرض) إذا كان ضمن القائمة
      //  if (currentOrbitMode === "helio" && name === 'Sun') continue;
       // if (currentOrbitMode === "geo" && name === 'Earth') continue;
        if (currentOrbitMode === "helio" && name === 'Sun') continue;  // الشمس ترسم كنقطة مركزية وليس ككوكب عادي
// لا نستبعد الأرض في الوضع helio
if (currentOrbitMode === "geo" && name === 'Earth') continue;   // في وضع geo، الأرض هي المركز ولا تُرسم ككرة منفصلة
        var colorVar = planetColors[name] || '--stel-accent';
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(colorVar).trim() || '#aaaaaa';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, (name === 'Jupiter' || name === 'Saturn') ? 6 : 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = "#CCCCCC";
        ctx.font = "10px sans-serif";
        ctx.fillText(name, pos.x - 12, pos.y - 8);
    }
    
    ctx.restore();
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