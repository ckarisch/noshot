var submission = {
  created: function() {
    // window.log(this.getSubmissionURL());
  },
  methods: {
    getSubmissionURL: function() {

      let url = window.appCfg.vbsServer.url + ":" + window.appCfg.vbsServer.port;
      url += "/vbs/submit?";
      url += "team=" + window.appCfg.vbsServer.teamId;
      url += "&member=" + window.appCfg.vbsServer.memberId;

      if (!url.startsWith("http://")) {
        url = "http://" + url;
      }
      return url;

    },
    submit: function(video, frame) {
      let url = this.getSubmissionURL();

      url += "&video=" + video;
      url += "&frame=" + frame;

      window.log(`Submission: ${url}`);
      fetch(url, {
          method: "POST"
        })
        .then(
          response => window.log(response),
          rejected => window.log(rejected)
        );

    }
  }
};
export default submission;
