/**
 * [Preferences description]
 * Handles storing user preferences in localStorage.
 *
 * Usage:
 * save     Preferences.save(prefKey, newValue);
 * load     let val = Preferences.load(prefKey[, defaultValueIfNotPresent]);
 * boolean  let bool = Preferences.isEnabled(prefKey, defaultValue);
 *
 * prefKeys are defined here in prefKeys attribute (see below class defintion)
 *
 * IMPORTANT: Since this files is loaded before everything else, global does NOT yet exist.
 */

class Preferences {
    static save(key, value) {
        localStorage[Preferences.suffix + key] = JSON.stringify(value);
    }

    static load(key, defaultValue = false) {
        var value = localStorage[Preferences.suffix + key];
        if (value === undefined) {
            return defaultValue;
        } else {
            try {
                return JSON.parse(value);
            } catch (e) {
                return defaultValue;
            }
        }
    }

    static isEnabled(key, defaultValue) {
        var value = localStorage[Preferences.suffix + key];
        if (value === "true") {
            return true;
        } else if (value === "false") {
            return false;
        } else return defaultValue;
    }

    static exists(key, nonEmpty) {
        return localStorage[Preferences.suffix + key] !== undefined
                && (!nonEmpty ||
                        (localStorage[Preferences.suffix + key] !== null
                                && localStorage[Preferences.suffix + key].length > 0));
    }

}

// all noshot prefKeys defined in one place
Preferences.prefKeys = {
  TEAM: {
    TEAM_ID: "teamId",
    MEMBER_ID: "memberId",
    LOCK_INPUT: "lockTeamInput",
  },
  VIDEO: {
    AUTOPLAY: "videoAutoplay"
  },
  IMAGE: {
    SIZE: "imageSize"
  },
  SUBMIT: {
    CONFIRM: "confirmSubmit"
  },
  LOG: {
    LOG_CACHE: "logObject"
  }
};
// Preferences.prefKeys = [
//   // team
//   "teamId", "memberId", "lockTeamInput",
//   // video
//   "videoAutoplay",
//   // image
//   "imageSize",
//   // submit
//   "confirmSubmit",
//   // logging
//   "logObject"
// ];


// support different preferences for different ecat installations
Preferences.suffix = "noshot#" + location.host + location.pathname.replace("/", "") + "#";

export default Preferences;
