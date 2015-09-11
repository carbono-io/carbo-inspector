(function () {

    console.log(Polymer);

    function onInspectorLoad() {
        var inspector = document.createElement('carbo-inspector');

        document.body.appendChild(inspector);

        console.log(inspector);

        inspector.highlight(document.getElementById('two'));
    }

    function onInspectorLoadError() {
        console.log('errror')
    }

    Polymer.Base.importHref('../src/carbo-inspector.html', onInspectorLoad, onInspectorLoadError);
})();