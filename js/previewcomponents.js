function PreviewComponent() {
    JQueryComponent.call(this);
    this.previewOnShow = true;
    this.object = null;
    this.propertyInfo = null;
    this.setUniqueId();
}

PreviewComponent.prototype = new JQueryComponent();

PreviewComponent.prototype.componentRemoved = function() {
    };

PreviewComponent.prototype.cleanAfterDelete = function(value) {
    };

PreviewComponent.prototype.gatherAlignmentInfo = function(info) {
    };

PreviewComponent.prototype.setAlignment = function(info) {
    };


PreviewComponent.prototype.appendPianoRollCanvas = function(options, $canvasContainer, withinDiv) {
    const pr = new PianoRoll(options);

    // Use the size of the piano roll to create a canvas
    const canvasWidth = pr.width;
    const canvasHeight = pr.height;

    let canvasString = "";
    if (withinDiv) {
        canvasString += "<div>";
    }
    canvasString += "<canvas width='" + canvasWidth + "' height='" + canvasHeight + "' ></canvas>";
    if (withinDiv) {
        canvasString += "</div>";
    }

    const $canvas = $(canvasString);

    $canvasContainer.append($canvas);

    const canvas = withinDiv ? $canvas.find("canvas").get(0) : $canvas.get(0);
    const ctx = canvas.getContext("2d");

    if (ctx) {
        pr.updateSize();
        pr.paint(0, 0, ctx);
    }

};


function CurvePreviewComponent() {
    PreviewComponent.call(this);
    this.canvasContext = null;

    this.sourceMinX = 0;
    this.sourceMaxX = 1;
    this.sourceMinY = -1;
    this.sourceMaxY = 1;

    this.canvasWidth = 400;
    this.canvasHeight = 300;
    
    this.targetMinX = 10;
    this.targetMaxX = this.canvasWidth - 10;
    this.targetMinY = 10;
    this.targetMaxY = this.canvasHeight - 10;

    this.otherCssClasses.push("ui-widget-content");
    this.otherCssClasses.push("curve-preview-component");
}

CurvePreviewComponent.prototype = new PreviewComponent();

CurvePreviewComponent.prototype.getHtmlContentBeforeChildren = function(resultArr) {
    resultArr.push("<div>");
    resultArr.push("<canvas id='" + this.id + "-canvas' width='" + this.canvasWidth + "' height='" + this.canvasHeight + "' ></canvas>");
    resultArr.push("</div>");
    resultArr.push("<button id='" + this.id + "-update-button' >Update</button>");
    resultArr.push("<button id='" + this.id + "-set-view-button' >Set View Rectangle</button>");
};

CurvePreviewComponent.prototype.jQueryCreated = function($localRoot) {
    JQueryComponent.prototype.jQueryCreated.call(this, $localRoot);

    const comp = this;

    const $canvas = this.$component.find("#" + this.id + "-canvas");
    const $updateButton = this.$component.find("#" + this.id + "-update-button");
    const $viewButton = this.$component.find("#" + this.id + "-set-view-button");

    $updateButton.button();
    $viewButton.button();

    $updateButton.on("click", function() {
        comp.paintPreview();
    });

    this.canvas = $canvas.get(0);
    this.canvasContext = this.canvas.getContext("2d");

    if (this.previewOnShow) {
        this.paintPreview();
    }
};

CurvePreviewComponent.prototype.paintPreview = function() {
    const ctx = this.canvasContext;
    const canvas = this.canvas;
    if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#00ff00";

        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const module = this.propertyInfo.otherInfo.data;

        const curve = this.object;

        const targetHeight = this.targetMaxY - this.targetMinY;
        const targetWidth = this.targetMaxX - this.targetMinX;
        const sourceHeight = this.sourceMaxY - this.sourceMinY;
        const sourceWidth = this.sourceMaxX - this.sourceMinX;

        let first = true;
        ctx.beginPath();
        for (let i=this.targetMinX; i<=this.targetMaxX; i++) {
            const fractionX = (i - this.targetMinX) / targetWidth;
            
            const x = this.sourceMinX + fractionX * sourceWidth;
            const curveValue = curve.getValue(module, x);

            const fractionY = (curveValue - this.sourceMinY) / sourceHeight;
            const j = this.targetMinY + (targetHeight - targetHeight * fractionY);

            //            logit(i + "," + j + " ");
            if (first) {
                first = false;
                ctx.moveTo(i, j);
            } else {
                ctx.lineTo(i, j);
            }
        }
        ctx.stroke();
    }
};



function PianoRollPreviewComponent() {
    PreviewComponent.call(this);

    this.addUpdateButton = true;
    this.addPlayButton = false;
    this.addStopButton = false;
    
    this.pianoRollWithinDiv = false;
    
    this.$canvasContainer = null;

    this.previewNumerator = 4;
    this.previewDenominator = 4;

    this.otherCssClasses.push("ui-widget-content");
    this.otherCssClasses.push("piano-roll-preview-component");
}

PianoRollPreviewComponent.prototype = new PreviewComponent();


PianoRollPreviewComponent.prototype.paintPreview = function() {
    this.$canvasContainer.empty();

    const options = this.getPianoRollOptions();
    for (let i=0; i<options.length; i++) {
        this.appendPianoRollCanvas(options[i], this.$canvasContainer, this.pianoRollWithinDiv);
    }
};

PianoRollPreviewComponent.prototype.playPreview = function() {
};
PianoRollPreviewComponent.prototype.stopPreview = function() {
};

PianoRollPreviewComponent.prototype.getHtmlContentBeforeChildren = function(resultArr) {
    resultArr.push("<div>Preview</div>");
    resultArr.push("<div class='canvas-container-div' >");
    resultArr.push("</div>");
    if (this.addUpdateButton) {
        resultArr.push("<button id='" + this.id + "-update-button' >Update</button>");
    }
    if (this.addPlayButton) {
        resultArr.push("<button id='" + this.id + "-play-button' >Play</button>");
    }
    if (this.addStopButton) {
        resultArr.push("<button id='" + this.id + "-stop-button' >Stop</button>");
    }
};

PianoRollPreviewComponent.prototype.jQueryCreated = function($localRoot) {
    JQueryComponent.prototype.jQueryCreated.call(this, $localRoot);

    const comp = this;

    this.$canvasContainer = this.$component.find(".canvas-container-div");

    if (this.addUpdateButton) {
        const $updateButton = this.$component.find("#" + this.id + "-update-button");

        $updateButton.button();

        $updateButton.on("click", function() {
            comp.paintPreview();
        });
    }
    if (this.addPlayButton) {
        const $playButton = this.$component.find("#" + this.id + "-play-button");

        $playButton.button();

        $playButton.on("click", function() {
            comp.playPreview();
        });
    }
    if (this.addStopButton) {
        const $stopButton = this.$component.find("#" + this.id + "-stop-button");

        $stopButton.button();

        $stopButton.on("click", function() {
            comp.stopPreview();
        });
    }

    if (this.previewOnShow) {
        this.paintPreview();
    }
};


function RythmPreviewComponent() {
    PianoRollPreviewComponent.call(this);
    this.addPlayButton = true;
    this.addStopButton = true;
}

RythmPreviewComponent.prototype = new PianoRollPreviewComponent();



RythmPreviewComponent.prototype.getPianoRollOptions = function() {

    const rythm = this.object;
    const module = this.propertyInfo.otherInfo.data;


    const harmony = new ConstantHarmonicRythm([new ConstantHarmonyElement()]);
    // Create the rythm elements
    const elements = rythm.getNoteRythmElements(module, harmony, 0);

    // Create some notes that have the same length as the rythm
    const dummyChannel = new RenderChannel();
    dummyChannel.id = "dummyChannel";

    const renderData = new RenderData();
    let currentTime = 0;
    for (let i=0; i<elements.length; i++) {
        const element = elements[i];
        const beatLength = positionUnitToBeats(element.length, element.lengthUnit,
            this.previewNumerator, this.previewDenominator);
        //        logit("Beat length: " + beatLength + " element length: " + element.length + " unit: " + PositionUnit.toString(element.lengthUnit));
        if (!element.rest) {
            const noteOn = new NoteOnEvent(60, currentTime, 1.0, dummyChannel);
            const noteOff = new NoteOffEvent(60, currentTime + beatLength, 1.0, dummyChannel);
            renderData.addEvent(noteOn);
            renderData.addEvent(noteOff);
        }
        //        logit("Current time: " + currentTime + "<br />");
        currentTime += beatLength;
    }

    // Create a piano roll
    const options = {
        renderData: renderData,
        harmony: null,
        showKeys: false
    };
    return [options];
};



function MotifPreviewComponent() {
    PianoRollPreviewComponent.call(this);
}

MotifPreviewComponent.prototype = new PianoRollPreviewComponent();



MotifPreviewComponent.prototype.getPianoRollOptions = function() {

    const motif = this.object;
    const module = this.propertyInfo.otherInfo.data;

    const harmony = new ConstantHarmonicRythm([new ConstantHarmonyElement()]);

    const dummyChannel = new RenderChannel();
    dummyChannel.id = "dummyChannel";


    const mre = new MotifRenderElement();
    mre.voiceLine = "dummyVoiceLine";
    mre.motif = motif.id;

    const renderData = new RenderData();

    const voiceLine = new ConstantVoiceLine();
    voiceLine.id = "dummyVoiceLine";
    voiceLine.addVoiceLineElement(new ConstantVoiceLineElement());

    const state = new RenderState(module, renderData);
    state.constantHarmony = harmony;
    state.plannedVoiceLines = [voiceLine];

    mre.renderBatch(state);

    const options = {
        renderData: renderData,
        harmony: harmony,
        showKeys: true
    };
    return [options];
};


function PercussionMotifPreviewComponent() {
    PianoRollPreviewComponent.call(this);
}

PercussionMotifPreviewComponent.prototype = new PianoRollPreviewComponent();



PercussionMotifPreviewComponent.prototype.getPianoRollOptions = function() {

    const motif = this.object;
    const module = this.propertyInfo.otherInfo.data;

    const harmony = new ConstantHarmonicRythm([new ConstantHarmonyElement()]);

    const dummyChannel = new RenderChannel();
    dummyChannel.id = "dummyChannel";

    const mre = new PercussionMotifRenderElement();
    mre.motifs = [motif.id];

    const renderData = new RenderData();

    const state = new RenderState(module, renderData);
    state.constantHarmony = harmony;

    mre.renderBatch(state);

    // logit("Render data: " + renderData.events + " <br />");

    const options = {
        renderData: renderData,
        harmony: harmony,
        showKeys: true
    };
    return [options];
};



// Works for both harmonic rythms and harmony elements
function HarmonyPreviewComponent() {
    PianoRollPreviewComponent.call(this);
}

HarmonyPreviewComponent.prototype = new PianoRollPreviewComponent();


HarmonyPreviewComponent.prototype.getPianoRollOptions = function() {

    const harmony = this.object;
    
    const module = this.propertyInfo.otherInfo.data;

    const harmonyElements = harmony.getConstantHarmonyElements(module);

    const chr = new ConstantHarmonicRythm(
        harmonyElements);

    const dummyChannel = new RenderChannel();
    dummyChannel.id = "dummyChannel";

    const renderData = new RenderData();

    let currentTime = 0;
    for (let i=0;i<chr.getCount(); i++) {
        const che = chr.get(i);
        const beatLength = positionUnitToBeats(che.length, che.lengthUnit, che.tsNumerator, che.tsDenominator, null);

        const scaleIndices = che.getChordScaleIndices();

        for (let j=0; j<scaleIndices.length; j++) {
            const absNote = che.getAbsoluteNoteFromChordBassIndex(j);
            const noteOn = new NoteOnEvent(absNote, currentTime, 1.0, dummyChannel);
            const noteOff = new NoteOffEvent(absNote, currentTime + beatLength, 1.0, dummyChannel);
            renderData.addEvent(noteOn);
            renderData.addEvent(noteOff);
        }

        currentTime += beatLength;
    }

    const maxWidth = 800;
    const beatWidth = Math.round(Math.min(50, maxWidth / currentTime));

    const options = {
        renderData: renderData,
        harmony: chr,
        showKeys: true,
        beatWidth: beatWidth
    };
    return [options];
};



function SectionPreviewComponent() {
    PianoRollPreviewComponent.call(this);
    this.previewOnShow = false;
}

SectionPreviewComponent.prototype = new PianoRollPreviewComponent();


SectionPreviewComponent.prototype.getPianoRollOptions = function() {

    const section = this.object;
    const module = this.propertyInfo.otherInfo.data;

    const renderData = new RenderData();

    const state = new RenderState(module, renderData);
    state.section = section;
    state.sectionModifiers = [];

    section.renderBatch(state);

    let maxTime = renderData.getTimeLimits()[1];

    maxTime = Math.max(maxTime, state.constantHarmony.getBeatLength());

    if (maxTime <= 0) {
        maxTime = 4;
    }
    
    const maxWidth = 800;
    const beatWidth = Math.round(Math.min(50, maxWidth / maxTime));

    const options = {
        renderData: renderData,
        harmony: state.constantHarmony,
        showKeys: true,
        beatWidth: beatWidth
    };
    return [options];
};



function StructurePreviewComponent() {
    PianoRollPreviewComponent.call(this);
    this.pianoRollWithinDiv = true;
    this.previewOnShow = false;
}

StructurePreviewComponent.prototype = new PianoRollPreviewComponent();


StructurePreviewComponent.prototype.getPianoRollOptions = function() {

    const structure = this.object;
    const module = this.propertyInfo.otherInfo.data;

    const renderDatas = [];
    const harmonies = [];
    const result = [];

    const maxWidth = 800;
    let beatWidth = 50;

    for (let i=0; i<structure.references.length; i++) {
        const ref = structure.references[i];
        if (!ref.active) {
            continue;
        }
        const renderData = new RenderData();
        const state = new RenderState(module, renderData);

        ref.renderBatch(state);
        renderDatas.push(renderData);
        harmonies.push(state.constantHarmony);

        let maxTime = state.constantHarmony.getBeatLength();
        maxTime = Math.max(maxTime, renderData.getTimeLimits()[1]);
        if (maxTime <= 0) {
            maxTime = 4;
        }
        beatWidth = Math.min(beatWidth, Math.round(Math.min(50, maxWidth / maxTime)));
    }

    for (let i=0; i<renderDatas.length; i++) {
        const options = {
            renderData: renderDatas[i],
            harmony: harmonies[i],
            showKeys: true,
            beatWidth: beatWidth
        };
        result.push(options);
    }
    return result;
};


