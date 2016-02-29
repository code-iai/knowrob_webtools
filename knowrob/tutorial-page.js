
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
    
    var prolog;

    this.init = function () {
        that.setupQueryField();
        that.rosViewer = client.newCanvas({
            divID: document.getElementById(canvasDiv)
        });
        that.resizeCanvas();
    };

    this.resizeCanvas = function () {
        that.rosViewer.resize($('#'+canvasDiv).width(), $('#'+canvasDiv).height());
    };
    
    this.setupQueryField = function() {
        var userQuery = ace.edit('user_query');
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
        
        var initQuery = ace.edit('history');
        initQuery.resize(true);
        initQuery.setTheme("ace/theme/solarized_light");
        initQuery.getSession().setMode("ace/mode/prolog");
        initQuery.getSession().setUseWrapMode(true);
        initQuery.setOptions({
            showGutter: false,
            printMarginColumn: false,
            highlightActiveLine: false,
            highlightGutterLine: false,
            enableBasicAutocompletion: true
        });
    };
    
    // TODO: below redundant with KB page
    
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
        //that.showConsoleOverlay();
        
        history.setValue(history.getValue() + "\n\n?- " + q +  ".\n", -1);
        history.navigateFileEnd();
        setActive(document.getElementById(nextButtonDiv));
        
        prolog.jsonQuery(q+", marker_publish", function(result) {
            //that.hideConsoleOverlay();
            history.setValue(history.getValue() + prolog.format(result), -1);
            history.navigateFileEnd();
            if( ! result.value ) setInactive(document.getElementById(nextButtonDiv));
        }, mode=1); // incremental mode
        
        query.setValue("");
        
        //that.addHistoryItem(q);
        //historyIndex = -1;
      }
      else {
        if (prolog != null && prolog.finished == false) {
          //that.hideConsoleOverlay();
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
      //that.showConsoleOverlay();
      prolog.nextQuery(function(result) {
          //that.hideConsoleOverlay();
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
};
