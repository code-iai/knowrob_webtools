/**
 * @author David Gossow - dgossow@willowgarage.com
 * @author Russell Toris - rctoris@wpi.edu
 */

function TextTexture(text, options){
    var lines = text.split('\n');
    var that = this;
    // Font options
    var font = options.font || "Bold 24px Monospace";
    var useShadow = options.useShadow || false;
    var useBubble = options.useBubble || false;
    var margin = options.margin || [12, 12];
    var lineHeight = 24;
    var shadowOffsetX = (!isNaN(options.shadowOffsetX) && options.shadowOffsetX) || 4;
    var shadowOffsetY = (!isNaN(options.shadowOffsetY) && options.shadowOffsetY) || 4;
    var shadowBlur = (!isNaN(options.shadowBlur) && options.shadowBlur) || 6;
    // Create a canvas for 2D rendering
    this.canvas = document.createElement('canvas');
    
    // Compute size of the canvas so that it fits the text.
    // We need a special context for measuring the size.
    var maxWidth = 0;
    var heightSum = 0;
    var measure_ctx = this.canvas.getContext('2d');
    measure_ctx.font = font;
    for(var i=0; i<lines.length; i++) {
        var m = measure_ctx.measureText(lines[i]);
        if(m.width>maxWidth) maxWidth = m.width;
        heightSum += m.height;
    }
    // The text size
    var tw = maxWidth;
    var th = lineHeight*lines.length;
    // The canvas size
    var cw = tw + margin[0];
    var ch = th + 0.5*margin[1];
        
    var bubbleRadius = 10;
    var bubblePeak = [15, 20, 0]; // width, height, x-offset
    if(useBubble) {
        cw += bubbleRadius*2;
        ch += bubbleRadius*2 + bubblePeak[1];
    }
    if(useShadow) {
        cw += shadowOffsetX + shadowBlur;
        ch += shadowOffsetY + shadowBlur;
    }
        
    // Create context with appropriate canvas size 
    this.ctx = this.canvas.getContext('2d');
    this.ctx.canvas.width  = cw;
    this.ctx.canvas.height = ch;
        
    if(useBubble) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = options.bubbleBorderColor || "black";
        this.ctx.lineWidth   = options.bubbleBorderWidth || "1";
        this.ctx.fillStyle   = options.bubbleColor || "rgba(255, 255, 255, 0.8)";
        
        var ls = 1;
        var w = tw + 2*bubbleRadius;
        var h = th + 2*bubbleRadius;
        var px=0, py=0;
        
        // TODO: is there really no "getPenPosition" method ?
        var moveTo = function(x,y) {
            that.ctx.moveTo(x,y);
            px=x; py=y;
        };
        var lineTo = function(x,y) {
            that.ctx.lineTo(x,y);
            px=x; py=y;
        };
        var curveTo = function(x,y,maxx,maxy) {
            var cx = (maxx ? Math.max(x,px) : Math.min(x,px));
            var cy = (maxy ? Math.max(y,py) : Math.min(y,py));
            that.ctx.quadraticCurveTo(cx,cy,x,y);
            px=x; py=y;
        };
        
        moveTo(w-bubbleRadius, h-ls);
        // bottom right
        curveTo(w-ls, h-bubbleRadius, 1, 1);
        lineTo (w-ls, bubbleRadius);
        // top right
        curveTo(w-bubbleRadius, ls, 1, 0);
        lineTo (  bubbleRadius, ls);
        // top left
        curveTo(ls, bubbleRadius, 0, 0);
        lineTo (ls, h-bubbleRadius);
        // bottom left
        curveTo(bubbleRadius, h-ls, 0, 1);
        // the peak
        lineTo(bubbleRadius + bubblePeak[2], h-ls);
        //lineTo(px + 0.5*bubblePeak[0], h-ls+bubblePeak[1]);
        lineTo(1, h-ls+bubblePeak[1]);
        lineTo(bubbleRadius + bubblePeak[2] + bubblePeak[0], h-ls);
        lineTo(w-bubbleRadius, h-ls);
        
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.closePath();
    }
        
    this.ctx.font = font;
    // Configure text shadow
    if(useShadow) {
        this.ctx.shadowColor = options.shadowColor || "gray";
        this.ctx.shadowOffsetX = shadowOffsetX;
        this.ctx.shadowOffsetY = shadowOffsetY;
        this.ctx.shadowBlur = shadowBlur;
    }
    // Configure text
    this.ctx.fillStyle = options.fillStyle || "#144F78";
    this.ctx.strokeStyle = options.strokeStyle || "#000000";
    // Render text into 2D canvas
    for(var i=0; i<lines.length; i++) {
        //ctx.strokeText(lines[i], 0.5*margin[0], (i+1)*lineHeight);
        this.ctx.fillText(lines[i], margin[0], 0.5*margin[1] + (i+1)*lineHeight);
    }
        
    // Finally create texture from canvas
    this.texture = new THREE.Texture(this.canvas);
    this.texture.needsUpdate = true;
};

/**
 * A Marker can convert a ROS marker message into a THREE object.
 *
 * @constructor
 * @param options - object with following keys:
 *
 *   * path - the base path or URL for any mesh files that will be loaded for this marker
 *   * message - the marker message
 *   * loader (optional) - the Collada loader to use (e.g., an instance of ROS3D.COLLADA_LOADER
 *                         ROS3D.COLLADA_LOADER_2) -- defaults to ROS3D.COLLADA_LOADER_2
 */
ROS3D.Marker = function(options) {
  options = options || {};
  var path = options.path || '/';
  var message = options.message;
  var loader = options.loader || ROS3D.COLLADA_LOADER_2;
  var that = this;

  // check for a trailing '/'
  if (path.substr(path.length - 1) !== '/') {
    path += '/';
  }

  THREE.Object3D.call(this);
  
  if(message.scale) {
    this.msgScale = [message.scale.x, message.scale.y, message.scale.z];
  }
  else {
    this.msgScale = [1,1,1];
  }
  this.msgColor = [message.color.r, message.color.g, message.color.b, message.color.a];
  this.msgMesh = undefined;
  this.msgText = message.text;
  this.isBackgroundMarker = false;
  this.isSelectable = true;
  this.id = message.id;
  this.ns = message.ns;
  this.frame_id = message.header.frame_id;
  this.marker_type = message.type;
  
  this.on_dblclick = options.on_dblclick || function(_) { };
  this.on_contextmenu = options.on_contextmenu || function(_) { };
    
  this.spriteAlignments = [
      THREE.SpriteAlignment.center,
      THREE.SpriteAlignment.bottomLeft,
      THREE.SpriteAlignment.topLeft,
      THREE.SpriteAlignment.topRight,
      THREE.SpriteAlignment.bottomRight,
      THREE.SpriteAlignment.topCenter,
      THREE.SpriteAlignment.centerLeft,
      THREE.SpriteAlignment.centerRight,
      THREE.SpriteAlignment.bottomCenter
  ];

  // set the pose and get the color
  this.setPose(message.pose);
  var colorMaterial = ROS3D.makeColorMaterial(this.msgColor[0],
      this.msgColor[1], this.msgColor[2], this.msgColor[3]);
  
  var createSpriteMaterial = function(useScreenCoordinates) {
      var alignment = Math.max(Math.min(Math.round(message.scale.z), that.spriteAlignments.length-1),0);
      return new THREE.SpriteMaterial({
          useScreenCoordinates: useScreenCoordinates,
          alignment: that.spriteAlignments[alignment]
      });
  };
  var createTexture = function(src) {
      var image = new Image();
      image.src = src;
      var texture = new THREE.Texture();
      texture.image = image;
      image.onload = function() {
        texture.needsUpdate = true;
      };
      return texture;
  };
  var htmlColor = function(c) {
      return "rgba("+
        Math.round(c[0]*255.0)+","+
        Math.round(c[1]*255.0)+","+
        Math.round(c[2]*255.0)+","+
        Math.round(c[3]*255.0)+")";
  };

  // create the object based on the type
  switch (message.type) {
    case ROS3D.MARKER_ARROW:
      this.isSelectable = false;
      // get the sizes for the arrow
      var len = message.scale.x;
      var headLength = len * 0.23;
      var headDiameter = message.scale.y;
      var shaftDiameter = headDiameter * 0.5;

      // determine the points
      var direction, p1 = null;
      if (message.points.length === 2) {
        p1 = new THREE.Vector3(message.points[0].x, message.points[0].y, message.points[0].z);
        var p2 = new THREE.Vector3(message.points[1].x, message.points[1].y, message.points[1].z);
        direction = p1.clone().negate().add(p2);
        // direction = p2 - p1;
        len = direction.length();
        headDiameter = message.scale.y;
        shaftDiameter = message.scale.x;

        if (message.scale.z !== 0.0) {
          headLength = message.scale.z;
        }
      }

      // add the marker
      this.add(new ROS3D.Arrow({
        direction : direction,
        origin : p1,
        length : len,
        headLength : headLength,
        shaftDiameter : shaftDiameter,
        headDiameter : headDiameter,
        material : colorMaterial
      }));
      break;
    case ROS3D.MARKER_CUBE:
      // set the cube dimensions
      var cubeGeom = new THREE.CubeGeometry(message.scale.x, message.scale.y, message.scale.z);
      this.add(new THREE.Mesh(cubeGeom, colorMaterial));
      break;
    case ROS3D.MARKER_SPHERE:
      // set the sphere dimensions
      var sphereGeom = new THREE.SphereGeometry(0.5, 32, 16);
      var sphereMesh = new THREE.Mesh(sphereGeom, colorMaterial);
      sphereMesh.scale.x = message.scale.x;
      sphereMesh.scale.y = message.scale.y;
      sphereMesh.scale.z = message.scale.z;
      this.add(sphereMesh);
      break;
    case ROS3D.MARKER_CYLINDER:
      // set the cylinder dimensions
      var cylinderGeom = new THREE.CylinderGeometry(0.5, 0.5, 1, 32, 2, false);
      var cylinderMesh = new THREE.Mesh(cylinderGeom, colorMaterial);
      cylinderMesh.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI * 0.5);
      cylinderMesh.scale = new THREE.Vector3(message.scale.x, message.scale.z, message.scale.y);
      this.add(cylinderMesh);
      break;
    case ROS3D.MARKER_LINE_STRIP:
      var lineStripGeom = new THREE.Geometry();
      var lineStripMaterial = new THREE.LineBasicMaterial({
        size : message.scale.x
      });

      // add the points
      var j;
      for ( j = 0; j < message.points.length; j++) {
        var pt = new THREE.Vector3();
        pt.x = message.points[j].x;
        pt.y = message.points[j].y;
        pt.z = message.points[j].z;
        lineStripGeom.vertices.push(pt);
      }

      // determine the colors for each
      if (message.colors.length === message.points.length) {
        lineStripMaterial.vertexColors = true;
        for ( j = 0; j < message.points.length; j++) {
          var clr = new THREE.Color();
          clr.setRGB(message.colors[j].r, message.colors[j].g, message.colors[j].b);
          lineStripGeom.colors.push(clr);
        }
      } else {
        lineStripMaterial.color.setRGB(message.color.r, message.color.g, message.color.b);
      }

      // add the line
      this.add(new THREE.Line(lineStripGeom, lineStripMaterial));
      break;
    case ROS3D.MARKER_LINE_LIST:
      var lineListGeom = new THREE.Geometry();
      var lineListMaterial = new THREE.LineBasicMaterial({
        size : message.scale.x
      });

      // add the points
      var k;
      for ( k = 0; k < message.points.length; k++) {
        var v = new THREE.Vector3();
        v.x = message.points[k].x;
        v.y = message.points[k].y;
        v.z = message.points[k].z;
        lineListGeom.vertices.push(v);
      }

      // determine the colors for each
      if (message.colors.length === message.points.length) {
        lineListMaterial.vertexColors = true;
        for ( k = 0; k < message.points.length; k++) {
          var c = new THREE.Color();
          c.setRGB(message.colors[k].r, message.colors[k].g, message.colors[k].b);
          lineListGeom.colors.push(c);
        }
      } else {
        lineListMaterial.color.setRGB(message.color.r, message.color.g, message.color.b);
      }

      // add the line
      this.add(new THREE.Line(lineListGeom, lineListMaterial,THREE.LinePieces));
      break;
    case ROS3D.MARKER_CUBE_LIST:
      // holds the main object
      var object = new THREE.Object3D();
      
      // check if custom colors should be used
      var numPoints = message.points.length;
      var createColors = (numPoints === message.colors.length);
      // do not render giant lists
      var stepSize = Math.ceil(numPoints / 1250);
        
      // add the points
      var p, cube, curColor, newMesh;
      for (p = 0; p < numPoints; p+=stepSize) {
        cube = new THREE.CubeGeometry(message.scale.x, message.scale.y, message.scale.z);

        // check the color
        if(createColors) {
          curColor = ROS3D.makeColorMaterial(message.colors[p].r, message.colors[p].g, message.colors[p].b, message.colors[p].a);
        } else {
          curColor = colorMaterial;
        }

        newMesh = new THREE.Mesh(cube, curColor);
        newMesh.position.x = message.points[p].x;
        newMesh.position.y = message.points[p].y;
        newMesh.position.z = message.points[p].z;
        object.add(newMesh);
      }

      this.add(object);
      break;
    case ROS3D.MARKER_SPHERE_LIST:
    case ROS3D.MARKER_POINTS:
      // for now, use a particle system for the lists
      var geometry = new THREE.Geometry();
      var material = new THREE.ParticleBasicMaterial({
        size : message.scale.x
      });

      // add the points
      var i;
      for ( i = 0; i < message.points.length; i++) {
        var vertex = new THREE.Vector3();
        vertex.x = message.points[i].x;
        vertex.y = message.points[i].y;
        vertex.z = message.points[i].z;
        geometry.vertices.push(vertex);
      }

      // determine the colors for each
      if (message.colors.length === message.points.length) {
        material.vertexColors = true;
        for ( i = 0; i < message.points.length; i++) {
          var color = new THREE.Color();
          color.setRGB(message.colors[i].r, message.colors[i].g, message.colors[i].b);
          geometry.colors.push(color);
        }
      } else {
        material.color.setRGB(message.color.r, message.color.g, message.color.b);
      }

      // add the particle system
      this.add(new THREE.ParticleSystem(geometry, material));
      break;
    case ROS3D.MARKER_MESH_RESOURCE:
      // load and add the mesh
      var meshColorMaterial = null;
      if(message.color.r !== 0 || message.color.g !== 0 ||
         message.color.b !== 0 || message.color.a !== 0) {
        meshColorMaterial = colorMaterial;
      }
      if(message.mesh_resource.startsWith('package://'))
        this.msgMesh = message.mesh_resource.substr(10);
      else if(message.mesh_resource.startsWith('/'))
        this.msgMesh = message.mesh_resource.substr(1);
      else
        this.msgMesh = message.mesh_resource;
      var meshResource = new ROS3D.MeshResource({
        path : path,
        resource : this.msgMesh,
        material : meshColorMaterial,
        loader : loader,
        scale : this.msgScale
      });
      this.add(meshResource);
      break;
    case ROS3D.MARKER_TRIANGLE_LIST:
      // create the list of triangles
      var tri = new ROS3D.TriangleList({
        material : colorMaterial,
        vertices : message.points,
        colors : message.colors
      });
      tri.scale = new THREE.Vector3(message.scale.x, message.scale.y, message.scale.z);
      this.add(tri);
      break;
    case ROS3D.MARKER_TEXT_VIEW_FACING:
      // only work on non-empty text
      if (message.text.length > 0) {
        // setup the text
        var textGeo = new THREE.TextGeometry(message.text, {
          size: message.scale.z * 0.2,
          height: 0.04 * message.scale.z,
          curveSegments: 4,
          font: 'helvetiker', weight: "bold", style: "normal",
          bevelThickness: 0.01, bevelSize: 0.005, bevelEnabled: false,
          material: 0,
          extrudeMaterial: 1
        });
        // XXX: artifacts when calling computeVertexNormals!
        //textGeo.computeVertexNormals();
        textGeo.computeBoundingBox();

        // position the text and add it
        var mesh = new THREE.Mesh(textGeo, colorMaterial);
        var centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
        mesh.position.y = -centerOffset;
        mesh.rotation.x = Math.PI * 0.5;
        mesh.rotation.y = Math.PI * 1.5;
        this.add(mesh);
      }
      break;
    case ROS3D.MARKER_IMAGE_HUD:
    case ROS3D.MARKER_TEXT_HUD:
      this.isSelectable = false;
      var material = createSpriteMaterial(true);
      if(message.type==ROS3D.MARKER_IMAGE_HUD) {
        material.map = createTexture(message.text);
      }
      else {
        var textTexture = new TextTexture(message.text, {
            fillStyle: htmlColor(this.msgColor),
            font: "Bold 24px Monospace",
            useBubble: false
        });
        material.map = textTexture.texture;
      }
      var sprite = new THREE.Sprite( material );
      sprite.scale.set(material.map.image.width, material.map.image.height, 1);
      sprite.position.set(message.pose.position.x, message.pose.position.y, 0);
      this.add(sprite);
      break;
    case ROS3D.MARKER_TEXT_SPRITE:
    case ROS3D.MARKER_SPRITE:
      this.isSelectable = false;
      var material = createSpriteMaterial(false);
      if(message.type==ROS3D.MARKER_SPRITE) {
        material.map = createTexture(message.text);
      }
      else {
        var textTexture = new TextTexture(message.text, {
            fillStyle: htmlColor(this.msgColor),
            font: "Bold 24px Monospace",
            useBubble: true
        });
        material.map = textTexture.texture;
      }
      var sprite = new THREE.Sprite(material);
      var ratio = material.map.image.width/material.map.image.height;
      sprite.scale = new THREE.Vector3(message.scale.x*ratio, message.scale.y, 1.0);
      this.add(sprite);
      break;
    case ROS3D.MARKER_BACKGROUND_IMAGE:
      this.isBackgroundMarker = true;
      this.isSelectable = false;
      var mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(2, 2, 0),
          new THREE.MeshBasicMaterial({
              map: createTexture(message.text)
          })
      );
      mesh.material.depthTest = false;
      mesh.material.depthWrite = false;
      mesh.renderDepth = 0;
      this.add(mesh);
      break;
    default:
      console.error('Currently unsupported marker type: ' + message.type);
      break;
  }
  
  this.traverse (function (child){
    child.addEventListener('dblclick', function(ev){
        if(that.lastEvent === ev) return;
        that.on_dblclick(that);
        that.lastEvent = ev;
    });
    child.addEventListener('contextmenu', function(ev){
        if(that.lastEvent === ev) return;
        that.on_contextmenu(that);
        that.lastEvent = ev;
    });
  });
  
  //this.traverse (function (child){
  //    child.castShadow = true;
  //    child.receiveShadow = true;
  //});
};
ROS3D.Marker.prototype.__proto__ = THREE.Object3D.prototype;

ROS3D.Marker.selectedMarker = undefined;

/**
 * Set the pose of this marker to the given values.
 *
 * @param pose - the pose to set for this marker
 */
ROS3D.Marker.prototype.setPose = function(pose) {
  // set position information
  this.position.x = pose.position.x;
  this.position.y = pose.position.y;
  this.position.z = pose.position.z;

  // set the rotation
  this.quaternion = new THREE.Quaternion(pose.orientation.x, pose.orientation.y,
      pose.orientation.z, pose.orientation.w);
  this.quaternion.normalize();

  // update the world
  this.updateMatrixWorld();
};

/**
 * Update this marker.
 *
 * @param message - the marker message
 * @return true on success otherwhise false is returned
 */
ROS3D.Marker.prototype.update = function(message) {
  var scaleChanged =
        Math.abs(this.msgScale[0] - message.scale.x) > 1.0e-6 ||
        Math.abs(this.msgScale[1] - message.scale.y) > 1.0e-6 ||
        Math.abs(this.msgScale[2] - message.scale.z) > 1.0e-6;
  var colorChanged =
        Math.abs(this.msgColor[0] - message.color.r) > 1.0e-6 ||
        Math.abs(this.msgColor[1] - message.color.g) > 1.0e-6 ||
        Math.abs(this.msgColor[1] - message.color.b) > 1.0e-6 ||
        Math.abs(this.msgColor[2] - message.color.a) > 1.0e-6;
  var colorMaterial = ROS3D.makeColorMaterial(
      message.color.r, message.color.g,
      message.color.b, message.color.a);
  if(this.marker_type != message.type) return false;
  
  switch (message.type) {
    case ROS3D.MARKER_ARROW:
    case ROS3D.MARKER_LINE_STRIP:
    case ROS3D.MARKER_LINE_LIST:
    case ROS3D.MARKER_CUBE_LIST:
    case ROS3D.MARKER_SPHERE_LIST:
    case ROS3D.MARKER_POINTS:
    case ROS3D.MARKER_TRIANGLE_LIST:
        // TODO: We would have to check each point here but this slows down updating of markers
        return false;
    case ROS3D.MARKER_CUBE:
    case ROS3D.MARKER_SPHERE:
    case ROS3D.MARKER_CYLINDER:
        if(scaleChanged) return false;
        if(colorChanged) {
            this.traverse (function (child){
                if (child instanceof THREE.Mesh) {
                    child.material = colorMaterial;
                }
            });
        }
        break;
    case ROS3D.MARKER_MESH_RESOURCE:
        if(message.mesh_resource.substr(10) !== this.msgMesh) return false;
        if(colorChanged) {
            var meshColorMaterial = undefined;
            if(message.color.r !== 0 || message.color.g !== 0 ||
               message.color.b !== 0 || message.color.a !== 0) {
                meshColorMaterial = colorMaterial;
            }
            var that = this;
            this.traverse (function (child){
                if (child instanceof THREE.Mesh) {
                    if(meshColorMaterial) {
                        child.material = meshColorMaterial;
                    } else { // Reset to default material
                        child.material = child.default_material;
                    }
                }
            });
        }
        if(scaleChanged) {
            this.traverse (function (child){
                if (child.scale_unit) {
                    child.scale = new THREE.Vector3(
                        message.scale.x*child.scale_unit,
                        message.scale.y*child.scale_unit,
                        message.scale.z*child.scale_unit);
                }
            });
        }
        break;
    case ROS3D.MARKER_TEXT_VIEW_FACING:
        if(scaleChanged || this.text !== message.text) {
            return false;
        }
        if(colorChanged) {
            this.traverse (function (child){
                if (child instanceof THREE.Mesh) {
                    child.material = colorMaterial;
                }
            });
        }
        break;
    case ROS3D.MARKER_IMAGE_HUD:
    case ROS3D.MARKER_TEXT_HUD:
        var sprite = this.children[0];
        if(this.msgText !== message.text) return false;
        if(Math.abs(this.msgScale[2] - message.scale.z) > 1.0e-6) return false;
        if(colorChanged) return false;
        sprite.position.set(
            message.pose.position.x,
            message.pose.position.y,
            0);
        break;
    case ROS3D.MARKER_SPRITE:
    case ROS3D.MARKER_TEXT_SPRITE:
        var sprite = this.children[0];
        if(this.msgText !== message.text) return false;
        if(Math.abs(this.msgScale[2] - message.scale.z) > 1.0e-6) return false;
        if(colorChanged) return false;
        if(scaleChanged) {
            var ratio = sprite.material.map.image.width/sprite.material.map.image.height;
            sprite.scale.set(message.scale.x*ratio, message.scale.y, 1.0);
        }
        break;
    case ROS3D.MARKER_BACKGROUND_IMAGE:
        if(this.msgText !== message.text) return false;
        break;
    default:
        return false;
  }
  
  this.msgText = message.text;
  this.msgScale = [message.scale.x, message.scale.y, message.scale.z];
  this.msgColor = [message.color.r, message.color.g, message.color.b, message.color.a];
  this.setPose(message.pose);
  
  return true;
}

/*
 * Free memory of elements in this marker.
 */
ROS3D.Marker.prototype.dispose = function() {
  this.children.forEach(function(element) {
    if (element instanceof ROS3D.MeshResource) {
      element.children.forEach(function(scene) {
        if (scene.material !== undefined) {
          scene.material.dispose();
        }
        scene.children.forEach(function(mesh) {
          if (mesh.geometry !== undefined) {
            mesh.geometry.dispose();
          }
          if (mesh.material !== undefined) {
            mesh.material.dispose();
          }
          scene.remove(mesh);
        });
        element.remove(scene);
      });
    } else {
      if (element.geometry !== undefined) {
          element.geometry.dispose();
      }
      if (element.material !== undefined) {
          element.material.dispose();
      }
    }
    element.parent.remove(element);
  });
};
