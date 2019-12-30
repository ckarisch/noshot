import Event from './Event.js'
import ResultObject from './ResultObject.js';

/*
  In order to be able to capture the ranked list of results
  and its development at any given point in time, each team
  should submit (to “vbs/log/” endpoint) a list of results every
  time that list is updated in their tool either proactively, e.g.
  as a result of a user interaction, or in the background due
  to some internal processing.
 */

function ResultLogger (teamName, teamId, memberId) {
  return {
    created: function() {
      this.teamName = teamName;
      this.teamId = teamId;
      this.memberId = memberId;
      this.logInterval;
      this.taskTimeInterval; // update interval for task time
      this.totalLoggedEvents = {local: [], submitted: []}; // store all logged events for summary display
    },
    methods: {
      isTaskRunning: function() {
        return window.appCfg.preferences.load(this.getCacheKey(), false);
      },

      getCacheKey: function() {
        return window.appCfg.preferences.prefKeys.LOG.LOG_CACHE;
      },

      createNewLog: function() {

          this.logObject = new ResultObject(this.teamId, this.memberId);
          window.appCfg.preferences.save(this.getCacheKey(), this.logToJSONString());
          this.startLogging();
      },

      resumeLog: function() {
          this.logObject = ResultObject.fromJSON(window.appCfg.preferences.load(this.getCacheKey(), new ResultObject(this.teamName, this.memberId)));
          this.startLogging();
      },

      startLogging: function() {
          this.startInterval();
          this.startTimer();
      },

      resetLog: function() {
          console.log("Actionlog reset ("+ this.logObject.events.length + " items)");
          this.logObject.reset();
          this.startInterval();
      },

      formatForSubmission: function() {
          this.logObject.type = global.log.submitType.INTERACT;
          let objJson = this.logToJSONString();
          this.resetLog();
          return objJson;
      },

      deleteLog: function() {
          console.log("Task Ended...");
          clearInterval(this.logInterval);
          clearInterval(this.taskTimeInterval);
          this.logObject = undefined;
          window.appCfg.preferences.save(this.getCacheKey(), undefined);
      },

      onMessageSent: function(sentString, success = false) {
          this.submitSent(sentString,  success);
      },

      submitSent: function(sentString, succeeded = false) {
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
                  this.$toastr.e(msg);
                  this.logObject = ResultObject.fromJSON(window.appCfg.preferences.load(this.getCacheKey(), new ResultObject(this.teamName, this.memberId)));
                  console.log("Task restored...");
              }

          });
      },

      // jsonString should already have been posted to server
      save: function(jsonString, isSubmitted = false, onSuccess = null, onFailure = null) {

          // revive json to get human readable date
          let postedLog = this.logFromJSON(jsonString);
          let filePath = this.createFilePathFromLog(postedLog, isSubmitted);

          // console.log(relativeFolder);

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
          //         let tempLog = ResultObject.fromJSON(jsonString);
          //         // console.log(tempLog);
          //         if (isSubmitted) this.totalLoggedEvents.submitted = this.totalLoggedEvents.submitted.concat(tempLog.events);
          //
          //         if(response.success) {
          //             console.log("Saved log to " + global.config.logPath  + global.config.actionLogFolder + filePath);
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

      },

      // deletes all serverside actionlogs (appdata/logs/actionLog)
      clearActionLog: function() {
          this.clearLogFolder("clearActionLog");
      },

      clearLogFolder: function(action, onSuccess = null, onFailure = null) {

          //TODO
          window.log(onSuccess + " " + onFailure);


          // var data = {
          //     operation: action
          // }

          // $.ajax({
          //     type : "POST",
          //     url : global.config.baseURL + "log.php",
          //     dataType: "json",
          //     data : data,
          //     success: (response) =>
          //     {
          //         if(response.success) {
          //             console.log("Clear log msg: " + response.message);
          //             toastr.info("Action Log: " + response.message);
          //             if(onSuccess) onSuccess(response);
          //         }
          //         else {
          //             console.log("Clear log msg: " + response.message);
          //             toastr.error("Action Log: " + response.message);
          //             if(onFailure) onFailure(response);
          //         }
          //
          //     }
          // });
      },

      createFilePathFromLog: function(log, isSubmitted = false) {
          let date = new Date(log.startTimestamp * 1000); // folder from task start time
          let fileName = Date.now() + ".json"; //  file from current timestamp

          let teamMemberDir = this.teamName + "_" + this.memberId;

          let local_remote_log = isSubmitted ? "submitted" : "local";

          let relDir = date.getFullYear()+ "_" +
              // INFO: starts at 0
              String(date.getMonth()).padStart(2, '0') + "_" +
              // INFO: getDay only gets day of week (e.g. 5 = fri)
              String(date.getDate()).padStart(2, '0') + "/" +
              String(date.getHours()).padStart(2, '0') + "_" + String(date.getMinutes()).padStart(2, '0');

          // let actionLogPath = global.config.logPath  + global.config.actionLogFolder;

          return teamMemberDir + "/" + local_remote_log + "/" + relDir + "/" + fileName;
      },
      startTimer: function() {
          // update task time every 500 ms
          this.taskTimeInterval = setInterval ( () => {
              // TODO: display
              // $("#taskTimeIndication")[0].innerHTML = this.getFormattedTimeIndicator();
          },500);
          let taskDurationFormatted = this.getFormattedTime(new Date(global.config.taskDurationSeconds * 1000));
          window.log(taskDurationFormatted);
          // TODO: display
          // $("#taskTimeInfo")[0].dataset.tootik = "Task duration: " + taskDurationFormatted;
      },


      startInterval: function() {
          // featureMap position is logged every 5 seconds (provided that it has changed)
          // var prevMapState = controller.featureMap.stringifyCurrentState();
          this.logInterval = setInterval(() => {
              window.appCfg.preferences.save(this.getCacheKey(), this.logToJSONString());
          }, 5000);
      },

      showLog: function(action, details) {
          window.log("--------------- [OLD LOG] ----------------");
          window.log("Action: " + action);
          window.log("Details: " + details);
          window.log("------------------------------------------");
      },

      log: function(category, type, value, attributes = undefined) {
          if (typeof category === "undefined" ||
              typeof type === "undefined" ||
              typeof value === "undefined")
          {
              window.log("ActionLogger::logAtomic incomplete log provided...");
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
          console.log("Action Logger: " + logDebug);
          // toastr.info("Action Logger: " + logDebug);
          this.logObject.addEvent(event);
      },

      logToJSONString: function() {
          return JSON.stringify(this.logObject);
      },

      logFromJSON: function(jsonOrString) {
          return ResultObject.fromJSON(jsonOrString);
      },

      getLogSequence: function() {
          return this.teamId + ";" + this.logObject + "time " + this.getCurrentTime();
      },

      getElapsedLogTime: function() {
          let time = window.utils.ts2Unix(Date.now()) - this.logObject.startTimestamp;
          let date = new Date(time * 1000);
          return this.getFormattedTime(date);
      },

      getFormattedTimeIndicator: function() {
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


          return "<span style='"+style+"'>" + formattedTime +"</span>";
      },

      getFormattedTime: function(date, utc = true) {
          // getUTCHours bypasses timezone specific time, e.g. always adding +1 for europe
          let hours = utc ? date.getUTCHours() : date.getHours();
          return this.pad(hours) + ":" + this.pad(date.getMinutes()) + ":" + this.pad(date.getSeconds());
      },

      getCurrentTime: function() {
          var date = new Date();
          return this.getFormattedTime(date, false);
      }

    } // methods
  } // return mixin
} // function Actionlogger

export default ResultLogger;
