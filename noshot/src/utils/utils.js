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
    videoInfoFromUrl: function(url, dataLocation = window.appCfg.dataServer.keyframesLocation) {
      let parts = url.split(dataLocation);
      if (parts.length < 1) return {};
      let video = parts[1].split("/")[1];
      let frame = parts[1].split("/")[2].split("_")[1];
      return {video: video, frame: frame};
    }
};

export default utilFuncs;
