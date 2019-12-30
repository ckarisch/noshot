import Event from './Event.js'
import InteractObject from './InteractObject.js';

/*
  The interaction log is a MANDATORY part of each
  submission AND should at least be posted to the VBS server
  once with a ﬂush submission after an unsuccessful search.
  Ideally, the interaction logs could be ﬂushed automatically
  every 10-15 seconds.
 */

class ActionLogger {

  constructor(teamName, teamId, memberId) {
    this.teamName = teamName;
    this.teamId = teamId;
    this.memberId = memberId;
    this.logInterval;
    this.taskTimeInterval; // update interval for task time
    this.totalLoggedEvents = {
      local: [],
      submitted: []
    }; // store all logged events for summary display
  }

  isTaskRunning() {
    return window.appCfg.preferences.load(this.getCacheKey(), false);
  }

  getCacheKey() {
    return window.appCfg.preferences.prefKeys.LOG.LOG_CACHE;
  }

  createNewLog() {

    this.logObject = new InteractObject(this.teamId, this.memberId);
    window.appCfg.preferences.save(this.getCacheKey(), this.logToJSONString());
    this.startLogging();
  }

  resumeLog() {
    this.logObject = InteractObject.fromJSON(window.appCfg.preferences.load(this.getCacheKey(), new InteractObject(this.teamName, this.memberId)));
    this.startLogging();
  }

  startLogging() {
    this.startInterval();
    this.startTimer();
  }

  resetLog() {
    window.log("Actionlog reset (" + this.logObject.events.length + " items)");
    this.logObject.reset();
    this.startInterval();
  }

  formatForSubmission() {
    this.logObject.type = global.log.submitType.INTERACT;
    let objJson = this.logToJSONString();
    this.resetLog();
    return objJson;
  }

  deleteLog() {
    window.log("Task Ended...");
    clearInterval(this.logInterval);
    clearInterval(this.taskTimeInterval);
    this.logObject = undefined;
    window.appCfg.preferences.save(this.getCacheKey(), undefined);
  }

  onMessageSent(sentString, success = false) {
    this.submitSent(sentString, success);
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
        // this.$toastr.e(msg);
        window.log(msg);
        this.logObject = InteractObject.fromJSON(window.appCfg.preferences.load(this.getCacheKey(), new InteractObject(this.teamName, this.memberId)));
        window.log("Task restored...");
      }

    });
  }

  // jsonString should already have been posted to server
  save(jsonString, isSubmitted = false, onSuccess = null, onFailure = null) {

    // revive json to get human readable date
    let postedLog = this.logFromJSON(jsonString);
    let filePath = this.createFilePathFromLog(postedLog, isSubmitted);

    // window.log(relativeFolder);

    // TODO save to file
    window.log(onSuccess + " " + onFailure + " " + filePath);

    // var data = {
    //     operation: "save",
    //     file: filePath,
    //     json: jsonString
    // }

    // $.ajax({
    //     type : "POST",
    //     url : global.config.baseURL + "log.php",
    //     dataType: "json",
    //     data : data,
    //     success: (response) =>
    //     {
    //         let tempLog = InteractObject.fromJSON(jsonString);
    //         // window.log(tempLog);
    //         if (isSubmitted) this.totalLoggedEvents.submitted = this.totalLoggedEvents.submitted.concat(tempLog.events);
    //
    //         if(response.success) {
    //             window.log("Saved log to " + global.config.logPath  + global.config.actionLogFolder + filePath);
    //             toastr.info("Action Log: saved locally!");
    //             this.totalLoggedEvents.local = this.totalLoggedEvents.local.concat(tempLog.events);
    //             if(onSuccess) onSuccess(response);
    //         }
    //         else {
    //             console.error("Failed to save log to " + global.config.logPath  + global.config.actionLogFolder + filePath);
    //             toastr.error("Action log: failed to save locally - " + response.message);
    //             if(onFailure) onFailure(response);
    //         }
    //
    //     }
    // });

  }

  // deletes all serverside actionlogs (appdata/logs/actionLog)
  // clearActionLog() {
  //   this.clearLogFolder("clearActionLog");
  // }

  // clearLogFolder(action, onSuccess = null, onFailure = null) {
  //
  //   //TODO
  //   window.log(onSuccess + " " + onFailure);
  //
  //
  //   // var data = {
  //   //     operation: action
  //   // }
  //
  //   // $.ajax({
  //   //     type : "POST",
  //   //     url : global.config.baseURL + "log.php",
  //   //     dataType: "json",
  //   //     data : data,
  //   //     success: (response) =>
  //   //     {
  //   //         if(response.success) {
  //   //             window.log("Clear log msg: " + response.message);
  //   //             toastr.info("Action Log: " + response.message);
  //   //             if(onSuccess) onSuccess(response);
  //   //         }
  //   //         else {
  //   //             window.log("Clear log msg: " + response.message);
  //   //             toastr.error("Action Log: " + response.message);
  //   //             if(onFailure) onFailure(response);
  //   //         }
  //   //
  //   //     }
  //   // });
  // }

  createFilePathFromLog(log, isSubmitted = false) {
    let date = new Date(log.startTimestamp * 1000); // folder from task start time
    let fileName = Date.now() + ".json"; //  file from current timestamp

    let teamMemberDir = this.teamName + "_" + this.memberId;

    let local_remote_log = isSubmitted ? "submitted" : "local";

    let relDir = date.getFullYear() + "_" +
      // INFO: starts at 0
      this.zeroPad(date.getMonth()) + "_" +
      // INFO: getDay only gets day of week (e.g. 5 = fri)
      this.zeroPad(date.getDate()) + "/" +
      this.zeroPad(date.getHours()) + "_" + String(date.getMinutes()).padStart(2, '0');

    // let actionLogPath = global.config.logPath  + global.config.actionLogFolder;

    return teamMemberDir + "/" + local_remote_log + "/" + relDir + "/" + fileName;
  }

  startTimer() {
    // update task time every 500 ms
    this.taskTimeInterval = setInterval(() => {
      console.log("timer interval fired...");
      // TODO: display
      // $("#taskTimeIndication")[0].innerHTML = this.getFormattedTimeIndicator();
    }, 500);
    let taskDurationFormatted = this.getFormattedTime(new Date(window.appCfg.logging.taskDurationSeconds * 1000));
    window.log(taskDurationFormatted);
    // TODO: display
    // $("#taskTimeInfo")[0].dataset.tootik = "Task duration: " + taskDurationFormatted;
  }


  startInterval() {
    // featureMap position is logged every 5 seconds (provided that it has changed)
    // var prevMapState = controller.featureMap.stringifyCurrentState();
    this.logInterval = setInterval(() => {
      console.log("log interval fired...");
      window.appCfg.preferences.save(this.getCacheKey(), this.logToJSONString());
    }, window.appCfg.logging.interactionIntervalMS);
  }

  showLog(action, details) {
    window.log("--------------- [OLD LOG] ----------------");
    window.log("Action: " + action);
    window.log("Details: " + details);
    window.log("------------------------------------------");
  }

  log(category, type, value, attributes = undefined) {
    if (typeof category === "undefined" ||
      typeof type === "undefined" ||
      typeof value === "undefined") {
      window.log("ActionLogger::log incomplete log provided...");
      window.log(category);
      window.log(type);
      window.log(value);
      return;
    }

    if (!this.logObject) return; // logging is disabled

    let event = new Event();
    event.category = category;
    event.type = type;
    event.value = value;
    if (typeof attributes !== "undefined") event.attributes = attributes;

    let logDebug = "Atomic Event - " + category + " " + type;
    window.log("Action Logger: " + logDebug);
    // toastr.info("Action Logger: " + logDebug);
    this.logObject.addEvent(event);
  }

  logToJSONString() {
    return JSON.stringify(this.logObject);
  }

  logFromJSON(jsonOrString) {
    return InteractObject.fromJSON(jsonOrString);
  }

  getLogSequence() {
    return this.teamId + ";" + this.logObject + "time " + this.getCurrentTime();
  }

  getElapsedLogTime() {
    let time = window.utils.ts2Unix(Date.now()) - this.logObject.startTimestamp;
    let date = new Date(time * 1000);
    return this.getFormattedTime(date);
  }

  getFormattedTimeIndicator() {
    let time = window.utils.ts2Unix(Date.now()) - this.logObject.startTimestamp;
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

    return "<span style='" + style + "'>" + formattedTime + "</span>";
  }

  getFormattedTime(date, utc = true) {
    // getUTCHours bypasses timezone specific time, e.g. always adding +1 for europe
    let hours = utc ? date.getUTCHours() : date.getHours();
    return this.zeroPad(hours) + ":" + this.zeroPad(date.getMinutes()) + ":" + this.zeroPad(date.getSeconds());
  }

  getCurrentTime() {
    var date = new Date();
    return this.getFormattedTime(date, false);
  }

  zeroPad(number, numZeros = 2) {
    return String(number).padStart(numZeros, '0');
  }


} // class

export default ActionLogger;
