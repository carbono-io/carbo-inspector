function buildRemoteMethod(methodName) {
    return function () {

        alert(methodName);
        // return executeRemoteOperation()
    }
}

function parseResponse(responseObject) {

    // if there are remote methods defined,
    // transform them into proxy methods
    // for remote messaging
    if (responseObject && responseObject._remoteMethods) {
        responseObject._remoteMethods.forEach(function (methodName) {

            responseObject[methodName] = buildRemoteMethod(methodName);
        });
    }

    return responseObject;
}

var _inspectorOperationDefers = {};

function executeRemoteOperation(remote, operation, args) {
    // Create and id for the operation
    var opid = _.uniqueId('test_');

    var message = JSON.stringify({
        id: opid,
        operation: operation,
        args: Array.isArray(args) ? args : [args]
    });            
    
    // Send the message to the iframe -
    remote.contentWindow.postMessage(message, '*');

    // Create a deferred object to be returned and store it
    // using the id
    var deferred = Q.defer();
    _inspectorOperationDefers[opid] = deferred;

    // Create an listener for the response event
    var responseListener = function (event) {
        var response = JSON.parse(event.data);

        // Only resolve deferred if the response id matches
        if (response.id === opid) {

            // Parse response object
            var responseObj = parseResponse(response.res);

            // Resolve the deferred object
            _inspectorOperationDefers[opid].resolve(responseObj);

            // Remove it from the hash
            delete _inspectorOperationDefers[opid];

            // Remove the listener after the response has arrived
            window.removeEventListener('message', responseListener);
        }

    }.bind(this);

    window.addEventListener('message', responseListener);

    // Return the promise of the deferred object
    return deferred.promise;
}