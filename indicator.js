/**
 * @author Daniel Beßler - danielb@cs.uni-bremen.de
 */

function IndicatorSprite(html, options, then){
    var that = this;
    // Font options
    var useBubble = options.useBubble || false;
    var margin = options.margin || [6, 6];
    var bubbleRadius = 12;
    var bubblePeak = [15, 20, 0]; // width, height, x-offset
    // Create a canvas for 2D rendering
    this.canvas = document.createElement('canvas');
    this.texture = undefined;
    
    var html_container = document.getElementById('measure-container');
    html_container.innerHTML = html;
    
    var html_canvas = document.createElement('canvas');
    html_canvas.height = html_container.clientHeight;
    html_canvas.width = html_container.clientWidth;
    
    rasterizeHTML.drawHTML(html, html_canvas).then(function (renderResult) {
        // The canvas size
        var cw = renderResult.image.width + 2*margin[0];
        var ch = renderResult.image.height + 2*margin[1];
        
        if(useBubble) ch += bubblePeak[1];
            
        // Create context with appropriate canvas size 
        that.ctx = that.canvas.getContext('2d');
        that.ctx.canvas.width  = cw;
        that.ctx.canvas.height = ch;
            
        if(useBubble) that.drawBubble(renderResult.image);
    
        that.ctx.drawImage(renderResult.image, 0.5*margin[0], 0.5*margin[1]);
            
        // Finally create texture from canvas
        that.texture = new THREE.Texture(that.canvas);
        that.texture.needsUpdate = true;
        
        then(that);
    });
    
    this.drawBubble = function (img) {
        that.ctx.beginPath();
        that.ctx.strokeStyle = options.bubbleBorderColor || "black";
        that.ctx.lineWidth   = options.bubbleBorderWidth || "2";
        that.ctx.fillStyle   = options.bubbleColor || "rgba(210, 210, 210, 0.8)";
        
        var ls = 1;
        var w = img.width + 2*margin[0];
        var h = img.height ;
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
        
        that.ctx.fill();
        that.ctx.stroke();
        that.ctx.closePath();
    };
};
