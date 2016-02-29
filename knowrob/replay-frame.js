/**
 * Episode replay user interface of openEASE.
 **/

function KnowrobReplayUI(client, options) {
    var that = this;
    
    // configuration of div names
    var canvasDiv     = options.canvas_div || 'markers'
    var queryDiv      = options.query_div || 'user_query'
    var nextButtonDiv = options.next_button_div || 'btn_query_next'
    
    var isStreaming = false;
    var isNewVideo = false;
    this.rosViewer = undefined;

    this.init = function () {
        that.rosViewer = client.newCanvas({
            divID: document.getElementById(canvasDiv)
        });

        that.setupVideoQuery();
        that.initVideoDivs();
        that.updateStartTime();
        that.updateEndTime();
        that.resizeCanvas();
    };

    this.resizeCanvas = function () {
        that.rosViewer.resize($('#'+canvasDiv).width(), $('#'+canvasDiv).height());
    };
    
    this.episodeData = function() { return client.episode.episodeData; };
    
    this.initVideoDivs = function() {
        var episodeSelect = document.getElementById('replay-episode-list');
        if (episodeSelect !== null && client.episode.hasEpisode()) {
            if(that.episodeData().video && that.episodeData().video.length > 0) {
               for (var i = 0; i < that.episodeData().video.length; i++) {
                  that.addVideoItem(that.episodeData().video[i].name);
               }
            }
            else {
                window.alert("This experiment has no video queries available yet! You can create new ones if you have administrative rights.");
                return;
            }
            
            var select = document.getElementById('time-sequence-dropdown');
            var opt = document.createElement('option');
            opt.value = 0;
            opt.innerHTML = 'Choose an experiment time interval';
            select.appendChild(opt);
            if(that.episodeData().time_intervals != null)
            {
                for (var i = 0; i < that.episodeData().time_intervals.length; i++) {
                    that.addTimeInterval(i + 1,
                         that.episodeData().time_intervals[i].start,
                         that.episodeData().time_intervals[i].end);
                }
            }      
        }
    };

    this.addTimeInterval = function(ind, start, end) {
        var select = document.getElementById('time-sequence-dropdown');
        var opt = document.createElement('option');
        opt.value = ind;
        opt.innerHTML = start + '--' + end;
        select.appendChild(opt);
    };

    this.setTimeSlides = function() {
        var i = document.getElementById('time-sequence-dropdown').value;
        if(i > 0){
            var firstrange = document.getElementById('replay-start-time');
            var secondrange = document.getElementById('replay-end-time');
            //var select = document.getElementById('time-sequence-dropdown');
            //var string_value = select.options[select.selectedIndex].text;
            //var string_array = string_value.split("--");
            var start = 0;
            var end = 20000000;
            
            if(that.episodeData().time_intervals != null)
            {
                start = that.episodeData().time_intervals[i-1].start;
                end = that.episodeData().time_intervals[i-1].end;
            }


            firstrange.min = start;
            firstrange.max = end;
            firstrange.value = start;

            secondrange.min = start;
            secondrange.max = end;
            secondrange.value = end;
            that.updateTimeValues();
       }
    }

    this.addVideoItem = function(episode) {
      var li = document.createElement("li");
      li.style.width = "100%";
      var item = document.createElement("a");
      item.href = "#";
      item.onclick = function() {
          document.getElementById("replay-episode-value").innerHTML = episode;
          that.replayEpisodeSelected();
      };
      item.style.width = "100%";
      item.style.textAlign = "center";
      item.appendChild(document.createTextNode(episode));
      li.appendChild(item);
      var episodeSelect = document.getElementById('replay-episode-list');
      episodeSelect.appendChild(li);
    };
    
    this.setupVideoQuery = function() {
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
        
        var initQuery = ace.edit('init_query');
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

    this.selectedVideoEpisode = function() {
        var selectedEpisode = document.getElementById('replay-episode-value').innerHTML;

        if(that.episodeData().video != null)
        {
            for(var i=0; i<that.episodeData().video.length; i++) {
               if(that.episodeData().video[i].name == selectedEpisode) return that.episodeData().video[i];
            }
        }
        return undefined;
    }

    this.updateVideoDivs = function() {
        var initdiv = document.getElementById('init_query');
        var userdiv = document.getElementById('user_query');
        var firstrange = document.getElementById('replay-start-time');
        var secondrange = document.getElementById('replay-end-time');
        var select = document.getElementById('time-sequence-dropdown');
        
        var selection = that.selectedVideoEpisode();
        if(selection){
          if(initdiv !== null) {
            ace.edit('init_query').setValue(selection.initialization);
          }
          if(initdiv !== null && userdiv !== null) {
            ace.edit('user_query').setValue(selection.animation);
          }
          
          document.getElementById('name-text').value = selection.name;
          for (var i = 0; i < that.episodeData().time_intervals.length; i++) {
                var episodestart = that.episodeData().time_intervals[i].start;
                var episodeend = that.episodeData().time_intervals[i].end;

                if(episodestart <= selection.start && episodeend >= selection.start
                && episodestart <= selection.end && episodeend >= selection.end)
                {
                    firstrange.min = episodestart;
                    firstrange.max = episodeend;

                    secondrange.min = episodestart;
                    secondrange.max = episodeend;
                    select.selectedIndex = i +1;
                }
          }

          if(firstrange !== null) {
            //firstrange.min = selection.start;
            //firstrange.max = selection.end;
            firstrange.value = selection.start;
          }
          if(secondrange !== null) {
            //secondrange.min = selection.start;
            //secondrange.max = selection.end;
            secondrange.value = selection.end;
          }
          
          that.updateStartTime();
          that.updateEndTime();
        }
    };
    
    this.updateSummaryDivs = function() {
        // FIXME: Re-implement
        /*
        var pictureUrl = '/knowrob/summary_data/' + videoFile.replace('/knowrob/static/experiments/video/', '').replace('.json', '.jpg');

        var sumdiv = document.getElementById('summary');
        var sumheaderdiv = document.getElementById('summary_header');
          
          if(sumdiv !== null && typeof(selection.summary) != "undefined" ) {
            var http = new XMLHttpRequest();
            http.open('HEAD', pictureUrl, false);
            http.send();
            if (http.status !== 404){
               sumheaderdiv.innerHTML = 'Summary';
               sumdiv.innerHTML = '<img class="picture" src="'+pictureUrl+'" width="205" height="180"/>';
            }
            else if(typeof(selection.summary) != "undefined" ){
               var image_creator_prolog_engine = this.new_pl_client();
               var regQuery = selection.summary;
               image_creator_prolog_engine.jsonQuery(regQuery, function(result) {
                  sumheaderdiv.innerHTML = 'Summary';
                  sumdiv.innerHTML = '<img class="picture" src="'+pictureUrl+'" width="205" height="180"/>'; 
               }); 
            }
          }
          */
    };
    
    this.updateStartTime = function() {
        document.getElementById("replay-start-value").innerHTML =
            formatDate(document.getElementById("replay-start-time").value);
    };
    this.updateEndTime = function() {
        document.getElementById("replay-end-value").innerHTML =
            formatDate(document.getElementById("replay-end-time").value);
    };
    this.updateTimeValues = function() {
        that.updateStartTime();
        that.updateEndTime();
    };
    
    this.formatInitialQuery = function(t) {
        var fps = parseInt(document.getElementById("replay-fps").value, 10);
        var init_query = "openease_video_fps(" + fps +
            "), openease_video_start, !, clear_canvas, T = 'timepoint_" + t + "', task_tree_canvas, " +
            ace.edit('init_query').getValue().trim();
        init_query = init_query.substr(0, init_query.length - 1);
        return init_query;
    };
    
    this.stopStreaming = function() {
        if(isStreaming)
        {
           //var t0  = parseInt(document.getElementById("replay-start-time").value, 10);
           //var t1  = parseInt(document.getElementById("replay-end-time").value, 10);
           var prolog = client.newProlog();
           prolog.jsonQuery('openease_video_stop.', function(result) {
              console.log(prolog.format(result));
              //setTimeout(function(){ that.streamRange(t0,t1); }, 500);
           }, mode=1);
        }

        isStreaming = false;
        var toggleButton = document.getElementById("replay-toggle-button");
        toggleButton.onclick = that.startStreaming;
        toggleButton.innerHTML = "Start";
    };
    
    this.startStreaming = function() {
        var toggleButton = document.getElementById("replay-toggle-button");
        toggleButton.onclick = that.stopStreaming;
        toggleButton.innerHTML = "Stop";
              
        var t0  = parseInt(document.getElementById("replay-start-time").value, 10);
        var t1  = parseInt(document.getElementById("replay-end-time").value, 10);
        var init_query = that.formatInitialQuery(t0.toString());
        
        var prolog = client.newProlog();
        prolog.jsonQuery(init_query, function(result) {
            console.log(prolog.format(result));
            setTimeout(function(){ that.streamRange(t0,t1); }, 500);
        }, mode=1);
    };
    
    this.streamRange = function(t0, t1) {
        var video_query = ace.edit('user_query').getValue();
        var fps = parseInt(document.getElementById("replay-fps").value, 10);
        var step_sec = 1.0/fps;
        var frame_number = 1;
        var t = t0;
        isStreaming = true;
        
        function streamStep(){
          if(!isStreaming) return;
          t += step_sec;
          if(t>t1) return;
          that.updateProgressBar(t0, t1, t);
          
          var query = "T = 'timepoint_" + t.toString() + "', " + video_query;
          query = query.trim();
          query = query.substr(0, query.length - 1);
          
          var prolog = client.newProlog();
          prolog.jsonQuery(query, function(result) {
            that.updateHUDText(t, function(){
              that.rosViewer.snapshot(frame_number, fps);
              frame_number += 1;
              streamStep();
            });
          }, mode=1);
        };
        streamStep();
    };
    
    this.updateProgressBar = function(t0, t1, t) {
        document.getElementById("replay-progress-bar").value = 100*(t-t0)/(t1-t0);
        document.getElementById("replay-progress-value").innerHTML = formatDate(t);
    }
    
    this.updateHUDText = function(t, handler) {
        var hudtextLines = [];
        var prolog = client.newProlog();
        // TODO: Use prolog to build task tree
        var infoQuery = "_T = 'timepoint_" + t.toString() + "', " +
              "task(_Task, _T), " +
              "rdf_has(_Task, knowrob:'taskContext', literal(type(_,Task))), " +
              "(( rdf_has(_Task, knowrob:'objectActedOn', _ObjectActedOn), " +
                  "( mng_designator_props(_ObjectActedOn, 'NAME', ObjectActedOn) ; " +
                  "( rdf_has(_ObjectActedOn, knowrob:'objectActedOn', __ObjectActedOn), " +
                  "  mng_designator_props(__ObjectActedOn, 'NAME', ObjectActedOn) ))) ; ObjectActedOn = ''), " +
              "(( rdf_has(_Task, knowrob:'perceptionResult', _Perception), " +
                  "mng_designator_props(_Perception, 'NAME', Perception) ) ; Perception = ''), " +
              "(( rdf_has(_Task, knowrob:'designator', _Designator), " +
                  "mng_designator_props(_Designator, 'NAME', Designator) ) ; Designator = ''), " +
              "(( rdf_has(_Task, knowrob:'goalContext', literal(type(_,Goal))) ) ; Goal = ''), " +
              "( ObjectActedOn \\= '' ; Perception \\= '' ; Designator \\= '' ; Goal \\= '')," +
              "findall(_TaskDetail, (task(_TaskId), subtask(_ParentTaskId, _TaskId), task_type(_TaskId, _Type), rdf_has(_TaskId, knowrob:'taskContext', literal(type(_,_TaskContext))), (rdf_has(_TaskId, knowrob:'goalContext', literal(type(_,_TaskGoal))); _TaskGoal = ''), atomic_list_concat([_TaskContext, _TaskGoal], ' ', _TaskTip), term_to_atom(_TaskId, _TaskIdAtom), term_to_atom(_ParentTaskId, _ParentTaskIdAtom), term_to_atom(_TaskTip, _TaskAtom), term_to_atom(_Type, _TypeAtom), jpl_new( '[Ljava.lang.String;', [_TaskAtom, _TaskIdAtom, _ParentTaskIdAtom, _TypeAtom], _TaskDetail)), _TaskDetails), jpl_new( '[[Ljava.lang.String;', _TaskDetails, _Tasks), findall(_TaskAtom, (task(__TaskId, _T), term_to_atom(__TaskId, _TaskAtom)), _HighlightedTaskDetails), jpl_new( '[Ljava.lang.String;', _HighlightedTaskDetails, _HighlightedTasks), jpl_new( '[Ljava.lang.String;', ['\\'http://knowrob.org/kb/knowrob.owl#CRAMAction\\'', '\\'http://knowrob.org/kb/knowrob.owl#ArmMovement\\''], _Types), update_task_tree(_Tasks, _HighlightedTasks, _Types).";
        
        function processInfo(result) {            
           if(result.solution) {
                var solutionString = result.solution['Task'];
                for(var key in result.solution) {
                    var value = result.solution[key];
                    if(key != 'Task' && value != '') {
                        solutionString += " " + value.trim();
                    }
                }
                hudtextLines.push(solutionString);
                prolog.nextQuery(processInfo);
            }
            else {
                // FIXME(daniel): this interface was removed! only markers aupported now.
                //knowrob.show_hud_text(hudtextLines, {});
                setTimeout(function(){ handler(); }, 500);
            }
        }
        var timeString = "Time: " + formatDate(t);
        hudtextLines.push(timeString.trim());
        prolog.jsonQuery(infoQuery, processInfo);
    };
    
    this.toggleContent = function(imageId, divId) {
      var obj = document.getElementById(divId);
      var img = document.getElementById(imageId);
      if(obj.className == "form hidden-form") {
        obj.className = "form";
        img.src = "/static/images/shade.png";
      }
      else {
        obj.className = "form hidden-form";
        img.src = "/static/images/unshade.png";
      }
    };

    this.showContent = function(imageId, divId) {
      var obj = document.getElementById(divId);
      var img = document.getElementById(imageId);
      if(obj.className == "form hidden-form") {
        obj.className = "form";
        img.src = "/static/images/shade.png";
      }
    };
    
    this.showReplayBox = function(divId) {
      var obj = document.getElementById(divId);
      obj.className = "content-box replay-box";
    };
    
    this.hideReplayBox = function(divId) {
      var obj = document.getElementById(divId);
      obj.className = "content-box replay-box replay-box-hidden";
    };
    
    this.replayEpisodeSelected = function() {
        that.showReplayBox('replay-configuration-box');
        that.showReplayBox('replay-panel-box');
        that.showContent('replay-configuration-toggle', 'replay-configuration-form');
        that.updateVideoDivs();
        that.updateSummaryDivs();
    };
    
    this.saveVideoSettings = function() {
        if(isNewVideo == true)
        {
            that.episodeData().video.push({
                name: document.getElementById('name-text').value,
                start: document.getElementById('replay-start-time').value,
                end: document.getElementById('replay-end-time').value,
                initialization: ace.edit('init_query').getValue(),
                animation: ace.edit('user_query').getValue(),
                fps: parseInt(document.getElementById("replay-fps").value, 10)
            });
            document.getElementById('replay-episode-value').innerHTML = document.getElementById('name-text').value;
            that.addVideoItem(name);
            that.replayEpisodeSelected();
            isNewVideo = false;
        }
        else
        {
            var selectedEpisode = document.getElementById('replay-episode-value').innerHTML;
            var videoSequence = [{
                name: selectedEpisode,
                start: document.getElementById('replay-start-time').value,
                end: document.getElementById('replay-end-time').value,
                initialization: ace.edit('init_query').getValue(),
                animation: ace.edit('user_query').getValue(),
                fps: parseInt(document.getElementById("replay-fps").value, 10)
            }];
            var oldVid = undefined;
            for(var i=0; i<that.episodeData().video.length; i++) {
                if(that.episodeData().video[i].name != selectedEpisode) {
                    videoSequence.push(that.episodeData().video[i]);
                }
                else { oldVidIndex = i; }
            }
        
            $.ajax({
                url: "/knowrob/exp_save/{{ category }}/{{ exp }}",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({ video: videoSequence }),
                dataType: "json"
            }).done( function (request) {});
        }
    };
    
    this.deleteVideo = function() {
        if(!that.selectedVideoEpisode()) return;
        
        var selectedEpisode = document.getElementById('replay-episode-value').innerHTML;
        if(!confirm("Are you sure you want to delete '"+selectedEpisode+"'?")) return;
        
        var videoSequence = [];
        for(var i=0; i<that.episodeData().video.length; i++) {
            if(that.episodeData().video[i].name != selectedEpisode) {
                videoSequence.push(that.episodeData().video[i]);
            }
        }
        
        $.ajax({
            url: "/knowrob/exp_save/{{ category }}/{{ exp }}",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ video: videoSequence }),
            dataType: "json",
            success: function (data) {
                // TODO: update without reload
                location.reload();
            }
        }).done( function (request) {});
    };
    
    this.newVideo = function() {
        isNewVideo = true;
        that.replayEpisodeSelected();

        document.getElementById('name-text').value = '';

        ace.edit('init_query').setValue('');
        ace.edit('user_query').setValue('');

        var firstrange = document.getElementById('replay-start-time');
        var secondrange = document.getElementById('replay-end-time');
        var select = document.getElementById('time-sequence-dropdown');

        firstrange.min = 0;
        firstrange.max = 0;
        firstrange.value = 0;

        secondrange.min = 0;
        secondrange.max = 0;
        secondrange.value = 0;

        select.options[0].selected = true;
        that.updateTimeValues();

        /*var name = prompt("Please enter a name for the video", "");
        if(!name) return;
        // TODO: let user select experiment instead of timestamps
        var start = prompt("Please enter a start timestamp", "");
        if(!start) return; start = parseInt(start);
        var end = prompt("Please enter a end timestamp", "");
        if(!end) return; end = parseInt(end);
        
        knowrob.episodeData.video.push({
            name: name,
            start: start,
            end: end,
            initialization: '',
            animation: '',
            fps: 6
        });
        document.getElementById('replay-episode-value').innerHTML = name;
        that.addVideoItem(name);
        that.replayEpisodeSelected();*/
    };
};
