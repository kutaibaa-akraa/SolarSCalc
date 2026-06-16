// تم اقتطاع هذا الملف من الصفحة الرئيسية solar_system.html و هي تقوم بالحسابات الفلكية للمجموعة الشمسية 
// 18 - 09 - 2016 قتيبة أقرع 
// تم تعديل دوال الوقت والتاريخ لتعمل بشكل صحيح مع التحديث التلقائي

var Flag_RealTimeUpdate = true;
var CartesianCoordinateType = null;
var CartesianCoordinateColor = { 'geocentric': "#cfffcf", 'heliocentric': "#ffff9f", 'none':"#000000" };
var AngularCoordinateType = "equatorial";
var AngularCoordinateColor = { 'equatorial': "#ccff80", 'ecliptic': "ffdf80", 'horizontal': "ccccff" };
var AstroDateTime = new Date();
var GeographicLatitude = null;
var GeographicLongitude = null;
var GeographicElevationInMeters = 0.0;
var COOKIE_EXPIRATION_DAYS = 3650;
var SelectedBody = null;

var RowBackgroundTable = {};
var CellSuffix = ['_name', '_x', '_y', '_z', '_distance', '_mag', '_SA', '_const', '_RA', '_DEC'];
var NameCurrentlyHighlighted = null;

function $(id) { return document.getElementById(id); }

function OnRowMouseEvent(e) {
    var id = null;
    var flavor = null;

    if (e && e.target && e.target) {
        id = e.target.id;
        flavor = e.type;
    } else if (window && window.event && window.event.srcElement) {
        id = window.event.srcElement.id;
        flavor = window.event.type;
    }

    if (id && flavor) {
        var name = id.replace(/_.*$/, "");
        var row = $(name + "_row");
        if (row) {
            var bg = RowBackgroundTable[row.id];
            if (bg != null) {
                var color = bg[flavor];
                if (color != null) {
                    NameCurrentlyHighlighted = (flavor == "mouseover") ? name : null;
                    for (var i = 0; i < CellSuffix.length; ++i) {
                        var cell = $(name + CellSuffix[i]);
                        if (cell) cell.style.backgroundColor = color;
                    }
                    HilightColors();
                }
            }
        }
    }
}

function InsertRow(table, id) {
    var row = $(id);
    if (row == null) {
        row = table.insertRow(table.rows.length);
        row.id = id;
        if (row.addEventListener) {
            row.addEventListener('mouseover', OnRowMouseEvent, false);
            row.addEventListener('mouseout', OnRowMouseEvent, false);
        } else if (row.attachEvent) {
            row.attachEvent('onmouseover', OnRowMouseEvent);
            row.attachEvent('onmouseout', OnRowMouseEvent);
        }
        RowBackgroundTable[id] = { 'mouseout': '', 'mouseover': '#787860' };
    }
    return row;
}

function SetAngleMode(mode) {
    AngleMode = mode;
    WriteCookie("AngleDisplayMode", mode, COOKIE_EXPIRATION_DAYS);
    CalculateSolarSystem();
}

function InsertCell(table, row, id, className, s) {
    var cell = $(id);
    if (cell == null) {
        cell = row.insertCell(row.cells.length);
        cell.className = className;
        cell.id = id;
    }
    cell.innerHTML = s;
    return cell;
}

function AddRowForCelestialBody(p, day) {
    var planetTable = $('planetTable');
    var pc = null;
    var distance = null;

    switch (CartesianCoordinateType) {
        case "heliocentric":
            distance = p.DistanceFromSun(day);
            pc = p.EclipticCartesianCoordinates(day);
            break;
        case "geocentric":
            distance = p.DistanceFromEarth(day);
            pc = p.GeocentricCoordinates(day);
            break;
        case "none":
            distance = 0.0;
            pc = { 'x': 0.0, 'y': 0.0, 'z': 0.0 };
            break;
        default:
            throw ("Internal error - unknown cartesian coordinate type '" + CartesianCoordinateType + "'");
    }

    var location = new GeographicCoordinates(GeographicLongitude, GeographicLatitude, GeographicElevationInMeters);
    var mag = (p.Name == "Earth") ? "&nbsp;" : p.VisualMagnitude(day).toFixed(2);
    var sunAngle = (p.Name == "Earth") ? "&nbsp;" : Astronomy.AngleWithSunInDegrees(p, day).toFixed(1) + "&deg;";

    var row = InsertRow(planetTable, p.Name + "_row");
    var PRECISION = 7;
    var raHtml = "&nbsp;";
    var decHtml = "&nbsp;";
    var eq = null;
    var constellation = "&nbsp;";

    if (p.Name != "Earth") {
        eq = p.EquatorialCoordinates(day, location);
        constellation = HtmlConstellation(eq);
        constellation = "<div style='text-align:center;' id='" + p.Name + "_constdiv'>" + constellation + "</div>";
    }

    switch (AngularCoordinateType) {
        case "equatorial":
            if (p.Name != "Earth") {
                raHtml = HtmlRightAscension(eq.longitude);
                decHtml = HtmlDeclination(eq.latitude);
            }
            break;
        case "ecliptic":
            if (p.Name != 'Sun') {
                var ec = p.EclipticAngularCoordinates(day);
                raHtml = HtmlDeclination(ec.longitude);
                decHtml = HtmlDeclination(ec.latitude);
            }
            break;
        case "horizontal":
            if (p.Name != "Earth") {
                var hc = p.HorizontalCoordinates(day, location);
                raHtml = HtmlDeclination(hc.azimuth);
                decHtml = HtmlDeclination(hc.altitude);
            }
            break;
        default:
            throw ("Internal error - unknown angular coordinate type '" + AngularCoordinateType + "'");
    }

    var nameTextColor = NakedEyeObjects[p.Name] ? "#000000" : "#808060";
    InsertCell(planetTable, row, p.Name + "_name", "", "<div style='text-align:center; color:" + nameTextColor + ";' id='" + p.Name + "_namediv'>" + p.Name + "</div>");
    InsertCell(planetTable, row, p.Name + "_x", "NumericData", pc.x.toFixed(PRECISION));
    InsertCell(planetTable, row, p.Name + "_y", "NumericData", pc.y.toFixed(PRECISION));
    InsertCell(planetTable, row, p.Name + "_z", "NumericData", pc.z.toFixed(PRECISION));
    InsertCell(planetTable, row, p.Name + "_distance", "NumericData", distance.toFixed(PRECISION));
    InsertCell(planetTable, row, p.Name + "_mag", "SmallNumericData", mag);
    InsertCell(planetTable, row, p.Name + "_SA", "SmallNumericData", sunAngle);
    InsertCell(planetTable, row, p.Name + "_const", "SmallNumericData", constellation);
    InsertCell(planetTable, row, p.Name + "_RA", "NumericData", raHtml);
    InsertCell(planetTable, row, p.Name + "_DEC", "NumericData", decHtml);
}
/*
function HilightColors() {
    var bgColorSun = "";
    var bgColorEarth = "";
    var coordDisplay = "";
    switch (CartesianCoordinateType) {
        case "heliocentric":
            bgColorSun = CartesianCoordinateColor[CartesianCoordinateType];
            break;
        case "geocentric":
            bgColorEarth = CartesianCoordinateColor[CartesianCoordinateType];
            break;
        case "none":
            coordDisplay = "none";
            break;
        default:
            throw ("Internal error - don't know how to highlight colors for '" + CartesianCoordinateType + "'");
    }

    if (NameCurrentlyHighlighted != 'Sun') {
        $('Sun_name').style.backgroundColor = bgColorSun;
        $('Sun_x').style.backgroundColor = bgColorSun;
        $('Sun_y').style.backgroundColor = bgColorSun;
        $('Sun_z').style.backgroundColor = bgColorSun;
        $('Sun_distance').style.backgroundColor = bgColorSun;
    }
    $('row_Heliocentric').style.backgroundColor = bgColorSun;

    if (NameCurrentlyHighlighted != "Earth") {
        $('Earth_name').style.backgroundColor = bgColorEarth;
        $('Earth_x').style.backgroundColor = bgColorEarth;
        $('Earth_y').style.backgroundColor = bgColorEarth;
        $('Earth_z').style.backgroundColor = bgColorEarth;
        $('Earth_distance').style.backgroundColor = bgColorEarth;
    }
    $('row_Geocentric').style.backgroundColor = bgColorEarth;

    $('row_Ecliptic').style.backgroundColor = (AngularCoordinateType == "ecliptic") ? AngularCoordinateColor[AngularCoordinateType] : "";
    $('row_Equatorial').style.backgroundColor = (AngularCoordinateType == "equatorial") ? AngularCoordinateColor[AngularCoordinateType] : "";
    $('row_Horizontal').style.backgroundColor = (AngularCoordinateType == "horizontal") ? AngularCoordinateColor[AngularCoordinateType] : "";

    $('th_Angle1').style.backgroundColor = AngularCoordinateColor[AngularCoordinateType];
    $('th_Angle2').style.backgroundColor = AngularCoordinateColor[AngularCoordinateType];

    var suffix = ["_x", "_y", "_z", "_distance"];
    for (var i in Astronomy.Body) {
        var p = Astronomy.Body[i];
        for (var j in suffix) {
            $(p.Name + suffix[j]).style.display = coordDisplay;
        }
    }
    for (var j in suffix) {
        $("th" + suffix[j]).style.display = coordDisplay;
    }
    $("Earth_row").style.display = coordDisplay;
}
*/

function HilightColors() {
    // دالة مساعدة لتعديل الخلفية بأمان
    function setBg(id, color) {
        var el = $(id);
        if (el) el.style.backgroundColor = color;
    }
    function setDisplay(id, display) {
        var el = $(id);
        if (el) el.style.display = display;
    }

    var bgColorSun = "";
    var bgColorEarth = "";
    var coordDisplay = "";
    switch (CartesianCoordinateType) {
        case "heliocentric":
            bgColorSun = CartesianCoordinateColor[CartesianCoordinateType];
            break;
        case "geocentric":
            bgColorEarth = CartesianCoordinateColor[CartesianCoordinateType];
            break;
        case "none":
            coordDisplay = "none";
            break;
        default:
            throw ("Internal error - don't know how to highlight colors for '" + CartesianCoordinateType + "'");
    }

    if (NameCurrentlyHighlighted != 'Sun') {
        setBg('Sun_name', bgColorSun);
        setBg('Sun_x', bgColorSun);
        setBg('Sun_y', bgColorSun);
        setBg('Sun_z', bgColorSun);
        setBg('Sun_distance', bgColorSun);
    }
    setBg('row_Heliocentric', bgColorSun);

    if (NameCurrentlyHighlighted != "Earth") {
        setBg('Earth_name', bgColorEarth);
        setBg('Earth_x', bgColorEarth);
        setBg('Earth_y', bgColorEarth);
        setBg('Earth_z', bgColorEarth);
        setBg('Earth_distance', bgColorEarth);
    }
    setBg('row_Geocentric', bgColorEarth);

    setBg('row_Ecliptic', (AngularCoordinateType == "ecliptic") ? AngularCoordinateColor[AngularCoordinateType] : "");
    setBg('row_Equatorial', (AngularCoordinateType == "equatorial") ? AngularCoordinateColor[AngularCoordinateType] : "");
    setBg('row_Horizontal', (AngularCoordinateType == "horizontal") ? AngularCoordinateColor[AngularCoordinateType] : "");

    setBg('th_Angle1', AngularCoordinateColor[AngularCoordinateType]);
    setBg('th_Angle2', AngularCoordinateColor[AngularCoordinateType]);

    var suffix = ["_x", "_y", "_z", "_distance"];
    for (var i in Astronomy.Body) {
        var p = Astronomy.Body[i];
        for (var j in suffix) {
            setDisplay(p.Name + suffix[j], coordDisplay);
        }
    }
    for (var j in suffix) {
        setDisplay("th" + suffix[j], coordDisplay);
    }
    setDisplay("Earth_row", coordDisplay);
}

function CalculateSolarSystem() {
    var day = Astronomy.DayValue(AstroDateTime);
    var text = "<code>" + AstroDateTime.toString() + "</code><br/>";
    text += "<code>عدد الأيام بدءا من تاريخ 01/01/2000 = " + day.toFixed(5) + "</code><br/>";
    $('divDateTime').innerHTML = text;

    $('th_x').title = CartesianCoordinateType + " x-coordinate in AU";
    $('th_y').title = CartesianCoordinateType + " y-coordinate in AU";
    $('th_z').title = CartesianCoordinateType + " z-coordinate in AU";

    $('th_x').style.backgroundColor = CartesianCoordinateColor[CartesianCoordinateType];
    $('th_y').style.backgroundColor = CartesianCoordinateColor[CartesianCoordinateType];
    $('th_z').style.backgroundColor = CartesianCoordinateColor[CartesianCoordinateType];
    $('th_distance').style.backgroundColor = CartesianCoordinateColor[CartesianCoordinateType];

    $('th_x').innerHTML = CartesianCoordinateType.charAt(0).toUpperCase() + "<sub>x</sub>";
    $('th_y').innerHTML = CartesianCoordinateType.charAt(0).toUpperCase() + "<sub>y</sub>";
    $('th_z').innerHTML = CartesianCoordinateType.charAt(0).toUpperCase() + "<sub>z</sub>";

    for (var i in Astronomy.Body) {
        AddRowForCelestialBody(Astronomy.Body[i], day);
    }

    HilightColors();
    CalculateSelectedBody(day);
    OnVisibilityChange();

    if (typeof UpdateOrbitVisuals === 'function') {
        UpdateOrbitVisuals();
    }
		// تحديث العرض الثلاثي الأبعاد إذا كان مفعلاً
		if (typeof is3DMode !== 'undefined' && is3DMode && typeof updatePlanetsPositions3D === 'function') {
				updatePlanetsPositions3D();
		}
}

var BriefDayOfWeek = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function BriefTimeString(date) {
    if (date == null) return "";
    var h = date.getHours();
    h = ((h < 10) ? "0" : "") + h.toString();
    var m = date.getMinutes();
    m = ((m < 10) ? "0" : "") + m.toString();
    var s = date.getSeconds();
    s = ((s < 10) ? "0" : "") + s.toString();
    return BriefDayOfWeek[date.getDay()] + " " + h + ":" + m + ":" + s;
}

function BriefDayValueString(day) {
    if (day == null) return "";
    return BriefTimeString(Astronomy.DayValueToDate(day));
}

function ResetSelectedBodyEvents() {
    if (SelectedBody != null) {
        SelectedBody = { 'Body': SelectedBody.Body };
    }
}

function CalculateSelectedBody(day) {
    if (SelectedBody != null) {
        var location = new GeographicCoordinates(GeographicLongitude, GeographicLatitude, GeographicElevationInMeters);
        if (SelectedBody.NextRiseTime == null || SelectedBody.NextRiseTime < day) {
            SelectedBody.NextRiseTime = Astronomy.NextRiseTime(SelectedBody.Body, day, location);
        }
        if (SelectedBody.NextSetTime == null || SelectedBody.NextSetTime < day) {
            SelectedBody.NextSetTime = Astronomy.NextSetTime(SelectedBody.Body, day, location);
        }
        if (SelectedBody.NextCulmTime == null || SelectedBody.NextCulmTime < day) {
            SelectedBody.NextCulmTime = Astronomy.NextCulmTime(SelectedBody.Body, day, location);
        }
        $('divRiseTime').innerHTML = BriefDayValueString(SelectedBody.NextRiseTime);
        $('divCulmTime').innerHTML = BriefDayValueString(SelectedBody.NextCulmTime);
        $('divSetTime').innerHTML = BriefDayValueString(SelectedBody.NextSetTime);
    }
}

function OnSelectBody() {
    var select = $('selectBody');
    var name = select.options[select.selectedIndex].value;
    SelectObjectForExtraInfo(name);
}

// ===================== دوال التاريخ والوقت المعدلة (تم إصلاحها) =====================

function ReflectDateTime(date) {
    $('edit_Year').value = date.getFullYear();
    $('edit_Month').value = 1 + date.getMonth();
    $('edit_Day').value = date.getDate();
    $('edit_Hour').value = date.getHours();
    $('edit_Minute').value = date.getMinutes();
    $('edit_Second').value = date.getSeconds();
}

function EnableDisableDateControls(enable) {
    $('edit_Year').disabled = !enable;
    $('edit_Month').disabled = !enable;
    $('edit_Day').disabled = !enable;
    $('edit_Hour').disabled = !enable;
    $('edit_Minute').disabled = !enable;
    $('edit_Second').disabled = !enable;
    $('button_SubtractOneDay').disabled = !enable;
    $('button_AddOneDay').disabled = !enable;
    $('button_SetDateTime').disabled = true;
}

function OnCheckBoxRealTime() {
    Flag_RealTimeUpdate = $('checkbox_RealTime').checked;
    EnableDisableDateControls(!Flag_RealTimeUpdate);
    WriteCookie("RealTimeMode", Flag_RealTimeUpdate.toString(), COOKIE_EXPIRATION_DAYS);

    if (Flag_RealTimeUpdate) {
        AstroDateTime = new Date();
        ReflectDateTime(AstroDateTime);
        ResetSelectedBodyEvents();
        CalculateSolarSystem();
    } else {
        var date = ParseDateTime();
        if (date != null) {
            SetUpdatedDateTime(date);
        } else {
            AstroDateTime = new Date();
            ReflectDateTime(AstroDateTime);
            CalculateSolarSystem();
        }
    }
}

// متغيرات التحكم في سرعة محاكاة الزمن
var TimeSpeed = 1.0;           // مضاعف السرعة (1 = الوقت الحقيقي، 10 = أسرع 10 مرات، 0.1 = أبطأ 10 مرات)
var IsPaused = false;          // حالة الإيقاف المؤقت
var LastTimerUpdate = Date.now(); // تستخدم لحساب الفرق الزمني بدقة

function Timer() {
    try {
        if (Flag_RealTimeUpdate) {
            var now = Date.now();
            var deltaSeconds = (now - LastTimerUpdate) / 1000.0;
            LastTimerUpdate = now;
            
            // منع القفزات الكبيرة عند العودة إلى علامة التبويب بعد فترة
            if (deltaSeconds > 5.0) {
                deltaSeconds = 0.1;
            }
            
            if (IsPaused) {
                // الوقت متوقف: لا نقوم بتحديث AstroDateTime
                // نعيد ضبط LastTimerUpdate لمنع تراكم الفارق عند استئناف التشغيل
                LastTimerUpdate = Date.now();
            } else if (TimeSpeed === 1.0) {
                // الوضع الحقيقي: نأخذ الوقت الفعلي من النظام
                AstroDateTime = new Date();
            } else {
                // وضع المحاكاة: نضيف الفارق الزمني مضروباً في عامل السرعة
                var deltaMilliseconds = deltaSeconds * TimeSpeed * 1000.0;
                var newTime = AstroDateTime.getTime() + deltaMilliseconds;
                AstroDateTime = new Date(newTime);
            }
            
            // تحديث حقول الإدخال وإعادة الحساب
            ReflectDateTime(AstroDateTime);
            CalculateSolarSystem();
        }
    } catch(e) {
        console.error("خطأ في Timer: " + e.message);
    }
    // استدعاء الدالة كل 50 مللي ثانية للحصول على انسيابية عالية
    setTimeout(Timer, 50);
}

// تعيين سرعة محددة
function setTimeSpeed(speed) {
    TimeSpeed = speed;
    IsPaused = false; // إلغاء الإيقاف المؤقت تلقائياً عند تغيير السرعة
    LastTimerUpdate = Date.now(); // إعادة ضبط التوقيت لمنع القفزات
    UpdateSpeedDisplay(); // تحديث عرض السرعة (الدالة أدناه)
}

// تبديل حالة الإيقاف المؤقت (تشغيل/إيقاف)
function togglePause() {
    IsPaused = !IsPaused;
    if (!IsPaused) {
        LastTimerUpdate = Date.now(); // إعادة ضبط التوقيت عند الاستئناف
    }
    UpdatePauseButton(); // تحديث مظهر الزر
}

// العودة إلى الوقت الحقيقي وإعادة ضبط السرعة إلى 1x
function resetToCurrentTime() {
    AstroDateTime = new Date();
    TimeSpeed = 1.0;
    IsPaused = false;
    LastTimerUpdate = Date.now();
    ReflectDateTime(AstroDateTime);
    CalculateSolarSystem();
    UpdateSpeedDisplay();
    UpdatePauseButton();
}

// تحديث عرض السرعة (اختياري)
function UpdateSpeedDisplay() {
    var display = document.getElementById('speedDisplay');
    if (display) {
        display.innerText = (IsPaused) ? '⏸' : TimeSpeed + 'x';
    }
}

// تحديث زر الإيقاف المؤقت
function UpdatePauseButton() {
    var btn = document.getElementById('btnPause');
    if (btn) {
        btn.innerText = IsPaused ? '▶️' : '⏸️';
        btn.title = IsPaused ? 'استئناف الزمن' : 'إيقاف الزمن مؤقتاً';
    }
}

function OnDateTimeDirty() {
    if (!Flag_RealTimeUpdate) {
        $('button_SetDateTime').disabled = false;
    }
}

function BindDateTimeInputEvents() {
    var inputs = ['edit_Year', 'edit_Month', 'edit_Day', 'edit_Hour', 'edit_Minute', 'edit_Second'];
    for (var i = 0; i < inputs.length; i++) {
        var el = $(inputs[i]);
        if (el) {
            el.onchange = OnDateTimeDirty;
            el.onkeyup = OnDateTimeDirty;
        }
    }
}

// ===================== دوال تحليل التاريخ والوقت (الأصلية) =====================

function ParseDateTimeBox(id, min, max) {
    var rv = null;
    var s = $(id).value;
    if (/^\d+$/.test(s)) {
        var n = parseInt(s, 10);
        if (!isNaN(n) && (n >= min) && (n <= max)) rv = n;
    }
    if (rv == null) {
        var box = id.replace(/^edit_/, "").toLowerCase();
        alert("The " + box + " value is not valid. It must be an integer between " + min + " and " + max + ", inclusive.");
        $(id).focus();
    }
    return rv;
}

function SaveDateTime(d) {
    var cookieText = d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getHours() + "/" + d.getMinutes() + "/" + d.getSeconds();
    WriteCookie("AstroDateTime", cookieText, COOKIE_EXPIRATION_DAYS);
}

function LoadDateTime() {
    var d = new Date();
    var cookieText = ReadCookie("AstroDateTime", "");
    if (cookieText != "") {
        var a = cookieText.split(/\//);
        if (a.length == 6) {
            d.setFullYear(parseInt(a[0], 10));
            d.setMonth(parseInt(a[1], 10) - 1);
            d.setDate(parseInt(a[2], 10));
            d.setHours(parseInt(a[3], 10));
            d.setMinutes(parseInt(a[4], 10));
            d.setSeconds(parseInt(a[5], 10));
            d.setMilliseconds(0);
        }
    }
    return d;
}

function ParseDateTime() {
    var year = ParseDateTimeBox('edit_Year', 1000, 3000);
    if (year == null) return null;
    var month = ParseDateTimeBox('edit_Month', 1, 12);
    if (month == null) return null;
    var day = ParseDateTimeBox('edit_Day', 1, 31);
    if (day == null) return null;
    var hour = ParseDateTimeBox('edit_Hour', 0, 23);
    if (hour == null) return null;
    var minute = ParseDateTimeBox('edit_Minute', 0, 59);
    if (minute == null) return null;
    var second = ParseDateTimeBox('edit_Second', 0, 59);
    if (second == null) return null;

    var date = new Date();
    date.setFullYear(year);
    date.setMonth(month - 1);
    date.setDate(day);
    date.setHours(hour);
    date.setMinutes(minute);
    date.setSeconds(second);
    date.setMilliseconds(0);
    return date;
}

function SetUpdatedDateTime(date) {
    AstroDateTime = date;
    $('button_SetDateTime').disabled = true;
    SaveDateTime(AstroDateTime);
    ResetSelectedBodyEvents();
    CalculateSolarSystem();
}

function OnSetDateTime() {
    var date = ParseDateTime();
    if (date != null) SetUpdatedDateTime(date);
}

function AddDays(d) {
    var date = ParseDateTime();
    if (date != null) {
        date.setDate(date.getDate() + d);
        ReflectDateTime(date);
        SetUpdatedDateTime(date);
    }
}

// ===================== بقية الدوال (الفلاتر، التفاصيل، الراديو، تحميل الخيارات) =====================

var NakedEyeObjects = {
    'Sun': true, 'Moon': true, 'Mercury': true, 'Venus': true,
    'Earth': true, 'Mars': true, 'Jupiter': true, 'Saturn': true
};

function OnVisibilityChange() {
    var day = Astronomy.DayValue(AstroDateTime);
    var location = new GeographicCoordinates(GeographicLongitude, GeographicLatitude, GeographicElevationInMeters);
    var hideBelowHorizon = $('checkbox_RisenObjectsOnly').checked;
    var hideDimObjects = $('checkbox_BrightObjectsOnly').checked;
    var showComets = $('checkbox_ShowComets').checked;
    var showMinor = $('checkbox_ShowMinor').checked;

    for (var i = 0; i < Astronomy.Body.length; ++i) {
        var p = Astronomy.Body[i];
        if (p.Name != "Earth") {
            var row = $(p.Name + "_row");
            var shouldHideThisBody = false;
            if (hideBelowHorizon) {
                var hc = p.HorizontalCoordinates(day, location);
                if (hc.altitude < 0.0) shouldHideThisBody = true;
            }
            if (hideDimObjects && !NakedEyeObjects[p.Name]) shouldHideThisBody = true;
            if (!showComets && (p.BodyType == 'comet')) shouldHideThisBody = true;
            if (!showMinor && (p.BodyType == 'minor')) shouldHideThisBody = true;
            row.style.display = shouldHideThisBody ? "none" : "";
        }
    }

    WriteCookie("RisenObjectsOnly", (hideBelowHorizon ? "true" : "false"), COOKIE_EXPIRATION_DAYS);
    WriteCookie("BrightObjectsOnly", (hideDimObjects ? "true" : "false"), COOKIE_EXPIRATION_DAYS);
}

function WriteSkyChart(body, location, doc) {
    var when = new Date();
    when.setFullYear(AstroDateTime.getFullYear());
    when.setMonth(AstroDateTime.getMonth());
    when.setDate(AstroDateTime.getDate());
    when.setHours(0, 0, 0, 0);
    doc.writeln("<h3>جدول بقيم الارتفاع/الانحراف الزاوي بتاريخ<br/> " + when.toLocaleDateString() + "</h3>");
    doc.writeln("<table style='text-align:right; font-family:Monospace;'>");
    doc.write("<tr>");
    doc.write("<td style='width:6em;'>Time</td>");
    doc.write("<td style='width:10em;'>Azimuth</td>");
    doc.write("<td style='width:10em;'>Elevation</td>");
    doc.writeln("</tr>");

    var TIME_STEP_MINUTES = 5;
    var NUM_TIME_STEPS = Math.round((24 * 60) / TIME_STEP_MINUTES);
    var hours = 0;
    var minutes = 0;
    var printing = true;
    for (var i = 0; i < NUM_TIME_STEPS; ++i) {
        when.setHours(hours, minutes, 0, 0);
        var day = Astronomy.DayValue(when);
        var timeString = ((hours < 10) ? "0" : "") + hours + ":" + ((minutes < 10) ? "0" : "") + minutes;
        var hc = body.HorizontalCoordinates(day, location);
        if (hc.altitude >= -1.5) {
            if (!printing) {
                doc.writeln("<tr><td>&nbsp;</td></tr>");
                printing = true;
            }
            doc.write("<tr>");
            doc.write("<td>" + timeString + "</td>");
            doc.write("<td>" + HtmlDeclination(hc.azimuth) + "</td>");
            doc.write("<td>" + HtmlDeclination(hc.altitude) + "</td>");
            doc.writeln("</tr>");
        } else {
            printing = false;
        }
        minutes += TIME_STEP_MINUTES;
        if (minutes >= 60) {
            minutes = 0;
            if (++hours >= 24) break;
        }
    }
    doc.writeln("</table>");
}

function OnDetailsButton() {
    if (SelectedBody != null && SelectedBody.Body != null) {
        var location = new GeographicCoordinates(GeographicLongitude, GeographicLatitude, GeographicElevationInMeters);
        var body = SelectedBody.Body;
        var w = window.open("", "CelestialBodyDetails");
        if (w != null && w.document != null) {
            var doc = w.document;
            doc.writeln("<html><head><title>" + SelectedBody.Body.Name + " details</title></head><body>");
            doc.writeln("<h2>تفاصيل حول " + SelectedBody.Body.Name + "</h2>");
            WriteSkyChart(body, location, doc);
            doc.writeln("</body></html>");
            doc.close();
        } else {
            alert("Error creating new browser window.");
        }
    } else {
        alert("No celestial body is selected.");
    }
}

function OnRadioButton_Cartesian(id) {
    switch (id) {
        case "rb_Cartesian_Heliocentric": CartesianCoordinateType = "heliocentric"; break;
        case "rb_Cartesian_Geocentric": CartesianCoordinateType = "geocentric"; break;
        case "rb_Cartesian_None": CartesianCoordinateType = "none"; break;
        default: throw ("Internal error - unknown radio button '" + id + "'");
    }
    WriteCookie("CartesianCoordinateType", id.substring("rb_Cartesian_".length), COOKIE_EXPIRATION_DAYS);
    CalculateSolarSystem();
}

function OnRadioButton_Angular(id) {
    var toolTip1, toolTip2, header1, header2;
    switch (id) {
        case "rb_Angular_Ecliptic":
            AngularCoordinateType = "ecliptic";
            toolTip1 = "Ecliptic longitude.";
            toolTip2 = "Ecliptic latitude.";
            header1 = '<a href="http://en.wikipedia.org/wiki/Ecliptic_longitude" target="_blank">طول بروجي</a>';
            header2 = '<a href="http://en.wikipedia.org/wiki/Ecliptic_latitude" target="_blank">عرض بروجي</a>';
            break;
        case "rb_Angular_Equatorial":
            AngularCoordinateType = "equatorial";
            toolTip1 = "Right Ascension in sidereal hours.";
            toolTip2 = "Declination in angular degrees.";
            header1 = '<a href="http://en.wikipedia.org/wiki/Right_ascension" target="_blank">مطلع مستقيم<br/> ( RA )</a>';
            header2 = '<a href="http://en.wikipedia.org/wiki/Declination" target="_blank">الميل <br/> ( DEC )</a>';
            break;
        case "rb_Angular_Horizontal":
            AngularCoordinateType = "horizontal";
            toolTip1 = "Compass direction clockwise from North.";
            toolTip2 = "Angle above the horizon.";
            header1 = '<a href="http://en.wikipedia.org/wiki/Horizontal_coordinate_system" target="_blank">انحراف زاوي</a>';
            header2 = '<a href="http://en.wikipedia.org/wiki/Horizontal_coordinate_system" target="_blank">ارتفاع</a>';
            break;
        default: throw ("Internal error - unknown radio button '" + id + "'");
    }
    $('th_Angle1').title = toolTip1;
    $('th_Angle2').title = toolTip2;
    $('th_Angle1').innerHTML = header1;
    $('th_Angle2').innerHTML = header2;
    WriteCookie("AngularCoordinateType", id.substring("rb_Angular_".length), COOKIE_EXPIRATION_DAYS);
    CalculateSolarSystem();
}

function LoadOption_Cartesian() {
    var radioButtonId = "rb_Cartesian_" + ReadCookie("CartesianCoordinateType", "Heliocentric");
    switch (radioButtonId) {
        case "rb_Cartesian_Heliocentric": case "rb_Cartesian_Geocentric": case "rb_Cartesian_None": break;
        default: radioButtonId = "rb_Cartesian_Heliocentric"; break;
    }
    $(radioButtonId).checked = true;
    OnRadioButton_Cartesian(radioButtonId);
}

function LoadOption_Angular() {
    var radioButtonId = "rb_Angular_" + ReadCookie("AngularCoordinateType", "Equatorial");
    switch (radioButtonId) {
        case "rb_Angular_Equatorial": case "rb_Angular_Horizontal": case "rb_Angular_Ecliptic": break;
        default: radioButtonId = "rb_Angular_Equatorial"; break;
    }
    $(radioButtonId).checked = true;
    OnRadioButton_Angular(radioButtonId);
}

function LoadOption_AngleMode() {
    var angleDisplayMode = ReadCookie("AngleDisplayMode", "dms");
    switch (angleDisplayMode) {
        case "dmm": case "dms": case "decimal": break;
        default: angleDisplayMode = "dms"; break;
    }
    var radioButtonId = "rb_AngleMode_" + angleDisplayMode;
    $(radioButtonId).checked = true;
    SetAngleMode(angleDisplayMode);
}

function LoadOption_RealTime() {
    var realTimeEnabled = (ReadCookie("RealTimeMode", "true") == "true");
    if (!realTimeEnabled) {
        AstroDateTime = LoadDateTime();
        ReflectDateTime(AstroDateTime);
    } else {
        AstroDateTime = new Date();
        ReflectDateTime(AstroDateTime);
    }
    $('checkbox_RealTime').checked = realTimeEnabled;
    OnCheckBoxRealTime(); // يضبط الحالة والأزرار ويحسب البيانات
}

function LoadOption_BrightObjectsOnly() {
    var brightOnly = (ReadCookie("BrightObjectsOnly", "false") == "true");
    $('checkbox_BrightObjectsOnly').checked = brightOnly;
}

function LoadOption_RisenObjectsOnly() {
    var risenOnly = (ReadCookie("RisenObjectsOnly", "false") == "true");
    $('checkbox_RisenObjectsOnly').checked = risenOnly;
}

function SelectObjectForExtraInfo(name) {
    var body = Astronomy[name];
    if (body == null || body.Name == null || body.Name != name) {
        throw "Internal error: invalid object selected: '" + name + "'";
    } else {
        WriteCookie("SelectedCelestialBody", name, COOKIE_EXPIRATION_DAYS);
        SelectedBody = { 'Body': body };
        CalculateSolarSystem();
    }
}

function LoadOption_SelectedObject() {
    var name = ReadCookie("SelectedCelestialBody", 'Sun');
    if (!Astronomy.IsBodyName(name) || (name == "Earth")) name = 'Sun';
    var select = $('selectBody');
    for (var i = 0; i < select.options.length; ++i) {
        if (select.options[i].value == name) {
            select.selectedIndex = i;
            SelectObjectForExtraInfo(name);
            return;
        }
    }
    alert("LoadOption_SelectedObject(): could not find option for '" + name + "'");
}

// ===================== دالة التهيئة الرئيسية (تم إصلاحها) =====================

function InitPage() {
    LoadOption_Cartesian();
    LoadOption_Angular();
    LoadOption_AngleMode();
    LoadOption_RealTime();       // تحميل وضع الوقت (تلقائي/يدوي) وتعيين القيم
    LoadGeographicCoordinates();
    LoadOption_SelectedObject();
    LoadOption_BrightObjectsOnly();
    LoadOption_RisenObjectsOnly();

    BindDateTimeInputEvents();   // ربط أحداث حقول الوقت لتفعيل زر "تعيين"
    OnVisibilityChange();        // تطبيق الفلاتر
    Timer();                     // بدء المؤتمر الذي يعمل كل ثانية
}