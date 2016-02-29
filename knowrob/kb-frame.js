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
    var canvasDiv     = options.canvas_div || 'markers'
    var designatorDiv = options.designator_div || 'designator'
    var pictureDiv    = options.picture_div || 'mjpeg'
    var historyDiv    = options.history_div || 'history'
    var libraryDiv    = options.library_div || 'examplequery'
    var queryDiv      = options.query_div || 'user_query'
    var nextButtonDiv = options.next_button_div || 'btn_query_next'
    
    var imageWidth = function() { return 0.0; };
    var imageHeight = function() { return 0.0; };
  
    // The index to the currently active history item
    // history items are saved on the server and queried using AJAX
    var historyIndex = -1;
    
    this.rosViewer = undefined;
    
    var prolog;

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
        
        that.initConsole();
        that.initHistory();
        that.initQueryLibrary();
        that.resizeCanvas();
        
        setInactive(document.getElementById(nextButtonDiv));
      
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
    //////////// Prolog Console
    ///////////////////////////////

    this.initConsole = function () {
        var userQuery = ace.edit(queryDiv);
        userQuery.resize(true);
        userQuery.setTheme("ace/theme/solarized_light");
        userQuery.getSession().setMode("ace/mode/prolog");
        userQuery.getSession().setUseWrapMode(true);
        userQuery.setOptions({
            showGutter: false,
            printMarginColumn: false,
            highlightActiveLine: false,
            highlightGutterLine: false,
            enableBasicAutocompletion: true
        });
        userQuery.commands.addCommand({
            name: 'send_query', readOnly: false,
            bindKey: {win: 'Enter',  mac: 'Enter'},
            exec: function(editor) { that.query(); }
        });
        userQuery.commands.addCommand({
            name: 'new_line', readOnly: false,
            bindKey: {win: 'Ctrl-Enter',  mac: 'Command-Enter'},
            exec: function(editor) { that.setQueryValue(userQuery.getValue()+"\n"); }
        });
        userQuery.commands.addCommand({
            name: 'next_result', readOnly: false,
            bindKey: {win: 'Ctrl-;',  mac: 'Command-;'},
            exec: function(editor) { that.nextSolution(); }
        });
        userQuery.commands.addCommand({
            name: 'next_result', readOnly: false,
            bindKey: {win: 'Ctrl-n',  mac: 'Command-n'},
            exec: function(editor) { that.nextSolution(); }
        });
        userQuery.commands.addCommand({
            name: 'next_history', readOnly: false,
            bindKey: {win: 'Up',  mac: 'Up'},
            exec: function(editor) { that.nextHistoryItem(); }
        });
        userQuery.commands.addCommand({
            name: 'previous_history', readOnly: false,
            bindKey: {win: 'Down',  mac: 'Down'},
            exec: function(editor) { that.previousHistoryItem(); }
        });
        
        // Create console iosOverlay
        var console = document.getElementById('console');
        if(console) {
            var consoleOverlay = document.createElement("div");
            consoleOverlay.setAttribute("id", "console-overlay");
            consoleOverlay.className = "ui-ios-overlay ios-overlay-hide div-overlay";
            consoleOverlay.innerHTML += '<span class="title">Processing Query</span';
            consoleOverlay.style.display = 'none';
            console.appendChild(consoleOverlay);
            var spinner = createSpinner();
            consoleOverlay.appendChild(spinner.el);
        }
        
        return userQuery;
    };
    
    this.showConsoleOverlay = function () {
      var consoleOverlay = document.getElementById('console-overlay');
      if(consoleOverlay) {
          consoleOverlay.style.display = 'block';
          consoleOverlay.className = consoleOverlay.className.replace("hide","show");
          consoleOverlay.style.pointerEvents = "auto";
      }
    };
    this.hideConsoleOverlay = function () {
      var consoleOverlay = document.getElementById('console-overlay');
      if(consoleOverlay) {
          //consoleOverlay.style.display = 'none';
          consoleOverlay.className = consoleOverlay.className.replace("show","hide");
          consoleOverlay.style.pointerEvents = "none";
      }
    };
    
    ///////////////////////////////
    //////////// Query Library
    ///////////////////////////////
    
    this.initQueryLibrary = function (queries) {
        function loadQueries(query_lib) {
            var select = document.getElementById(libraryDiv);
            if(select !== null && query_lib) {
                while (select.firstChild) select.removeChild(select.firstChild);
                
                var query = query_lib.query || query_lib;
                for (var i = 0; i < query.length; i++) {
                    var opt = document.createElement('option');
                    if(query[i].q !== undefined) {
                        opt.value = query[i].q;
                        opt.innerHTML = query[i].text;
                        select.appendChild(opt);
                    }
                }
                select.size = query.length;
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
    //////////// History
    ///////////////////////////////

    this.addHistoryItem = function (query) {
        $.ajax({
            url: "/knowrob/add_history_item",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({query: query}),  
            dataType: "json"
        }).done( function (request) {})
    };

    this.setHistoryItem = function (index) {
        $.ajax({
            url: "/knowrob/get_history_item",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({index: index}),  
            dataType: "json",
            success: function (data) {
                 ace.edit(queryDiv).setValue(data.item);
                 historyIndex = data.index;
            }
        }).done( function (request) {})
    };

    this.nextHistoryItem = function () {
        this.setHistoryItem(historyIndex+1);
    };
    
    this.previousHistoryItem = function () {
        this.setHistoryItem(historyIndex-1);
    };

    this.initHistory = function () {
        var history = ace.edit(historyDiv);
        history.setTheme("ace/theme/solarized_light");
        history.getSession().setMode("ace/mode/prolog");
        history.getSession().setUseWrapMode(true);
        history.setOptions({
            readOnly: true,
            showGutter: false,
            printMarginColumn: false,
            highlightActiveLine: false,
            highlightGutterLine: false
        });
        return history;
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
    
    ///////////////////////////////
    //////////// History
    ///////////////////////////////
    
    this.newProlog = function() {
      if (prolog && prolog.finished == false) {
        ace.edit(historyDiv).setValue(ace.edit(historyDiv).getValue() + "stopped.\n", -1);
        ace.edit(historyDiv).navigateFileEnd();
        prolog.finishClient();
        prolog = undefined;
      }
      return new JsonProlog(client.ros, {});
    }
    
    this.query = function () {
      var query = ace.edit(queryDiv);
      var history = ace.edit(historyDiv);
      var q = query.getValue().trim();
    
      if (q.substr(q.length - 1) == ".") {
        q = q.substr(0, q.length - 1);
        prolog = this.newProlog();
        that.showConsoleOverlay();
        
        history.setValue(history.getValue() + "\n\n?- " + q +  ".\n", -1);
        history.navigateFileEnd();
        setActive(document.getElementById(nextButtonDiv));
        
        prolog.jsonQuery(q+", marker_publish", function(result) {
            that.hideConsoleOverlay();
            history.setValue(history.getValue() + prolog.format(result), -1);
            history.navigateFileEnd();
            if( ! result.value ) setInactive(document.getElementById(nextButtonDiv));
        }, mode=1); // incremental mode
        
        query.setValue("");
        
        that.addHistoryItem(q);
        historyIndex = -1;
      }
      else {
        if (prolog != null && prolog.finished == false) {
          that.hideConsoleOverlay();
          history.setValue(history.getValue() + "stopped.\n\n", -1);
          history.navigateFileEnd();
          prolog.finishClient();
          prolog = undefined;
        }
        else {
          alert("Invalid prolog query '" + q + "'. Prolog queries always end with a dot.");
        }
      }
    };

    this.nextSolution = function () {
      var history = ace.edit(historyDiv);
      that.showConsoleOverlay();
      prolog.nextQuery(function(result) {
          that.hideConsoleOverlay();
          history.setValue(history.getValue() + prolog.format(result), -1);
          history.navigateFileEnd();
          if( ! result.value ) setInactive(document.getElementById(nextButtonDiv));
      });
      ace.edit(queryDiv).focus();
    };
    
    function setActive(div) {
      div.style.pointerEvents = "auto";
      div.style.backgroundColor = "#dadada";
      div.style.color = "#606060";
    };
    
    function setInactive(div) {
      div.style.pointerEvents = "none";
      div.style.backgroundColor = "#cfcfcf";
      div.style.color = "#adadad";
    };

    // append the selected query to the user_query form
    this.addSelectedToQueryform = function (selectid, focus) {
      var select = document.getElementById(selectid);
      this.setQueryValue(select.options[select.selectedIndex].value, focus);
    };

    // set the value of the query editor and move the cursor to the end
    this.setQueryValue = function (val, focus){
      var user_query = ace.edit(queryDiv);
      user_query.setValue(val, -1);
      if(focus) user_query.focus();
      user_query.navigateFileEnd();
    };
};
