document.addEventListener('DOMContentLoaded', function () {
    // Initialize Mapbox GL JS map
    mapboxgl.accessToken = 'pk.eyJ1IjoiamltbWtlNyIsImEiOiJjbHpxMXQyM20xZDR3MmtvYzVqYnY1eDN6In0.Tvu24VR5JIAAgEQ2CsD7ww';
    const map = new mapboxgl.Map({
        container: 'map', // Make sure this matches the ID of your map element
        style: 'mapbox://styles/jimmke7/cm5eo6wqk00t601s947g96fc6',
        center: [-73.6, 45.5], // Note: Longitude first, then latitude
        zoom: 11.5,
        interactive: true // Enable zooming and dragging
    });

    // Add zoom and rotation controls to the map.
    map.addControl(new mapboxgl.NavigationControl());

    // Enable scroll zoom and drag pan
    map.scrollZoom.enable();
    map.dragPan.enable();

    const svgContainer = document.getElementById('map');
    const svg = d3.select(svgContainer).append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .style("position", "absolute")
        .style("top", 0)
        .style("left", 0);

    const g = svg.append("g").attr("class", "mapbox-zoom-hide");

    // Function to project latitude and longitude to pixel coordinates
    function project(d) {
        const point = map.project(new mapboxgl.LngLat(d[0], d[1]));
        return point;
    }

    // Define a D3 line generator
    const line = d3.line()
        .curve(d3.curveCardinal) // Apply a curve to the line to smoothen
        .x(d => project(d).x)
        .y(d => project(d).y);

    // Load the GeoJSON data for bike lanes
    fetch('data/raw/bikelane-infra.json')
        .then(response => response.json())
        .then(data => {
            // Draw the GeoJSON lines
            const paths = g.selectAll("path")
                .data(data.features)
                .enter().append("path")
                .attr("d", d => line(d.geometry.coordinates))
                .attr("class", "bike-lane-path")
                .attr("stroke", d => {
                    if (d.properties.REV_AVANCEMENT_CODE === 'PE') {
                        return '#00a5cf'; // Blue for PE
                    }
                    if (d.properties.TYPE_VOIE_CODE === '7') {
                        return '#5c44ec'; // Purple for multi-use path
                    }
                    if (d.properties.TYPE_VOIE_CODE === '5') {
                        return '#085c2c'; // Green - code 5 == Cycle path on its own lane (Piste cyclable en site propre)
                    }
                    return d.properties.SEPARATEUR_CODE && d.properties.SEPARATEUR_CODE.trim() !== '' ? '#085c2c': '#88cc4c'; // Green for non-blank SEPARATEUR_CODE, Light green for others
                })
                .attr("stroke-width", d => {
                    if (d.properties.REV_AVANCEMENT_CODE === 'PE') {
                        return 4; // REV bike path
                    }
                    if (d.properties.TYPE_VOIE_CODE === '5' || d.properties.TYPE_VOIE_CODE === '7') {
                        return 3; // multi-use path or cycle path on its own lane
                    }
                    if (d.properties.SEPARATEUR_CODE && d.properties.SEPARATEUR_CODE.trim() !== '') {
                        return 2; // Thicker line for multi-use path
                    }
                    return 1;
                })
                .on("click", function(event, d) {
                    console.log(d.properties.ID_CYCL);
                });

            // Update the SVG dimensions and position on map events
            const update = () => {
                const bounds = map.getBounds();
                const topLeft = project([bounds.getWest(), bounds.getNorth()]);
                const bottomRight = project([bounds.getEast(), bounds.getSouth()]);

                svg.attr("width", bottomRight.x - topLeft.x)
                    .attr("height", bottomRight.y - topLeft.y)
                    .style("left", `${topLeft.x}px`)
                    .style("top", `${topLeft.y}px`);

                g.attr("transform", `translate(${-topLeft.x},${-topLeft.y})`);

                paths.attr("d", d => line(d.geometry.coordinates));
            };

            // Initial update
            update();

            // Update on map events
            map.on("viewreset", update);
            map.on("move", update);
            map.on("moveend", update);
            map.on("zoom", update); // Add zoom event listener
        })
        .catch(error => console.error('Error loading the GeoJSON data:', error));

    // Ensure the map is fully loaded before adding layers
    map.on('load', function () {
        // Load the GeoJSON data for Bixi stations
        fetch('data/curated/bixi_stations_distance.geojson')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Add the Bixi stations to the map
                map.addSource('bixi-stations', {
                    'type': 'geojson',
                    'data': data
                });

                map.addLayer({
                    'id': 'bixi-stations-layer',
                    'type': 'fill',
                    'source': 'bixi-stations',
                    'layout': {},
                    'paint': {
                        'fill-color': '#5c44ec',
                        'fill-opacity': [
                            'interpolate',
                            ['linear'],
                            ['get', 'distance'], // Assuming 'distance' is the property in your GeoJSON data
                            0, 0.01, // Minimum distance with minimum opacity
                            1000, 0.2 // Maximum distance with higher opacity
                        ]
                    }
                });

                map.addLayer({
                    'id': 'bixi-stations-outline',
                    'type': 'line',
                    'source': 'bixi-stations',
                    'layout': {},
                    'paint': {
                        'line-color': '#5c44ec',
                        'line-opacity': 0.8,
                        'line-width': 2
                    }
                });
            })
            .catch(error => console.error('Error loading the Bixi stations GeoJSON data:', error));
    });
});