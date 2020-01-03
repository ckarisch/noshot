<template>
  <div id="logOverlay">
    <button v-tooltip.bottom-center="tooltips.toggleLog" v-on:click="toggleLogging" class="toggleLogButton" v-bind:class="{ enabledLog: isEnabled }" type="button" name="button"><i class="fas fa-power-off"></i></button>
    <div class="timedisplay">00:00:00</div>
    <!-- <button v-tooltip.bottom-center="tooltips.saveLog" v-on:click="saveLog" :disabled="!hasLogEvents" class="logButton" type="button" name="button"><i class="far fa-save"></i></button> -->
    <button v-tooltip.bottom-center="tooltips.finishLog" v-on:click="confirmFinishLog" :disabled="!existsLog" class="logButton" type="button" name="button"><i class="far fa-check-square"></i></button>
  </div>
</template>

<script>
import Event from '../utils/logging/Event.js';
import Result from '../utils/logging/Result.js';
import ResultObject from '../utils/logging/ResultObject.js';

export default {
  name: 'NoshotLogging',
  created() {
    this.actionLogger.setVueComponent(this);
    this.updateButtons();
  },
  data: () => {
      return {
        isEnabled: false,
        actionLogger: window.logging.actionLogger,
        logTypes: window.logging.logTypes,
        tooltips: {
          finishLog: "Finish task",
          saveLog: "Force Save Log",
          toggleLog: "Turn on/off logging"
        },
        existsLog: false,
        hasLogEvents: false
      };
  },
  props: {
  },
  methods: {

    toggleLogging: function () {
      let newValue = !this.isEnabled;

      // TURN on logging
      if (newValue) {
        if (this.actionLogger.isTaskRunning()) {
          this.actionLogger.resumeLog();
          this.isEnabled = true;
        } else {
          this.isEnabled = true;
          this.actionLogger.createNewLog();
        }
      // TURN off logging
      } else {
        this.isEnabled = false;
        this.actionLogger.stopLogging();
      }
      this.updateButtons();
    }, // toggleLogging

    confirmFinishLog: function() {
      if (!this.actionLogger.isTaskRunning()) {
        this.$toastr.e(`No log task running!`, "Log");
        return;
      }

      this.confirmDialog(this, "<span>Finish current log task?</span>",
        // confirmed
        () => {
          this.actionLogger.finishLog(
            () => {
              this.isEnabled = false;
              this.updateButtons();
            }
          );
        },
        // cancelled
        () => {
          // user canceled request
        }
      );
    },

    notifyLogUpdate: function() {
      this.notifyParents(this, 'log-created');
      this.updateButtons();
    },

    updateButtons: function() {
      this.existsLog = this.actionLogger.isTaskRunning();
      this.hasLogEvents = this.actionLogger.hasLogEvents();
    },

    // logs events, component usage:
    // let cat = window.logging.logTypes.category.TEXT;
    // let data  = {
    //    category: cat.key,
    //    type: cat.values.CONCEPT,
    //    value: "anyAssociatedValue"
    // }
    // this.notifyParents(this, 'log-event', data);
    logEvent: function(data) {
      let event = new Event(data.category, data.type, data.value);
      this.actionLogger.log(this.logTypes.submitType.INTERACT, event);
    },

    // creates results from dataArray
    resultsFromDataArray: function(dataArray) {
      let results = [];
      for (let entry of dataArray) {
        let result = new Result(entry.video, entry.frame, entry.score, entry.rank, entry.shot);
        results.push(result);
      }
      return results;
    },

    // logs results, component usage:
    // pass data.info and data.results (array of result objects), i.e.
    // all mandatory and optional properties of utils/logging/ResultObject.js:
    // let data.info = {
    //   usedCategories: ["Text", "Sketch"]
    //   usedTypes: ["ASR", "Color"]
    //   sortType:  ["ASR"]
    //   resultSetAvailability: "all"
    // }
    // data.results is an array of which one result entry has
    // all mandatory and optional properties of utils/logging/Result.js:
    // let data.result  = {
    //   video: "12345";
    //   frame: 123;
    //   score: 0.94;  // optional
    //   rank: 1;     // optional
    //   shot: 4;      // optional
    // }
    logResult: function(data) {
      let results = this.resultsFromDataArray(data.results);
      let resultObject = new ResultObject(this.actionLogger.teamId, this.actionLogger.memberId); // TODO: member
      resultObject.initFromInfo(data.info, results);
      this.actionLogger.log(this.logTypes.submitType.RESULT, resultObject);
    },

  }, // methods
  mounted: function () {
    this.actionLogger.resumeLog(this.actionLogger.isActive());
    this.actionLogger.displayCurrentTime();
  }
}
</script>
