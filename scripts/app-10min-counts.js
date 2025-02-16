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
                // Filter the data to only include entries with a TIMEINTERVAL of "13:10:00"
                const filteredData = data.features.filter(d => d.properties.TIMEINTERVAL === "08:10:00");

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

                const update = () => {
                    const circles = svg.selectAll('circle')
                        .data(filteredData);

                    circles.enter().append('circle')
                        .attr('class', 'station-circle')
                        .merge(circles)
                        .attr('cx', d => project(d.geometry.coordinates)[0])
                        .attr('cy', d => project(d.geometry.coordinates)[1])
                        .attr('r', d => d3.scaleLinear().domain([0, 100]).range([2, 6])(d.properties.DELTACOUNT))
                        //.attr('fill', 'rgba(83, 230, 145, 0.2)')
                        .attr('fill', d => d.properties.DELTACOUNT > 0 ? 'rgba(83, 230, 145, 0.2)' : 'rgba(255, 0, 0, 0.2)')
                        //.attr('stroke', 'rgba(39, 174, 96, 0.7)')
                        .attr('stroke', d => d.properties.DELTACOUNT > 0 ? 'rgba(39, 174, 96, 0.7)' : 'rgba(255, 0, 0, 0.7)')
                        .attr('stroke-width', 3);

                    circles.exit().remove();
                };

                map.on('viewreset', update);
                map.on('move', update);
                map.on('moveend', update);

                update();
            })
            .catch(error => console.error('Error loading the Bixi stations GeoJSON data:', error));
    });
});
