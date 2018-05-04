const d3 = window.d3 || require('d3');
const taskTreeConfiguration = require('./Configuration');
const duration = taskTreeConfiguration.duration;

// define a d3 diagonal projection for use by the node paths later on.
const diagonal = d3.svg.diagonal()
    .projection((d) => {
        return [d.y, d.x];
    });

exports.appendNewLinks = (svgGroup,links,source) =>{
    let link = svgGroup.selectAll('path.link')
        .data(links,(d) => {
            return d.target.id;
        });

    // Enter any new links at the parent's previous position.
    link.enter().insert('path', 'g')
        .attr('class', 'link')
        .attr('d', () => {
            let o = {
                x: source.x0,
                y: source.y0
            };
            return diagonal({
                source: o,
                target: o
            });
        });

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr('d', diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr('d', () => {
            let o = {
                x: source.x,
                y: source.y
            };
            return diagonal({
                source: o,
                target: o
            });
        })
        .remove();

};