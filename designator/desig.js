
function format_designator(desig) {
    format_designator(desig, "", 0, 0);
}

function format_designator(desig, pre, parent, level) {
    if(desig.length==0) return pre;

    post = pre;
    d = desig.shift();

    // context ended, go one level up
    if(d["parent"] < parent)
      level--;

    if(d["key"].substring(0, 1) != '_')
    {
      if(d["type"]==0) { // string
        post += format_designator_value(
            d["key"], d["value_string"], level);
        post = format_designator(desig, post, d["parent"], level);
      }
      else if(d["type"]==1) { // float
        post += format_designator_value(
            d["key"], d["value_float"], level);
        post = format_designator(desig, post, d["parent"], level);
      }
      else if(d["type"]==5) { // Pose
        post += format_designator_value(
            d["key"], format_pose(d["value_pose"], level), level);
        post = format_designator(desig, post, d["parent"], level);
      }
      else if(d["type"]==12) { // Matrix
        post += format_designator_value(
            d["key"], format_matrix(d["value_array"], level), level);
        post = format_designator(desig, post, d["parent"], level);
      }
      else if(d["type"]==13) { // Vector
        post += format_designator_value(
            d["key"], format_array(d["value_array"], level), level);
        post = format_designator(desig, post, d["parent"], level);
      }
      else if(d["type"]==4) { // PoseStamped
        post += format_designator_value(
            d["key"], format_pose_stamped(d["value_posestamped"], level), level);
        post = format_designator(desig, post, d["parent"], level);
      }
      else {
        post += "<div class='desig div"+level+"'>\n"
        post += d["key"];
        post = format_designator(desig, post, d["parent"], level+1);
        post += "</div>\n";

      }
    }
    return post;
}

function format_designator_value(key, value, level) {
    return "<div class='desig div"+level+"'>\n" + key + " = " + value + "</div>\n";
}

function format_array(value, level) {
    post = "";
    post += "<div class='desig div"+(level+1)+"'>";
    for(var i=0; i<value.length; ++i) {
        post += value[i] + " ";
    }
    post += "</div>\n";
    return post;
}

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
}

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
}

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
}
