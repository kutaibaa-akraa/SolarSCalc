var AngleMode = "dms";
var RegExp_Float = /^\d+(\.\d*)?([eE][\+\-]?\d+)?$/;

function $(id)
{
    return document.getElementById (id);
}

function HtmlRightAscension (ra, mode)
{
    if (mode == null) {
        mode = AngleMode;
    }
    
    switch (mode) {
        case "dms":
            var dms = Angle.DMS (ra);
            if (dms.negative) {
                throw "Encountered negative right ascension!  " + ra;
            }
            var hours   = (dms.degrees < 10 ? "0" : "") + dms.degrees.toString();
            var minutes = (dms.minutes < 10 ? "0" : "") + dms.minutes.toString();
            var seconds = (dms.seconds < 10 ? "0" : "") + dms.seconds.toFixed(1);
            var s = hours + "<sup class='UnitSup'>h</sup>&nbsp;" + minutes + "<sup class='UnitSup'>m</sup>&nbsp;" + seconds + "<sup class='UnitSup'>s</sup>";
            return s;
            
        case "dmm":
            var dms = Angle.DMM (ra);
            if (dms.negative) {
                throw "Encountered negative right ascension!  " + ra;
            }
            var hours   = (dms.degrees < 10 ? "0" : "") + dms.degrees.toString();
            var minutes = (dms.minutes < 10 ? "0" : "") + dms.minutes.toFixed(2);            
            var s = hours + "<sup class='UnitSup'>h</sup>&nbsp;" + minutes + "<sup class='UnitSup'>m</sup>";
            return s;
            
        case "decimal":
            return ra.toFixed(5) + "<sup class='UnitSup'>h</sup>";
            
        default:
            throw "HtmlRightAscension:  Unknown angle mode '" + mode + "'";
    }    
}

function HtmlDeclination (dec, mode)
{
    if (mode == null) {
        mode = AngleMode;
    }
    
    switch (mode) {
        case "dms":
            var dms = Angle.DMS (dec);
            var s = dms.negative ? "&minus;" : "&nbsp;";
            if (dms.degrees < 100) {
                s += "0";
            }
            var hours   = (dms.degrees < 10 ? "0" : "") + dms.degrees.toString();
            var minutes = (dms.minutes < 10 ? "0" : "") + dms.minutes.toString();
            var seconds = (dms.seconds < 10 ? "0" : "") + dms.seconds.toFixed(1);
            s += hours + "&deg;&nbsp;" + minutes + "'&nbsp;" + seconds + "&quot;";
            return s;

        case "dmm":
            var dms = Angle.DMM (dec);
            var s = dms.negative ? "&minus;" : "&nbsp;";
            if (dms.degrees < 100) {
                s += "0";
            }
            var hours   = (dms.degrees < 10 ? "0" : "") + dms.degrees.toString();
            var minutes = (dms.minutes < 10 ? "0" : "") + dms.minutes.toFixed(2);
            s += hours + "&deg;&nbsp;" + minutes + "'&nbsp;";
            return s;

        case "decimal":
            return dec.toFixed(5) + "&deg;";
            
        default:
            throw "HtmlDeclination:  Unknown angle mode '" + mode + "'";                
    }
}

function HtmlConstellation (eq)
{
    var c = Astronomy.FindConstellation (eq);
    if (c == null) {
        return "<span title='Cannot determine constellation'>???</span>";
    } else {
        var verboseName = ConstellationByConciseName[c.ConciseName].FullName;
        return "<span title='" + verboseName + "'>" + c.ConciseName + "</span>";
    }
}

function ShowAngleFeedback (divName, value, editName)
{
    var isDMS = ($(editName).value.indexOf(":") >= 0);
    var feedback;
    if (isDMS) {
        feedback = HtmlDeclination (value, "decimal");
    } else {
        feedback = HtmlDeclination (value, "dms");
    }
    $(divName).innerHTML = '&nbsp;&nbsp;' + feedback;        
}

function CommitGeographicCoordinates()
{
    // إصلاح: تمرير max = 90 لخط العرض، 180 لخط الطول
    var lat = ParseAngle ($('GeoLat_Value').value, 90);
    var lon = ParseAngle ($('GeoLong_Value').value, 180);

    if (lat == null) {
        alert ("خط العرض الذي أدخلته غير صحيح. يجب أن يكون بين 0 و 90 درجة. يمكنك إدخاله بصيغة عشرية أو بصيغة dd:mm:ss.");
        $('GeoLat_Value').focus();
        return false;
    }
    
    if (lon == null) {
        alert ("خط الطول الذي أدخلته غير صحيح. يجب أن يكون بين 0 و 180 درجة. يمكنك إدخاله بصيغة عشرية أو بصيغة dd:mm:ss.");
        $('GeoLong_Value').focus();
        return false;
    }
    
    if ($('GeoLat_NS').selectedIndex == 1) {
        lat *= -1.0;
    }
    
    if ($('GeoLong_EW').selectedIndex == 0) {
        lon *= -1.0;
    }            

    GeographicLatitude = lat;
    GeographicLongitude = lon;
    ShowAngleFeedback ('GeoLat_Feedback',  lat, 'GeoLat_Value');
    ShowAngleFeedback ('GeoLong_Feedback', lon, 'GeoLong_Value');
    return true;
}

function SaveGeographicCoordinates()
{
    if (CommitGeographicCoordinates()) {
        var expiration = 3650;
        WriteCookie ("GeographicLatitudeValue",  $('GeoLat_Value').value,  expiration);
        WriteCookie ("GeographicLongitudeValue", $('GeoLong_Value').value, expiration);
        WriteCookie ("GeographicLatitudeDirection",  (($('GeoLat_NS') .selectedIndex == 0) ? "N" : "S"), expiration);
        WriteCookie ("GeographicLongitudeDirection", (($('GeoLong_EW').selectedIndex == 0) ? "W" : "E"), expiration);
        $('SaveButton').disabled = true;
    }
}

function LoadGeographicCoordinates()
{
    // استخدام إحداثيات مدينة حلب كقيم افتراضية صحيحة
    $('GeoLat_Value').value  = ReadCookie ("GeographicLatitudeValue",  "36.189100");
    $('GeoLong_Value').value = ReadCookie ("GeographicLongitudeValue", "37.134990");
    $('GeoLat_NS').selectedIndex  = ReadCookie("GeographicLatitudeDirection","N")  == "N" ? 0 : 1;
    $('GeoLong_EW').selectedIndex = ReadCookie("GeographicLongitudeDirection","E") == "E" ? 1 : 0;
    CommitGeographicCoordinates();
}

function OnGeoLatLongChange()
{
    $('SaveButton').disabled = false;
}

function ParseAngle (s, max)
{
    // max يجب أن يكون رقمًا موجبًا (90 لخط العرض، 180 لخط الطول)
    if (typeof max !== 'number' || max <= 0) {
        console.error("ParseAngle: invalid max value", max);
        return null;
    }
    var array = s.split(/\s*:\s*/);
    if (array.length >= 1 && array.length <= 3) {
        var denom = 1.0;
        var angle = 0.0;
        for (var i=0; i < array.length; ++i) {
            if (!RegExp_Float.test(array[i])) {
                return null;
            }
            var x = parseFloat (array[i]);
            if (isNaN(x)) {
                return null;
            }
            if (x < 0) {
                return null;
            }
            if (i > 0 && x >= 60.0) {
                return null;
            }
            angle += x / denom;
            denom *= 60.0;
        }
        if (angle < 0.0 || angle > max) {
            return null;
        }
        return angle;
    }
    return null;
}

/*
    $Log: astro_helper.js,v $
    Revision 1.3  2009/03/08 00:02:10  Don.Cross
    My C# astro.exe (compiled as sun.exe) now has a "javascript" option that generates constellation.js.
    This new constellation.js file contains the data needed for constellation calculation based on equatorial coordinates.
    I updated my astronomy.js code to allow use of this data to determine a constellation.
    The page solar_system.html uses this now to show the concise constellation symbol for each celestial body.

    Revision 1.2  2008/04/06 21:16:09  Don.Cross
    Users seem confused when confronted with the colon-notation the first time entering geographic coordinates.
    I am changing the default to a real location (Cambridge, MA) but making it decimal instead of dd:mm:ss.

    Revision 1.1  2008/02/22 23:11:29  Don.Cross
    Starting to work on graphical sky view in JavaScript.
    Factored out some code for managing user's geographic location in cookies and form elements
     from solar_system.html into new file astro_helper.js.
    Adding star_catalog.js, which was translated from text file by my GenStarMapJS.exe program.

*/