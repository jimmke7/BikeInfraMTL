document.addEventListener('DOMContentLoaded', () => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiamltbWtlNyIsImEiOiJjbHpxMXQyM20xZDR3MmtvYzVqYnY1eDN6In0.Tvu24VR5JIAAgEQ2CsD7ww';
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/jimmke7/cm5eo6wqk00t601s947g96fc6',
        // center: [-73.6, 45.5],
        center: [-73.51, 45.518],
        zoom: 11.5,
        interactive: true
    });

    map.addControl(new mapboxgl.NavigationControl());
    map.scrollZoom.enable();
    map.dragPan.enable();

    map.on('load', () => {
        d3.json('data/curated/bixi-stations-interval-counts.json')
            .then(data => {
                const svg = d3.select(map.getCanvasContainer()).append('svg')
                    .attr('class', 'map-overlay')
                    .style('position', 'absolute')
                    .style('top', 0)
                    .style('left', 0)
                    .style('width', '100%')
                    .style('height', '100%');

                const project = (d) => {
                    const p = map.project(new mapboxgl.LngLat(d[0], d[1]));
                    return [p.x, p.y];
                };

                const update = (filteredData) => {
                    const circles = svg.selectAll('circle')
                        .data(filteredData);

                    circles.enter().append('circle')
                        .attr('class', 'station-circle')
                        .merge(circles)
                        .attr('cx', d => project(d.geometry.coordinates)[0])
                        .attr('cy', d => project(d.geometry.coordinates)[1])
                        .attr('r', d => d3.scaleLinear().domain([0, 100]).range([2, 6])(Math.abs(d.properties.DELTACOUNT)))
                        .attr('fill', d => d.properties.DELTACOUNT > 0 ? 'rgba(83, 230, 145, 0.2)' : 'rgba(255, 0, 0, 0.2)')
                        .attr('stroke', d => d.properties.DELTACOUNT > 0 ? 'rgba(39, 174, 96, 0.7)' : 'rgba(255, 0, 0, 0.7)')
                        .attr('stroke-width', 3);

                    circles.exit().remove();
                };

                const timeIntervals = [...new Set(data.features.map(d => d.properties.TIMEINTERVAL))];
                timeIntervals.sort((a, b) => new Date(`1970-01-01T${a}`) - new Date(`1970-01-01T${b}`));
                let currentIndex = 0;
                let intervalId;

                const animate = () => {
                    const selectedTime = timeIntervals[currentIndex];
                    console.log(`Animating time interval: ${selectedTime}`);
                    const filteredData = data.features.filter(d => d.properties.TIMEINTERVAL === timeIntervals[currentIndex]);
                    update(filteredData);

                    // Update the time-display element
                    const timeDisplay = document.getElementById('time-display');
                    timeDisplay.textContent = timeIntervals[currentIndex].slice(0, 5);

                    // Update the range input value
                    const timeRange = document.getElementById('time-range');
                    timeRange.value = currentIndex;

                    currentIndex = (currentIndex + 1) % timeIntervals.length;
                };

                const animateButton = document.getElementById('animate-map-btn');
                animateButton.addEventListener('click', () => {
                    if (!intervalId) {
                        intervalId = setInterval(animate, 200); // Interval in milliseconds
                        animate();
                        animateButton.textContent = 'Stop';
                    } else {
                        clearInterval(intervalId);
                        intervalId = null;
                        animateButton.textContent = 'Animate Map';
                    }
                });

                const timeRange = document.getElementById('time-range');
                timeRange.addEventListener('input', (event) => {
                    currentIndex = parseInt(event.target.value, 10);
                    animate();
                });

                map.on('viewreset', () => animate());
                map.on('move', () => animate());
                map.on('moveend', () => animate());
            })
            .catch(error => console.error('Error loading the Bixi stations GeoJSON data:', error));
    });
});
