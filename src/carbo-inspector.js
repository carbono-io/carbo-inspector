/**
 * This component is responsible for highlighting the
 * components inside the application and communicating with the external 
 * world by means of the `window.postMessage` and 
 * `window.addEventListener('message')` methods.
 *
 * It has and implementation of a request-response model through that channel, 
 * for more information, see handleFrameRequestMessage
 * 
 * @author Simon Fan, Pat Jenny, Lu Heuko
 */

(function () {

    /**
     * List of operations that can be called via window.postMessage
     * from the outer world.
     * @type {Array}
     */
    var OPERATION_WHITELIST = [
        'highlightElementAtPoint',
        'unHighlight',
        'getActiveElementData',
        'scrollBy'
    ];

    /**
     * Style properties to be mimiced by the highlighter element
     * @type {Array}
     */
    var MIMIC_STYLES = [
        'border-top-left-radius',
        'border-top-right-radius',
        'border-bottom-left-radius',
        'border-bottom-right-radius',
    ];

    /**
     * Helper methods for manipulating DOMNodes
     * @type {Object}
     */
    var DOMHelpers = {
        /**
         * Retrieves the computed style of an given element
         * @param  {DOMNode} element The element from which to read computedSytles
         * @return {Object}          Object with the computed styles
         */
        getComputedStyle: function (element) {

            if (!element) {
                throw new Error('No element for getComputedStyle(element)');
            }

            var cs = {};

            // Get the computed cs of the element
            var _cs = window.getComputedStyle(element);

            for (var i = _cs.length - 1; i >=0; i--) {
                var prop = _cs[i];

                cs[prop] = _cs.getPropertyValue(prop);
            }

            return cs;
        },

        /**
         * Retrieves the attributes of a given element
         * @param  {DOMNode} element The element from which to read attributes
         * @return {Object}          Object with all attributes
         */
        getAttributes: function (element) {

            if (!element) {
                throw new Error('No element for getAttributes(element)');
            }

            // Object on which to store attributes
            var attributes = {};

            var _attrs = element.attributes;

            for (var i = _attrs.length - 1; i >= 0; i--) {
                attributes[_attrs[i].name] = _attrs[i].value;
            }

            return attributes;
        },
    };

    /**
     * Register the carbo-inspector element
     */
    Polymer({
        is: 'carbo-inspector',

        /**
         * Method called whenever the component is ready
         */
        ready: function () {
            // mudou para window - window inclui a overlay - certo?
            // Respondi: (quando ler a resposta, apagar a pergunta)

            // Listen to `message` events on the window object.
            // The window is the object that contains the whole application,
            // in the case of the edited application (inside which is the inspector component)
            // it is the `iframe`. 
            // 
            // Only the window receives messages.
            window.addEventListener('message', this.handleFrameRequestMessage.bind(this), false);

            // nao entendi exatamente essa parte
            // Respondi: (quando ler a resposta, apagar a pergunta)

            // Listen o mouseout events on the `document` object
            // which represents the whole document (as if we were selecting the
            // wrapping `<html></html>` tag).
            // 
            // Whenever the mouseout event fires, we have to verify that the
            // source target is the 'html' tag and not any children of it.
            // That's because events on the DOM tree 'bubble' up,
            // in other words, events from inner nodes bubble up to the 
            // parent nodes.
            document.addEventListener('mouseout', function (e) {
                var from = e.relatedTarget || e.toElement;
                if (!from || from.nodeName == "HTML") {
                    this.unHighlight();
                }
            }.bind(this));
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
            // Thus we should whitelist the available methods.
            // 
            // (_.any returns true if ANY of the items in the array
            // results in a true evaluation from the condition)
            var operationWhitelisted = _.any(OPERATION_WHITELIST, function (op) {
                return op === request.operation;
            });

            if (operationWhitelisted) {
                // Execute the operation and store the result
                var res = this[request.operation].apply(this, request.args);

                // Send message to parent frame passing the request.id
                // so that the parent may resolve to the correct inquiry.
                parent.postMessage(JSON.stringify({
                    id: request.id,
                    res: res
                }), '*');

            } else {
                throw new Error('Operation %s is not available at inspector', operationName);
            }
        },

        /**
         * Retrieves information about the active element.
         * @return {{tagName: String, attributes: Object, computedStyle: Object }Object} 
         *         Data on the current active element.
         */
        getActiveElementData: function () {
            var element = this.activeElement;

            var boundingRect = element.getBoundingClientRect();

            //PEGA AS INFOS DO ELEMENTO CLICADO ENVIADAS PELO CANVAS
            var data = {
                tagName: element.tagName,
                attributes: DOMHelpers.getAttributes(element),
                computedStyle: DOMHelpers.getComputedStyle(element),
                rect: {
                    top: boundingRect.top,
                    left: boundingRect.left,
                    width: boundingRect.width,
                    height: boundingRect.height,
                },
            };

            return data;
        },

        /**
         * Highlights a given element
         * @param  {DOMNode} element The node to be highlighted
         */
        highlight: function (element, force) {
            if (!element) {
                throw new Error('No element for highlight(element)');
            }

            // If the new highlighted element is the same as the 
            // currentActive one, just let it be.
            if (this.activeElement === element && !force) {
                return; 
            }

            // If there is an activeElement unHighlight it
            if (this.activeElement) {
                this.unHighlight(this.activeElement);
            }

            // Save the element to the active element
            this.activeElement = element;

            console.log(element);

            // Get element tag name
            var elementLabelName = element.tagName;

            // Get label div of inpector.html
            var elementLabelContainer = this.$.elementlabel;

            // Set value of label div
            elementLabelContainer.innerHTML = elementLabelName;

            // The highlighter DOMNode
            var highlighter = this.$.highlighter;
            // The bounding rectangle for the element to be hightlighted
            var rect        = element.getBoundingClientRect();
            
            this.toggleClass('show', true, highlighter);

            // Set positions
            highlighter.style.left   = rect.left   + 'px';
            highlighter.style.top    = rect.top    + 'px';
            highlighter.style.width  = rect.width  + 'px';
            highlighter.style.height = rect.height + 'px';

            // There are some styles that interfere drastically 
            // on the positioning, such as border radius.
            // We want to mimic those styles from 
            // the highlighted element to the highlighter
            var computedStyle = DOMHelpers.getComputedStyle(element);

            //forEach - para cada um dos itens do array MIMIC_STYLES
            MIMIC_STYLES.forEach(function (styleProp) {
                if (computedStyle[styleProp]) {
                    // Simply copy the styles
                    highlighter.style[styleProp] = computedStyle[styleProp];
                }
            });
        },

        /**
         * Removes highlight.
         */
        unHighlight: function () {

            var highlighter = this.$.highlighter;

            this.toggleClass('show', false, highlighter);

            // Unmimic styles
            MIMIC_STYLES.forEach(function (styleProp) {
                delete highlighter.style[styleProp];
            });
        },
        
        /**
         * Highlights the element at a given point
         * @param {Object{ x: Number, y: Number}} 
         *         point The point at which the element to be highlighted is
         * @param {Boolean} force
         */
        highlightElementAtPoint: function (point, force) {
            // get hovered component (Element under that position)
            var element = document.elementFromPoint(point.x, point.y);
            
            if (element === this) {
                this.unHighlight();
            }
            
            this.highlight(element, force);
        },
        
        /**
         * Scrolls the window
         * @param  {Number} deltaX
         * @param  {Number} deltaY
         */
        scrollBy: function (deltaX, deltaY) {
            // console.log('scroll x: %s, y: %s', deltaX, deltaY);
            window.scrollBy(deltaX, deltaY);
        }
    });

})();
