/**
 * Main user interface of openEASE.
 * The ui contains a Prolog console,
 * a library of predefined queries,
 * a webgl canvas and some widgets for
 * displaying graphics and statistics.
 **/
function KnowrobUI(client, options) {
    var that = this;
    
    var imageWidth = function() { return 0.0; };
    var imageHeight = function() { return 0.0; };
    
    this.rosViewer = undefined;
    this.console = undefined;

    this.init = function () {
        that.rosViewer = client.newCanvas({
            divID: document.getElementById('markers'),
            on_window_dblclick: function() {
                if(client.selectedMarker) {
                    that.initQueryLibrary();
                    client.unselectMarker();
                }
            }
        });
        
    
        that.console = new PrologConsole(client, options);
        that.console.init();
        
        that.initQueryLibrary();
        that.resizeCanvas();
      
        $('#mjpeg').resize(function(){
            var timeout = function(){ if(that.resizeImage()) window.setTimeout(timeout, 10); };
            if(that.resizeImage()) window.setTimeout(timeout, 10);
        });
    };

    this.resizeImage = function () {
        return imageResizer($('#mjpeg_image'),
                            $('#mjpeg'),
                            imageWidth(),
                            imageHeight()
                           );
    };

    this.resizeCanvas = function () {
        that.rosViewer.resize($('#markers').width(), $('#markers').height());
    };
    
    this.setCameraPose = function (pose) {
        that.rosViewer.setCameraPose(pose);
    };
    
    ///////////////////////////////
    //////////// Query Library
    ///////////////////////////////
    
    this.initQueryLibrary = function (queries) {
        function loadQueries(query_lib) {
            var lib_div = document.getElementById('library_content');
            if(lib_div !== null && query_lib) {
                lib_div.innerHTML = '';
                
                var query = query_lib.query || query_lib;
                for (var i = 0; i < query.length; i++) {
                    var text = query[i].text.trim();
                    if(text.length==0) continue;
                    
                    if(text.startsWith('-----')) {
                        // insert space between sections
                        if(i>0) {
                            var x = document.createElement('div');
                            x.className = 'query_lib_space';
                            lib_div.appendChild(x);
                        }
                        
                        var x = document.createElement('div');
                        x.className = 'query_lib_header';
                        x.innerHTML = text.split("-----")[1].trim();
                        lib_div.appendChild(x);
                    }
                    else if(query[i].q) {
                        var x = document.createElement('button');
                        x.type = 'button';
                        x.value = query[i].q;
                        x.className = 'query_lib_button';
                        x.innerHTML = text;
                        lib_div.appendChild(x);
                    }
                }
            }
            
            $( "button.query_lib_button" )
                .focus(function( ) {
                    ui.console.setQueryValue( $(this)['0'].value );
                });
        };
        
        if(queries == undefined) {
            client.episode.queryEpisodeData(loadQueries);
        }
        else {
            loadQueries(queries);
        }
    };
    
    $("#library_content").keydown(function(e) {
        var button = $(".query_lib_button:focus");
        if (e.keyCode == 40) { // down
            for(var next=button.next(); next.length>0; next=next.next()) {
                if(next.hasClass('query_lib_button')) {
                    next.focus();
                    next.click();
                    break;
                }
            }
            e.preventDefault();
        }
        else if (e.keyCode == 38) { // up
            for(var prev=button.prev(); prev.length>0; prev=prev.prev()) {
                if(prev.hasClass('query_lib_button')) {
                    prev.focus();
                    prev.click();
                    break;
                }
            }
            e.preventDefault();
        }
        else if (e.keyCode == 32) { // space
            e.preventDefault();
            that.console.query();
        }
    });
    
    ///////////////////////////////
    //////////// Editable Query Library
    ///////////////////////////////
    
    this.editQueries = function() {
        window.alert("Not implemented yet.");
    };
    
    this.uploadQueries = function() {
        window.alert("Not implemented yet.");
    };
    
    this.downloadQueries = function() {
        window.alert("Not implemented yet.");
    };
    
    this.saveQueries = function() {
        var experimentData = { query: [] };
        var x = document.getElementById("examplequery");
        // FIXME broken
        for(var i=0; i<x.options.length; i++) {
            experimentData.query.push({
                q: x.options[i].value,
                text: x.options[i].text
            });
        };
        $.ajax({
            url: "/knowrob/exp_save",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(experimentData),  
            dataType: "json",
            success: function (data) {}
        }).done( function (request) {});
    };
};
