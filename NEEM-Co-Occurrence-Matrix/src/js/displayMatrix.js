const d3 = window.d3 || require('d3');

const configuration = require('./configuration');
const utils = require('./utils');
const mouse = require('./mouse');

let svg;
let matrix = [];
let nodes;
let opacityScale;


let groupOne = 0;
let groupTwo = 0;
let indexGroupOneMatrixToNode = [];
let indexGroupTwoMatrixToNode = [];
let indexGroupOneNodeToMatrix = {};
let indexGroupTwoNodeToMatrix = {};
let columnMatrixScale;
let rowMatrixScale;
let rowOrders;


exports.displayMatrix = (data, containerId) => {
    configuration.initConfiguration(containerId);
    opacityScale = d3.scaleLinear().domain([0, 10]).range([0.3, 1.0]).clamp(true);
    initSvg();
    drawMatrix(data);

};


function initSvg(){
    let containerAttr = d3.select(configuration.containerId).attr('class');

    svg = d3.select(configuration.containerId)
        .attr('class', containerAttr + ' matrix-container')
        .append('graph')
        .attr('class', 'matrix-graph')
        .append('svg')
        .attr('width', configuration.width + configuration.margin.left + configuration.margin.right)
        .attr('height', configuration.height + configuration.margin.top + configuration.margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + configuration.margin.left + ',' + configuration.margin.top + ')');

    svg.append('rect')
        .attr('class', 'matrix-background')
        .attr('width', configuration.width)
        .attr('height', configuration.height);
}

function drawMatrix(data){
    nodes = data.nodes;
    mouse.nodes = nodes;

    nodes.forEach((node) => {
        node.count = 0;
        node.group = utils.groupToInt(node.group);
        if(node.group === 1){
            indexGroupOneNodeToMatrix[node.index] = groupOne;
            indexGroupOneMatrixToNode.push(node.index);
            groupOne += 1;
        }
        else{
            indexGroupTwoNodeToMatrix[node.index] = groupTwo;
            indexGroupTwoMatrixToNode.push(node.index);
            groupTwo += 1;
        }
    });

    columnMatrixScale = d3.scaleBand().range([0, configuration.width]).domain(d3.range(groupTwo));
    rowMatrixScale = d3.scaleBand().range([0, configuration.height]).domain(d3.range(groupOne));

    // Create rows for the matrix
    for (let i = 0; i < groupOne;i++){
        let item_index = 0;
        matrix.push(new Array());

        for (let j = 0; j < groupTwo; j++){

            matrix[i].push({
                x: indexGroupOneMatrixToNode[i],
                y: indexGroupTwoMatrixToNode[item_index],
                z: 0
            });
            item_index += 1;
        }
    }


    // Fill matrix with data from links and count how many times each item appears
    data.links.forEach((link) => {
        matrix[indexGroupOneNodeToMatrix[link.source]][indexGroupTwoNodeToMatrix[link.target]].z += link.value;
        //matrix[link.target][link.source].z += link.value;
        nodes[link.source].count += link.value;
        nodes[link.target].count += link.value;
    });

    // Draw each row (translating the y coordinate)
    let rows = svg.selectAll('.row')
        .data(matrix)
        .enter().append('g')
        .attr('class', 'row')
        .attr('transform', (d, i) => {
            return 'translate(0,' + rowMatrixScale(i) + ')';
        });
    //

    rows.selectAll('.cell')
        .data(d => d.filter(item => item.z > 0))
        .enter().append('rect')
        .attr('class', 'cell')
        .attr('x', d => {
            return columnMatrixScale(indexGroupTwoNodeToMatrix[d.y])
        })
        .attr('width', columnMatrixScale.bandwidth())
        .attr('height', rowMatrixScale.bandwidth())
        .style('fill-opacity', d => opacityScale(d.z)).style('fill', d => {
        //return nodes[d.x].group == nodes[d.y].group ? colorScale(nodes[d.x].group) : "grey";
            return 'grey';})
        .on('mouseover', mouse.mouseover)
        .on('mouseout', mouse.mouseout);
    //
    let columns = svg.selectAll('.column')
        .data(indexGroupTwoMatrixToNode)
        .enter().append('g')
        .attr('class', 'column')
        .attr('transform', (d, i) => {
            return 'translate(' + columnMatrixScale(i) + ')rotate(-90)';
        });
    //
    rows.append('text')
        .attr('class', (d, i) => {return 'node-label ' + utils.intToGroup(nodes[indexGroupOneMatrixToNode[i]].group)})
        .attr('x', -5)
        .attr('y', rowMatrixScale.bandwidth()/2)
        .attr('dy', '.32em')
        .attr('text-anchor', 'end')
        .text((d, i) => utils.capitalize_Words(nodes[indexGroupOneMatrixToNode[i]].name));
    //
    columns.append('text')
        .attr('class', (d, i) => {return 'node-label ' + utils.intToGroup(nodes[indexGroupTwoMatrixToNode[i]].group)})
        .attr('y', 100)
        .attr('y', columnMatrixScale.bandwidth()/2)
        .attr('dy', '.32em')
        .attr('text-anchor', 'start')
        .text((d, i) => utils.capitalize_Words(nodes[indexGroupTwoMatrixToNode[i]].name));


    rowOrders = {
        name: d3.range(groupOne).sort((a, b) => {
            let nodeA = nodes[indexGroupOneMatrixToNode[a]];
            let nodeB = nodes[indexGroupOneMatrixToNode[b]];

            return d3.ascending(nodeA.name, nodeB.name);
        }),
        count: d3.range(groupOne).sort((a, b) => {
            let nodeA = nodes[indexGroupOneMatrixToNode[a]];
            let nodeB = nodes[indexGroupOneMatrixToNode[b]];

            return nodeB.count - nodeA.count;
        })
    };

    d3.select('#rowOrder').on('change', () => {
        changeRowOrder(document.getElementById('rowOrder').value);
    });

    d3.select('#columnOrder').on('change', () => {
        changeColumnOrder(document.getElementById('columnOrder').value);
    });

    rows.append('line')
        .attr('x2', configuration.width)
        .attr('class', 'matrix-line');

    columns.append('line')
        .attr('x1', -configuration.width)
        .attr('class', 'matrix-line');
}


function changeRowOrder(value) {
    let sortedResult = rowOrders[value];
    let temp = [];
    indexGroupOneNodeToMatrix = {};
    rowMatrixScale.domain(sortedResult);
    console.log(rowOrders);

    for (let i = 0; i < sortedResult.length; i++){
        let rowIndex = sortedResult[i];
        let nodeIndex = indexGroupOneMatrixToNode[rowIndex];
        temp.push(nodeIndex);
        indexGroupOneNodeToMatrix[nodeIndex] = i;
    }
    indexGroupOneMatrixToNode = temp;

    let t = svg.transition().duration(2000);
    t.selectAll('.row')
        .delay((d, i) => rowMatrixScale(i) * 4)
        .attr('transform', function(d, i) {
            return 'translate(0,' + rowMatrixScale(i) + ')';
        });
}

function changeColumnOrder(value) {
    //var sortedResult = columnOrders[value];
    let sortedResult = sortColumn(value);
    let temp = [];
    indexGroupTwoNodeToMatrix = {};
    columnMatrixScale.domain(sortedResult);

    for (let i = 0; i < sortedResult.length; i++){
        let columnIndex = sortedResult[i];
        let nodeIndex = indexGroupTwoMatrixToNode[columnIndex];
        temp.push(nodeIndex);
        indexGroupTwoNodeToMatrix[nodeIndex] = i;
    }
    indexGroupTwoMatrixToNode = temp;

    let t = svg.transition().duration(2000);

    columnMatrixScale.domain(indexGroupTwoMatrixToNode)

    t.selectAll('.column')
        .delay((d, i) => columnMatrixScale(d) * 4)
        .attr('transform', function(d, i) {
            return 'translate(' + columnMatrixScale(d) + ')rotate(-90)';
        });

    columnMatrixScale.domain(indexGroupTwoMatrixToNode)
    t.selectAll('.row')
        .delay((d, i) => rowMatrixScale(i) * 4)
        .attr('transform', function(d, i) {
            return 'translate(0,' + rowMatrixScale(i) + ')';
        }).selectAll('.cell')
        .delay(d => columnMatrixScale(d.y) * 4)
        .attr('x', d => {
            return columnMatrixScale(d.y)
        });
    //
}

function sortColumn(value){
    if ('name' === value){
        let tempResult = d3.range(groupTwo).sort((a, b) => {
            let nodeA = nodes[indexGroupTwoMatrixToNode[a]];
            let nodeB = nodes[indexGroupTwoMatrixToNode[b]];

            return d3.ascending(nodeA.name, nodeB.name);
        });

        let result = new Array(tempResult.length);

        for (let i = 0; i < tempResult.length; i++){
            result[tempResult[i]] = i
        }
        return result;
    }

    if ('count' === value){
        return d3.range(groupTwo).sort((a, b) => {
            let nodeA = nodes[indexGroupTwoMatrixToNode[a]];
            let nodeB = nodes[indexGroupTwoMatrixToNode[b]];

            return nodeB.count - nodeA.count;
        })
    }
}