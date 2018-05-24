class Timepoint {
    constructor(timepointUri) {
        this.timepointUri = timepointUri;
        this.time = parseFloat(timepointUri.split('#')[1].split('_')[1]);
    }
}

exports.Timepoint = Timepoint;