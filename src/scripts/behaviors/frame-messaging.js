/**
 * The MIT License (MIT)
 * Copyright (c) 2015 Fabrica de Aplicativos S/A
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 */
/**
 * Enables messaging between frames
 */

var CONSTANTS = require('../constants');

var IFRAME_OPERATION_PREFIX = 'canvas_iframe_operation_';
/**
 * Method called whenever the component is ready
 */
exports.ready = function () {
    // Listen to `message` events on the window object.
    // The window is the object that contains the whole application,
    // in the case of the edited application (inside which is the inspector component)
    // it is the `iframe`. 
    // 
    // Only the window receives messages.
    window.addEventListener('message', this.handleFrameRequestMessage.bind(this), false);
};

/**
 * Handles messages from the parent frame.
 * @param  {Event} event the event object
 */
exports.handleFrameRequestMessage = function (event) {
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

        // If the result is a promise, wait for the promise to be 
        // done before returning results
        Q.when(res)
            .then(function (finalRes) {

                // Send message to parent frame passing the request.id
                // so that the parent may resolve to the correct inquiry.
                parent.postMessage(JSON.stringify({
                    id: request.id,

                    // If there is a method to convert the object into 
                    // plain JSON object, do so.
                    res: (finalRes !== undefined && finalRes.toPlainObject) ? finalRes.toPlainObject() : finalRes
                }), '*');

            }.bind(this))
            // terminate promise chain
            .done();

    } else {
        throw new Error('Operation `' + request.operation + '` is not available at inspector');
    }
};


/**
 * Executes and operation in the iframe parent.
 *
 * @param  {String} operation The name of the operation to be executed.
 * @param  {Array|*} args     Array of arguments or single argument.
 */
exports.executeParentOperation = function (operation, args) {


    var opid = _.uniqueId(IFRAME_OPERATION_PREFIX);

    var message = JSON.stringify({
        id: opid,
        operation: operation,
        args: args
    });

    if (typeof parent !== 'undefined') {
      parent.postMessage(message,'*');
    }

    //TODO:Implementar retorno da mensagem do parent

};

