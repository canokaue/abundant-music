
const that = self;

function logit(str) {
    that.postMessage({type: "log", data: str});
}

//importScripts("composeworkersource.js");
importScripts(
    "composer/geninfo.js",
    "composer/random.js",
    "composer/mersennetwister.js",
    "composer/utils.js",
    "composer/simplemodulegeneratorphasegroup.js",
    "composer/songpart.js",
    "composer/melodyoffset.js",
    "composer/constants.js",
    "composer/interpolation.js",
    "composer/splineinterpolation.js",
    "composer/map.js",
    "composer/latticenoise.js",
    "composer/perlinnoise.js",
    "composer/variables.js",
    "composer/soundfont.js",
    "composer/perftimer.js",
    "composer/procedures.js",
    "composer/dfssolver.js",
    "composer/controlchannel.js",
    "composer/renderchannel.js",
    "composer/curve.js",
    "composer/figurationgrid.js",
    "composer/figurator.js",
    "composer/renderline.js",
    "composer/motifrenderelement.js",
    "composer/sectionmodifier.js",
    "composer/controlline.js",
    "composer/genmusicmodule.js",
    "composer/splitzone.js",
    "composer/rythm.js",
    "composer/section.js",
    "composer/motifzone.js",
    "composer/percussionmotifzone.js",
    "composer/motif.js",
    "composer/percussionmotif.js",
    "composer/predefinedpercussion.js",
    "composer/harmonicrythm.js",
    "composer/harmonyelementinclude.js",
    "composer/harmonyelement.js",
    "composer/harmonymodifier.js",
    "composer/sequenceharmonyelement.js",
    "composer/plannedharmonyelement.js",
    "composer/phraseharmonyelement.js",
    "composer/voiceline.js",
    "composer/structure.js",
    "composer/renderstate.js",
    "composer/renderdata.js",
    "composer/harmonygenerator.js",
    "composer/staticharmonygenerator.js",
    "composer/dynamicharmonygeneratorconstants.js",
    "composer/dynamicharmonygenerator.js",
    "composer/chromatictransitionharmonygenerator.js",
    "composer/chromaticoscillationharmonygenerator.js",
    "composer/dominantharmonygenerator.js",
    "composer/toniccadenceharmonygenerator.js",
    "composer/suspantstrategies.js",
    "composer/voicelinegenerator.js",
    "composer/classicalvoicelinegenerator.js",
    "composer/voicelineconstraintsinclude.js",
    "composer/voicelineconstraints.js",
    "composer/classicalvoicelineplanner.js",
    "composer/midiconstants.js",
    "composer/midirenderer.js",
    "composer/datasample.js",
    "composer/testmodule.js");

importScripts(
    "midisynth/riffwave.js", 
    "midisynth/midisynthsource.js", 
    "midisynth/midisynthenvelope.js", 
    "midisynth/midisynthfilter.js", 
    "midisynth/midisynthoscillator.js", 
    "midisynth/midisynthvoice.js", 
    "midisynth/midisynthinstrument.js", 
    "midisynth/midisynth.js");

importScripts("stacktrace.js");

function inputOk(genInfo, correct) {
    let valid = true;
    try {
        valid = validateValueWithSafeValue(genInfo, new GenInfo(), null, {"array": 1, "number": 1}, correct);
        if (!valid) {
            logit("Input validation failed");
        }
    } catch (exc) {
        logit("Input validation threw exception:");
        logit(exc.toString());
        valid = false;
    }
    return valid;
}

function render(data, progressMultiplier) {

    const content = data.content;

//                        logit("Worker is composing with seed " + content.seed);
    const seed = content.seed;
    const sectionIndex = content.sectionIndex;

    const rnd = new MersenneTwister(seed);
    const genInfo = content.genInfo;


    if (inputOk(genInfo, true)) {

        const resultObj = {};
        const maxSections = 40;
        const module = createTestModule(rnd.genrand_int31(), genInfo, resultObj);

        const midiRenderer = module.getSynthRenderer("midiRenderer");

        const result = {
            songStructureInfo: resultObj.songStructureInfo,
            seed: seed,
            channelMaps: midiRenderer.channelMaps,
            module: module
        };

        const renderData = new RenderData();
        const state = new RenderState(module, renderData);
        const structure = module.structures[0];
        if (structure.references.length > maxSections) {
            structure.references.length = maxSections;
        }
        const sectionTimes = [];
        structure.renderBatch(state, function(progress) {
            sectionTimes.push(state.sectionTime);
            that.postMessage({type: "progressReport", progress: progress * progressMultiplier});
        });
        renderData.sort();

        result.origRenderData = renderData;

        const netJson = renderData.toNetJSON();

        result.renderData = JSON.parse(netJson);
        result.renderDataLength = state.sectionTime;
        result.sectionTimes = sectionTimes;

        return result;

    }
    return null;
}


self.addEventListener('message', function(e) {

    try {

        const data = e.data;

        if (!data) {
            return; // Empty message
        }

        if (!data.type) {
            // Probably just testing for transferable object support
            return;
        }

        switch (data.type) {
            case "startTask":
                const taskType = data.taskType;
                switch (taskType) {
                    case 0: {
//                        logit("Worker is composing...");

                        let result = render(data, 1);
                        if (result) {
                            delete result.origRenderData; // No use to us
                            delete result.module; // No use to us
                            self.postMessage({type: "progressReport", progress: 1});
                            self.postMessage({type: "result", data: JSON.stringify(result)});
                        } else {
                            self.postMessage({type: "error", data: "No result from render"});
                        }
                        break;
                    }
                    case 1: // Midi
                    case 2: { // Wav
//                        logit("Worker is exporting midi...");

                        const progMult = taskType == 1 ? 1 : 0.5;

                        let result = render(data, progMult);
                        if (result) {
                            const midiRenderer = result.module.getSynthRenderer("midiRenderer");
                            const midiData = midiRenderer.getMidiData(result.origRenderData, result.module, data.content.genInfo);
                            result.midiData = midiData;

//                            logit("Result midi data " + JSON.stringify(result.midiData));

                            delete result.origRenderData; // No use to us now after midi has been rendered
                            delete result.module; // No use to us now after midi has been rendered

                            const that = self;
                            if (taskType == 2) {
                                // Render wav and send the buffer first
                                const options = {sampleFreq: 44100, channels: 2};
                                const synth = new MidiSynth(options);
                                const floatResult = synth.synthesizeBatch(result.midiData, function(progress) {
                                    that.postMessage({type: "progressReport", progress: 0.5 + 0.5 * progress});
                                });

                                const maxShort = (256 * 256) / 2 - 1;

                                const len = floatResult[0].length;

                                const dataView = new DataView(new ArrayBuffer(len * 4));

                                for (let i=0; i<len; i++) {
                                    let value = floatResult[0][i];
                                    dataView.setInt16(i * 4, Math.round(maxShort * value), true);
                                    value = floatResult[1][i];
                                    dataView.setInt16(i * 4 + 2, Math.round(maxShort * value), true);
                                }

                                const rw = new RIFFWAVE();
                                const buffer = rw.create(dataView);
                                if (data.transferableSupported) {
//                                    logit("Using transferable!");
                                    self.postMessage(buffer, [buffer]);
                                } else {
                                    self.postMessage(buffer);
                                }
                            }
                            self.postMessage({type: "progressReport", progress: 1});
                            self.postMessage({type: "result", data: JSON.stringify(result)});

                        } else {
                            logit("Error, no result");
                            self.postMessage({type: "error", data: "No result from render"});
                        }
                        break;
                    }
                }
                break;
            case "cancelTask":
                break;
        }
//        self.close();
    } catch (exc) {
        logit("Exception in worker " + exc + " ");
        logit(printStackTrace({e: exc}).join("\n"));

        self.postMessage({type: "error", data: exc.toString()});
//        self.close();
    }
}, false);