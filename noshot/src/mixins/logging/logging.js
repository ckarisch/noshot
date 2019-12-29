// global logging mixin
var logging = {
  created: function() {
  },
  methods: {
    getActionLogger: function() {
      return window.logging.actionLogger;
    }
  }
}
export default logging;
