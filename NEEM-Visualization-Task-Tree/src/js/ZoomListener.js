const d3 = window.d3 || require('d3');
let svgGroup;

// define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents

exports.getZoomListener = (group) => {
    svgGroup = group;
    return d3.behavior.zoom().scaleExtent([0.1, 3]).on('zoom', zoom);
};

function zoom() {
    svgGroup.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
}