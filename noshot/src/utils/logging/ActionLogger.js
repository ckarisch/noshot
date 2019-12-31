import InteractObject from './InteractObject.js';
import ResultObject from './ResultObject.js';

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
    this.logInterval;       // interval for logging
    this.taskTimeInterval;  // update interval for task time
    this.interactLog;
    this.totalLoggedEvents = {
      local: [],
      submitted: []
    }; // store all logged events for summary display
    this.noshotLoggingComponent = null;
  }

  setVueComponent(component) {
    this.noshotLoggingComponent = component;
  }

  resetLog() {
    window.appCfg.preferences.save(this.interactLog.getCacheKey(), undefined);
    this.interactLog = undefined;
  }

  isTaskRunning() {
    return window.appCfg.preferences.load(InteractObject.getCacheKey(), false);
  }

  isLogEmpty() {
    if (!this.isTaskRunning()) return false;
    let tempLog = InteractObject.fromJSON(
      window.appCfg.preferences.load(InteractObject.getCacheKey(),
      new InteractObject(this.teamName, this.memberId)));
    return tempLog.events > 0;
  }

  isActive() {
    return (this.taskTimeInterval && this.logInterval);
  }

  // getCacheKey() {
  //   return window.appCfg.preferences.prefKeys.LOG.LOG_CACHE;
  // }

  createNewLog() {
    this.interactLog = new InteractObject(this.teamId, this.memberId);
    this.saveToLocalStorage();
    this.startLogging();
  }

  resumeLog(startLogging = true) {
    this.interactLog = InteractObject.fromJSON(
      window.appCfg.preferences.load(InteractObject.getCacheKey(),
      new InteractObject(this.teamName, this.memberId)));
    if (startLogging) this.startLogging();
  }

  startLogging() {
    window.log("Logging ON");
    this.startInterval();
    this.startTimer();
  }

  stopLogging() {
    window.log("Logging OFF");
    clearInterval(this.logInterval);
    clearInterval(this.taskTimeInterval);
    this.logInterval = null;
    this.taskTimeInterval = null;
    this.displayCurrentTime();
  }

  displayCurrentTime() {
    document.querySelector(".timedisplay").innerHTML = this.getFormattedTimeIndicator(false);
  }

  flushLog() {
    window.log("Actionlog flush (" + this.interactLog.events.length + " items)");
    this.interactLog.flush();
  }

  deleteLog() {
    window.log("Delete log " + this.interactLog.getCacheKey());
    this.stopLogging();
    this.resetLog(this.interactLog);
    document.querySelector(".timedisplay").innerHTML = "00:00:00";
  }

  // submit to vbs server
  submit() {
    this.interactLog.timestamp = window.utils.ts2Unix(Date.now()); // set submission ts
    let jsonString = this.logToJSONString(this.interactLog);
    let vbsServerUrl = window.appCfg.vbsServer.url + ":" + window.appCfg.vbsServer.port;
    let url = vbsServerUrl + window.appCfg.vbsServer.logRoute;

    fetch(url, {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: jsonString
    }).then(response => {
        console.log(response);
        let txt = response.text();
        // status ok
        if (response.ok) {
          txt.then(result => {
            window.log(`Submitted log to ${vbsServerUrl}.`);
            // save locally
            this.save(true);
            return result;
          });
        } else {
          // error
          return txt.then(err => {throw err;});
        }
    }).catch(error => {
        // let msg = error.message ? error.message : error;
        console.log(`Error submiting log to ${vbsServerUrl}.`);
        window.log(error);
        // save locally
        this.save(false);
    });
  }

  // creates file save dialog for saving log
  // isSubmitted: has already been submitted to server
  save(isSubmitted = false) {

    let jsonString = this.logToJSONString();
    let filePath = this.createFilePathFromLog(this.interactLog, isSubmitted);

    // manual saving
    // var blob = new Blob([jsonString], {type: "text/plain;charset=utf-8"});
    // var blob = new Blob(this.interactLog, {type: "application/json;charset=utf-8"});
    // window.utils.saveAs(blob, filePath);

    // automatic saving
    let logServerUrl = window.appCfg.dbServer.url + ':' + window.appCfg.dbServer.port;
    let url = logServerUrl + window.appCfg.dbServer.logRoute;
    var data = {
        file: filePath,
        json: jsonString
    }

    fetch(url, {
        method: "PUT",
        mode: "cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then(response => {
        let txt = response.text();
        // status ok
        if (response.ok) {
          txt.then(result => {
            window.log(`Saved log to ${logServerUrl}, ${filePath}`);
            this.flushLog(this.interactLog);
            if (this.noshotLoggingComponent) this.noshotLoggingComponent.notifyLogUpdate();
            return result;
          });
        } else {
          // error
          return txt.then(err => {throw err;});
        }
    }).catch(error => {
        // let msg = error.message ? error.message : error;
        console.log(`Error saving log to ${logServerUrl}`);
        window.log(error);
    });
  }

  saveToLocalStorage() {
    window.appCfg.preferences.save(this.interactLog.getCacheKey(), this.logToJSON(this.interactLog));
  }

  createFilePathFromLog(log, isSubmitted = false) {
    let dateStart = new Date(log.beginTimestamp * 1000); // folder from task start time
    let dateSubmit = new Date(log.timestamp * 1000); // task submit time
    let fileExt = "json"; //  file from submission timestamp

    let teamMemberDir = this.teamName + "_" + this.memberId;

    let local_remote_log = isSubmitted ? "submitted" : "local";

    let relDir = dateStart.getFullYear() + "_" +
      // INFO: starts at 0
      this.zeroPad(dateStart.getMonth()) + "_" +
      // INFO: getDay only gets day of week (e.g. 5 = fri)
      this.zeroPad(dateStart.getDate());

    let stampBeginTime = this.zeroPad(dateStart.getHours()) + "-" + this.zeroPad(dateStart.getMinutes()) + "-" + this.zeroPad(dateStart.getSeconds());
    let stampSubmitTime = this.zeroPad(dateSubmit.getHours()) + "-" + this.zeroPad(dateSubmit.getMinutes()) + "-" + this.zeroPad(dateSubmit.getSeconds());

    // log.timestamp necessary to guarantee uniqueness
    return `${teamMemberDir}/${local_remote_log}/${relDir}/${log.startTime}/${stampBeginTime}_${stampSubmitTime}_${log.timestamp}.${fileExt}`;
  }

  startTimer() {
    // update task time every 500 ms
    this.taskTimeInterval = setInterval(() => {
      // console.log("timer interval fired...");
      this.displayCurrentTime();
    }, 500);
    // let taskDurationFormatted = this.getFormattedTime(new Date(window.appCfg.logging.taskDurationSeconds * 1000));
    // window.log(taskDurationFormatted);
    // TODO: display
    // $("#taskTimeInfo")[0].dataset.tootik = "Task duration: " + taskDurationFormatted;
  }

  startInterval() {
    // featureMap position is logged every 5 seconds (provided that it has changed)
    // var prevMapState = controller.featureMap.stringifyCurrentState();
    this.logInterval = setInterval(() => {
      // console.log("log interval fired...");
      this.saveToLocalStorage();
      // submit interact log if there are new events
      if (!this.isLogEmpty()) this.submit(this.interactLog);
    }, window.appCfg.logging.interactionIntervalMS);
  }

  showLog(action, details) {
    window.log("--------------- [OLD LOG] ----------------");
    window.log("Action: " + action);
    window.log("Details: " + details);
    window.log("------------------------------------------");
  }

  // pass Event/Result as object
  log(category, object) {
    if (typeof category === "undefined" ||
      typeof type === "undefined" ||
      typeof value === "undefined") {
      window.log("ActionLogger::log incomplete log provided...");
      window.log(category);
      window.log(object);
      return;
    }

    if (!this.interactLog) return; // logging is disabled

    let logDebug = "Event - " + category + " " + object.type;
    window.log("Action Logger: " + logDebug);
    // toastr.info("Action Logger: " + logDebug);
    if (object.type === window.logging.logTypes.submitType.RESULT) {
      this.interactLog.addEvent(object);
    }
    else if (object.type === window.logging.logTypes.submitType.INTERACT) {
      let resultLog = new ResultObject(this.teamName, this.memberId);
      // TODO add resultLog fields
      // TODO add result
      window.log(resultLog);
    }

  }

  logToJSON(logObj = this.interactLog) {
    return logObj.toJSON();
  }

  logToJSONString(logObj = this.interactLog) {
    return JSON.stringify(logObj);
  }

  logFromJSON(jsonOrString, isInteractObject = true) {
    if (isInteractObject) return InteractObject.fromJSON(jsonOrString);
    else return ResultObject.fromJSON(jsonOrString);
  }

  getLogSequence() {
    return this.teamId + ";" + this.interactLog + "time " + this.getCurrentTime();
  }

  // time stince start of logging
  getElapsedLogTime() {
    let time = Date.now() - this.interactLog.startTime;
    let date = new Date(time);
    return this.getFormattedTime(date);
  }

  // time spent logging
  getFormattedTimeIndicator(colored = true) {

    let logTime = Date.now() - this.interactLog.startTime;
    // let date = new Date(logTime * 1000);
    let date = new Date(logTime);
    let formattedTime = this.getFormattedTime(date);

    let style = "";

    if (colored) {
      style = "color:#4daf4a;";
      // half time
      if (logTime > window.appCfg.logging.taskDurationSeconds * 0.5)
        style = "color:#ffff33;";
      // 90%
      if (logTime > window.appCfg.logging.taskDurationSeconds * 0.9)
        style = "color:#e41a1c;";
      // time over
      if (logTime > window.appCfg.logging.taskDurationSeconds)
        style = "color:#999999;";
    }

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
