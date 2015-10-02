/**
 * List of operations that can be called via window.postMessage
 * from the outer world.
 * @type {Object}
 */
exports.operationWhitelist = {
    // general
    createHighlighter: true,

    // highlighting
    highlightElementAtPoint: true,
    highlightElementForSelector: true,
    unHighlight: true,
    hideHighlighter: true,
    showHighlighter: true,
    getHighlighterTargetData: true,

    // manipulation
    replaceInnerHTML: true,

    // analysis
    getElementData: true,

    // 
    getActiveElementData: true,
    scrollBy: true,
    areFocusAndHoverTogether: true,
    activateLoading: true,
    deactivateLoading: true,
    executeHighlighterOperation: true
};

/**
 * Name of the property at which highlighers will be stored.
 * @type {String}
 */
exports.highlightersNs = '_highlighters';
