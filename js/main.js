
let output = null;

let $content = null;

let contextFunc = null;
let audioContext = null;

let renderData = null;
let renderer = null;
let mapping = null;


function createHarmony() {
    const hg = new StaticHarmonyGenerator({
        length: 5,
        seed: 73462,
        baseToBaseLikelihood: 0.001,
        baseToNeighbourLikelihood: 1,
        auxiliaryToAuxiliaryLikelihood: 0.001
    });
    const solution = hg.search();

    let harmonyElements = [];
    if (solution) {
        logit("Founc solution: " + solution + "<br />");
        harmonyElements = solution;
    } else {
        logit("Failed to find solution. Reason: " + hg.failReason + "<br />");
        const base = 65;
        harmonyElements.push(new ConstantHarmonyElement().setChordRoot(0).setBaseNote(base));
        harmonyElements.push(new ConstantHarmonyElement().setChordRoot(3).setBaseNote(base));
        harmonyElements.push(new ConstantHarmonyElement().setChordRoot(1).setBaseNote(base));
        harmonyElements.push(new ConstantHarmonyElement().setChordRoot(4).setBaseNote(base));
        harmonyElements.push(new ConstantHarmonyElement().setChordRoot(0).setBaseNote(base));
    }

    const harmony = new ConstantHarmonicRythm(harmonyElements);
    return harmony;
}

function createRenderLine(motif, voiceLine) {
    const mre1 = new MotifRenderElement();
    mre1.motif = motif;
    mre1.startBeatTime = 0;
    mre1.endBeatTime = 4;
    mre1.voiceLine = voiceLine;
    const mre2 = new MotifRenderElement();
    mre2.startBeatTime = 4;
    mre2.endBeatTime = 8;
    mre2.motif = motif;
    mre2.voiceLine = voiceLine;
    const mre3 = new MotifRenderElement();
    mre3.startBeatTime = 8;
    mre3.endBeatTime = 12;
    mre3.motif = motif;
    mre3.voiceLine = voiceLine;
    const mre4 = new MotifRenderElement();
    mre4.startBeatTime = 12;
    mre4.endBeatTime = 16;
    mre4.motif = motif;
    mre4.voiceLine = voiceLine;

    const renderLine = new RenderLine();
    renderLine.channel = "renderChannel1";
    renderLine.addRenderElement(mre1);
    renderLine.addRenderElement(mre2);
    renderLine.addRenderElement(mre3);
    renderLine.addRenderElement(mre4);

    return renderLine;
}

function createMotif1() {
    const motif1 = new Motif();
    motif1.id = "motif1";
    motif1.addMotifElement(new VoiceNoteMotifElement().setIndex(0)
        .setRelativeType(RelativeType.VOICE_LINE));
    motif1.addMotifElement(new VoiceNoteMotifElement().setIndex(-1)
        .setRelativeType(RelativeType.NEXT_VOICE_NOTE));
    motif1.addMotifElement(new VoiceNoteMotifElement().setIndex(-1)
        .setRelativeType(RelativeType.NEXT_VOICE_NOTE));
    motif1.addMotifElement(new VoiceNoteMotifElement().setIndex(2)
        .setRelativeType(RelativeType.VOICE_LINE));
    return motif1;
}

function createMotif2() {
    const motif = new Motif();
    motif.id = "motif2";
    const count = 16;
    const length = 4 / count;
    for (let i=0; i<count; i++) {
        motif.addMotifElement(new VoiceNoteMotifElement().setIndex((i % 4) * 1)
            .setRelativeType(RelativeType.VOICE_LINE).setLength(length).setOffsetType(OffsetType.CHORD));
    }
    return motif;
}

function createModule() {
    const module = new GenMusicModule();

    const motif1 = createMotif1();
    const motif2 = createMotif2();
    module.addMotif(motif1);
    module.addMotif(motif2);

    const renderLine1 = createRenderLine("motif1", "voiceLine1");
    const renderLine2 = createRenderLine("motif2", "voiceLine2");

    const structure = new Structure();
    structure.id = "structure1";
    structure.references.push(new SectionReference("section1"));
    module.addStructure(structure);

    const renderChannel = new RenderChannel();
    renderChannel.id = "renderChannel1";
    module.renderChannels.push(renderChannel);

    const vl1 = new ConstantVoiceLine();
    vl1.id = "voiceLine1";
    vl1.addVoiceLineElement(new ConstantVoiceLineElement().setIndex(3).setSnapType(SnapType.CHORD));
    vl1.addVoiceLineElement(new ConstantVoiceLineElement().setIndex(4).setSnapType(SnapType.CHORD));
    vl1.addVoiceLineElement(new ConstantVoiceLineElement().setIndex(5).setSnapType(SnapType.CHORD));
    vl1.addVoiceLineElement(new ConstantVoiceLineElement().setIndex(6).setSnapType(SnapType.CHORD));
    vl1.addVoiceLineElement(new ConstantVoiceLineElement().setIndex(5).setSnapType(SnapType.CHORD));
    const vl2 = new ConstantVoiceLine();
    vl2.id = "voiceLine2";
    vl2.addVoiceLineElement(new ConstantVoiceLineElement().setIndex(0).setOctaves(-1).setSnapType(SnapType.SCALE).setIndexType(IndexType.CHORD_BASS));
    vl2.addVoiceLineElement(new ConstantVoiceLineElement().setIndex(0).setOctaves(-1).setSnapType(SnapType.SCALE).setIndexType(IndexType.CHORD_BASS));
    vl2.addVoiceLineElement(new ConstantVoiceLineElement().setIndex(0).setOctaves(-1).setSnapType(SnapType.SCALE).setIndexType(IndexType.CHORD_BASS));
    vl2.addVoiceLineElement(new ConstantVoiceLineElement().setIndex(0).setOctaves(-1).setSnapType(SnapType.SCALE).setIndexType(IndexType.CHORD_BASS));
    vl2.addVoiceLineElement(new ConstantVoiceLineElement().setIndex(0).setOctaves(-1).setSnapType(SnapType.SCALE).setIndexType(IndexType.CHORD_BASS));

    const harmony = createHarmony();
    harmony.id = "harmony1";
    module.addHarmony(harmony);

    const section = new Section();
    section.id = "section1";
    section.harmonicRythm = "harmony1";
    section.addVoiceLine(vl1);
    section.addVoiceLine(vl2);
    section.addRenderLine(renderLine1);
    section.addRenderLine(renderLine2);
    module.addSection(section);

    return module;
}

function getRenderData2() {
    const module = createModule();
    const data = module.renderBatch("structure1");
    logit("events: " + data.events);
    return data;
}


function visualize() {
    const renderData = getRenderData2();
    
    const canvasWidth = 500;
    const canvasHeight = 250;
    const $canvas = $("<canvas width=\"" + canvasWidth + "\" height=\"" + canvasHeight + "\" />");
    $content.append($canvas);
    const canvas = $canvas.get()[0];
    const canvasContext = canvas.getContext("2d");

    canvasContext.fillStyle = "#ff0000";
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);
}

function renderLoop() {
    const voiceCount = renderer.getVoiceCount();
    if (renderData.events.length > 0 || voiceCount > 0) {
        const first = renderData.events[0];
        if (first && first.time + renderer.startTime > audioContext.currentTime - 1.5) {
            const split = renderData.splitOnTime(audioContext.currentTime - renderer.startTime + 1);
            //            logit("Rendering events: " + split[0].events + "<br />");
            renderer.render(audioContext, split[0], mapping);
            renderData = split[1];
        } else {
            renderer.render(audioContext, null, mapping);
        }
        setTimeout(renderLoop, 200);
    }
//    logit("Voice count before: " + voiceCount + " after: " + renderer.getVoiceCount() + "<br/>");
}


function render() {
    logit("Rendering...");

    renderData = getRenderData2();

    renderer = new WebAudioRenderer();

    if (audioContext == null) {
        audioContext = new contextFunc();
    }
    renderer.startTime = audioContext.currentTime;

    mapping = {
    };

    renderLoop();
}

function init() {
    output = $("#output").get()[0];
    $content = $("#content");
    const $playButton = $("<button>Play</button>");
    const $visualizeButton = $("<button>Visualize</button>");
    $content.append($playButton);
    $content.append($visualizeButton);
    $playButton.button();

    contextFunc = typeof AudioContext === "undefined" ?
    (typeof webkitAudioContext === "undefined" ? null : webkitAudioContext) : AudioContext;

    if (contextFunc) {
        //        audioContext = new contextFunc();
        $playButton.click(() => {
            //            logit("Rendering...");
            render();
        });
    } else {
        logit("Unable to get audio context. This demo probably only works in Chrome and Safari.<br />");
    }

    $visualizeButton.click(() => {
        visualize();
    });

}

function logit(str) {
    if (output) {
        output.innerHTML += str;
    }
}

function logitRnd(str, prob) {
    if (Math.random() < prob) {
        if (output) {
            output.innerHTML += str;
        }
    }
}

$(document).ready(() => {
    init();
});


