class AtomicEvent {
    constructor(actionString) {
        this.timestamp = ts2Unix(Date.now());
        this.category;
        this.type;
        this.value;
        this.attributes; // optional
        if (actionString) this.fromActionString(actionString);
    }

    // TODO: maybe define format String like format as internal representation,
    // which can then be parsed by this class in order to create an Event?
    fromActionString(string) {
        // let parts = string.split("::");
    }

    toJSON() {
        // calls superclass toJSON setting its own type
        return Object.assign({}, this);
    }

    // reviver can be passed as the second parameter to JSON.parse
    // to automatically call Class.fromJSON on the resulting value.
    static reviver(key, value) {
        return key === "" ? AtomicEvent.fromJSON(value) : value;
    }

    // fromJSON is used to convert a serialized version
    // of the class to an instance of the class
    static fromJSON(jsonOrString) {
        if (typeof jsonOrString === "string") {
            // if it's a string, parse it first
            return JSON.parse(jsonOrString, AtomicEvent.reviver);
        }
        else {
            let atomicEvent = new AtomicEvent();
            return Object.assign(atomicEvent, jsonOrString);
        }
    }

}
export default AtomicEvent;
