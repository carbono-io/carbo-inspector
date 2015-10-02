'use strict';

/**
 * Implements behaviors only valid for canvas usage.
 */

/**
 * Activates the loading highlighter
 */
exports.activateLoading = function () {
    this.$.loading.highlight(hlt.target);
};

/**
 * Deactivates the loading highlighter
 */
exports.deactivateLoading = function () {
    this.$.loading.hide();
};
