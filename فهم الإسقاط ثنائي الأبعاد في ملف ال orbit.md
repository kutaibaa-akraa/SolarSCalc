## التحليل الدقيق لاتجاه المحاور في الرسم ثنائي الأبعاد

### 1. الوضع الحالي (هل الإسقاط صحيح؟)

في الكود الحالي، الإسقاط **معكوس** بالنسبة للمحور Y مقارنةً بالنظام الكارتيزي القياسي:

```javascript
// الكود الحالي في UpdateOrbitVisuals
screenY = centerY + pos.y * scale;
```

هذا يعني:
- **قيم Y الموجبة** تظهر **أسفل** مركز الرسم.
- **قيم Y السالبة** تظهر **فوق** مركز الرسم.

هذا ليس صحيحاً رياضياً ولا فلكياً للنظام القياسي، حيث يُفترض أن المحور Y الموجب يتجه للأعلى.

### 2. ماذا يعني هذا الاتجاه علمياً؟

- **الاتجاه الحالي (Y للأسفل)**: هذا يمثل **النظر من القطب الجنوبي** للمجموعة الشمسية (South Ecliptic Pole). في هذا المنظر، تدور الكواكب في اتجاه عقارب الساعة.
- **الاتجاه الصحيح (Y للأعلى)**: هذا يمثل **النظر من القطب الشمالي** (North Ecliptic Pole). هذا هو المنظر القياسي المعتمد في جميع خرائط وكالات الفضاء (NASA, ESA) والكتب المدرسية، حيث تدور الكواكب عكس اتجاه عقارب الساعة.

**لذا، يجب تعديل الكود ليتوافق مع المنظر القياسي من القطب الشمالي.**

---

## التعديل المطلوب في ملف `orbit.js` (ودالة التحديث في HTML)

### أ. تعديل دالة `UpdateOrbitVisuals` (في ملف HTML أو `orbit.js`)

استبدل `screenY = centerY + pos.y * scale;` بـ `screenY = centerY - pos.y * scale;`

```javascript
// التعديل المطلوب في UpdateOrbitVisuals
var screenY = centerY - pos.y * scale;  // عكس الإشارة لجعل Y للأعلى
```

### ب. تعديل دالة `redrawCanvas` في `orbit.js` (للمحاور والترقيم)

يجب تعديل كل مكان يستخدم `centerY + y * scale` ليصبح `centerY - y * scale`:

```javascript
// رسم الخطوط الأفقية (Y ثابت)
for (var y = -dynamicMaxDist; y <= dynamicMaxDist; y += stepAU) {
    var py = centerY - y * scale;  // تعديل هنا
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(canvas.width, py);
    ctx.stroke();
}

// رسم أرقام المحور Y
for (var y = -dynamicMaxDist; y <= dynamicMaxDist; y += stepAU) {
    if (Math.abs(y) < 0.01) continue;
    var py = centerY - y * scale;  // تعديل هنا
    ctx.fillText(y.toFixed(1), centerX + 4, py - 2);
}
```

### ج. إضافة معلومات توضيحية على الرسم (نظرة من القطب الشمالي)

أضف هذا النص في أعلى أو أسفل الـ Canvas ليوضح للمستخدم ما يراه:

```javascript
// داخل redrawCanvas، بعد رسم كل شيء:
ctx.fillStyle = "#AAAAAA";
ctx.font = "12px Arial";
ctx.textAlign = "center";
ctx.fillText("النظام الشمسي - منظر علوي (من القطب الشمالي)", canvas.width/2, 20);
ctx.fillText("المحور X (أحمر) ← →  |  المحور Y (أخضر) ↑ ↓", canvas.width/2, canvas.height - 10);
```

---

## الكود المعدل بالكامل لدالة `redrawCanvas` (القسم المتعلق بالمحاور)

```javascript
// ============================================================
// رسم المحاور والترقيم (بعد تعديل إشارة Y)
// ============================================================

// رسم الخطوط الأفقية (قيم Y ثابتة)
for (var y = -dynamicMaxDist; y <= dynamicMaxDist; y += stepAU) {
    var py = centerY - y * scale;   // Y الموجبة للأعلى
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(canvas.width, py);
    ctx.stroke();
}

// رسم الخطوط العمودية (قيم X ثابتة) - بدون تغيير لأن X تبقى كما هي
for (var x = -dynamicMaxDist; x <= dynamicMaxDist; x += stepAU) {
    var px = centerX + x * scale;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, canvas.height);
    ctx.stroke();
}

// ترقيم المحور X (يمين = موجب، يسار = سالب)
for (var x = -dynamicMaxDist; x <= dynamicMaxDist; x += stepAU) {
    if (Math.abs(x) < 0.01) continue;
    var px = centerX + x * scale;
    ctx.fillText(x.toFixed(1), px - 8, centerY - 4);
}

// ترقيم المحور Y (فوق = موجب، تحت = سالب)
for (var y = -dynamicMaxDist; y <= dynamicMaxDist; y += stepAU) {
    if (Math.abs(y) < 0.01) continue;
    var py = centerY - y * scale;   // Y الموجبة للأعلى
    ctx.fillText(y.toFixed(1), centerX + 4, py - 2);
}
```

---

## شرح التعديلات للمستخدم (ما ستضيفه في قسم التحديثات أو التوثيق)

> **تم تصحيح اتجاه المحور Y في الرسم ثنائي الأبعاد**: أصبحت القيم الموجبة للمحور Y تتجه إلى أعلى الشاشة، والقيم السالبة إلى أسفلها، ليتوافق الرسم مع المنظر القياسي للمجموعة الشمسية من **القطب الشمالي** (North Ecliptic Pole). هذا يعني أن حركة الكواكب تظهر عكس اتجاه عقارب الساعة، تماماً كما في خرائط وكالة ناسا والمراجع الفلكية المعتمدة. تم تحديث ترقيم المحاور ليعكس هذه القيم بدقة، مع إضافة تسمية توضيحية على الرسم تبين أن المنظر هو "منظر علوي من القطب الشمالي".

---

## التأكد النهائي من صحة الإسقاط

| العنصر | القيمة في الجدول | الموقع على الرسم (بعد التعديل) |
| :--- | :--- | :--- |
| **X موجب** | `x = 1.5` | يمين المركز |
| **X سالب** | `x = -1.5` | يسار المركز |
| **Y موجب** | `y = 1.2` | **أعلى** المركز (فوق المحور X) |
| **Y سالب** | `y = -1.2` | **أسفل** المركز (تحت المحور X) |

الآن أصبح الرسم دقيقاً تماماً ومطابقاً للمنظر القياسي من فوق القطب الشمالي للشمس، مما يسهل على المستخدم مقارنة القيم الرقمية في الجدول مع المواقع المرئية على الشاشة.