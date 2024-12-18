document.addEventListener('DOMContentLoaded', function () {
    // Initialize the map
    var map = L.map('map').setView([45.5017, -73.5673], 12); // Centered on Montreal

    // Add a tile layer to the map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Load the GeoJSON data
    fetch('data/bikelane-infra.json')
        .then(response => response.json())
        .then(data => {
            // Add the GeoJSON layer to the map
            L.geoJSON(data, {
                style: function (feature) {
                    return {
                        color: 'lightblue',
                        weight: 2
                    };
                }
            }).addTo(map);
        })
        .catch(error => console.error('Error loading the GeoJSON data:', error));
});