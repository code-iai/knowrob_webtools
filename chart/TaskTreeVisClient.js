function TaskTreeVisClient(options) {
  var ros = options.ros;
  var containerId = options.containerId;
  var topic = options.topic;
  var width1 = options.width || 960;
  var height1 = options.height || 500;
 
  var initialOptions = {
        where: containerId,
        width: width1,
        height: height1
      };

  var taskTreeHandle = new TreeDiagram(initialOptions);

  var rosTopic = new ROSLIB.Topic({
    ros : ros,
    name : topic,
    messageType : 'data_vis_msgs/TaskTree'
  });

  rosTopic.subscribe(function(message) {
      var options = {
        data: message.tree,
        info: message.info,
        where: containerId,
        width: message.width,
        height: message.height,
      };
      taskTreeHandle.update(options);         
      $(containerId).change();
      
  });
}
