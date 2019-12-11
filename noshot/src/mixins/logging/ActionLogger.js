class ActionLogger {

/**
 * VBS 2019
 *
 * Action Logging:
 * Last year we introduced a rudimental interaction logging, so we can perform a more detailed analysis after the competition.
 * At VBS 2019, we refined the logging mechanism as follows:
 * Interaction logs are now sent as body of the HTTP POST request
 * They have to be encoded as JSON and should adhere to the agreed format that all teams received
 * If you issue multiple submissions during a task, always clear the log sequence after each submission to avoid unnecessary redundancy (no cumulative logging!).
 * A log message is usually sent in combination with an actual submission, but can also be sent independently of a submission (in case the target scene was not found). In that case, simply do not specify a video and frame/shot in the URL parameters
 * Log messages are also accepted after a task has ended (but don't forget to send it!)
 *
 *
 * Message Format Example:
 *  {
 *      "teamId": "SIRET",
 *      "memberId": 2,
 *      "timestamp": 1542960322, // time (UNIX) of when message was submitted
 *      "type": "submit",
 *
 *      "events": [
 *          { // (composite) event 1
 *              "timestamp": 1542960225,
 *              "actions": [
 *                  {
 *                      "timestamp": 1542960120,
 *                      "category": "text",
 *                      "type": "ASR",
 *                      "value": "how are you",
 *                      "attributes": "1000 NN"
 *                  },
 *                       ...
 *                     { ... }
 *              ]
 *          },
 *          { // (atomic) event 2
 *              "timestamp": 1542960136,
 *              "category": "browsing",
 *              "type": "rankedList",
 *              "value": "scrollDown"
 *          },
 *          { // (atomic) event 3
 *              "timestamp": 1542960145,
 *              "category": "image",
 *              "type": "globalFeature",
 *              "value": "VId10,FN35;VId65,FN228"
 *              "attributes": "rerank"
 *          },
 *
 *                      ...
 *
 *          { // (atomic) event n - 1
 *              "timestamp": 1542960290,
 *              "category": "text",
 *              "type": ["concept", "ocr"],
 *              "value": "horse",
 *              "attributes": "1000 NN; sort"
 *          },
 *          { // (atomic) event n
 *              "timestamp": 1542960305,
 *              "category": "browsing",
 *              "type": "videoPlayer",
 *              "value": "play VId10,FN160"
 *          }
 *      ]
 *
 * }
 *
 *
 * Flush messages Format Example:
 * {SUBMISSION/FLUSH}; TEAM ID; MEMBER ID; TIMESTAMP
 *
 */

    constructor(teamName, teamId, memberId) {
        this.teamName = teamName;
        this.teamId = teamId;
        this.memberId = memberId;
        this.logInterval;
        this.taskTimeInterval; // update interval for task time
        this.totalLoggedEvents = {local: [], submitted: []}; // store all logged events for summary display
    }

    isTaskRunning()
    {
        // console.log("Task running?");
        // console.log(Preferences.load(this.getCacheKey(), false));
        return Preferences.load(this.getCacheKey(), false);
    }

    getCacheKey() {
        // save log per team and member
        // return Preferences.prefKeys.LOG.LOG_CACHE + "_" + this.teamId + "_" + this.memberId;
        return Preferences.prefKeys.LOG.LOG_CACHE;
    }

    createNewLog() {

        this.logObject = new LogObject(this.teamId, this.memberId);
        Preferences.save(this.getCacheKey(), this.logToJSONString());
        this.startLogging();
    }

    resumeLog() {
        this.logObject = LogObject.fromJSON(Preferences.load(this.getCacheKey(), new LogObject(this.teamName, this.memberId)));
        this.startLogging();
    }

    startLogging() {
        this.startInterval();
        this.startTimer();
    }

    resetLog() {
        console.log("Actionlog reset ("+ this.logObject.events.length + " items)");
        this.logObject.reset();
        this.startInterval();
    }

    formatForFlush() {
        this.logObject.type = global.log.submitType.FLUSH;
        let objJson = this.logToJSONString();
        // this.resetLog();
        return objJson;
    }

    formatForSubmission() {
        this.logObject.type = global.log.submitType.REGULAR;
        let objJson = this.logToJSONString();
        this.resetLog();
        return objJson;
    }

    deleteLog() {
        console.log("Task Ended...");
        clearInterval(this.logInterval);
        clearInterval(this.taskTimeInterval);
        this.logObject = undefined;
        Preferences.save(this.getCacheKey(), undefined);
    }

    onMessageSent(sentString, success = false, isFlush = false) {
        if (isFlush) this.flushSent(sentString, success);
        else this.submitSent(sentString,  success);
    }

    submitSent(sentString, succeeded = false) {
        // attempt to save log locally
        this.save(sentString, succeeded, () => {
            // save success

        }, () => {
            // saving failed

            // restore log
            if (!succeeded) {
                let msg = "Keeping action log - submitted: ";
                msg += succeeded ? "YES" : "NO";
                msg += ", saved locally: NO.";
                toastr.error(msg);
                this.logObject = LogObject.fromJSON(Preferences.load(this.getCacheKey(), new LogObject(this.teamName, this.memberId)));
                console.log("Task restored...");
            }

        });
    }

    flushSent(sentString, succeeded = false) {
        // attempt to save log locally
        this.save(sentString, succeeded, () => {
            // save success
            this.deleteLog();

            // console.log("call flush save succeeded");
            controller.showFinishTask();
        }, () => {
            // saving failed

            toastr.error("Action Log: failed saving locally, retry or discard log with new task!");

            let msg = "Action log - submitted: ";
            msg += succeeded ? "YES" : "NO";
            msg += ", saved locally: NO.";

            $.confirm({
                buttons: {
                    discard: () => {
                        this.deleteLog();
                    },
                    keep: () =>  {
                        // restore log
                        this.logObject = LogObject.fromJSON(Preferences.load(this.getCacheKey(), new LogObject(this.teamName, this.memberId)));
                        console.log("Task restored...");
                    },
                },
                content: "Discard or keep action log for next task?",
                title: msg,
                onClose: () => {
                    controller.showFinishTask();
                }
            });
        });

    }

    // jsonString should already have been posted to server
    save(jsonString, isSubmitted = false, onSuccess = null, onFailure = null) {

        // revive json to get human readable date
        let postedLog = this.logFromJSON(jsonString);
        let filePath = this.createFilePathFromLog(postedLog, isSubmitted);

        // console.log(relativeFolder);

        var data = {
            operation: "save",
            file: filePath,
            json: jsonString
        }

        $.ajax({
            type : "POST",
            url : global.config.baseURL + "log.php",
            dataType: "json",
            data : data,
            success: (response) =>
            {
                let tempLog = LogObject.fromJSON(jsonString);
                // console.log(tempLog);
                if (isSubmitted) this.totalLoggedEvents.submitted = this.totalLoggedEvents.submitted.concat(tempLog.events);

                if(response.success) {
                    console.log("Saved log to " + global.config.logPath  + global.config.actionLogFolder + filePath);
                    toastr.info("Action Log: saved locally!");
                    this.totalLoggedEvents.local = this.totalLoggedEvents.local.concat(tempLog.events);
                    if(onSuccess) onSuccess(response);
                }
                else {
                    console.error("Failed to save log to " + global.config.logPath  + global.config.actionLogFolder + filePath);
                    toastr.error("Action log: failed to save locally - " + response.message);
                    if(onFailure) onFailure(response);
                }

            }
        });

    }

    // deletes all serverside actionlogs (appdata/logs/actionLog)
    clearActionLog() {
        this.clearLogFolder("clearActionLog");
    }

    // deletes all serverside map caches (appData/cache)
    clearCache() {
        this.clearLogFolder("clearCache");
    }

    clearLogFolder(action, onSuccess = null, onFailure = null) {

        var data = {
            operation: action
        }

        $.ajax({
            type : "POST",
            url : global.config.baseURL + "log.php",
            dataType: "json",
            data : data,
            success: (response) =>
            {
                if(response.success) {
                    console.log("Clear log msg: " + response.message);
                    toastr.info("Action Log: " + response.message);
                    if(onSuccess) onSuccess(response);
                }
                else {
                    console.log("Clear log msg: " + response.message);
                    toastr.error("Action Log: " + response.message);
                    if(onFailure) onFailure(response);
                }

            }
        });
    }

    createFilePathFromLog(log, isSubmitted = false) {
        let date = new Date(log.startTimestamp * 1000); // folder from task start time
        let fileName = Date.now() + ".json"; //  file from current timestamp

        let teamMemberDir = this.teamName + "_" + this.memberId;

        let local_remote_log = isSubmitted ? "submitted" : "local";

        let relDir = date.getFullYear()+ "_" +
            // INFO: starts at 0
            padZeros(date.getMonth() + 1, 2) + "_" +
            // INFO: getDay only gets day of week (e.g. 5 = fri)
            padZeros(date.getDate(), 2) + "/" +
            padZeros(date.getHours(), 2) + "_" + padZeros(date.getMinutes(),2);

        // let actionLogPath = global.config.logPath  + global.config.actionLogFolder;

        return teamMemberDir + "/" + local_remote_log + "/" + relDir + "/" + fileName;
    }


    startTimer() {
        // update task time every 500 ms
        this.taskTimeInterval = setInterval ( () => {
            $("#taskTimeIndication")[0].innerHTML = this.getFormattedTimeIndicator();
        },500);
        let taskDurationFormatted = this.getFormattedTime(new Date(global.config.taskDurationSeconds * 1000));
        $("#taskTimeInfo")[0].dataset.tootik = "Task duration: " + taskDurationFormatted;
    }


    startInterval() {
        // featureMap position is logged every 5 seconds (provided that it has changed)
        var prevMapState = controller.featureMap.stringifyCurrentState();
        this.logInterval = setInterval(() => {


            // var newMapState = controller.featureMap.stringifyCurrentState();
            // if (newMapState != prevMapState) {
            //     // this.log("B", newMapState);
            //     let cat = global.log.category.BROWSE;
            //     this.logAtomic(cat.key, cat.values.EXPLORE, newMapState);
            // }
            // prevMapState = newMapState;

            // cache logObject in localStorage
            // console.log("Caching logObject:");
            // console.log(this.logObject);
            Preferences.save(this.getCacheKey(), this.logToJSONString());
        }, 5000);
    }

    //TODO: replace all by appropriate logs (logAtomic, logComposite) throghout
    log(action, details) {
        console.log("--------------- [OLD LOG] ----------------");
        console.log("Action: " + action);
        console.log("Details: " + details);
        console.log("------------------------------------------");

        // OLD VBS 2018
        // var time = Math.round((Date.now() - this.log.timestamp) / 1000);
        // var logEntry = action + "(" + time + "s";
        // if (details) {
        //     logEntry += "," + details;
        // }
        // logEntry += ");";
        // this.log += logEntry;
    }

    logAtomic(category, type, value, attributes = undefined) {
        if (typeof category === "undefined" ||
            typeof type === "undefined" ||
            typeof value === "undefined")
        {
            console.log("ActionLogger::logAtomic incomplete log provided...");
            console.log(category);
            console.log(type);
            console.log(value);
            return;
        }

        if (!this.logObject) return; // logging is disabled

        let atomicEvent = new AtomicEvent();
        atomicEvent.category = category;
        atomicEvent.type = type;
        atomicEvent.value = value;
        if (typeof attributes !== "undefined") atomicEvent.attributes = attributes;

        let logDebug = "Atomic Event - " + category + " " + type;
        console.log("Action Logger: " + logDebug);
        // toastr.info("Action Logger: " + logDebug);
        this.logObject.addEvent(atomicEvent);
    }

    //TODO: needed at all?
    logComposite() {

    }

    logToJSONString() {
        return JSON.stringify(this.logObject);
    }

    logFromJSON(jsonOrString) {
        return LogObject.fromJSON(jsonOrString);
    }

    getLogSequence() {
        return this.teamId + ";" + this.logObject + "time " + this.getCurrentTime();
    }

    getElapsedLogTime() {
        let time = ts2Unix(Date.now()) - this.logObject.startTimestamp;
        let date = new Date(time * 1000);
        return this.getFormattedTime(date);
    }

    getFormattedTimeIndicator() {
        let time = ts2Unix(Date.now()) - this.logObject.startTimestamp;
        let date = new Date(time * 1000);
        let formattedTime = this.getFormattedTime(date);
        let style = "color:#4daf4a;";

        // half time
        if (time > global.config.taskDurationSeconds * 0.5)
            style = "color:#ffff33;";
        // 90%
        if (time > global.config.taskDurationSeconds * 0.9)
            style = "color:#e41a1c;";
        // time over
        if (time > global.config.taskDurationSeconds)
            style = "color:#999999;";


        return "<span style='"+style+"'>" + formattedTime +"</span>";
    }

    getFormattedTime(date, utc = true) {
        // getUTCHours bypasses timezone specific time, e.g. always adding +1 for europe
        let hours = utc ? date.getUTCHours() : date.getHours();
        return this.pad(hours) + ":" + this.pad(date.getMinutes()) + ":" + this.pad(date.getSeconds());
    }

    getCurrentTime() {
        var date = new Date();
        return this.getFormattedTime(date, false);
    }

    pad(v) {
        if (v<10) {
            return "0" + v;
        } else {
            return "" + v;
        }
    }

}
