var logTypes = logTypes || {};

/**
 * VBS 2020
 *
 * Action Logging:
 * The first successful interaction logging attempt at VBS
 * 2018 demonstrated that it is viable to instantly collect infor-
 * mation on what actions were being used to solve a task and
 * also how users interact with their systems. For VBS 2019,
 * the employed log format was revisited to be more versatile
 * (i.e., to support all expected actions in all participating tools),
 * but still ensuring that teams use a general unified set of
 * action categories. For the current iteration at VBS 2020, we
 * tried to re-iterate on those efforts and further simplified the
 * format based on the lessons learned. Furthermore, we added
 * a method to log ranked lists of results in addition to the
 * (inter-)actions submitted by the teams.
 *
 */

logTypes.submitType = {
    INTERACT: "interaction",
    RESULT: "result"
}
Object.freeze(logTypes.submitType);

logTypes.eventType = {
  // TODO
};

logTypes.category = {
    TEXT: {
        key: "text", // used whenever user enters a text, while various data sources can be selected from listed types
        types: {
            META: "metadata", // using texts provided with videos (filename, descriptions, etc.)
            OCR: "OCR", // optical character recognition
            ASR: "ASR", // automatic speech recognition
            CONCEPT: "concept", // automatically retrieved labels (e.g. DCNN)
            LOCALIZED_OBJ: "localizedObject", // labels obtained from an object detection system (e.g., YOLO)
                                              // providing also region proposals, input text is usually
                                              // entered and positioned as a box in a sketch based interface
            CAPTION: "caption", // description of image/shot using whole sentences
            JOINT_EMBED: "jointEmbedding", // text query is mapped to an image representation space
            CUSTOM: "custom" // tool specific (e.g. searching in set of image maps)
        }
    },
    IMAGE: {
        key: "image", // used when user provides or selects an image
        types: {
            GLOBAL_FEAT: "globalFeatures", // whole image search, e.g. DCNN features
            LOCAL_FEAT: "localFeatures", // only part of image is considered
            FEEDBACK_MODEL: "feedbackModel" // parameters of employed similarity model are updated with selected image example
        }
    },
    SKETCH: {
        key: "sketch",
        types: {
            COLOR: "color", // user draws color sketch
            EDGE: "edge", // user draws edge-based sketch
            MOTION: "motion", // user defines motion sketch
            SEM_SEG: "semanticSegmentation" // user specifies free-form regions of 'objects'
        }
    },
    FILTER: {
        key: "filter",
        types: {
            B_W: "bw", // black and white filter
            DOM_COL: "dominantColor", // user selects a dominant color
            RESOLUTION: "resolution", // user searches for specific video resolution
            NUM_OBJECTS: "numberOfObjects" // user searches for # of objects
        }
    },
    BROWSE: {
        // B = browsing using a tool specific browsing system, e.g., zoom in/out in a hierarchical imagemap
        key: "browsing",
        types: {
            RANKED_LIST: "rankedList", // browsing ranked and sorted results
            VID_SUMMARY: "videoSummary", // user displays representative frames from a selected video (value contains video id)
            TEMP_CONTEXT: "temporalContext", // user inspects temporal context of a selected frame in a visualization component (not video player)
            VID_PLAYER: "videoPlayer", // user navigates an integrated video player
            EXPLORE: "exploration", // user employs a precomputed exploration or visualization structure (e.g. image map, value contains actions like zoom in , pan etc.)
            RANDOM_SELECTION: "randomSelection", // a result set obtained purely by a random sampling
            TOOL_LAYOUT: "toolLayout", // user changes a GUI panel
            EXP_SORT: "explicitSort", // user sorts current result by selecting button/checkbox (query is not changed)
            RESET_ALL: "resetAll" // sets the tool to the initial setting
        }
    },
    COOP: {
        key: "cooperation",
        types: {
            REC_SUBMISSION: "receiveSubmission", // receive a submission from a team member
            REC_ACTION: "receiveAction" // receive action from a team member
        }
    }
};
Object.freeze(logTypes.category);

export default logTypes;
