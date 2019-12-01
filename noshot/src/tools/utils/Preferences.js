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

// all diveXplore prefKeys defined in one place
Preferences.prefKeys = {
    TEAM: {
        TEAM_ID: "teamId",
        MEMBER_ID: "memberId",
        LOCK_INPUT: "lockTeamInput",
    },
    SHOT_LIST: {
        ZOOM: "shotListZoom",
        GROUP_VIDEO: "shotListGroupVideo",
        SHOW_TIMELINE: "shotListShowTimeline"
    },
    VIDEO: {
        AUTOPLAY: "videoAutoplay",
        HIGHLIGHT_RELEVANT_DIVE: "highlightRelevant",
        JUMP_ON_SHOT_CHANGE: "jumpOnShotChange"
    },
    LOG: {
        LOG_CACHE: "logObject"
    },
    NAV: {
        BOOKMARKS: "showBookmarks",
        SHOTINFO: "showShotInfo",
        FILMSTRIP: "showFilmStrip",
        QUICK_SUBMIT: "shotListQuickSubmit",
        F_SUBMIT: "fButtonSubmit"
    },
    MAP_SEARCH: {
        AUTOCLOSE_ON_SELECT: "autoCloseOnSelect"
    },
    CONCEPT_SEARCH: {
        SELECT_IDX: "selectedConceptQueryIdx",
    }
};

// support different preferences for different ecat installations
Preferences.suffix = "diveXplore#" + location.host + location.pathname.replace("/featuremap.php", "") + "#";
