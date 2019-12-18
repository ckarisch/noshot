class CompositeEvent {
    constructor() {
        this.timestamp = ts2Unix(Date.now());
        this.actions = [];
    }

    addEvent(atomicEvent)
    {
        this.actions.push(atomicEvent);
    }

    toJSON() {
        let strArray = [];

        for (let i = 0; i < this.actions.length; i++) {
            strArray.push(this.actions[i].toJSON());
        }

        // calls superclass toJSON setting its own type
        return Object.assign({}, this, {
            actions: strArray
        });
    }

    // reviver can be passed as the second parameter to JSON.parse
    // to automatically call Class.fromJSON on the resulting value.
    static reviver(key, value) {
        return key === "" ? CompositeEvent.fromJSON(value) : value;
    }

    // fromJSON is used to convert a serialized version
    // of the class to an instance of the class
    static fromJSON(jsonOrString) {
        if (typeof jsonOrString === "string") {
            // if it's a string, parse it first
            return JSON.parse(jsonOrString, CompositeEvent.reviver);
        }
        else {
            let compositeEvent = new CompositeEvent();

            let objectArray = [];

            for (let i = 0; i < jsonOrString.actions.length; i++) {
                objectArray.push(jsonOrString.actions[i]);
            }

            return Object.assign(compositeEvent, jsonOrString, {
                actions: objectArray
            });
        }
    }
}

export default CompositeEvent;
