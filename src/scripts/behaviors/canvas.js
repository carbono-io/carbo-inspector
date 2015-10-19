'use strict';

/**
 * Implements behaviors only valid for canvas usage.
 */

/**
 * Activates the loading highlighter
 */
exports.activateLoading = function (targetSelector) {
    var element = document.querySelector(targetSelector);
    this.$.loading.highlight(element);
};

/**
 * Deactivates the loading highlighter
 */
exports.deactivateLoading = function () {
    this.$.loading.hide();
};




exports.changeRoute = function(page){
  window.router.setRoute( (page) ? "/"+page : undefined);
};


exports.reloadFrame = function(){
    location.reload();
};