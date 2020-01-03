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
    // this.isLogPending = false; // flag for marking critical logging section
    // this.totalLoggedEvents = {
    //   local: [],
    //   submitted: []
    // }; // store all logged events for summary display
    this.noshotLoggingComponent = null;
    this.pendingResultLogs = [];
  }

  setVueComponent(component) {
    this.noshotLoggingComponent = component;
  }

  resetLog() {
    window.appCfg.preferences.save(this.interactLog.getCacheKey(), undefined);
    this.interactLog = undefined;
    window.appCfg.preferences.save(ResultObject.getCacheKey(), undefined);
    this.pendingResultLogs = [];
  }

  isTaskRunning() {
    return this.getLogFromLocalStorage(InteractObject.getCacheKey()) ? true : false;
  }

  getLogFromLocalStorage(type = InteractObject.getCacheKey()) {
    return window.appCfg.preferences.load(type, false);
  }

  areResultLogsPending() {
    let resultObjects = this.getLogFromLocalStorage(ResultObject.getCacheKey());
    return resultObjects.length > 0;
  }

  hasLogEvents() {
    if (!this.isTaskRunning()) return false;
    let tempLog = InteractObject.fromJSON(
      window.appCfg.preferences.load(InteractObject.getCacheKey(),
      new InteractObject(this.teamName, this.memberId)));
    // window.log(tempLog.events.length);
    return tempLog.events.length > 0;
  }

  isActive() {
    return (this.taskTimeInterval && this.logInterval) ? true : false;
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
    if (!this.isTaskRunning()) return;
    this.interactLog = InteractObject.fromJSON(
      window.appCfg.preferences.load(InteractObject.getCacheKey(),
      new InteractObject(this.teamName, this.memberId)));
    this.interactLog.isBeingSubmitted = false;
    if (this.areResultLogsPending()) {
      let list = window.appCfg.preferences.load(ResultObject.getCacheKey(), []);
      for (let rl of list) {
        let resultObject = ResultObject.fromJSON(rl);
        resultObject.isBeingSubmitted  = false;
        // dont push already loaded events
        if (this.pendingResultLogs.filter(el => el.id === rl.id).length === 0) {
          this.pendingResultLogs.push(resultObject);
        }
      }
    }
    if (startLogging) this.startLogging();
  }

  // finishes up remaining logs and resets logging
  finishLog(cb = null) {
    // if (!this.isActive()) this.resumeLog(false); // get log if not loaded

    this.stopLogging(); // sop all intervals for saving

    if (!this.hasLogEvents() && !this.areResultLogsPending()) {
      this.deleteLog();
      return (cb) ? cb() : cb;
    }

    // interval to wait for currently submitting logs
    let intvl = setInterval( () => {

      // wait for all currently running submissions to finish
      if (this.isSubmittingInteracLogs()) return;
      if (this.isSubmittingResultLogs()) return;
      clearInterval(intvl);

      // logger has no server requests pending
      let promises = [];

      // interact log
      if (this.hasLogEvents()) {
        let p = new Promise( (res) => {
          this.submitAndSaveLog(
            this.interactLog,
            () => {res();}
          );
        });
        promises.push(p);
      }

      // result logs
      if (this.areResultLogsPending()) {
        for (let resLog of this.pendingResultLogs) {
          let p = new Promise( (res) => {
            this.submitAndSaveLog(
              resLog,
              () => {res();}
            );
          });
          promises.push(p);
        } // for all pending logs
      }

      // wait for all promises before cb
      Promise.all(promises).then(() => {
        this.deleteLog();
        return (cb) ? cb() : cb;
      });

    }, 500); // interval
  } // method

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
    this.saveToLocalStorage();
    this.displayCurrentTime();
  }

  displayCurrentTime() {
    document.querySelector(".timedisplay").innerHTML = this.getFormattedTimeIndicator(false);
  }

  flushLog(log = this.interactLog) {
    if (log === this.interactLog) {
      window.log("Interact log flush (" + log.events.length + " events)");
      log.flush();
    }
    else {
      this.pendingResultLogs = this.pendingResultLogs.filter(element => element.id !== log.id);
      window.log("Result log flush (remaining: " + this.pendingResultLogs.length + " logs)");
    }

    this.saveToLocalStorage();
  }

  deleteLog() {
    window.log("Delete log " + this.interactLog.getCacheKey());
    this.stopLogging();
    this.resetLog();
    this.displayCurrentTime();
  }

  isSubmittingInteracLogs() {
    return this.interactLog.isBeingSubmitted;
  }

  isSubmittingResultLogs() {
    for (let resLog of this.pendingResultLogs) {
      if (resLog.isBeingSubmitted) return true;
    }
    return false;
  }

  // submitPendingResultLogs() {
  //   // pending resultlogs
  //   for (let resLog of this.pendingResultLogs) {
  //     if (!resLog.isBeingSubmitted) this.submitAndSaveLog(resLog);
  //   }
  // }

  // submit to vbs server and save locally
  submitAndSaveLog(log = this.interactLog, cb = null) {
    // no events to log
    if (!this.hasLogEvents()) {
      if (cb) cb();
      return;
    }

    log.isBeingSubmitted = true;
    let submitPromise = this.submit(log);
    let savePromise = null;
    // SUBMIT
    submitPromise.then(
      // resolve submit
      () => {savePromise = this.save(log, true);},
      // reject submit
      () => {savePromise = this.save(log, false);}
    )
    // SAVE (after submit)
    .finally(() => {
      savePromise.then(
        // resolve save
        () => {
          this.flushLog(log);
          log.isBeingSubmitted = false;
          if (this.noshotLoggingComponent) this.noshotLoggingComponent.notifyLogUpdate();
          if (cb) cb();
        },
        // reject save
        () => {
          log.isBeingSubmitted = false;
          if (cb) cb();
        }
      );
    });
  }

  // submit to vbs server
  submit(log = this.interactLog) {
    log.timestamp = window.utils.ts2Unix(Date.now()); // set submission ts
    let jsonString = this.logToJSONString(log);

    // server data
    let vbsServerUrl = window.appCfg.vbsServer.url + ":" + window.appCfg.vbsServer.port;
    let url = vbsServerUrl + window.appCfg.vbsServer.logRoute;

    return new Promise((res, rej) => {
      fetch(url, {
          method: "POST",
          mode: "cors",
          headers: {
              "Content-Type": "application/json"
          },
          body: jsonString
      }).then(response => {
          let txt = response.text();
          // status ok
          if (response.ok) {
            txt.then(result => {
              window.log(`Submitted log to ${vbsServerUrl}.`);
              res(jsonString);
              return result;
            });
          } else {
            // error
            return txt.then(err => {
              throw err;
            });
          }
      }).catch(error => {
          let msg = `Error submitting ${log.getCacheKey()} to ${vbsServerUrl}.`;
          window.log(msg);
          this.fireToastr('e', msg, 'Log');
          window.log(error);
          rej(jsonString);
          return error;
      }); // fetch
    }); // return promise
  }

  // type = 'i','s','e'
  fireToastr(type, msg, title = "") {
    if (this.noshotLoggingComponent) {
      this.noshotLoggingComponent.$toastr[type](msg, title);
    }
  }

  /**
   * creates file save dialog for saving log
   * @param  {[type]}  jsonString          potentially vbs server submitted json string
   * @param  {Boolean} [isSubmitted=false] is submitted to server
   * @return {[type]}                      void
   */
  save(log = this.interactLog, isSubmitted = false) {

    let jsonString = this.logToJSONString(log);
    let filePath = this.createFilePathFromLog(log, isSubmitted);

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

    return new Promise((res, rej) => {
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
              res(result);
              return result;
            });
          } else {
            // error
            return txt.then(err => {
              throw err;
            });
          }
      }).catch(error => {
          // let msg = error.message ? error.message : error;
          let msg = `Error saving log to ${logServerUrl}`;
          window.log(msg);
          this.fireToastr('e', msg, 'Log');
          window.log(error);
          rej(error);
          return error;
      }); // fetch
    }); // return promise
  }

  saveToLocalStorage() {
    // interact
    window.appCfg.preferences.save(this.interactLog.getCacheKey(), this.logToJSON(this.interactLog));
    // result
    let list = [];
    for (let obj of this.pendingResultLogs) {
      list.push(this.logToJSON(obj));
    }
    window.appCfg.preferences.save(ResultObject.getCacheKey(), list);
  }

  createFilePathFromLog(log, isSubmitted = false) {
    let logStartTime = this.interactLog.startTime; // only defined in this.interactLog!!
    let logStartDate = new Date(logStartTime);
    let dateLastSubmit = new Date(log.beginTimestamp * 1000); // folder from task start time
    let dateSubmit = new Date(log.timestamp * 1000); // task submit time
    let fileExt = "json"; //  file from submission timestamp

    let teamMemberDir = this.teamName + "_" + this.memberId;

    let local_remote_log = isSubmitted ? "submitted" : "local";

    let relDir = logStartDate.getFullYear() + "_" +
      // INFO: starts at 0
      window.utils.zeroPad(logStartDate.getMonth()+1) + "_" +
      // INFO: getDay only gets day of week (e.g. 5 = fri)
      window.utils.zeroPad(logStartDate.getDate());

    let stampLastSubmit = window.utils.zeroPad(dateLastSubmit.getHours()) + "-" + window.utils.zeroPad(dateLastSubmit.getMinutes()) + "-" + window.utils.zeroPad(dateLastSubmit.getSeconds());
    let stampSubmitTime = window.utils.zeroPad(dateSubmit.getHours()) + "-" + window.utils.zeroPad(dateSubmit.getMinutes()) + "-" + window.utils.zeroPad(dateSubmit.getSeconds());

    // Date.now() necessary to guarantee uniqueness
    let path = `${teamMemberDir}/${local_remote_log}/${relDir}/${logStartTime}/${Date.now()}_${log.getCacheKey()}`;
    if (log === this.interactLog) {
      path += `_${stampLastSubmit}_${stampSubmitTime}`;
    } else {
      path += `_${stampSubmitTime}`;
    }
    return `${path}.${fileExt}`;
  }

  startTimer() {
    // update task time every 500 ms
    this.taskTimeInterval = setInterval(() => {
      this.displayCurrentTime();
    }, 500);
  }

  startInterval() {
    // featureMap position is logged every 5 seconds (provided that it has changed)
    // var prevMapState = controller.featureMap.stringifyCurrentState();
    this.logInterval = setInterval(() => {
      // console.log("log interval fired...");
      this.saveToLocalStorage();
      // submit interact log if there are new events
      if (!this.isSubmittingInteracLogs()) this.submitAndSaveLog();
      // submit pending result logs
      for (let resLog of this.pendingResultLogs) {
        if (!resLog.isBeingSubmitted) this.submitAndSaveLog(resLog);
      }
    }, window.appCfg.logging.interactionIntervalMS);
  }

  printLogsInfo() {
    // local storage (LS)
    let interactLocalStorage = this.getLogFromLocalStorage(InteractObject.getCacheKey());
    let interactLocalEvents = (interactLocalStorage) ? interactLocalStorage.events.length : 0;
    let resultsLocalStorage = this.getLogFromLocalStorage(ResultObject.getCacheKey());
    let resultsLocalLogs = (resultsLocalStorage) ? resultsLocalStorage.length : 0;
    // Objects (OBJ)
    let numEvents = (this.interactLog) ? this.interactLog.events.length : 0;
    let numResults = (this.pendingResultLogs) ? this.pendingResultLogs.length : 0;
    window.log("--------------- [Log INFO] ----------------");
    window.log("[Interaction Log]");
    window.log(`OBJ ${(this.interactLog) ? "existing" : "undefined"}, #events: ${numEvents}`);
    window.log(`LS ${(interactLocalStorage) ? "existing" : "undefined"}, #events: ${interactLocalEvents}`);
    window.log("[Results Logs]");
    window.log(`OBJ ${(this.pendingResultLogs) ? "existing" : "undefined"}, #logs: ${numResults}`);
    window.log(`LS ${(resultsLocalStorage) ? "existing" : "undefined"}, #logs: ${resultsLocalLogs}`);
    window.log("------------------------------------------");
  }

  // pass Event/Result as object
  log(logType, object) {
    if (typeof logType === "undefined" ||
      typeof object === "undefined") {
      window.log("ActionLogger::log incomplete log provided...");
      window.log(logType);
      window.log(object);
      return;
    }

    if (!this.isActive()) return; // logging is disabled

    // toastr.info("Action Logger: " + logDebug);
    if (logType === window.logging.logTypes.submitType.INTERACT) {
      // let logDebug = logType + " - Event: " + object.type;
      // window.log("Action Logger: " + logDebug);
      this.interactLog.addEvent(object);
    }
    else if (logType === window.logging.logTypes.submitType.RESULT) {
      this.pendingResultLogs.push(object);
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

    if (!this.interactLog) return "00:00:00";

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
    return window.utils.zeroPad(hours) + ":" + window.utils.zeroPad(date.getMinutes()) + ":" + window.utils.zeroPad(date.getSeconds());
  }

  getCurrentTime() {
    var date = new Date();
    return this.getFormattedTime(date, false);
  }

} // class

export default ActionLogger;
