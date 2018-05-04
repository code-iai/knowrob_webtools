const d3 = window.d3 || require('d3');
const taskTreeConfiguration = require('./Configuration');
const zoomListenerModule = require('./ZoomListener');
const taskTreeNode = require('./TaskTreeNode');
const taskTreeLinks = require('./TaskTreeLinks');

let baseSvg;
let svgGroup;

let zoomListener;
let isInit = false;

let tree;
let maxLabelLength;
let root;
let i = 0;

exports.initView = (r) => {
    if(!isInit){
        maxLabelLength = r.name.length;
        root = r;

        tree = d3.layout.tree().size([taskTreeConfiguration.viewerHeight(), taskTreeConfiguration.viewerWidth()]);
        baseSvg =  d3.select(taskTreeConfiguration.treeContainerId)
            .append('svg')
            .attr('width', taskTreeConfiguration.viewerWidth())
            .attr('height',taskTreeConfiguration.viewerHeight())
            .attr('class', 'overlay');

        // Append a group which holds all nodes and which the zoom Listener can act upon.
        svgGroup = baseSvg.append('g');
        zoomListener= zoomListenerModule.getZoomListener(svgGroup);
        baseSvg.call(zoomListener);

        isInit = true;
    }
};

exports.update = (source) => {
    // Compute the new height, function counts total children of root node and sets tree height accordingly.
    // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
    // This makes the layout more consistent.
    let levelWidth = [1];
    let childCount = (level, n) =>{
        if (n.children && n.children.length > 0) {
            if (levelWidth.length <= level + 1) levelWidth.push(0);

            levelWidth[level + 1] += n.children.length;
            n.children.forEach((d) =>{
                childCount(level + 1, d);
            });
        }
    };

    childCount(0, root);
    let newHeight = d3.max(levelWidth) * 25; // 25 pixels per line
    tree = tree.size([newHeight, taskTreeConfiguration.viewerWidth()]);

    // Compute the new tree layout.
    let nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

    // Set widths between levels based on maxLabelLength.
    nodes.forEach((d) => {
        d.y = (d.depth * (maxLabelLength * 40)); //maxLabelLength * 40px
        // alternatively to keep a fixed scale one can set a fixed depth per level
        // Normalize for fixed-depth by commenting out below line
        // d.y = (d.depth * 500); //500px per level.
    });

    let nodes_svg = svgGroup.selectAll('g.node')
        .data(nodes, (d) => {
            return d.id || (d.id = ++i);
        });

    taskTreeNode.appendNewNode(source, nodes_svg);
    // Update the links…
    taskTreeLinks.appendNewLinks(svgGroup, links, source);
    // Stash the old positions for transition.

    nodes.forEach((d) => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
};

// Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving
// with large amount of children.
exports.centerNode = (source) => {
    let scale = zoomListener.scale();
    let x = -source.y0;
    let y = -source.x0;

    x = x * scale + taskTreeConfiguration.viewerWidth() / 2;
    y = y * scale + taskTreeConfiguration.viewerHeight() / 2;

    d3.select('g').transition()
        .duration(taskTreeConfiguration.duration)
        .attr('transform', 'translate(' + x + ',' + y + ')scale(' + scale + ')');

    zoomListener.scale(scale);
    zoomListener.translate([x, y]);
};