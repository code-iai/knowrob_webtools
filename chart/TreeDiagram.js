function TreeDiagram(options){
  options = options || {};
  var width = options.width || 960;
  var height = options.height || 500;
  var where = options.where;
  /*var root = {id: options.data.value1[0],
              parent: "",
              color: options.data.value1[2],
              info: options.data.value2} || {};*/

  //var width = 960,
  //    height = 500;

  //var tree = d3.layout.tree()
  //    .size([height - 20, width - 20]);

  //var root = {},
  //var nodes = tree(root);

  //root.parent = root;
  //root.px = root.y;
  //root.py = root.x;

  var diagonal = d3.svg.diagonal().projection(function(d) { return [d.y, d.x] });

  var vis = d3.select(where).append("svg:svg")
      .attr("width", width)
      .attr("height", height);

  var svg = vis
    .append("svg:g")
      .attr("transform", "translate(10,10)");

  var node = svg.selectAll(".node"),
      link = svg.selectAll(".link");

  var duration = 0;
  //    timer = setInterval(update, duration);

  /*var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([0, 30]) //-10, 0
  .html(function(d) {
    var ret = "<span>";
    for (i in d.info) {
      ret += d.info[i] + "</span>";
    }
    
    return ret;
  });

  svg.call(tip);*/

  // removes this chart
  this.remove = function() {
    vis.remove();
    /*vis = d3.select(where).append("svg:svg")
      .attr("width", width)
      .attr("height", height);
   svg = vis
    .append("svg:g")
      .attr("transform", "translate(10,10)");
   node = svg.selectAll(".node"),
      link = svg.selectAll(".link");*/
  }

  this.update = function(data) {
    vis.remove();
    vis = d3.select(where).append("svg:svg")
      .attr("width", width)
      .attr("height", height);
    svg = vis
    .append("svg:g")
      .attr("transform", "translate(10,10)");
    node = svg.selectAll(".node"),
      link = svg.selectAll(".link");
    var tree = d3.layout.tree()
      .size([height - 20, width - 20]);
    var root = {id: data.data[0].id,
                parent: data.data[0].id,
                color: data.data[0].color,
                info: data.data[0].info};

    var nodes = tree(root);

    root.parent = root;
    root.px = root.y;
    root.py = root.x;


    for (var i = 0; i < data.data.length; i++) {

      var n = {id: data.data[i].id,
               parent: data.data[i].parent,
               color: data.data[i].color,
               info: data.data[i].info};

      if (nodes.find(function (element, index, array) {
            if(element.id == n.id) {return true} else {return false}
          }) == -1){//undefined) {

      var p = nodes[nodes.findIndex(function (element, index, array) {
            if(element.id == n.parent) {return true} else {return false}
          })|0];
      if(p == undefined) p = root;
      if (p.children) p.children.push(n); else p.children = [n];
      nodes.push(n);

    
      }
    }
    //console.log(nodes);

    // Recompute the layout and data join.
    node = node.data(tree.nodes(root), function(d) { return d.id; });
    link = link.data(tree.links(nodes), function(d) { return d.source.id + "-" + d.target.id; });



    // Add entering nodes in the parent’s old position.
    var node_ = node.enter().append("svg:circle")
        .attr("class", "node")
        .attr("r", 6)
        .attr("fill", function(d,i) {return d.color})
        .attr("cx", function(d) { return d.parent.px; })
        .attr("cy", function(d) { return d.parent.py; })
        .on("click", function(){return})
        .on("mouseover", function(){return})
        .on("mouseout", function(){return});

    

    // Add entering links in the parent’s old position.
    link.enter().insert("svg:path", ".node")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("d", function(d) {
          var o = {x: d.source.py, y: d.source.px};
          return diagonal({source: o, target: o});
        });

    // Transition nodes and links to their new positions.
    var t = svg.transition()
        .duration(duration);

    t.selectAll(".link")
        .attr("d", diagonal);

    t.selectAll(".node")
        .attr("cx", function(d) { return d.px = d.y; })
        .attr("cy", function(d) { return d.py = d.x; });

    node.enter().append("text")
      .text(function(d) { return d.info; })
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "blue")
      .attr("x", function(d) { return d.px; })
      .attr("y", function(d) { return d.py; });
        
  // exit nodes and links
  var nodeExit = node.exit()
      .remove();

  link.exit()
      .remove();

  
  //console.log(nodes);
  }

}
