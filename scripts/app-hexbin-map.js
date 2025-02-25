document.addEventListener('DOMContentLoaded', () => {
    // Initialize Mapbox GL JS map
    mapboxgl.accessToken = 'pk.eyJ1IjoiamltbWtlNyIsImEiOiJjbHpxMXQyM20xZDR3MmtvYzVqYnY1eDN6In0.Tvu24VR5JIAAgEQ2CsD7ww';
    const map = new mapboxgl.Map({
        container: 'map', // Make sure this matches the ID of your map element
        style: 'mapbox://styles/jimmke7/cm5eo6wqk00t601s947g96fc6',
        center: [-73.51, 45.518], // Center to Montreal
        zoom: 11.8,
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

    const hexbin = d3.hexbin()
        .radius(15)
        .extent([[0, 0], [svgContainer.clientWidth, svgContainer.clientHeight]]);

    Promise.all([
        d3.json('data/curated/city-area-focus.json'),
        d3.json('data/curated/bixi-stations-interval-counts.json')
    ]).then(([cityData, bixiData]) => {
        console.log('Data loaded:', { cityData, bixiData }); // Console log when data is loaded

        const cityPolygon = cityData.features[0].geometry.coordinates[0];

        // Generate a grid of points within the bounding box of the city
        const [minLng, minLat] = d3.geoBounds(cityData)[0];
        const [maxLng, maxLat] = d3.geoBounds(cityData)[1];
        const points = [];

        for (let lng = minLng; lng <= maxLng; lng += 0.001) {
            for (let lat = minLat; lat <= maxLat; lat += 0.001) {
                if (d3.polygonContains(cityPolygon, [lng, lat])) {
                    const coords = project([lng, lat]);
                    points.push([coords.x, coords.y]);
                }
            }
        }

        const hexbinData = hexbin(points);

        // Function to update hexbin data and render hexagons
        const updateHexagons = (filteredBixiData) => {
            // Sum the delta counts for Bixi stations within each hexagon
            hexbinData.forEach(hex => {
                hex.deltaCount = 0;
                filteredBixiData.forEach(station => {
                    const coords = project([station.geometry.coordinates[0], station.geometry.coordinates[1]]);
                    if (hex.x - hexbin.radius() <= coords.x && coords.x <= hex.x + hexbin.radius() &&
                        hex.y - hexbin.radius() <= coords.y && coords.y <= hex.y + hexbin.radius()) {
                        hex.deltaCount += station.properties.DELTACOUNT;
                    }
                });
            });

            // Determine the maximum delta count for scaling opacity
            const maxDeltaCount = d3.max(hexbinData, d => Math.abs(d.deltaCount));

            const paths = g.selectAll("path").data(hexbinData);

            paths.enter().append("path")
                .merge(paths)
                .attr("d", hexbin.hexagon())
                .attr("transform", d => `translate(${d.x},${d.y})`)
                .attr("fill", d => d.deltaCount > 0 ? "green" : "red")
                .attr("fill-opacity", d => 0.5 * Math.abs(d.deltaCount) / maxDeltaCount)
                .attr("stroke", "#333333")
                .attr("stroke-opacity", 0.7);

            paths.exit().remove();
        };

        // Function to update the SVG dimensions and position on map events
        let animationFrameId;
        const update = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            animationFrameId = requestAnimationFrame(() => {
                const bounds = map.getBounds();
                const topLeft = project([bounds.getWest(), bounds.getNorth()]);
                const bottomRight = project([bounds.getEast(), bounds.getSouth()]);

                svg.attr("width", bottomRight.x - topLeft.x)
                    .attr("height", bottomRight.y - topLeft.y)
                    .style("left", `${topLeft.x}px`)
                    .style("top", `${topLeft.y}px`);

                g.attr("transform", `translate(${-topLeft.x},${-topLeft.y})`);

                const points = [];
                for (let lng = minLng; lng <= maxLng; lng += 0.001) {
                    for (let lat = minLat; lat <= maxLat; lat += 0.001) {
                        if (d3.polygonContains(cityPolygon, [lng, lat])) {
                            const coords = project([lng, lat]);
                            points.push([coords.x, coords.y]);
                        }
                    }
                }

                const hexbinData = hexbin(points);

                // Define filteredBixiData based on the current time interval
                const filteredBixiData = bixiData.features.filter(d => d.properties.TIMEINTERVAL === timeIntervals[currentIntervalIndex]);

                // Sum the delta counts for Bixi stations within each hexagon
                hexbinData.forEach(hex => {
                    hex.deltaCount = 0;
                    filteredBixiData.forEach(station => {
                        const coords = project([station.geometry.coordinates[0], station.geometry.coordinates[1]]);
                        if (hex.x - hexbin.radius() <= coords.x && coords.x <= hex.x + hexbin.radius() &&
                            hex.y - hexbin.radius() <= coords.y && coords.y <= hex.y + hexbin.radius()) {
                            hex.deltaCount += station.properties.DELTACOUNT;
                        }
                    });
                });

                const paths = g.selectAll("path").data(hexbinData);

                paths.enter().append("path")
                    .merge(paths)
                    .attr("d", hexbin.hexagon())
                    .attr("transform", d => `translate(${d.x},${d.y})`)
                    .attr("fill", d => d.deltaCount > 0 ? "#008000" : "#FF0000") // Green: #008000, Red: #FF0000
                    .attr("fill-opacity", d => 0.5 * Math.abs(d.deltaCount) / maxDeltaCount)
                    .attr("stroke", "#333333")
                    .attr("stroke-opacity", 0.7);

                paths.exit().remove();
            });
        };

        // Initial update
        update();

        // Update on map events
        map.on("viewreset", update);
        map.on("move", update);
        map.on("moveend", update);
        map.on("zoom", update); // Add zoom event listener

        // Animation functionality
        let currentIntervalIndex = 0;
        const timeIntervals = Array.from(new Set(bixiData.features.map(d => d.properties.TIMEINTERVAL))).sort();
        let animationInterval;

        const animate = () => {
            const filteredBixiData = bixiData.features.filter(d => d.properties.TIMEINTERVAL === timeIntervals[currentIntervalIndex]);
            updateHexagons(filteredBixiData);
            currentIntervalIndex = (currentIntervalIndex + 1) % timeIntervals.length;

            // Update the range input value
            const timeRange = document.getElementById('time-range');
            timeRange.value = currentIntervalIndex;

            // Update the time display
            const timeDisplay = document.getElementById('time-display');
            timeDisplay.textContent = timeIntervals[currentIntervalIndex].slice(0, 5);
        };

        document.getElementById('animate-map-btn').addEventListener('click', () => {
            if (animationInterval) {
                clearInterval(animationInterval);
            }
            animationInterval = setInterval(animate, 200);
        });
    }).catch(error => console.error('Error loading the data:', error));
});
