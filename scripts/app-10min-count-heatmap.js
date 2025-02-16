document.addEventListener('DOMContentLoaded', () => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiamltbWtlNyIsImEiOiJjbHpxMXQyM20xZDR3MmtvYzVqYnY1eDN6In0.Tvu24VR5JIAAgEQ2CsD7ww';
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/jimmke7/cm5eo6wqk00t601s947g96fc6',
        center: [-73.6, 45.5],
        zoom: 11.5,
        interactive: true
    });

    map.addControl(new mapboxgl.NavigationControl());
    map.scrollZoom.enable();
    map.dragPan.enable();

    map.on('load', () => {
        d3.json('data/curated/bixi-stations-interval-counts.json')
            .then(data => {
                map.addSource('bixi-stations-start', {
                    type: 'geojson',
                    data: null
                });

                map.addSource('bixi-stations-end', {
                    type: 'geojson',
                    data: null
                });

                map.addLayer({
                    id: 'bixi-heatmap-start',
                    type: 'heatmap',
                    source: 'bixi-stations-start',
                    paint: {
                        'heatmap-weight': [
                            'interpolate',
                            ['linear'],
                            ['get', 'DELTACOUNT'],
                            0, 0,
                            200, 1
                        ],
                        'heatmap-intensity': 1,
                        'heatmap-color': [
                            'interpolate',
                            ['linear'],
                            ['heatmap-density'],
                            0, 'rgba(0, 0, 255, 0)',
                            0.5, 'rgba(0, 255, 0, 0.2)',
                            1, 'rgba(0, 255, 0, 0.5)'
                        ],
                        'heatmap-radius': 40,
                        'heatmap-opacity': 0.8
                    }
                });

                map.addLayer({
                    id: 'bixi-heatmap-end',
                    type: 'heatmap',
                    source: 'bixi-stations-end',
                    paint: {
                        'heatmap-weight': [
                            'interpolate',
                            ['linear'],
                            ['abs', ['get', 'DELTACOUNT']], // Use absolute value to ensure positive delta counts
                            0, 0,
                            200, 1
                        ],
                        'heatmap-intensity': 1,
                        'heatmap-color': [
                            'interpolate',
                            ['linear'],
                            ['heatmap-density'],
                            0, 'rgba(255, 0, 0, 0)',
                            0.5, 'rgba(255, 0, 0, 0.2)',
                            1, 'rgba(255, 0, 0, 0.5)'
                        ],
                        'heatmap-radius': 40,
                        'heatmap-opacity': 0.8
                    }
                });

                const timeIntervals = [...new Set(data.features.map(d => d.properties.TIMEINTERVAL))];
                timeIntervals.sort((a, b) => new Date(`1970-01-01T${a}`) - new Date(`1970-01-01T${b}`));
                let currentIndex = 0;
                let intervalId;

                const animate = () => {
                    const selectedTime = timeIntervals[currentIndex];
                    console.log(`Animating time interval: ${selectedTime}`);
                    const filteredData = {
                        type: 'FeatureCollection',
                        features: data.features.filter(d => d.properties.TIMEINTERVAL === selectedTime)
                    };
                    const filteredDataStart = {
                        type: 'FeatureCollection',
                        features: filteredData.features.filter(d => d.properties.DELTACOUNT > 0)
                    };
                    const filteredDataEnd = {
                        type: 'FeatureCollection',
                        features: filteredData.features.filter(d => d.properties.DELTACOUNT < 0)
                    };

                    map.getSource('bixi-stations-start').setData(filteredDataStart);
                    map.getSource('bixi-stations-end').setData(filteredDataEnd);

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
