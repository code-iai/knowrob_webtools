
function TutorialUI(client, options) {
    var that = this;
    
    // configuration of div names
    var canvasDiv     = options.canvas_div || 'markers'
    var designatorDiv = options.designator_div || 'designator'
    var pictureDiv    = options.picture_div || 'mjpeg'
    var historyDiv    = options.history_div || 'history'
    var libraryDiv    = options.library_div || 'examplequery'
    var queryDiv      = options.query_div || 'user_query'
    var nextButtonDiv = options.next_button_div || 'btn_query_next'
    
    this.rosViewer = undefined;
    
    this.console = new PrologConsole(client, options);

    this.init = function () {
        that.console.init();
        
        that.rosViewer = client.newCanvas({
            divID: document.getElementById(canvasDiv)
        });
        that.resizeCanvas();
    };

    this.resizeCanvas = function () {
        that.rosViewer.resize($('#'+canvasDiv).width(), $('#'+canvasDiv).height());
    };
};
