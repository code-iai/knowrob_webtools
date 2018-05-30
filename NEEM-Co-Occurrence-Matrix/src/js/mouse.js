const d3 = window.d3 || require('d3');
const utils = require('./utils');
exports.nodes = [];
let tooltip;

exports.mouseover = (p) => {
    if(!tooltip){
        initToolTip();
    }
    d3.selectAll('.row text').classed('active', (d, i) => {
        return d[0].x == p.x;
    });
    d3.selectAll('.column text').classed('active', (d, i) => {
        return d == p.y;
    });

    let columnNode = exports.nodes[p.y];
    let rowNode = exports.nodes[p.x];

    tooltip.transition().duration(200).style('opacity', .9);
    tooltip.html(utils.capitalize_Words(columnNode.name) + ' [' + utils.intToGroup(columnNode.group) + ']</br>' +
        utils.capitalize_Words(rowNode.name) + ' [' + utils.intToGroup(rowNode.group) + ']</br>' +
        p.z)
        .style('left', (d3.event.pageX + 30) + 'px')
        .style('top', (d3.event.pageY - 50) + 'px');

}

exports.mouseout = () => {
    if(!tooltip){
        initToolTip();
    }

    d3.selectAll('text').classed('active', false);
    tooltip.transition().duration(500).style('opacity', 0);
};

function initToolTip(){
    tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
}

