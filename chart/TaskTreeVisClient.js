function TaskTreeVisClient(options) {
  var ros = options.ros;
  var containerId = options.containerId;
  var topic = options.topic;
  var init_width = options.width || 460;
  var init_height = options.height || 580;
 
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
        width: message.width || 460,
        height: message.height || 580,
      };
      taskTreeHandle.update(options);         
      $(containerId).change();
      
  });
}
