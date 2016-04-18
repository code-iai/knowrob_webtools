/**
 * The selected manipulation task episodic memory.
 * Episodes are organized in categories.
 * Continous log data is saved in a mongo DB that is named
 * based on category and episode name.
 **/
function KnowrobEpisode(client){
    var that = this;
    
    this.category = undefined;
    this.episode = undefined;
    // Parsed episode data file
    this.episodeData = undefined;
    
    this.hasEpisode = function() {
        return that.episode && that.episode!='None';
    };
    
    this.setEpisode = function (category, episode, handler) {
        if(category==that.category && episode==that.episode) return;
        that.episodeData = undefined;
        that.category = category;
        that.episode = episode;
        // Auto select the mongo database
        that.selectMongoDB();
        
        $.ajax({
            url: "/episode_set/"+category+"/"+episode,
            type: "GET",
            contentType: "application/json",
            dataType: "json"
        }).done( function (request) {
            that.queryEpisodeData(handler);
        });
    };
    
    this.queryEpisodeData = function (handler) {
        if(!that.episodeData) {
            that.downloadEpisodeData(function (request) {
                that.episodeData = request;
                if(handler) handler(that.episodeData);
            });
        }
        else if(handler) handler(that.episodeData);
    };
    
    this.downloadEpisodeData = function (handler) {
        $.ajax({
            url: "/download_episode",
            type: "GET",
            contentType: "application/json",
            dataType: "json"
        }).done( function (request) {
            handler(request);
        });
    };
    
    this.uploadEpisodeData = function(query_lib) {
        $.ajax({
            url: "/upload_episode",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(query_lib),  
            dataType: "json",
            success: function (data) {
                window.alert("Query library uploaded successfully!");
            }
        }).done( function (request) {});
    };
    
    this.downloadEpisodeDataFTP = function (credentials, handler) {
        $.ajax({
            url: "/download_episode_ftp",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({server:credentials.server, user:credentials.user, pw:credentials.pw}), 
            dataType: "json"
        }).done( function (request) {
            handler(request);
        });
    };
    
    this.uploadEpisodeDataFTP = function(credentials, query_lib) {
        $.ajax({
            url: "/upload_episode_ftp",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ options: { server:credentials.server, user:credentials.user, pw:credentials.pw }, lib: query_lib }),  
            dataType: "json",
            success: function (data) {
                window.alert("Query library uploaded successfully!");
            }
        }).done( function (request) {});
    };
    
    this.selectMongoDB = function () {
        if(that.category && that.episode) {
            var prolog = new JsonProlog(client.ros, {});
            prolog.jsonQuery("mng_db('"+that.category+"_"+that.episode+"').", function(result) {
                console.info("Selected mongo DB " + that.category+"_"+that.episode);
                prolog.finishClient();
            });
        }
    };
};
