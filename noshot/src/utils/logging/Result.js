class Result {
    constructor(video, frame, score = undefined, rank = undefined, shot = undefined) {
        this.video = video;
        this.frame = frame;
        this.score = score;
        this.rank = rank;
        this.shot = shot;
    }

    toJSON() {
        // calls superclass toJSON setting its own type
        return Object.assign({}, this);
    }

    // reviver can be passed as the second parameter to JSON.parse
    // to automatically call Class.fromJSON on the resulting value.
    static reviver(key, value) {
        return key === "" ? Result.fromJSON(value) : value;
    }

    // fromJSON is used to convert a serialized version
    // of the class to an instance of the class
    static fromJSON(jsonOrString) {
        if (typeof jsonOrString === "string") {
            // if it's a string, parse it first
            return JSON.parse(jsonOrString, Result.reviver);
        }
        else {
            let result = new Result();
            return Object.assign(result, jsonOrString);
        }
    }

}
export default Result;
