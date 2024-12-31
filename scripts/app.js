document.addEventListener('DOMContentLoaded', function () {
    // Initialize Mapbox GL JS map
    mapboxgl.accessToken = 'pk.eyJ1IjoiamltbWtlNyIsImEiOiJjbHpxMXQyM20xZDR3MmtvYzVqYnY1eDN6In0.Tvu24VR5JIAAgEQ2CsD7ww';
    const map = new mapboxgl.Map({
        container: 'map', // Make sure this matches the ID of your map element
        style: 'mapbox://styles/jimmke7/clzq419ef00cd01pdf5nyf92j',
        center: [-73.5650, 45.4950], // Note: Longitude first, then latitude
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

    // Load the GeoJSON data
    fetch('data/raw/bikelane-infra.json')
        .then(response => response.json())
        .then(data => {
            // Draw the GeoJSON lines
            const paths = g.selectAll("path")
                .data(data.features)
                .enter().append("path")
                .attr("d", d => line(d.geometry.coordinates))
                .attr("class", d => {
                    if (d.properties.SEPARATEUR_DESC === 'Mail') {
                        return "bike-lane-path debug-bike-lane-path";
                    }
                    return "bike-lane-path";
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
});