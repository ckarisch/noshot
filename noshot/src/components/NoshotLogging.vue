<template>
  <div id="logOverlay">
    <button v-tooltip.bottom-center="tooltips.toggleLog" v-on:click="toggleLogging" class="toggleLogButton" v-bind:class="{ enabledLog: isEnabled }" type="button" name="button"><i class="fas fa-power-off"></i></button>
    <div class="timedisplay">00:00:00</div>
    <button v-tooltip.bottom-center="tooltips.saveLog" v-on:click="saveLog" :disabled="!hasLogEvents" class="logButton" type="button" name="button"><i class="far fa-save"></i></button>
    <button v-tooltip.bottom-center="tooltips.deleteLog" v-on:click="deleteLog" :disabled="!existsLog" class="logButton" type="button" name="button"><i class="far fa-trash-alt"></i></button>
  </div>
</template>

<script>
import Event from '../utils/logging/Event.js';
// import Result from '../utils/logging/Result.js';

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
          deleteLog: "Delete current log",
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
          // CONFIRM RESUME
          // this.confirmResumeLog(
          //   () => {this.isEnabled = true;},
          //   this.confirmCreateNewLog
          // );
          this.actionLogger.resumeLog();
          this.isEnabled = true;
        } else {
          this.isEnabled = true;
          this.actionLogger.createNewLog();
        }
      // TURN off logging
      } else {
        // CONFIRM SAVE AND DELETE
        // let onDeleteConfirmed = () => {
        //   this.isEnabled = false;
        //   if (this.actionLogger.isActive()) this.actionLogger.stopLogging();
        // }
        // let onSaveConfirmed = () => {
        //   this.confirmDeleteLog(
        //     onDeleteConfirmed,
        //     onDeleteConfirmed
        //   )
        // }
        // this.confirmSaveLog(
        //   onSaveConfirmed,
        //   onSaveConfirmed
        // );
        this.isEnabled = false;
        this.actionLogger.stopLogging();
      }
      this.updateButtons();
    }, // toggleLogging

    confirmResumeLog: function(onConfirm = undefined, onCancel = undefined) {
      this.confirmDialog(this, "<span>Resume previous log?</span>",
        // confirmed
        () => {
          this.actionLogger.resumeLog();
          if (onConfirm) onConfirm();
        },
        // cancelled
        () => {
          // this.confirmCreateNewLog();
          if (onCancel) onCancel();
        }
      );
    },

    confirmCreateNewLog: function(onConfirm = undefined, onCancel = undefined) {
      this.confirmDialog(this, "<span>Create new log?</span>",
        // confirmed
        () => {
          this.actionLogger.createNewLog();
          if (onConfirm) onConfirm();
        },
        // cancelled
        () => {
          if (onCancel) onCancel();
        }
      );
    },

    confirmSaveLog: function(onConfirm = undefined, onCancel = undefined) {
      this.confirmDialog(this, "<span>Save log?</span>",
        // confirmed
        () => {
          if (onConfirm) onConfirm();
        },
        // cancelled
        () => {
          if (onCancel) onCancel();
        }
      );
    },

    confirmDeleteLog: function(onConfirm = undefined, onCancel = undefined) {
      this.confirmDialog(this, "<span>Delete current log?</span>",
        // confirmed
        () => {
          this.actionLogger.deleteLog();
          if (onConfirm) onConfirm();
        },
        // cancelled
        () => {
          if (onCancel) onCancel();
        }
      );
    },

    saveLog: function() {
      if (!this.actionLogger.isTaskRunning()) {
        this.$toastr.e(`No log task running!`, "Log");
        return;
      }

      if (!this.actionLogger.isActive()) this.actionLogger.resumeLog(false);
      this.actionLogger.submit();
      this.updateButtons();
    },

    deleteLog: function() {
      if (!this.actionLogger.isTaskRunning()) {
        this.$toastr.e(`No log task running!`, "Log");
        return;
      }

      let onDeleteConfirmed = () => {
        this.isEnabled = false;
        if (this.actionLogger.isActive()) this.actionLogger.stopLogging();
        this.updateButtons();
      }
      this.confirmDeleteLog(
        onDeleteConfirmed
      )
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

    // logs results, component usage:
    //TODO
    // logEvent: function(category, type, value = undefined) {
    //   let event = new Event(category, type, value);
    //   this.actionLogger.log(this.logTypes.submitType.INTERACT, event);
    // },

  }, // methods
  mounted: function () {
    if (!this.actionLogger.isActive()) {
      this.actionLogger.resumeLog(false);
      this.actionLogger.displayCurrentTime();
    }
  }
}
</script>
