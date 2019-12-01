var global = global || {};
global.log = {};

global.log.submitType = {
    REGULAR: "submit",
    FLUSH: "flush"
}
Object.freeze(global.log.submitType);

global.log.category = {
    TEXT: {
        key: "text",
        values: {
            META: "metadata", // using texts provided with videos (filename, descriptions, etc.)
            OCR: "OCR", // optical character recognition
            ASR: "ASR", // automatic speech recognition
            CONCEPT: "concept", // automatically retrieved labels (e.g. DCNN)
            LOCALIZED_OBJ: "localizedObject", // object detection system labels
            CAPTION: "cooperation", // description of image/shot using whole sentences
            CUSTOM: "custom" // tool specific (e.g. searching in set of image maps)
        }
    },
    IMAGE: {
        key: "image",
        values: {
            GLOBAL_FEAT: "globalFeatures", // whole image search, e.g. DCNN features
            LOCAL_FEAT: "localFeatures", // only part of image is considered
            FEEDBACK_MODEL: "feedbackModel" // parameters of employed similarity model are updated with selected image example
        }
    },
    SKETCH: {
        key: "sketch",
        values: {
            COLOR: "color", // user draws color sketch
            EDGE: "edge", // user draws edge-based sketch
            MOTION: "motion", // user defines motion sketch
            SEM_SEG: "semanticSegmentation" // user specifies free-form regions of 'objects'
        }
    },
    FILTER: {
        key: "filter",
        values: {
            B_W: "bw", // black and white filter
            DOM_COL: "dominantColor", // user selects a dominant color
            RESOLUTION: "resolution", // user searches for specific video resolution
            //TODO: ask for permission
            // SHOTS: "videoShots" // user browses all shots of single video
            MAP: "featuremap" // user browses all shots of single video
        }
    },
    BROWSE: {
        // B = browsing using a tool specific browsing system, e.g., zoom in/out in a hierarchical imagemap
        key: "browsing",
        values: {
            RANKED_LIST: "rankedList", // browsing ranked and sorted results
            VID_SUMMARY: "videoSummary", // user displays representative frames from a selected video (value contains video id)
            TEMP_CONTEXT: "temporalContext", // user inspects temporal context of a selected frame in a visualization component (not video player)
            VID_PLAYER: "videoPlayer", // user navigates an integrated video player
            EXPLORE: "exploration", // user employs a precomputed exploration or visualization structure (e.g. image map, value contains actions like zoom in , pan etc.)
            TOOL_LAYOUT: "toolLayout", // user changes a GUI panel
            EXP_SORT: "explicitSort", // user sorts current result by selecting button/checkbox (query is not changed)
            RESET_ALL: "resetAll" // sets the tool to the initial setting
        }
    },
    COOP: {
        key: "cooperation",
        values: {
            REC_SUBMISSION: "receiveSubmission", // receive a submission from a team member
            REC_ACTION: "receiveAction" // receive action from a team member
        }
    }
};
Object.freeze(global.log.category);
