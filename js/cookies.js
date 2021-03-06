// cookies.js  -  Adaptation by Don Cross  http://cosinekitty.com
// Original version of these functions came from:   http://www.quirksmode.org/js/cookies.html
// I modified these to escape/unescape value strings automatically.

function WriteCookie (name, value, days) 
{
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        expires = "; expires="+date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = name + "=" + escape(value) + expires + "; path=/";
}

function ReadCookie (name, valueIfAbsent) 
{
    var ca = document.cookie.split(/;\s*/);
    for (var i in ca) {
        var pair = ca[i].split(/=/);
        if (pair[0] == name) {
            return unescape(pair[1]);
        }
    }
    return valueIfAbsent;
}

function EraseCookie (name) 
{
    createCookie(name,"",-1);
}

function GetCookieNameList()        // Don Cross wrote this one!
{
    var list = document.cookie.split (/=[^;]*;?\s*/);
    if (list[list.length-1] == "") {
        --list.length;
    }
    return list;
} 

/*
    $Log: cookies.js,v $
    Revision 1.3  2008/02/17 21:46:12  Don.Cross
    Now the user can edit his geographic coordinates and save them in a cookie.
    The format is allowed to be either decimal or dd:mm:ss.
    Whichever format the user enters, we display feedback in the opposite format.

    Revision 1.2  2008/02/17 20:17:32  Don.Cross
    Changed function names to begin with upper case letters.

    Revision 1.1  2008/02/17 20:16:18  Don.Cross
    Re-usable cookies functions.

*/