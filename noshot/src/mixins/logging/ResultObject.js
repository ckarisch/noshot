class ResultObject {
/*
  * Message Format Example:
  *  {
  *      "teamId": "4",
  *      "memberId": 2,
  *      "timestamp": 1542960322, // time (UNIX) of when message was submitted
  *      "type": "result",
  *      "usedCategories" : ["Text", "Sketch"],
  *      "usedTypes" : ["ASR", "Color"],
  *      "sortType" : ["ASR"],
  *      "resultSetAvailability" : "all",
  *
  *      "results" :
  *       [
  *           { // Entry 1
  *               "video" : "02521",
  *               "shot" : 7,
  *               "score" : 0.94,
  *               "rank" : 1
  *           },
  *           { // Entry 2
  *               "video" : "02521",
  *               "frame" : 957,
  *               "score" : 0.91,
  *               "rank" : 2
  *           },
  *           { // Entry 3
  *               "video" : "02525",
  *               "shot" : 34,
  *               "score" : 0.85
  *           },
  *           ...
  *           { // Entry n
  *               "video" : "02528",
  *               "frame" : 1547
  *           }
  *       ]
  * }
  *
 */
    constructor(team, member) {
        this.teamId = team;
        this.memberId = member;
        this.startTimestamp = window.utils.ts2Unix(Date.now()); // start time: remember when logging started
        this.timestamp = null; // submission timestamp
        this.type = null;
        this.events = [];
    }

    reset() {
        this.type = null;
        this.events = [];
    }

    // composite or atomic event
    addEvent(event) {
        this.events.push(event);
    }

    toJSON() {
        let eventArray = [];
        for (let i = 0; i < this.events.length; i++) {
            eventArray.push(this.events[i].toJSON());
        }

        // calls superclass toJSON setting its own type
        return Object.assign({}, this, {
            events: eventArray,
            timestamp: window.utils.ts2Unix(Date.now()) // get current timestamp for submission
        });
    }

    // reviver can be passed as the second parameter to JSON.parse
    // to automatically call Class.fromJSON on the resulting value.
    static reviver(key, value) {
        return key === "" ? LogObject.fromJSON(value) : value;
    }

    // fromJSON is used to convert a serialized version
    // of the class to an instance of the class
    static fromJSON(jsonOrString) {
        if (typeof jsonOrString === "string") {
            // if it's a string, parse it first
            return JSON.parse(jsonOrString, LogObject.reviver);
        }
        else {
            let logObj = new LogObject();

            let eventArray = [];
            for (let i = 0; i < jsonOrString.events.length; i++) {
                let event = jsonOrString.events[i];
                event = Event.fromJSON(event);
                eventArray.push(event);
            }

            return Object.assign(logObj, jsonOrString, {
                events: eventArray
            });
        }
    }
}
export default ResultObject;
