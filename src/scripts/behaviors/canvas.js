'use strict';
/**
 * Implements behaviors only valid for canvas usage.
 */

console.log('canvas started');

// MAYBE DEPRECATE: 

exports.activateLoading = function () {
    this.$.loading.highlight(hlt.target);
};

exports.deactivateLoading = function () {
    this.$.loading.hide();
};
