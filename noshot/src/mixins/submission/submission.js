var submission = {
  created: function() {
    // window.log(this.getSubmissionURL());
  },
  methods: {
    getSubmissionURL: function() {

      let url = window.appCfg.vbsServer.url + ":" + window.appCfg.vbsServer.port;
      url += window.appCfg.vbsServer.submitRoute;
      url += "?team=" + window.appCfg.vbsServer.teamId;
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
    submitConfirm: function(video, confirm=this.appCfg.preferences.isEnabled("confirmSubmit", true)) {

      let addTag = "";

      if (video.frame.url) {
        addTag = `<img style='width:100%;' src='${video.frame.url}' />`;
      }
      else if (video.frame.canvas) {
        // needs to be executed after dialog is open (HACK: use setTimeout)
        setTimeout(() => {
          if (video.frame.canvas) {
            video.frame.canvas.classList.add("confirm_image");
            let conf_image = document.querySelector('.confirm_image');
            conf_image.parentNode.replaceChild(video.frame.canvas, conf_image);
            // .appendChild(video.frame.canvas);
          }
        }, 0);
      }

      // Trigger a confirmation dialog
      if (confirm) {
        this.$dialog
          .confirm(`<div class="confirm_submission">
                      <div>Confirm submission of</div>
                      <div class='confirm_image'> ${addTag}</div>
                      <div><b>v</b> ${video.id} <b>f</b> ${video.frame.number}</div>
                    </div>`,
            {
            html: true,
            // close on clicking outside
            backdropClose: true
          }).then(() => {
            // window.log('Clicked on proceed');
            this.submit(video.id, video.frame.number);
          })
          .catch(() => {
            window.log('submission cancelled');
          });
      }
      else this.submit(video.id, video.frame.number);

    },
    submit: function(video, frame, showToast = true) {
      let url = this.getSubmissionURL();

      url += "&video=" + video;
      url += "&frame=" + frame;

      window.log(`Submission: ${url}`);
      if (showToast) this.$toastr.i(`v ${video} f ${frame}`, "Submission");
      // issue submit
      fetch(url, {
          method: "POST",
          mode: "cors"
      })
      .then(
        response => {
          // response returns text
          response.text().then(
            res => {
              window.log(res);
              // parse result for correctness (only show info for AVS)
              let isCorrect = res.toLowerCase().includes("correct");
              let isWrong = res.toLowerCase().includes("wrong");
              if (isCorrect && showToast) this.$toastr.s(`${res}`, "Submission successful");
              else if (isWrong) this.$toastr.e(`${res}`, "Submission wrong");
              else this.$toastr.i(`${res}`, "Server response");
            });
        },
        rejected => {
          // let responseText = rejected.body;
          // window.log(responseText);
          window.log(rejected);
          this.$toastr.e(`Server not reachable...`, "Submission failed");
      })
      .catch(err => console.log(err));

    }
  }
};
export default submission;
