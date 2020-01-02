import Result from './Result.js';

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
        this.id = Date.now(); // more unique than this.timestamp
        this.teamId = team;
        this.memberId = member;
        this.timestamp = window.utils.ts2Unix(this.id);   // UNIX TS, submission timestamp
        this.type = window.logging.logTypes.submitType.RESULT;
        this.usedCategories = []; // list of currently used categories
        this.usedTypes = [];      // used category types
        this.sortType = [];       // type employed for sorting
        // resultSetAvailability determines whether users can see and browse
        // the whole returned ranked candidate set ('all'), just a limited
        // subset without paging scrolling ('top'), or just a sample from a
        // maintained relevance score distribution determining a ranked
        // list that is not displayed at all ('sample').
        this.resultSetAvailability = "",
        this.results = [];
        this.isBeingSubmitted = false;
    }

    static getCacheKey() {
      return window.appCfg.preferences.prefKeys.LOG.RESULT;
    }
    getCacheKey() {
      return ResultObject.getCacheKey();
    }

    // e.g.:
    // let info = {
    //   usedCategories: ["Text", "Sketch"]
    //   usedTypes: ["ASR", "Color"]
    //   sortType:  ["ASR"]
    //   resultSetAvailability: "all"
    // }
    initFromInfo(info, results = []) {
      this.usedCategories = info.usedCategories;
      this.usedTypes = info.usedTypes;
      this.sortType = info.sortType;
      this.resultSetAvailability = info.resultSetAvailability;
      this.results = results;
    }

    flush() {
        this.type = null;
        this.beginTimestamp  = this.timestamp;
        this.timestamp = null;
        this.results = [];
    }

    // result
    addResult(result) {
        this.results.push(result);
    }

    toJSON() {
        let resultArray = [];
        for (let i = 0; i < this.results.length; i++) {
            resultArray.push(this.results[i].toJSON());
        }

        // calls superclass toJSON setting its own type
        return Object.assign({}, this, {
            results: resultArray
        });
    }

    // reviver can be passed as the second parameter to JSON.parse
    // to automatically call Class.fromJSON on the resulting value.
    static reviver(key, value) {
        return key === "" ? ResultObject.fromJSON(value) : value;
    }

    // fromJSON is used to convert a serialized version
    // of the class to an instance of the class
    static fromJSON(jsonOrString) {
        if (typeof jsonOrString === "string") {
            // if it's a string, parse it first
            return JSON.parse(jsonOrString, ResultObject.reviver);
        }
        else {
            let logObj = new ResultObject();

            let resultArray = [];
            for (let i = 0; i < jsonOrString.results.length; i++) {
                let result = jsonOrString.results[i];
                result = Result.fromJSON(result);
                resultArray.push(result);
            }

            return Object.assign(logObj, jsonOrString, {
                results: resultArray
            });
        }
    }
}
export default ResultObject;
