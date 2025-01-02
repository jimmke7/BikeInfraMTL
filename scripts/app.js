document.addEventListener('DOMContentLoaded', function () {
    // Initialize Mapbox GL JS map
    mapboxgl.accessToken = 'pk.eyJ1IjoiamltbWtlNyIsImEiOiJjbHpxMXQyM20xZDR3MmtvYzVqYnY1eDN6In0.Tvu24VR5JIAAgEQ2CsD7ww';
    const map = new mapboxgl.Map({
        container: 'map', // Make sure this matches the ID of your map element
        style: 'mapbox://styles/jimmke7/cm5eo6wqk00t601s947g96fc6',
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

    // Define a color mapping for each SEPARATEUR_DESC category
    const colorMapping = {
        'Délinéateur': 'orange',
        'Mail': 'blue',
        'Marquage au sol': 'red',
        'Stationnement': 'purple',
        'Surélévation': 'pink',
        'Other': '#3BBA9C'
    };

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
                .attr("class", "bike-lane-path")
                .style("stroke", d => colorMapping[d.properties.SEPARATEUR_DESC] || '#3BBA9C'); // Apply colors based on SEPARATEUR_DESC

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

    // Create a legend
    const legendContainer = d3.select("body").append("div")
        .attr("class", "legend-container")
        .style("position", "absolute")
        .style("top", "10px")
        .style("right", "10px")
        .style("background", "white")
        .style("padding", "10px")
        .style("border", "1px solid black");

    const legend = legendContainer.selectAll(".legend-item")
        .data(Object.entries(colorMapping))
        .enter().append("div")
        .attr("class", "legend-item")
        .style("margin-bottom", "5px");

    legend.append("span")
        .style("display", "inline-block")
        .style("width", "20px")
        .style("height", "20px")
        .style("background-color", d => d[1])
        .style("margin-right", "5px");

    legend.append("span")
        .text(d => d[0]);
});