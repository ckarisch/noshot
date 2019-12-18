class LogObject {

    constructor(team, member) {
        this.teamId = team;
        this.memberId = member;
        this.startTimestamp = ts2Unix(Date.now()); // start time: remember when logging started
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
            timestamp: ts2Unix(Date.now()) // get current timestamp for submission
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
                if (event.hasOwnProperty("actions")) {
                    // composite event
                    event = CompositeEvent.fromJSON(event);
                }
                else {
                    // atomic event
                    event = AtomicEvent.fromJSON(event);
                }
                eventArray.push(event);
            }

            return Object.assign(logObj, jsonOrString, {
                events: eventArray
            });
        }
    }
}
export default LogObject;
