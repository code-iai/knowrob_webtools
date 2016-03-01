
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
            $.ajax({
                url: "/episode_queries",
                type: "GET",
                contentType: "application/json",
                dataType: "json"
            }).done( function (request) {
                that.episodeData = request;
                if(handler) handler(that.episodeData);
            });
        }
        else if(handler) handler(that.episodeData);
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
