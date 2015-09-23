/**
 * @class CSSInspector
 *
 * Defines a class for inspecting css rules and stylesheets
 * and their effects on target elements.
 *
 * For the time being, does not perform any intelligence,
 * it delegates to CSSUtilities (by brothercake).
 * 
 * For docs on CSSUtilities:
 * // http://www.brothercake.com/site/resources/scripts/cssutilities/functions
 */

var css = require('css');
var DOMHelpers = require('../aux/dom');

/**
 * Class that proxies methods to CSSUtilities
 * @param {Node} element The element the inspector should work upon
 */
function CSSInspector(defaultOptions, element) {

    // Save the default options
    this.defaultOptions = defaultOptions;

    this.setTarget(element);
}

/**
 * Sets the target element
 * @param {[type]} element [description]
 */
CSSInspector.prototype.setTarget = function (element) {
    this.target = element;
};

/**
 * Default options for `getCSSRules`
 * @type {Object}
 */
var GET_CSS_RULES_DEFAULTS = {
    media: 'screen',
    properties: ['properties', 'selector', 'css'],
    altstates: true,
};

/**
 * Retrieves the rules that apply to the element
 * @param  {[type]} options [description]
 * @return {Promise -> Array}         [description]
 */
CSSInspector.prototype.getCSSRules = function (options) {
    if (!this.target) {
        throw new Error('No target for `getCSSRules`');
    }
    
    // Default setting
    options = _.assign({}, GET_CSS_RULES_DEFAULTS, options);
    // create a defer object
    var defer = Q.defer();
    
    // properties option must be String
    var properties = _.isArray(options.properties) ? 
        options.properties.join(',') : 
        options.properties;

    try {
        // CSSUtilities.getCSSRules(element [, media] [, properties] [, altstates] [, oncomplete])
        CSSUtilities.getCSSRules(
            this.target, 
            options.media, 
            properties,
            options.altstates,
            function (rules) {
                defer.resolve(rules.map(function (r) {
                    return {
                        selector: r.selector,
                        css: r.css,
                        properties: r.properties,
                    };
                }));
            }
        );
    } catch (e) {
        defer.reject(e);
    }

    // return the promise
    return defer.promise;
};

/**
 * Default options for `getCSSProperties`
 * @type {Object}
 */
var GET_CSS_PROPERTIES_DEFAULTS = {
    media: 'screen',
};

/**
 * Retrieves css properties related to the target element
 * @param  {Object} options [description]
 * @return {Promise -> Array}
 */
CSSInspector.prototype.getCSSProperties = function (options) {
    if (!this.target) {
        throw new Error('No target for `getCSSProperties`');
    }

    // Default setting
    options = _.assign({}, GET_CSS_PROPERTIES_DEFAULTS, options);
    // create a defer object
    var defer = Q.defer();

    try {
        // CSSUtilities.getCSSProperties(element [, media] [, oncomplete])
        CSSUtilities.getCSSProperties(
            this.target, 
            options.media, 
            defer.resolve
        );
    } catch (e) {
        defer.reject(e);
    }

    // return the promise
    return defer.promise;
};

/**
 * Default options for getCSSSelectors
 * @type {Object}
 */
var GET_CSS_SELECTORS_DEFAULTS = {
    media: 'screen',
    directonly: true,
};

/**
 * Retrieves css selectors that apply to the target element.
 * @param  {Object} options 
 * @return {Promise -> Array}
 *     Taken from CSSUtilities docs
 *     "The method returns an array of zero or more selectors,
 *     each of which is a String CSS selector,
 *     trimmed of leading or trailing whitespace."
 */
// CSSInspector.prototype.getCSSSelectors = function (options) {
//     if (!this.target) {
//         throw new Error('[CSSInspector] No target for `getCSSSelectors`');
//     }

//     // Default setting
//     options = _.assign({}, GET_CSS_SELECTORS_DEFAULTS, options);

//     var defer = Q.defer();
//     // CSSUtilities.getCSSSelectors(element [, media] [, directonly] [, oncomplete])
    
//     // TODO: study error handling with CSSUtilities
//     // Its asynchronous api should not be dealt with try-catch
//     // but instead some way of error handling on the callback.
//     // But the correct error handling mode was not found until now 
//     // (just starting experiment)
//     try {
//         CSSUtilities.getCSSSelectors(
//             this.target, 
//             options.media, 
//             options.directonly,
//             function (selectors) {
//                 defer.resolve(selectors);
//             }
//         );
//     } catch (e) {
//         defer.reject(e);
//     }

//     return defer.promise;
// };

function getAllStyleRules() {
        
}

CSSInspector.prototype.getCSSSelectors = function (options) {

    var targetRules = [];
    
    var stylesheetRules = Array.prototype.slice.call(document.styleSheets[0], 0);

    stylesheetRules.forEach(function (rule) {
        // Check if rule applies to the target
        var selector = rule.selector;

    }.bind(this));
};


/**
 * Retrieves selector specificity for a given element
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
CSSInspector.prototype.getCSSSelectorSpecificity = function (options) {
    if (!this.target) {
        throw new Error('[CSSInspector] No target for `getCSSSelectorSpecificity`');
    }
    // CSSUtilities.getCSSSelectorSpecificity(selector [, element] [, oncomplete])
};

/**
 * Static methods
 */

CSSInspector.getCSSSelectorSpecificity = function (options) {
    // CSSUtilities.getCSSSelectorSpecificity(selector [, element] [, oncomplete])
};
CSSInspector.getCSSStyleSheetRules = function (options) {
    // CSSUtilities.getCSSStyleSheetRules([media] [, accept] [, ssid] [, oncomplete])
};
CSSInspector.getCSSStyleSheets = function () {
    // CSSUtilities.getCSSStyleSheets([oncomplete])
};

/**
 * Initializes CSSUtilities
 * @return {[type]} [description]
 */
function initializeCSSUtilities() {
    // CSSUtilities is available as a global
    // as it was imported via `script` tag
    
    // set config and initialize
    // Use author mode because we need to access the actual 
    // stylesheets.
    // 
    // This incurs in one extra ajax get request 
    // for each stylesheet in the inspected application.
    // 
    // Also, some methods will run in asynchronous mode, 
    // with callbacks.
    // 
    // docs:
    // http://www.brothercake.com/site/resources/scripts/cssutilities/config/#config-mode
    CSSUtilities.define('mode', 'browser');
    CSSUtilities.define('async', true);
    // Do not take into account inline styles
    CSSUtilities.define('attributes', false);
    CSSUtilities.init();
}

// invoke CSSUtilities initialization immediately
initializeCSSUtilities();

// export
module.exports = CSSInspector;