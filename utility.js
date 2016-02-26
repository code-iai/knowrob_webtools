

function loadTextureBinary( data ) {
    var image = new Image();
    var texture = new THREE.Texture( image );
    image.onload = function () { texture.needsUpdate = true; };
    image.crossOrigin = this.crossOrigin;
    image.src = "data:image/png;base64," + data;
    //image.src = "data:image/png;base64," + Base64.encode(data);
    return texture;
};

function highlightElement(name, type, highlight) {
    if(typeof type == "string") {
        if(type === "class") {
          var elems = document.getElementsByClassName(name);
          for (i = 0; i < elems.length; i++) {
            elems[i].style.backgroundColor = highlight ? "#144F78" : "#BBB";
            elems[i].style.border = highlight ? "5px solid #144F78" : "1px solid #BBB";
          }
        }
        else if(type === "id") {
          document.getElementById(name).style.border = highlight ? "5px solid #144F78" : "1px solid #BBB";
        }
    }
};

function imageResizer(image, div, image_width, image_height){
    if(!image || image_width <= 0.0 || image_height <= 0.0) return true;
    
    var image_ratio = image_height/image_width;
    var div_ratio = div.height()/div.width();
    if(image_ratio < div_ratio) {
        image.width(div.width());
        image.height(div.width()*image_ratio);
    }
    else {
        image.height(div.height());
        image.width(div.height()/image_ratio);
    }
    return false;
};
    
function formatDate(unix_timestamp) {
    // create a new javascript Date object based on the timestamp
    // multiplied by 1000 so that the argument is in milliseconds, not seconds
    var date = new Date(unix_timestamp*1000);
    // hours part from the timestamp
    var hours = date.getHours();
    // minutes part from the timestamp
    var minutes = "0" + date.getMinutes();
    // seconds part from the timestamp
    var seconds = "0" + date.getSeconds();
    // will display time in 10:30:23 format
    return hours + ':' + minutes.substr(minutes.length-2) + ':' + seconds.substr(seconds.length-2);
};
