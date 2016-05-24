function TaskTreeVisClient(options) {
  var ros = options.ros;
  var containerId = options.containerId;
  var topic = options.topic;
  var init_width = options.width || 960;
  var init_height = options.height || 500;
 
  var initialOptions = {
        where: containerId,
        width: this.width,
        height: this.height
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
        width: message.width || 960,
        height: message.height || 500,
      };
      taskTreeHandle.update(options);         
      $(containerId).change();
      
  });
}
