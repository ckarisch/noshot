import Frame from '../entities/Frame.js'
import Video from '../entities/Video.js'

// general utils
const utilFuncs = {
    // right padding s with c to a total of n chars
    padding_right: function(s, c, n) {
      if (!s || !c || s.length >= n) {
        return s;
      }
      let max = (n - s.length) / c.length;
      for (let i = 0; i < max; i++) {
        s += c;
      }
      return s;
    },
    // more convenient logging function
    // will print out caller name iff it is defined (not for anonymous)
    debugLog: function(msg) {
      // get caller
      let callerString = "";
      let stackv = (new Error()).stack.split("\n");
      let caller = stackv[2];
      let file = caller.substring(caller.lastIndexOf("/") + 1, caller.length - 1);
      if (caller != null) callerString += file + ": ";
      callerString = utilFuncs.padding_right(callerString, " ", 30);
      if (typeof msg === 'object') {
        // eslint-disable-next-line no-console
        console.log(callerString);
        // eslint-disable-next-line no-console
        console.log(msg);
      }
      else {
        // eslint-disable-next-line no-console
        console.log(callerString + msg);
      }
    },
    updateJSONRecursive: function(jsonPart, updatePart) {
      if (Object.keys(jsonPart).length === 0) return;
      if (Object.keys(updatePart).length === 0) return;
      for (let key in updatePart) {
        if (typeof updatePart[key] === 'object' &&
          Object.keys(updatePart[key]).length > 0 &&
          Object.keys(jsonPart[key].length > 0)) {
          utilFuncs.updateJSONRecursive(jsonPart[key], updatePart[key]);
        } else if (jsonPart[key] !== updatePart[key]) {
          window.log(`[config override] ${key}: ${jsonPart[key]} => ${updatePart[key]}`);
          jsonPart[key] = updatePart[key];
        }
      }
    },
    thumbUrlFromVideoPosition: function(videoNr, second) {
      return `${window.appCfg.dataServer.keyframesLocation}/${videoNr}/${videoNr}_${second}_key.jpg`;
    },
    videoFromThumbUrl: function(url, dataLocation = window.appCfg.dataServer.keyframesLocation) {

      // frame
      let parts = url.split(dataLocation);
      if (parts.length < 1) return {};
      let videoID = parts[1].split("/")[1];
      let fps = utilFuncs.getVideoFPS(videoID);
      let second = parts[1].split("/")[2].split("_")[1];
      let frame = new Frame(second, fps, url);

      // video
      // place randomly
      let curvidWidth = parseInt(window.appCfg.preferences.load(window.appCfg.preferences.prefKeys.VIDEO.WIDTH, 300));
      let maxLeft = window.innerWidth - curvidWidth;
        // video.width+"px".replace("px",''));
      let maxTop = window.innerHeight - parseInt(curvidWidth/16*9+20+"px".replace("px",''));
      let rndLeft = Math.floor(Math.random() * (maxLeft+1));  // 0 - maxLeft
      let rndTop = Math.floor(Math.random() * (maxTop+1));    // 0 - maxTop

      let video = new Video(videoID, frame, {x: rndLeft, y: rndTop});
      return video;
    },
    // fake db result
    videoToDBResult: function(video) {
      return {
        id:video.getUniqueID().slice(1),
        video: video.id,
        second: video.frame.second,
        startSecond: video.frame.second,
        endSecond: video.frame.second,
        count: "N/A",
        parent: "N/A",
        probability: "N/A"
      };
    },
    getVideoFPS: function(video) {
      if (!video.endsWith(".mp4")) video += '.mp4';
      return parseFloat(window.appCfg.fps[video]);
    },
    frameToSecond: function(frame, fps) {
      return parseFloat(frame) / fps;
    },
    secondToFrame: function(second, fps) {
      return Math.floor(parseFloat(second) * fps);
    },
    /**
     * Takes a screenshot from video.
     * @param videoEl {Element} Video element
     * @param scale {Number} Screenshot scale (default = 1)
     * @returns {Element} Screenshot image element
     */
    getScreenshot: function(videoEl, scale) {
        scale = scale || 1;

        let canvas = document.createElement("canvas");
        // canvas.useCORS = true;
        canvas.allowTaint = false;
        // canvas.crossOrigin = "anonymous";

        canvas.width = videoEl.clientWidth * scale;
        canvas.height = videoEl.clientHeight * scale;
        canvas.getContext('2d').drawImage(videoEl, 0, 0, canvas.width, canvas.height);

        // unfotunately does not work due to CORS policy...
        return canvas.toDataURL();
    },
    copyCanvas: function(videoEl, scale) {
      scale = scale || 1;

      let canvas = document.createElement("canvas");
      // canvas.useCORS = true;
      canvas.allowTaint = false;
      // canvas.crossOrigin = "anonymous";

      canvas.width = videoEl.clientWidth * scale;
      canvas.height = videoEl.clientHeight * scale;
      canvas.getContext('2d').drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      return canvas;
    },
    ts2Unix: function(timestamp) {
      return Math.floor(timestamp / 1000);
      // return parseInt((timestamp / 1000).toFixed(0));
    }
};

export default utilFuncs;
