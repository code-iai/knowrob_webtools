function BarChart (options) {
  
  this.options = options || {};
  
  options = options || {};
  var data = options.data || [];
  var where = options.where;
  var label = options.label;
  var fontsize = options.fontsize || "14px";
  var query = options.query || "";
  
  // Set up chart dimensions
  var w = options.width || 400;
  var h = options.height || 400;
  var margin = {top: 10, right: 10, bottom: 40, left: 10},
      width = w - margin.left - margin.right,
      height = h - margin.top - margin.bottom;
  
  
  // Scales and axes
  var x = d3.scale.linear()
      .range([0, width]);
          
  var y = d3.scale.ordinal()
      .rangeBands([0, height], .2);
      
  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");
  
  
  // Create SVG canvas
  var svg = d3.select("#"+options.id).append("svg:svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);
  var vis = svg.append("svg:g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  

  // // // // // // // // // // // // // // 
  // Update data based on ROS message
  //
  this.update = function(data) {

    // Maximum and sum of the y/value2 array
    var max = d3.max(data.value2, function(d) {return parseInt(d)});
    var sum = data.value2.reduce(function(a,b) { return parseInt(a) + parseInt(b) });
    
    // Set up domains of scale objects:
    x.domain([0, max]);
    y.domain(d3.range(data.value2.length))
    
//     var color = d3.scale.ordinal()
//         .domain(d3.range(data.value2.length))
//         .range(colorbrewer.Blues[7]);
    var color = d3.scale.category20();
    
    // Add x axis
    svg.append("g")
        .attr("class", "x axis")
        .style("font-size", fontsize)
        .attr("transform", "translate(" + margin.left + "," + (height + margin.top ) + ")")
        .call(xAxis);
    
    // Draw actual bars
    var bars = vis.selectAll("rect.bar")
        .data(data.value2)
        .attr("fill", function(d, i) { return color(i); });
        
    //enter
    bars.enter()
        .append("svg:rect")
        .attr("class", "bar")
        .attr("fill", function(d, i) { return color(i); });
        
    // transition
    bars.attr("stroke-width", 4)
        .transition()
        .duration(300)
        .ease("quad")
        .attr("width", x)
        .attr("height", y.rangeBand())
        .attr("transform", function(d,i) {
          return "translate(" + [0, y(i)] + ")"
        });
    
    //exit 
    bars.exit()
        .transition()
        .duration(300)
        .ease("exp")
        .attr("width", 0)
        .remove();
    
    
    // Labels inside the bars
    var text = vis.selectAll("text.value")
        .data(data.value2)
        .attr("x", 5)
        .attr("y", function(d,i){ return y(i) + y.rangeBand()/2; } );
    
    text.enter().append("text")
        .attr("class", "value")
        .attr("x", 5)
        .attr("y", function(d,i){ return y(i) + y.rangeBand()/2; } )
        .attr("dy", ".36em")
        .attr("text-anchor", "start")
        .style("font-size", fontsize)
        .text(function(d,i) {return data.value1[i]});
    
    text.exit()
        .remove();
    
    
//     // Values at the left side of the chart
//     var val = vis.selectAll("text.percent")
//         .data(data.value2)
//         .attr("x", 0)//x)
//         .attr("y", function(d,i){ return y(i) + y.rangeBand()/2; } );
//     
//     val.enter().append("text")
//         .attr("class", "val")
//         .attr("x", 0)//x)
//         .attr("y", function(d,i){ return y(i) + y.rangeBand()/2; } )
//         .attr("dx", -5)
//         .attr("dy", ".36em")
//         .attr("text-anchor", "end")
//         .style("font-size", fontsize)
//         .text(function(d) { return parseFloat(d).toFixed(2); });
//     
//     val.exit()
//        .remove();
    
    
    // Summary legend at the bottom
    var total = vis.selectAll("text.total")
        .data([sum]);
        
    total.enter().append("text")
         .attr("class", "total")
         .attr("y", height + margin.top + (margin.bottom / 2))
         .attr("dy", 0)
         .attr("text-anchor", "start")
         .style("font-size", fontsize)
//          .text(label + " (# values: " + sum + ")")
         .text(label);
        
    total.exit()
         .remove();
    
  }
  
  // External trigger to remove this chart
  this.remove = function() {
    svg.remove();
  }
  
  
  
  // // // // // // // // // // // // // // // // // // // // // // // // 
  // Getters and setters
  // 
  
  
  this.getWidth = function() {
    return width;
  }
  this.getHeight = function() {
    return height;
  }
  this.getData = function() {
    return data;
  }
  this.getLabel = function() {
    return label;
  }
  this.getQuery = function() {
    return query;
  }
  
  this.setWidth = function(width) {
    width = width;
  }
  this.setHeight = function(height) {
    height = height;
  }
  this.setData = function(d) {
    data = d;
  }
  this.setLabel = function(l) {
    label = l;
  }
  this.setQuery = function(q) {
    query = q;
  }
  
}
