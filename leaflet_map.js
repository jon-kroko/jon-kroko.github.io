// Initialize Leaflet map in HTML element "map" (https://leafletjs.com/)
var map = L.map('map').setView([20, -20], 2);

// Add satellite images as map layer
var satelliteLayer = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/satellite-streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoiam9uLWtyb2tvIiwiYSI6ImNraTh1ZjZiMTA5ZDkycHBqMWI3OHczNTUifQ.88PVNiIZ-IHwPHv71zlPsw'
}).addTo(map);


// Add earthquakes to map - async because we need to wait for the HTTP response
var earthquakeLayer = new L.layerGroup().addTo(map);
url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
document.getElementById("earthquake_data_url").href = url;
const fetchEarthquakeData = async () => {
    let response = await fetch(url);
    if (response.ok) {
        let json = await response.json();
        for (let i = 0; i < json.features.length; i++) {
            L.marker([
                    json.features[i].geometry.coordinates[1],   // latitude
                    json.features[i].geometry.coordinates[0]])  // longitude
                .on('dblclick', () => shake(json.features[i].properties.mag))
                .bindPopup(
                    "<b>Place: </b>" + json.features[i].properties.place +
                    "<br><b>Magnitude: </b>" + json.features[i].properties.mag +
                    "<br><b>Time: </b>" + new Date(json.features[i].properties.time))
                .addTo(earthquakeLayer);
        }
        console.log("Fetched earthquake data");
    } else {
        alert("HTTP-Error: " + response.status);
    }
}


// Add continental boundaries to map
var boundaryLayer = L.geoJSON().addTo(map);
var boundariesUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";
const fetchContinentalBoundaries = async () => {
    let response = await fetch(boundariesUrl);
    if (response.ok) {
        let json = await response.json();
        for (let i = 0; i < json.features.length; i++) {
            boundaryLayer.addData(json.features[i]);
        }
        console.log("Fetched continental boundaries");
    } else {
        alert("HTTP-Error: " + response.status);
    }
}


// Animate earthquake
function shake(magnitude) {
    var el = document.getElementById("animatable");

    // Set up magic numbers - they can be changed to prettify the animation
    var max_frames = 100;       // Animation duration in frames
    var refresh_interval = 20;  // In milliseconds
    var speed = 0.42;           // Stretch/compress the curve on the time axis
    var amplifier = 0.03 * window.innerHeight; // Make the shaking visible
    // Superlinear function makes magnitude differences more perceptible
    var mag_factor = Math.pow(magnitude, 2);

    var current_frame = 0;
    var anim = setInterval(animate, refresh_interval);

    function animate() {
        if (current_frame >= max_frames) {
            clearInterval(anim);    // End animation
            el.style.top = '0px';   // Reset position
        } else {
            current_frame++;

            // Decrease max. amplitude with time to end the animation smoothly
            var damp_factor = ((max_frames - current_frame) / max_frames);

            // Use sinus to create harmonic oscillation as a baseline
            el.style.top = Math.sin(current_frame * speed) *
                mag_factor * amplifier * damp_factor + 'px';
        }
    }
}


// Enable the user to make continental boundaries and earthquakes (in)visible
function addMapLayerControls() {
    L.control.layers(
        { "Satellite": satelliteLayer },
        { "Earthquakes": earthquakeLayer, "Continental Boundaries": boundaryLayer },
        { collapsed: true }
    ).addTo(map);
}



// Execute all the stuff defined before
fetchEarthquakeData();
fetchContinentalBoundaries();
addMapLayerControls();
