<template>
  <div id="logOverlay">
    <button v-on:click="toggleLogging" class="toggleLogButton" v-bind:class="{ enabledLog: isEnabled }" type="button" name="button"><i class="fas fa-power-off"></i></button>
    <div class="timedisplay">00:00:00</div>

    <button class="logButton" type="button" name="button"><i class="far fa-save"></i></button>
    <button class="logButton" type="button" name="button"><i class="far fa-trash-alt"></i></button>


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
          this.confirmResumeLog(
            null,
            this.confirmCreateNewLog
          );
        } else {
          this.isEnabled = true;
          this.actionLogger.createNewLog();
        }
      // TURN off logging
      } else {
        this.confirmSaveLog(
          this.confirmDeleteLog,
          this.confirmDeleteLog
        );
      }
    }, // toggleLogging

    confirmResumeLog: function(onConfirm = undefined, onCancel = undefined) {
      this.confirmDialog(this, "<span>Resume previous log?</span>",
        // confirmed
        () => {
          this.isEnabled = true;
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
          this.isEnabled = true;
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
          this.isEnabled = false;
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
          this.isEnabled = false;
          this.actionLogger.deleteLog();
          if (onConfirm) onConfirm();
        },
        // cancelled
        () => {
          if (onCancel) onCancel();
        }
      );
    }

  } // methods
}
</script>
