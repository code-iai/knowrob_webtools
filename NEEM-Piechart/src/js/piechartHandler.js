const d3 = window.d3 || require('d3');
const config = require('./configuration');

let div;

let color = d3.scale.ordinal()
    .range(['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56']);

let arc = d3.svg.arc()
    .outerRadius(config.radius - 10)
    .innerRadius(config.radius - 70);

let pie = d3.layout.pie()
    .sort(null)
    .startAngle(1.1*Math.PI)
    .endAngle(3.1*Math.PI)
    .value(function(d) { return d.total; });

exports.displayPiechart = (pieData, pieContainerId, onClickCallback) => {
    div = d3.select(pieContainerId).append('div').attr('class', 'toolTip');

    let svg = d3.select(pieContainerId).append('svg')
        .attr('width', config.width)
        .attr('height', config.width)
        .append('g')
        .attr('transform', 'translate(' + config.width / 2 + ',' + config.height / 2 + ')');


    let g = svg.selectAll('.arc')
        .data(pie(pieData))
        .enter().append('g')
        .attr('class', 'arc');

    g.append('path')
        .style('fill', function(d) { return color(d.data.name); })
        .transition().delay(function(d,i) {
        return i * 500; }).duration(500)
        .attrTween('d', function(d) {
            let i = d3.interpolate(d.startAngle+0.1, d.endAngle);
            return function(t) {
                d.endAngle = i(t);
                return arc(d)
            }
        });
    g.append('text')
        .attr('transform', function(d) { return 'translate(' + arc.centroid(d) + ')'; })
        .attr('dy', '.35em')
        .transition()
        .delay(1000)
        .text(function(d) { return d.data.name; });

    d3.selectAll('path').on('mousemove', function(d) {
        div.style('left', d3.event.pageX+10+'px');
        div.style('top', d3.event.pageY-25+'px');
        div.style('display', 'inline-block');
        div.html((d.data.name)+'<br>'+(d.data.total) + '<br>'+(d.data.percent) + '%');
    });

    d3.selectAll('path').on('mouseout', function(d){
        div.style('display', 'none');
    });
};
