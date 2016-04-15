/**
 * Main user interface of openEASE.
 * The ui contains a Prolog console,
 * a library of predefined queries,
 * a webgl canvas and some widgets for
 * displaying graphics and statistics.
 **/
function KnowrobUI(client, options) {
    var that = this;
    
    // configuration of div names
    var canvasDiv     = options.canvas_div || 'markers';
    var designatorDiv = options.designator_div || 'designator';
    var pictureDiv    = options.picture_div || 'mjpeg';
    var historyDiv    = options.history_div || 'history';
    var libraryDiv    = options.library_div || 'library';
    var queryDiv      = options.query_div || 'user_query';
    var nextButtonDiv = options.next_button_div || 'btn_query_next';
    
    var imageWidth = function() { return 0.0; };
    var imageHeight = function() { return 0.0; };
    
    this.rosViewer = undefined;
    this.console = undefined;

    this.init = function () {
        that.rosViewer = client.newCanvas({
            divID: document.getElementById(canvasDiv),
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
      
        $('#'+pictureDiv).resize(function(){
            var timeout = function(){ if(that.resizeImage()) window.setTimeout(timeout, 10); };
            if(that.resizeImage()) window.setTimeout(timeout, 10);
        });
    };

    this.resizeImage = function () {
        return imageResizer($('#mjpeg_image'),
                            $('#'+pictureDiv),
                            imageWidth(),
                            imageHeight()
                           );
    };

    this.resizeCanvas = function () {
        that.rosViewer.resize($('#'+canvasDiv).width(), $('#'+canvasDiv).height());
    };
    
    this.setCameraPose = function (pose) {
        that.rosViewer.setCameraPose(pose);
    };
    
    ///////////////////////////////
    //////////// Query Library
    ///////////////////////////////
    
    this.initQueryLibrary = function (queries) {
        function loadQueries(query_lib) {
            var lib_div = document.getElementById(libraryDiv);
            if(lib_div !== null && query_lib) {
                lib_div.innerHTML = '';
                
                var query = query_lib.query || query_lib;
                for (var i = 0; i < query.length; i++) {
                    var text = query[i].text.trim();
                    if(text.length==0) continue;
                    
                    // TODO: buttons for editable queries!
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
                        x.className = 'query_lib_button show_code';
                        x.innerHTML = text;
                        if(client.flask_user.isAdmin()) {
                            x.ondblclick = function(e) {
                                that.setQueryText();
                            };
                        }
                        lib_div.appendChild(x);
                    }
                }
            }
            
            $( "button.query_lib_button" ).focus(function( event ) {
                ui.console.setQueryValue( $(this)['0'].value );
                event.preventDefault();
            });
        };
        
        if(queries == undefined) {
            client.episode.queryEpisodeData(loadQueries);
        }
        else {
            loadQueries(queries);
        }
    };
    
    $("#library").keydown(function(e) {
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
    // FIXME(daniel): object query library not editable yet!
    
    function ensureSelected() {
        // FIXME broken
        if(document.getElementById("examplequery").selectedIndex<1) {
            window.alert("Please select a query.");
            return false;
        }
        else {
            return true;
        }
    };
    
    function selectedQueryIndex() {
        // FIXME broken
        return document.getElementById("examplequery").selectedIndex;
    };
    
    function selectedQueryText() {
        // FIXME broken
        var x = document.getElementById("examplequery");
        if(!ensureSelected()) return None;
        return x.options[x.selectedIndex].firstChild.data;
    };
    
    function setQueryText() {
        var text = window.prompt("Please enter natural language "+
            "representation for the Prolog query",selectedQueryText());
        if(text) {
        // FIXME broken
            var x = document.getElementById("examplequery");
            x.options[x.selectedIndex].firstChild.data = text;
        }
    };
    
    function selectedQueryCode() {
        // FIXME broken
        var x = document.getElementById("examplequery");
        if(!ensureSelected()) return None;
        return x.options[x.selectedIndex].value;
    };
    
    function addQuery() {
        // FIXME broken
        var x = document.getElementById("examplequery");
        var i = selectedQueryIndex()+1;
        var text = window.prompt("Please enter natural language "+
            "representation for the Prolog query","");
        if(text) {
            var opt = document.createElement('option');
            opt.value = '';
            opt.innerHTML = text;
            if(x.selectedIndex+1 < x.options.length) {
                x.insertBefore(opt, x.options[x.selectedIndex+1]);
            }
            else {
                x.appendChild(opt);
            }
        }
    };
    
    function deleteQuery() {
        if(!ensureSelected()) return;
        if(window.confirm('Do you really want to delete the query "'+selectedQueryText()+'"')) {
        // FIXME broken
            var x = document.getElementById("examplequery");
            x.removeChild( x.options[x.selectedIndex] );
        }
    };
    
    function saveQuery() {
        if(!ensureSelected()) return;
        var x = document.getElementById("examplequery");
        // FIXME broken
        x.options[x.selectedIndex].value = ace.edit('user_query').getValue();
    };
    
    function queryMove(increment) {
        if(!ensureSelected()) return;
        // FIXME broken
        var x = document.getElementById("examplequery");
        var selIndex = x.selectedIndex;
        if(selIndex + increment <= 0) return;
        var selValue = x.options[selIndex].value;
        var selText = x.options[selIndex].text;
        x.options[selIndex].value = x.options[selIndex + increment].value;
        x.options[selIndex].text = x.options[selIndex + increment].text;
        x.options[selIndex + increment].value = selValue;
        x.options[selIndex + increment].text = selText;
        x.selectedIndex = selIndex + increment;
    };
    function queryUp() { queryMove(-1); };
    function queryDown() { queryMove(1); };
    
    function saveQueries() {
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
