//handle array of designators
function empty_designators(desigResponseMsgs) {
  var empty =true;
  var length = desigResponseMsgs.designators.length;
  for (i=0;i<length;i++){
       if(desigResponseMsgs.designators[i].description.length != 0){
	 empty = false;
       }
  }
  return empty;
};

function format_designator_array(desigResponseMsgs) {
  var length = desigResponseMsgs.designators.length;
  post = "";
  for (i=0;i<length;i++){
       post += format_designator(desigResponseMsgs.designators[i].description);
  }
  return post;
};

function parse_designator(desig/*, parents*/) {
    var out = {};
    var parents = [out];
    for(var i in desig) {
      var d = desig[i]; // next value find the parent designator
      var level = d["parent"];
      var parent = parents[level];
      if(parent == undefined){
	continue;
      }
      parents = parents.slice(0,level+1);
      //parse value 
      var value = parse_designator_value(d);
      if(!value) {
        value = {};
        parents = parents.concat(value);
      }
      parent[d["key"]] = value;
    }
    console.warn("OUT MSGS:"+out);
    return out;
};

function parse_designator_value(elem) {
  if(elem["type"]==0)       return elem["value_string"];
  else if(elem["type"]==1)  return elem["value_float"];
  else if(elem["type"]==3)  return elem["value_float"];//why not...C++ interface of desigs has only lists, no generic array container
  else if(elem["type"]==5)  return elem["value_pose"];
  else if(elem["type"]==12) return elem["value_array"]; // Matrix of floats ...so this sux
  else if(elem["type"]==13) return elem["value_array"]; // Vector of floats ...so what if I want a vector of Objects?
  else if(elem["type"]==4)  return elem["value_posestamped"];
  else return undefined;
};

function format_designator(desig) {
    return __format_designator(desig, "");
};

function __format_designator(desig, pre) {
    if(desig.length==0) return pre;

    post = pre || "";
    d = desig.shift();
    level = d["parent"];

    if(d["key"].substring(0, 1) != '_')
    {
      if(d["type"]==0) { // string
        post += format_designator_value(
            d["key"], d["value_string"], level);
        post = __format_designator(desig, post);
      }
      else if(d["type"]==1) { // float
        post += format_designator_value(
            d["key"], d["value_float"], level);
        post = __format_designator(desig, post);
      }
      else if(d["type"]==5) { // Pose
        post += format_designator_value(
            d["key"], format_pose(d["value_pose"], level), level);
        post = __format_designator(desig, post);
      }
      else if(d["type"]==12) { // Matrix
        post += format_designator_value(
            d["key"], format_matrix(d["value_array"], level), level);
        post = __format_designator(desig, post);
      }
      else if(d["type"]==13) { // Vector
        post += format_designator_value(
            d["key"], format_array(d["value_array"], level), level);
        post = __format_designator(desig, post);
      }
      else if(d["type"]==4) { // PoseStamped
        post += format_designator_value(
            d["key"], format_pose_stamped(d["value_posestamped"], level), level);
        post = __format_designator(desig, post);
      }
      else {
        post += "<div class='desig div"+level+"'>\n"
        post += d["key"];
        post += "</div>\n";
        post = __format_designator(desig, post);
      }
    }
    return post;
};

function format_designator_value(key, value, level) {
    return "<div class='desig div"+level+"'>\n" + key + " = " + value + "</div>\n";
};

function format_array(value, level) {
    post = "";
    post += "<div class='desig div"+(level+1)+"'>";
    for(var i=0; i<value.length; ++i) {
        post += value[i] + " ";
    }
    post += "</div>\n";
    return post;
};

function format_matrix(value, level) {
    post = "";
    post += "<div class='desig div"+(level+1)+"'>";
    for(var i=0; i<4; ++i) {
        for(var j=0; j<4; ++j) {
            post += value[i*4 + j] + " ";
        }
        post += "<br/>\n";
    }
    post += "</div>\n";
    return post;
};

function format_pose_stamped(poseStampedMsg, level) {
    post = "";
    post += "<div class='desig div"+(level+1)+"'>";
    post += "header<br/>\n";
    post += "<div class='desig div"+(level+2)+"'>";
    post += "seq = " + poseStampedMsg["header"]["seq"] + "<br/>\n";
    post += "stamp = " + poseStampedMsg["header"]["stamp"]["secs"] + "<br/>\n";
    post += "frame_id = " + poseStampedMsg["header"]["frame_id"] + "<br/>\n";
    post += "</div>\n";
    post += "pose<br/>\n";
    post += format_pose(poseStampedMsg["pose"], level+1);
    post += "</div>\n";
    return post;
};

function format_pose(poseMsg, level) {
    post = "";
    post += "<div class='desig div"+(level+1)+"'>";
    post += "position<br/>\n";
    post += "<div class='div"+(level+2)+"'>";
    post += "x = " + poseMsg["position"]["x"] + "<br/>\n";
    post += "y = " + poseMsg["position"]["y"] + "<br/>\n";
    post += "z = " + poseMsg["position"]["z"] + "<br/>\n";
    post += "</div>\n";
    post += "orientation<br/>\n";
    post += "<div class='desig div"+(level+2)+"'>";
    post += "x = " + poseMsg["orientation"]["x"] + "<br/>\n";
    post += "y = " + poseMsg["orientation"]["y"] + "<br/>\n";
    post += "z = " + poseMsg["orientation"]["z"] + "<br/>\n";
    post += "w = " + poseMsg["orientation"]["w"] + "<br/>\n";
    post += "</div>\n";
    post += "</div>\n";
    return post;
};
