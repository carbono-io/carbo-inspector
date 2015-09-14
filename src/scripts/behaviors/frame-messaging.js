/**
 * Enables messaging between frames
 */

var CONSTANTS = require('../constants');

var FrameMessagingBehavior = {
    /**
     * Method called whenever the component is ready
     */
    ready: function () {
        // Listen to `message` events on the window object.
        // The window is the object that contains the whole application,
        // in the case of the edited application (inside which is the inspector component)
        // it is the `iframe`. 
        // 
        // Only the window receives messages.
        window.addEventListener('message', this.handleFrameRequestMessage.bind(this), false);
    },
    
    /**
     * Handles messages from the parent frame.
     * @param  {Event} event the event object
     */
    handleFrameRequestMessage: function (event) {

        // método JSON.parse() converte string para JSON
        var request = JSON.parse(event.data);

        // Check if the operationName is whitelisted
        // Not all methods on the inspector object should be
        // available for outside use for security reasons.
        // Thus we should whitelist the available methods
        var operationWhitelisted = CONSTANTS.operationWhitelist[request.operation]; 

        if (operationWhitelisted) {
            // Execute the operation and store the result
            var res = this[request.operation].apply(this, request.args);

            // Send message to parent frame passing the request.id
            // so that the parent may resolve to the correct inquiry.
            parent.postMessage(JSON.stringify({
                id: request.id,

                // If there is a method to convert the object into 
                // plain JSON object, do so.
                res: (res !== undefined && res.toPlainObject) ? res.toPlainObject() : res
            }), '*');

        } else {
            throw new Error('Operation %s is not available at inspector', request.operation);
        }
    },
};

module.exports = FrameMessagingBehavior;