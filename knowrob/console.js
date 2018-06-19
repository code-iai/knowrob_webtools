/**
 * A Prolog console with history pane.
 **/
function PrologConsole(client, options) {
    var that = this;
    var prolog;
    
    var useOverlay = options.use_console_overlay;
    
    var nextButtonDiv = options.next_button_div || 'btn_query_next';
    var historyDiv    = options.history_div || 'history';
    var queryDiv      = options.query_div || 'user_query';
    
    // Names of prolog predicates and modules for auto completion
    var prologNames;
  
    // The index to the currently active history item
    // history items are saved on the server and queried using AJAX
    var historyIndex = -1;
    
    this.rdf_namespaces = {};

    this.init = function () {
        ace.require("ace/ext/language_tools");
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
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            wrap: false
        });
        userQuery.commands.addCommand({
            name: 'send_query', readOnly: false,
            bindKey: {win: 'Ctrl-Enter',  mac: 'Command-Enter'},
            exec: function(editor) { that.query(); }
        });
        userQuery.commands.addCommand({
            name: 'next_result', readOnly: false,
            bindKey: {win: 'Ctrl-;',  mac: 'Command-;'},
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
        
        this.initAutoCompletion();
        
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
        
        var history = ace.edit(historyDiv);
        history.setTheme("ace/theme/solarized_light");
        history.getSession().setMode("ace/mode/prolog");
        history.getSession().setUseWrapMode(true);
        history.setOptions({
            readOnly: true,
            showGutter: false,
            printMarginColumn: false,
            highlightActiveLine: false,
            highlightGutterLine: false,
            wrap: false
        });
        
        setInactive(document.getElementById(nextButtonDiv));
        
        setInterval(that.updateNamespaces, 10000);
        that.updateNamespaces();
    };
    
    this.updateNamespaces = function(objectName) {
        var pl = client.newProlog();
        if(!pl) return;
        pl.jsonQuery("findall([_X,_Y], rdf_current_ns(_X,_Y), NS).",
            function(result) {
                pl.finishClient();
                if(result.solution) {
                  var namespaces = {};
                  for(i in result.solution.NS) {
                    namespaces[result.solution.NS[i][1]] = result.solution.NS[i][0];
                  }
                  that.rdf_namespaces = namespaces;
                }
            }
        );
    };
    
    this.queryPredicateNames = function() {
      if( ! prologNames ) {
        prolog = this.newProlog();
        if(!prolog) return;
        prologNames = [];
        // Query for predicates/modules and collect all results
        prolog.jsonQuery("findall(X, current_predicate(X/_);current_module(X), L)", function(x) {
          if (x.value) {
            // Parse each value
            var lines = x.value.split("\n");
            for(i=1; i<lines.length-1; ++i) {
              var tmp = lines[i].split(" = ");
              if(tmp.length==2) {
                prologNames.push(tmp[1].trim());
              }
            }
            prologNames.sort();
          }
          else {
            console.warn("Unable to query prolog names.");
            console.warn(x);
          }
        }, mode=0);
      }
      return prologNames;
    };
    
    this.initAutoCompletion = function() {
        // Add completer for prolog code
        ace.require("ace/ext/language_tools").addCompleter({
            getCompletions: function(editor, session, pos, prefix, callback) {
                var names = that.queryPredicateNames();
                if( names ) {
                  callback(null, names.map(function(x) {
                      return {name: x, value: x, score: 100, meta: "pl"};
                  }));
                }
            }
        });
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

    this.newProlog = function() {
      if(!client.ros) return;
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
        var oldQuery = q;
        q = prologJSWrapper(q);
        prolog = this.newProlog();
        if(useOverlay) that.showConsoleOverlay();
        
        history.setValue(history.getValue() + "\n\n?- " + oldQuery +  ".\n", -1);
        history.navigateFileEnd();
        setActive(document.getElementById(nextButtonDiv));
        
        prolog.jsonQuery(q+", ignore(marker_publish)", function(result) {
            console.log(result);
            if(useOverlay) that.hideConsoleOverlay();
            history.setValue(history.getValue() + prolog.format(result,that.rdf_namespaces), -1);
            history.navigateFileEnd();
            if( ! result.value ) setInactive(document.getElementById(nextButtonDiv));
        }, mode=1); // incremental mode
        
        query.setValue("");
        
        that.addHistoryItem(oldQuery);
        historyIndex = -1;
      }
      else {
        if (prolog != null && prolog.finished == false) {
          if(useOverlay) that.hideConsoleOverlay();
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
      if(useOverlay) that.showConsoleOverlay();
      prolog.nextQuery(function(result) {
          if(useOverlay) that.hideConsoleOverlay();
          history.setValue(history.getValue() + prolog.format(result,that.rdf_namespaces), -1);
          history.navigateFileEnd();
          if( ! result.value ) setInactive(document.getElementById(nextButtonDiv));
      });
      ace.edit(queryDiv).focus();
    };

    function prologJSWrapper(query){
        var splitedQuery = query.split('(');
        if(splitedQuery[0] && 'showTaskTree' == splitedQuery[0]){
            var myNode = document.getElementById("chart");
            while (myNode.firstChild) {
                myNode.removeChild(myNode.firstChild);
            }

            $.getScript( "/static/lib/d3/d3.v3.min.js", function() {
                $.getScript('/static/lib/NEEM-Visualization-Task-Tree/build/neemVisualizationTaskTree.js', function(){
                    var pathToLogFile = splitedQuery[1].split(')')[0].replace(new RegExp('\'', 'g'),'');
                    parent.frames['cog-frame'].contentWindow.visualizeTaskTree = neemVisualizationTaskTree.visualizeTaskTree
                    parent.frames['cog-frame'].
                    contentWindow.visualizeTaskTree('/static'+pathToLogFile,'#chart','#chart', nodeClickCallback);
                });
            });
            return "true";
        }

        if(splitedQuery[0] && 'showTaskErrorMatrix' == splitedQuery[0]){
            var myNode = document.getElementById("chart");
            while (myNode.firstChild) {
                myNode.removeChild(myNode.firstChild);
            }

            $.getScript( "/static/lib/d3/d3.v4.min.js", function() {
                $.getScript('/static/lib/NEEM-Co-Occurrence-Matrix/build/neemCoOccurrenceMatrix.js', function(){
                    var pathToLogFile = splitedQuery[1].split(')')[0].replace(new RegExp('\'', 'g'),'');
                    parent.frames['cog-frame'].
                        contentWindow.showMatrx = showMatrx;
                    parent.frames['cog-frame'].
                        contentWindow.showMatrx('/static'+pathToLogFile,'#chart', matrixLabelClickCallback);

                });
            });

            return 'true';
        }

        if(splitedQuery[0] && 'showTaskTimeBarchart' == splitedQuery[0]){
            var myNode = document.getElementById("chart");
            while (myNode.firstChild) {
                myNode.removeChild(myNode.firstChild);
            }

            $.getScript( "/static/lib/d3/d3.v3.min.js", function() {
                $.getScript('/static/lib/NEEM-Hierarchy-Barchart/build/neemHierarchyBarchart.js', function(){
                    var pathToLogFile = splitedQuery[1].split(')')[0].replace(new RegExp('\'', 'g'),'');
                    parent.frames['cog-frame'].
                        contentWindow.neemHierarchyBarchart.visualizeTaskTimeBarchart = neemHierarchyBarchart.visualizeTaskTimeBarchart;
                    parent.frames['cog-frame'].
                    contentWindow.neemHierarchyBarchart.visualizeTaskTimeBarchart('/static'+pathToLogFile,'#chart', 'test');

                });
            });

            return 'true';
        }

        if(splitedQuery[0] && 'showTaskNumBarchart' == splitedQuery[0]){
            var myNode = document.getElementById("chart");
            while (myNode.firstChild) {
                myNode.removeChild(myNode.firstChild);
            }

            $.getScript( "/static/lib/d3/d3.v3.min.js", function() {
                $.getScript('/static/lib/NEEM-Hierarchy-Barchart/build/neemHierarchyBarchart.js', function(){
                    var pathToLogFile = splitedQuery[1].split(')')[0].replace(new RegExp('\'', 'g'),'');
                    parent.frames['cog-frame'].
                        contentWindow.neemHierarchyBarchart.visualizeTaskNumBarchart = neemHierarchyBarchart.visualizeTaskNumBarchart;
                    parent.frames['cog-frame'].
                    contentWindow.neemHierarchyBarchart.visualizeTaskNumBarchart('/static'+pathToLogFile,'#chart', 'test');

                });
            });

            return 'true';
        }

        if(splitedQuery[0] && 'showReasoningNumBarchart' == splitedQuery[0]){
            var myNode = document.getElementById("chart");
            while (myNode.firstChild) {
                myNode.removeChild(myNode.firstChild);
            }

            $.getScript( "/static/lib/d3/d3.v3.min.js", function() {
                $.getScript('/static/lib/NEEM-Hierarchy-Barchart/build/neemHierarchyBarchart.js', function(){
                    var pathToLogFile = splitedQuery[1].split(')')[0].replace(new RegExp('\'', 'g'),'');
                    parent.frames['cog-frame'].
                        contentWindow.neemHierarchyBarchart.visualizeReasoningNumBarchart = neemHierarchyBarchart.visualizeReasoningNumBarchart;
                    parent.frames['cog-frame'].
                    contentWindow.neemHierarchyBarchart.visualizeReasoningNumBarchart('/static'+pathToLogFile,'#chart', 'test');
                });
            });

            return 'true';
        }

        if(splitedQuery[0] && 'showReasoningTimeBarchart' == splitedQuery[0]){
            var myNode = document.getElementById("chart");
            while (myNode.firstChild) {
                myNode.removeChild(myNode.firstChild);
            }

            $.getScript( "/static/lib/d3/d3.v3.min.js", function() {
                $.getScript('/static/lib/NEEM-Hierarchy-Barchart/build/neemHierarchyBarchart.js', function(){
                    var pathToLogFile = splitedQuery[1].split(')')[0].replace(new RegExp('\'', 'g'),'');
                    parent.frames['cog-frame'].
                        contentWindow.neemHierarchyBarchart.visualizeReasoningTimeBarchart = neemHierarchyBarchart.visualizeReasoningTimeBarchart;
                    parent.frames['cog-frame'].
                    contentWindow.neemHierarchyBarchart.visualizeReasoningTimeBarchart('/static'+pathToLogFile,'#chart', 'test');

                });
            });

            return 'true';
        }

        if(splitedQuery[0] && 'showReasoningVsTaskTimePiechart' == splitedQuery[0]){
            var myNode = document.getElementById("chart");
            while (myNode.firstChild) {
                myNode.removeChild(myNode.firstChild);
            }

            $.getScript( "/static/lib/d3/d3.v3.min.js", function() {
                $.getScript('/static/lib/NEEM-Piechart/build/neemPiechart.js', function(){
                    var pathToLogFile = splitedQuery[1].split(')')[0].replace(new RegExp('\'', 'g'),'');
                    parent.frames['cog-frame'].
                        contentWindow.neemPiechart.visualizeReasoningVsTaskTimePiechart = neemPiechart.visualizeReasoningVsTaskTimePiechart;
                    parent.frames['cog-frame'].
                    contentWindow.neemPiechart.visualizeReasoningVsTaskTimePiechart('/static'+pathToLogFile,'#chart', 'test');

                });
            });

            return 'true';
        }

        if(splitedQuery[0] && 'showReasoningVsTaskNumPiechart' == splitedQuery[0]){
            var myNode = document.getElementById("chart");
            while (myNode.firstChild) {
                myNode.removeChild(myNode.firstChild);
            }

            $.getScript( "/static/lib/d3/d3.v3.min.js", function() {
                $.getScript('/static/lib/NEEM-Piechart/build/neemPiechart.js', function(){
                    var pathToLogFile = splitedQuery[1].split(')')[0].replace(new RegExp('\'', 'g'),'');
                    parent.frames['cog-frame'].
                        contentWindow.neemPiechart.visualizeReasoningVsTaskNumPiechart = neemPiechart.visualizeReasoningVsTaskNumPiechart;
                    parent.frames['cog-frame'].
                    contentWindow.neemPiechart.visualizeReasoningVsTaskNumPiechart('/static'+pathToLogFile,'#chart', 'test');

                });
            });

            return 'true';
        }

        if(splitedQuery[0] && 'showErrorVsTaskNumPiechart' == splitedQuery[0]){
            var myNode = document.getElementById("chart");
            while (myNode.firstChild) {
                myNode.removeChild(myNode.firstChild);
            }

            $.getScript( "/static/lib/d3/d3.v3.min.js", function() {
                $.getScript('/static/lib/NEEM-Piechart/build/neemPiechart.js', function(){
                    var pathToLogFile = splitedQuery[1].split(')')[0].replace(new RegExp('\'', 'g'),'');
                    parent.frames['cog-frame'].
                        contentWindow.neemPiechart.visualizeErrorVsTaskNumPiechart = neemPiechart.visualizeErrorVsTaskNumPiechart;
                    parent.frames['cog-frame'].
                    contentWindow.neemPiechart.visualizeErrorVsTaskNumPiechart('/static'+pathToLogFile,'#chart', 'test');

                });
            });

            return 'true';
        }

        return query;
    }

    function matrixLabelClickCallback(d, nodes){
        var typeName = "";

        if (!isNaN(d)) {
            //READING the error name
            typeName = nodes[d].name;
            var splitedTypeName = typeName.split(':');
            typeName = splitedTypeName[0].toLowerCase() + ':' + splitedTypeName[1];
        }
        else{
            //READING the task type
            var knowrob_uri = 'http://knowrob.org/kb/knowrob.owl#';
            typeName = knowrob_uri+nodes[d[0].x].name;
        }

        var q = 'retractall(last_clicked(_)),asserta(last_clicked(\''+typeName+'\'))';
        prolog = that.newProlog()
        prolog.jsonQuery(q+", ignore(marker_publish)", function(result) {
            console.log(result);
            console.log('DONE');
        }, mode=0);
    }
    function nodeClickCallback(node){
        var knowrob_uri = 'http://knowrob.org/kb/knowrob.owl#';
        console.log(knowrob_uri + node.name);
        var q = 'retractall(last_clicked(_)),asserta(last_clicked(\''+knowrob_uri + node.name+'\'))';
        prolog = that.newProlog()
        prolog.jsonQuery(q+", ignore(marker_publish)", function(result) {
            console.log(result);
            console.log('DONE');
        }, mode=0);
    }

    // TODO(daniel): better use CSS class / disabled selector
    function setActive(div) {
      div.style.pointerEvents = "auto";
      div.style.backgroundColor = "#dadada";
      div.style.color = "#606060";
      div.style.opacity = "1.0";
    };
    function setInactive(div) {
      div.style.pointerEvents = "none";
      div.style.backgroundColor = "#cfcfcf";
      div.style.color = "#adadad";
      div.style.opacity = "0.2";
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
      // disabled because it behaviour is not nice when wrapping disabled
      //user_query.navigateFileEnd();
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
    
    this.zoomIn = function() {
        $('#history').css('font-size', parseInt($('#history').css("font-size")) + 2);
        $('#user_query').css('font-size', parseInt($('#user_query').css("font-size")) + 2);
    };
    
    this.zoomOut = function() {
        $('#history').css('font-size', parseInt($('#history').css("font-size")) - 2);
        $('#user_query').css('font-size', parseInt($('#user_query').css("font-size")) - 2);
    };
};
