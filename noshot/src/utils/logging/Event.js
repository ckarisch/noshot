class Event {
    constructor(category, type, value) {
        this.timestamp = window.utils.ts2Unix(Date.now());
        this.category = category;
        this.type = type;
        this.value = value; // JSON     
    }

    toJSON() {

        // calls superclass toJSON setting its own type
        return Object.assign({}, this);
    }

    // reviver can be passed as the second parameter to JSON.parse
    // to automatically call Class.fromJSON on the resulting value.
    static reviver(key, value) {
        return key === "" ? Event.fromJSON(value) : value;
    }

    // fromJSON is used to convert a serialized version
    // of the class to an instance of the class
    static fromJSON(jsonOrString) {
        if (typeof jsonOrString === "string") {
            // if it's a string, parse it first
            return JSON.parse(jsonOrString, Event.reviver);
        }
        else {
            let event = new Event();
            return Object.assign(event, jsonOrString);
        }
    }

}
export default Event;
