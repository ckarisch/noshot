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
    submitList: function(frameList) {
      for (let f in frameList) {        
        this.submit(f);
      }
    },
    submit: function(video, frame) {
      let url = this.getSubmissionURL();

      url += "&video=" + video;
      url += "&frame=" + frame;

      window.log(`Submission: ${url}`);
      this.$toastr.i(`v ${video} f ${frame}`, "Submission");
      fetch(url, {
          method: "POST",
          mode: "cors"
        })
        .then(
          response => {
            window.log(response);
            this.$toastr.s(`${response}`, "Submission succeeded");
          },
          rejected => {
            window.log(rejected);
            this.$toastr.e(`${rejected}`, "Submission failed");
          }
        );

    }
  }
};
export default submission;
