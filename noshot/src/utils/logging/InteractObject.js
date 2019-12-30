class InteractObject {
/*
  * Message Format Example:
  *  {
  *      "teamId": "4",
  *      "memberId": 2,
  *      "timestamp": 1542960322, // time (UNIX) of when message was submitted
  *      "type": "interaction",
  *
  *      "events" :
  *       [
  *           { // Event 1
  *               "timestamp" : 1542960120, // UNIX timestamp of when event was registered by client.
  *               "category" : "text",
  *               "type" : "ASR",
  *               "value" : "how are you",
  *           },
  *           { // Event 2
  *               "timestamp" : 1542960136,
  *               "category" : "browsing",
  *               "type" : "rankedList",
  *               "value" : "scrollDown"
  *           },
  *           { // Event 3
  *               "timestamp" : 1542960145,
  *               "category" : "image",
  *               "type" : "globalFeature",
  *               "value" : "VId10,FN35;VId65,FN228"
  *           },
  *           ...
  *           { // Event n
  *               "timestamp" : 1542960305,
  *               "category" : "browsing",
  *               "type" : "videoPlayer",
  *               "value" : "play VId10,FN160"
  *           }
  *       ]
  * }
  *
 */
    constructor(team, member) {
        this.teamId = team;
        this.memberId = member;
        this.startTime = Date.now();
        this.startTimestamp = window.utils.ts2Unix(this.startTime); // start time: remember when logging started
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
        return key === "" ? InteractObject.fromJSON(value) : value;
    }

    // fromJSON is used to convert a serialized version
    // of the class to an instance of the class
    static fromJSON(jsonOrString) {
        if (typeof jsonOrString === "string") {
            // if it's a string, parse it first
            return JSON.parse(jsonOrString, InteractObject.reviver);
        }
        else {
            let logObj = new InteractObject();

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
export default InteractObject;
