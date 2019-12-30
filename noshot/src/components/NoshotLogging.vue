<template>
  <div id="logOverlay">
    <button v-on:click="toggleLogging" class="toggleLogButton" v-bind:class="{ enabledLog: isEnabled }" type="button" name="button"><i class="fas fa-power-off"></i></button>
    <div class="timedisplay">00:00:00</div>

    <button v-on:click="saveLog" class="logButton" type="button" name="button"><i class="far fa-save"></i></button>
    <button v-on:click="deleteLog" class="logButton" type="button" name="button"><i class="far fa-trash-alt"></i></button>


  </div>
</template>

<script>
export default {
  name: 'NoshotLogging',
  created() {
  },
  data: () => {
      return {
        isEnabled: false,
        actionLogger: window.logging.actionLogger
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
      this.confirmDialog(this, "<span>Delete log?</span>",
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
      this.actionLogger.save();
    },

    deleteLog: function() {
      if (!this.actionLogger.isTaskRunning()) {
        this.$toastr.e(`No log task running!`, "Log");
        return;
      }
      
      let onDeleteConfirmed = () => {
        this.isEnabled = false;
        if (this.actionLogger.isActive()) this.actionLogger.stopLogging();
      }
      this.confirmDeleteLog(
        onDeleteConfirmed
      )
    }

  }, // methods
  mounted: function () {
    if (!this.actionLogger.isActive()) {
      this.actionLogger.resumeLog(false);
      this.actionLogger.displayCurrentTime();
    }
  }
}
</script>
