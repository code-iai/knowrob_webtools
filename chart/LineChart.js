// inspired by http://bl.ocks.org/mbostock/3883245

function LineChart(options) {
  
  this.options = options || {};
  
  options = options || {};
  var w = options.width || 300;
  var h = options.height || 300;
  var textOffset = 14;
  var tweenDuration = 250;
  var label = options.label || "units";
  var fontsize = options.fontsize || "14px";
  var query = options.query || "";
  
  var timeFormat = d3.time.format("%I:%M");
  
  // // // // // // // // // // // // // 
  // Set up chart canvas
  var margin = {top: 10, right: 10, bottom: 40, left: 30},
      width = w - margin.left - margin.right,
      height = h - margin.top - margin.bottom;
      
  var color = d3.scale.category20();
  
  var x = d3.time.scale()
          .range([0, width]);
  
  var y = d3.scale.linear()
          .range([height, 0]);
  
  var xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .ticks(5)
          .tickPadding(5);
  
  var yAxis = d3.svg.axis()
          .scale(y)
          .orient("left");
  
  var line = d3.svg.line()
          .x(function(d) { return x(d.x); })
          .y(function(d) { return y(d.y); });
  
  var svg = d3.select("#"+options.id).append("svg:svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
            
  // // // // // // // // // // // // // // 
  // Update data based on ROS message
  //
  this.update = function(msg) {
    
    // convert dual arrays in message to x-y-pairs
    data = msgToMap(msg);
    
    // convert strings to floats
    data.forEach(function(d) {
      d.x = new Date(parseFloat(d.x) * 1000);
      d.y = parseFloat(d.y);
    });
    
    // set domains for x and y axes
    x.domain(d3.extent(data, function(d) { return d.x; }));
    y.domain([0, d3.max(data, function(d) { return d.y; })]);
    
    // draw x axis
    svg.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0," + height + ")")
       .call(xAxis);
    
    // draw y axis
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end");
    
    // draw diagram line
    svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line);
  };
  

  
  // // // // // // // // // // // // // // // // // // // // // // // // //
  // Convert the diagram message of the form value1[], value2[] into a map
  // key-value map
  var msgToMap = function(msg){
    var res = new Array();
    for(i=0; i < msg.value1.length; i++) {
      res[i] = {'x': msg.value1[i], 'y': msg.value2[i]};
    };
    return res;
  };
  
  
  // // // // // // // // // // // // // // // // // // // // // // // // 
  // Helper functions
  // 
  
  // External trigger to remove this chart
  this.remove = function() {
    svg.remove();
  }
  
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
