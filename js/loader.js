

function updateLoaderProgress(progress) {
    if (typeof($) != 'undefined') {
        $('#loader-progress').progressbar('option', 'value', progress);
    }
}


var useDevSources = true;
var clientSources = ["css/style.css"];
if (useDevSources) {
    clientSources = "css/style.css js/midi.js js/fakebytearray.js js/tween.js js/classicalnoise.js js/jquerycomponents.js js/guiproperties.js js/guipropertiescomponent.js js/valuecomponents.js js/guiobjectlistcomponent.js js/uniqueidmanager.js js/propertyinfoprovider.js js/songsettingscomponents.js js/asyncoperation.js js/noterepr.js js/audioplayer.js js/sm2player.js js/webaudioplayer.js js/frustumcullingchunks.js js/composevisualizer.js js/composemain.js".split(" ");
}

Modernizr.load(
    [
        {
            test: Modernizr.webgl,
            yep: ["js/webglonly-min.js"],
            complete: function() {
                console.log("Loaded webgl stuff for three.js");
                updateLoaderProgress(40);
            }
        },
        {
            both: clientSources,
            complete: function() {
                updateLoaderProgress(50);

                $(document).ready(function() {
                    composeSetup1();
                });
            }
        }
    ]
);

