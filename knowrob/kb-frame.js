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
                    var x = document.createElement('button');
                    if(query[i].q !== undefined) {
                        x.type = 'button';
                        x.className = 'query_lib_button show_code';
                        x.value = query[i].q;
                        if(client.flask_user.isAdmin()) {
                            x.ondblclick = "ui.setQueryText()";
                        }
                        //x.onchange = "ui.console.setQueryValue("+x.value+")";
                        
                        if(query[i].text.startsWith('-----')) {
                            x.innerHTML = '<div class="query_lib_header">'+
                                query[i].text.split("-----")[1].trim()+'</div>';
                        }
                        else {
                            x.innerHTML = query[i].text;
                        }
                        
                        lib_div.appendChild(x);
                        lib_div.appendChild(document.createElement('br'));
                        lib_div.appendChild(document.createElement('hr'));
                    }
                }
            }
        };
        
        if(queries == undefined) {
            client.episode.queryEpisodeData(loadQueries);
        }
        else {
            loadQueries(queries);
        }
    };
    
    ///////////////////////////////
    //////////// Editable Query Library
    ///////////////////////////////
    // FIXME(daniel): object query library not editable yet!
    
    function ensureSelected() {
        if(document.getElementById("examplequery").selectedIndex<1) {
            window.alert("Please select a query.");
            return false;
        }
        else {
            return true;
        }
    };
    
    function selectedQueryIndex() {
        return document.getElementById("examplequery").selectedIndex;
    };
    
    function selectedQueryText() {
        var x = document.getElementById("examplequery");
        if(!ensureSelected()) return None;
        return x.options[x.selectedIndex].firstChild.data;
    };
    
    function setQueryText() {
        var text = window.prompt("Please enter natural language "+
            "representation for the Prolog query",selectedQueryText());
        if(text) {
            var x = document.getElementById("examplequery");
            x.options[x.selectedIndex].firstChild.data = text;
        }
    };
    
    function selectedQueryCode() {
        var x = document.getElementById("examplequery");
        if(!ensureSelected()) return None;
        return x.options[x.selectedIndex].value;
    };
    
    function addQuery() {
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
            var x = document.getElementById("examplequery");
            x.removeChild( x.options[x.selectedIndex] );
        }
    };
    
    function saveQuery() {
        if(!ensureSelected()) return;
        var x = document.getElementById("examplequery");
        x.options[x.selectedIndex].value = ace.edit('user_query').getValue();
    };
    
    function queryMove(increment) {
        if(!ensureSelected()) return;
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
