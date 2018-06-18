const d3 = window.d3 || require('d3');
const config = require('./configuration');

let x = d3.scale.linear()
    .range([0, config.width]);

let color = d3.scale.ordinal()
    .range(['steelblue', '#ccc']);

let partition = d3.layout.partition()
    .value(function(d) { return d.size; });

let xAxis = d3.svg.axis()
    .scale(x)
    .orient('top');

let svg;

exports.displayBarchart = (barData, barContainerId, textLabelOnClickCallback) => {
    svg = d3.select(barContainerId)
        .attr('class', 'barchart-container')
        .append('svg')
        .attr('width', config.width + config.margin.left + config.margin.right)
        .attr('height', config.height + config.margin.top + config.margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + config.margin.left + ',' + config.margin.top + ')');

    svg.append('rect')
        .attr('class', 'background')
        .attr('width', config.width)
        .attr('height', config.height)
        .on('click', up);

    svg.append('g')
        .attr('class', 'x axis');

    svg.append('g')
        .attr('class', 'y axis')
        .append('line')
        .attr('y1', '100%');

    partition.nodes(barData);
    x.domain([0, barData.value]).nice();
    down(barData, 0);
};

function down(d, i) {
    if (!d.children || d.__transition__) return;
    let end = config.duration + d.children.length * config.delay;

    // Mark any currently-displayed bars as exiting.
    let exit = svg.selectAll('.enter')
        .attr('class', 'exit');

    // Entering nodes immediately obscure the clicked-on bar, so hide it.
    exit.selectAll('rect').filter(function(p) { return p === d; })
        .style('fill-opacity', 1e-6);

    // Enter the new bars for the clicked-on data.
    // Per above, entering bars are immediately visible.
    let enter = bar(d)
        .attr('transform', stack(i))
        .style('opacity', 1);

    // Have the text fade-in, even though the bars are visible.
    // Color the bars as parents; they will fade to children if appropriate.
    enter.select('text').style('fill-opacity', 1e-6);
    enter.select('rect').style('fill', color(true));

    // Update the x-scale domain.
    x.domain([0, d3.max(d.children, function(d) { return d.value; })]).nice();

    // Update the x-axis.
    svg.selectAll('.x.axis').transition()
        .duration(config.duration)
        .call(xAxis);

    // Transition entering bars to their new position.
    let enterTransition = enter.transition()
        .duration(config.duration)
        .delay(function(d, i) { return i * config.delay; })
        .attr('transform', function(d, i) { return 'translate(0,' + config.barHeight * i * 1.2 + ')'; });

    // Transition entering text.
    enterTransition.select('text')
        .style('fill-opacity', 1);

    // Transition entering rects to the new x-scale.
    enterTransition.select('rect')
        .attr('width', function(d) { return x(d.value); })
        .style('fill', function(d) { return color(!!d.children); });

    // Transition exiting bars to fade out.
    let exitTransition = exit.transition()
        .duration(config.duration)
        .style('opacity', 1e-6)
        .remove();

    // Transition exiting bars to the new x-scale.
    exitTransition.selectAll('rect')
        .attr('width', function(d) { return x(d.value); });

    // Rebind the current node to the background.
    svg.select('.background')
        .datum(d)
        .transition()
        .duration(end);

    d.index = i;
}


function up(d) {
    if (!d.parent || this.__transition__) return;
    let end = config.duration + d.children.length * config.delay;

    // Mark any currently-displayed bars as exiting.
    let exit = svg.selectAll('.enter')
        .attr('class', 'exit');

    // Enter the new bars for the clicked-on data's parent.
    let enter = bar(d.parent)
        .attr('transform', function(d, i) { return 'translate(0,' + config.barHeight * i * 1.2 + ')'; })
        .style('opacity', 1e-6);

    // Color the bars as appropriate.
    // Exiting nodes will obscure the parent bar, so hide it.
    enter.select('rect')
        .style('fill', function(d) { return color(!!d.children); })
        .filter(function(p) { return p === d; })
        .style('fill-opacity', 1e-6);

    // Update the x-scale domain.
    x.domain([0, d3.max(d.parent.children, function(d) { return d.value; })]).nice();

    // Update the x-axis.
    svg.selectAll('.x.axis').transition()
        .duration(config.duration)
        .call(xAxis);

    // Transition entering bars to fade in over the full duration.
    let enterTransition = enter.transition()
        .duration(end)
        .style('opacity', 1);

    // Transition entering rects to the new x-scale.
    // When the entering parent rect is done, make it visible!
    enterTransition.select('rect')
        .attr('width', function(d) { return x(d.value); })
        .each('end', function(p) { if (p === d) d3.select(this).style('fill-opacity', null); });

    // Transition exiting bars to the parent's position.
    let exitTransition = exit.selectAll('g').transition()
        .duration(config.duration)
        .delay(function(d, i) { return i * config.delay; })
        .attr('transform', stack(d.index));

    // Transition exiting text to fade out.
    exitTransition.select('text')
        .style('fill-opacity', 1e-6);

    // Transition exiting rects to the new scale and fade to parent color.
    exitTransition.select('rect')
        .attr('width', function(d) { return x(d.value); })
        .style('fill', color(true));

    // Remove exiting nodes when the last child has finished transitioning.
    exit.transition()
        .duration(end)
        .remove();

    // Rebind the current parent to the background.
    svg.select('.background')
        .datum(d.parent)
        .transition()
        .duration(end);
}


// Creates a set of bars for the given data node, at the specified index.
function bar(d) {
    let bar = svg.insert('g', '.y.axis')
        .attr('class', 'enter')
        .attr('transform', 'translate(0,5)')
        .selectAll('g')
        .data(d.children)
        .enter().append('g')
        .style('cursor', function(d) { return !d.children ? null : 'pointer'; })
        .on('click', down);

    bar.append('text')
        .attr('x', -6)
        .attr('y', config.barHeight / 2)
        .attr('dy', '.35em')
        .style('text-anchor', 'end')
        .text(function(d) { return d.name; });

    bar.append('rect')
        .attr('width', function(d) { return x(d.value); })
        .attr('height', config.barHeight);

    return bar;
}

// A stateful closure for stacking bars horizontally.
function stack(i) {
    let x0 = 0;
    return function(d) {
        let tx = 'translate(' + x0 + ',' + config.barHeight * i * 1.2 + ')';
        x0 += x(d.value);
        return tx;
    };
}