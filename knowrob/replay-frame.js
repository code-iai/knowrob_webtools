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

    this.setCameraPose = function (pose) {
        that.rosViewer.setCameraPose(pose);
    };
    
    this.episodeData = function() { return client.episode.episodeData; };
    
    this.initVideoDivs = function() {
        var select = document.getElementById('replay-episode-dropdown');

        if (client.episode.hasEpisode()) {
            if(that.episodeData() && that.episodeData().video && that.episodeData().video.length > 0) {
               for (var i = 0; i < that.episodeData().video.length; i++) {
                  that.addVideoItem(that.episodeData().video[i].name);
               }
            }
            if(that.episodeData().episodes != null) {
                for (var i = select.length - 1; i >= 0; i--) {
                    select.remove(i);
                }
                
                for (var i = 0; i < that.episodeData().episodes.length; i++) {
                    that.addTimeInterval(i, that.episodeData().episodes[i]);
                }
            }      
        }
    };

    this.addTimeInterval = function(ind, episode) {
        var select = document.getElementById('replay-episode-dropdown');
        var opt = document.createElement('option');
        opt.value = ind;
        opt.innerHTML = episode.name;
        select.appendChild(opt);
    };

    this.setTimeSlides = function() {
        var i = document.getElementById('replay-episode-dropdown').value;
        if(i >= 0){
            var firstrange = document.getElementById('replay-start-time');
            var secondrange = document.getElementById('replay-end-time');
            var start = that.episodeData().episodes[i].start;
            var end = that.episodeData().episodes[i].end;

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
        if(that.episodeData().video) {
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
        var select = document.getElementById('replay-episode-dropdown');
        
        var selection = that.selectedVideoEpisode();
        if(selection){
          if(initdiv !== null) {
            ace.edit('init_query').setValue(selection.initialization);
          }
          if(initdiv !== null && userdiv !== null) {
            ace.edit('user_query').setValue(selection.animation);
          }
          
          document.getElementById('replay-video-title-text').value = selection.name;
          for (var i = 0; i < that.episodeData().episodes.length; i++) {
                var episodestart = that.episodeData().episodes[i].start;
                var episodeend = that.episodeData().episodes[i].end;

                if(episodestart <= selection.start && episodeend >= selection.start
                && episodestart <= selection.end && episodeend >= selection.end)
                {
                    firstrange.min = episodestart;
                    firstrange.max = episodeend;

                    secondrange.min = episodestart;
                    secondrange.max = episodeend;
                    select.selectedIndex = i;
                }
          }
          firstrange.value = selection.start;
          secondrange.value = selection.end;
          
          that.updateStartTime();
          that.updateEndTime();
        }
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
            "), openease_video_start, !, clear_canvas, T = 'timepoint_" + t + "', " +
            ace.edit('init_query').getValue().trim();
        init_query = init_query.substr(0, init_query.length - 1);
        return init_query;
    };
    
    this.stopStreaming = function() {
        if(isStreaming) {
           var prolog = client.newProlog();
           prolog.jsonQuery('openease_video_stop.', function(result) {
              console.log(prolog.format(result));
              window.open('/knowrob/local_data/video_created/video.mp4','_blank')
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
            that.updateTime(t, function(){
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
    
    this.updateTime = function(t, handler) {
        var timeString = "Time: " + formatDate(t);
        var infoQuery = "_T = 'timepoint_" + t.toString() + "', " + "marker(hud_text('HUD'), TimeHudOld), marker_remove(TimeHudOld)," +
            "marker(hud_text('HUD'), TimeHudNew), marker_text(TimeHudNew, '" +  timeString + "'), marker_publish.";
        
        var prolog = client.newProlog();
        function processInfo(result) {
            setTimeout(function(){ handler(); }, 500);
        }
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
    };
    
    this.saveVideoSettings = function() {
        if(isNewVideo == true) {
            that.episodeData().video.push({
                name: document.getElementById('replay-video-title-text').value,
                start: document.getElementById('replay-start-time').value,
                end: document.getElementById('replay-end-time').value,
                initialization: ace.edit('init_query').getValue(),
                animation: ace.edit('user_query').getValue(),
                fps: parseInt(document.getElementById("replay-fps").value, 10)
            });
            document.getElementById('replay-episode-value').innerHTML = document.getElementById('replay-video-title-text').value;
            that.addVideoItem(name);
            that.replayEpisodeSelected();
            isNewVideo = false;
        }
        else {
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

        document.getElementById('replay-video-title-text').value = '';

        ace.edit('init_query').setValue('');
        ace.edit('user_query').setValue('');

        var firstrange = document.getElementById('replay-start-time');
        var secondrange = document.getElementById('replay-end-time');
        var select = document.getElementById('replay-episode-dropdown');

        firstrange.min = 0;
        firstrange.max = 0;
        firstrange.value = 0;

        secondrange.min = 0;
        secondrange.max = 0;
        secondrange.value = 0;

        select.value = 0;
        select.options[0].selected = true;
        that.setTimeSlides();
    };
};
