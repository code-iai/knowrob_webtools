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
    
    var libraryData;
    var editorSkipUpdate = false;
    
    this.rosViewer = undefined;
    this.console = undefined;
    this.queryLibrary = undefined;

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
    
        var editor = document.getElementById('library-editor');
        document.getElementsByClassName("icon_close")[0].onclick = that.hideLibraryEditor;
        document.getElementsByClassName("icon_add")[0].onclick = that.addQuery;
        window.onclick = function(event) {
            if (event.target == editor) {
                editor.style.display = "none";
            }
        };
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
                that.queryLibrary = query;
                that.updateLibraryEditor(query);
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
    
    function textEditor(container, options) {
        $('<textarea class="library_textarea" data-bind="value: ' + options.field + '"></textarea>').appendTo(container);
    };
    
    this.editLibrary = function() {
        that.updateLibraryEditor(that.queryLibrary);
        that.showLibraryEditor();
    };
    
    this.updateLibraryEditor = function(query_lib) {
        if(editorSkipUpdate) return;
        libraryData = new kendo.data.DataSource({
            data: query_lib,
            schema: {
              model: {
                id: "name",
                fields: {
                    text: { editable: true },
                    q: { editable: true }
                }
              }
            }
        });
        libraryData.read();
        
        //var n = document.createElement("div");
        document.getElementById('library-editor-content').innerHTML = '';
        //document.getElementById('library-editor-content').appendChild(n);
        $('#library-editor-content').kendoGrid({
            dataSource: libraryData,
            columns: [
                { field: "text", title: "Natural language query", editor: textEditor },
                { field: "q", title: "Prolog encoded query", editor: textEditor },
                { command: ["edit", "destroy"], title: "&nbsp;", width: 100 }
            ],
            cancel:function(e) {
                // HACK: For some reasons rows disappear when editing is canceled
                $('#library-editor-content').data('kendoGrid').dataSource.read();
                $('#library-editor-content').data('kendoGrid').refresh();
            },
            save: function(e) {
                editorSkipUpdate = true;
                that.initQueryLibrary(libraryData._data);
                editorSkipUpdate = false;
            },
            remove: function(e) {
                editorSkipUpdate = true;
                that.initQueryLibrary(libraryData._data);
                editorSkipUpdate = false;
            },
            editable: "inline",
            selectable: true,
            sortable: false,
            scrollable: false
        });
    };
    
    this.showLibraryEditor = function() {
        document.getElementById('library-editor').style.display = "block";
    };
    
    this.hideLibraryEditor = function() {
        document.getElementById('library-editor').style.display = "none";
    };
    
    this.addQuery = function() {
        var grid = $("#library-editor-content").data("kendoGrid");
        if (grid) {
            //this logic creates a new item in the datasource/datagrid
            var dataSource = grid.dataSource;
            var total = dataSource.data().length;
            dataSource.insert(total, {});
            dataSource.page(dataSource.totalPages());
            grid.editRow(grid.tbody.children().last());
        }
    };
    
    this.saveQueries = function() {
        // FIXME(daniel): object queries can not be saved like this
        var experimentData = { query: that.queryLibrary };
        $.ajax({
            url: "/knowrob/exp_save",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(experimentData),  
            dataType: "json",
            success: function (data) {
                window.alert("Query library saved successfully!");
            }
        }).done( function (request) {});
    };
    
    this.uploadQueries = function() {
        window.alert("Not implemented yet.");
    };
    
    this.downloadQueries = function() {
        window.alert("Not implemented yet.");
    };
    
    ///////////////////////////////
    //////////// Query Library Diff
    ///////////////////////////////
    
    this.jsondiff = function(left, right) {
        console.info(left);
        console.info(right);
        var delta = jsondiffpatch.diff(left, right);
        return jsondiffpatch.formatters.html.format(delta, left);
    };
    
    this.showDiff = function(diff) {
        document.getElementById('library-editor-content').innerHTML = diff;
        jsondiffpatch.formatters.html.hideUnchanged();
        // TODO: make lib editor more generic
        that.showLibraryEditor();
    };
    
    this.diffQueries = function() {
        var right = JSON.parse(JSON.stringify(that.queryLibrary));
        client.episode.queryEpisodeData(function(result) {
            //that.showDiff(that.jsondiff( result.query, right ) );
            that.showDiff(that.jsondiff( JSON.parse(JSON.stringify(result.query)), right ) );
        });
    };
};
