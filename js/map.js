// map.js - خريطة Leaflet لاختيار الموقع
var map, marker;
var isMapInitialized = false;

function initMap() {
    if (isMapInitialized) return;
    var latInput = document.getElementById('latInput');
    var lngInput = document.getElementById('lngInput');
    var lat = parseFloat(latInput.value) || 33.5138;
    var lng = parseFloat(lngInput.value) || 36.2765;
    
    map = L.map('locationMap').setView([lat, lng], 5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    
    marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    marker.on('dragend', function(e) {
        var pos = marker.getLatLng();
        latInput.value = pos.lat.toFixed(6);
        lngInput.value = pos.lng.toFixed(6);
        if (typeof onLocationChange === 'function') onLocationChange();
    });
    
    map.on('click', function(e) {
        marker.setLatLng(e.latlng);
        latInput.value = e.latlng.lat.toFixed(6);
        lngInput.value = e.latlng.lng.toFixed(6);
        if (typeof onLocationChange === 'function') onLocationChange();
    });
    isMapInitialized = true;
}

function updateMapMarker(lat, lng) {
    if (map && marker) {
        marker.setLatLng([lat, lng]);
        map.setView([lat, lng], map.getZoom());
    }
}

// دالة لربط تغيير الموقع من الخريطة بنظام الإحداثيات الأصلي
function onLocationChange() {
    var lat = parseFloat(document.getElementById('latInput').value);
    var lng = parseFloat(document.getElementById('lngInput').value);
    if (isNaN(lat) || isNaN(lng)) return;
    var ns = document.getElementById('latNS').value;
    var ew = document.getElementById('lngEW').value;
    var finalLat = (ns === 'S') ? -Math.abs(lat) : Math.abs(lat);
    var finalLng = (ew === 'W') ? -Math.abs(lng) : Math.abs(lng);
    
    document.getElementById('GeoLat_Value').value = Math.abs(finalLat).toFixed(5);
    document.getElementById('GeoLat_NS').value = finalLat >= 0 ? 'N' : 'S';
    document.getElementById('GeoLong_Value').value = Math.abs(finalLng).toFixed(5);
    document.getElementById('GeoLong_EW').value = finalLng >= 0 ? 'E' : 'W';
    
    if (typeof OnGeoLatLongChange === 'function') OnGeoLatLongChange();
    if (typeof CommitGeographicCoordinates === 'function') CommitGeographicCoordinates();
    if (typeof CalculateSolarSystem === 'function') CalculateSolarSystem();
}

window.initMap = initMap;
window.updateMapMarker = updateMapMarker;
window.onLocationChange = onLocationChange;