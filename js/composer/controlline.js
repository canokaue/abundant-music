
function ControlLine() {
    this.id = "";
    this._constructorName = "ControlLine";
}

ControlLine.prototype.copy = function() {
    return copyObjectDeep(this);
};

ControlLine.prototype.getPrimitiveControlLines = function(module, harmony) {
    return [this];
};

ControlLine.prototype.renderBatch = function(state) {
    const lines = this.getPrimitiveControlLines(state.module, state.constantHarmony);

    const allElements = [];
    const allChannels = [];


    for (let j=0; j<lines.length; j++) {
        const controlLine = lines[j];
        const controlChannel = state.module.getControlChannel(controlLine.channel);
        if (!controlChannel) {
            logit(" could not find control channel " + controlLine.channel);
            continue;
        }
        const elements = controlLine.getPrimitiveControlElements(state.module, state.constantHarmony);
        for (var i=0; i<elements.length; i++) {
            allChannels.push(controlChannel);
        }

        addAll(allElements, elements);
    }

    const beatLength = state.constantHarmony.getBeatLength();

    for (var i=0; i<allElements.length; i++) {
        const e = allElements[i];
        state.controlChannel = allChannels[i];
        state.controlSlotData = state.controlSlotDatas[state.controlChannel.id];
        if (! state.controlSlotData) {
            state.controlSlotData = state.controlChannel.createSlotData(beatLength);
            state.controlSlotDatas[state.controlChannel.id] = state.controlSlotData;
        }
        e.renderBatch(state);
    }


};

function PrimitiveControlLine() {
    ControlLine.call(this);
    this.channel = "";
    this.controlElements = [];
    this._constructorName = "PrimitiveControlLine";
}

PrimitiveControlLine.prototype = new ControlLine();


PrimitiveControlLine.prototype.getPrimitiveControlElements = function(module, harmony) {
    const result = [];
    for (let i=0; i<this.controlElements.length; i++) {
        const e = this.controlElements[i];
        addAll(result, e.getPrimitiveControlElements(module, harmony));
    }
    return result;
};


PrimitiveControlLine.prototype.addControlElement = function(e) {
    this.controlElements.push(e);
    return this;
};

function ControlElement() {
    this.id = "";
    this.active = true;

    this._constructorName = "ControlElement";
}

ControlElement.prototype.getPrimitiveControlElements = function(module, harmony) {
    return [this];
};


function PositionedControlElement() {
    ControlElement.call(this);
    this.startTime = 0;
    this.startTimeUnit = PositionUnit.BEATS;

    this.endTime = 1;
    this.endTimeUnit = PositionUnit.BEATS;

    this.controlOffset = 0; // An extra "write"-pointer offset
    this.controlOffsetUnit = PositionUnit.BEATS;
    this._constructorName = "PositionedControlElement";

}

PositionedControlElement.prototype = new ControlElement();


function MultiStepControlElement() {
    PositionedControlElement.call(this);
    this.startIndices = [];
    this.indices = [];
    this.endIndices = [];

    this.elements = [];
    this._constructorName = "MultiStepControlElement";
}
MultiStepControlElement.prototype = new PositionedControlElement();

MultiStepControlElement.prototype.getPrimitiveControlElements = function(module, harmony) {
    const result = [];

    const active = getValueOrExpressionValue(this, "active", module);
    if (!active) {
        return result;
    }

    let currentBeat = positionUnitToBeats2(this.startTime, this.startTimeUnit, 0, harmony);

    const harmonyBeatLength = harmony.getBeatLength();

    const startIndices = getValueOrExpressionValue(this, "startIndices", module);
    const indices = getValueOrExpressionValue(this, "indices", module);
    const endIndices = getValueOrExpressionValue(this, "endIndices", module);

//    logit(startIndices + " " + indices + " " + endIndices);

    if (this.verbose) {
        logit(this._constructorName + " " + startIndices + " " + indices + " " + endIndices + " " + this.activeExpression + " " + this.activeUseExpression);
    }

    const that = this;

    function getLength(testIndices, beatOffset, elements) {
        let result = 0;
        for (let i=0; i<testIndices.length; i++) {
            const index = testIndices[i];
            if (index < elements.length) {
                const element = elements[index];
                const primitiveElements = element.getPrimitiveControlElements(module, harmony);

                let maxEndBeat = 0;
                for (let j=0; j<primitiveElements.length; j++) {
                    const pElement = primitiveElements[j];
                    const endBeat = positionUnitToBeats2(pElement.endTime, pElement.endTimeUnit, result, harmony);
//                    logit("   endBeat in getLength(): " + endBeat + " pElement.endTime: " + pElement.endTime + " pElement.endTimeUnit: " + pElement.endTimeUnit);
//                    logit("    " + JSON.stringify(pElement));
                    maxEndBeat = Math.max(maxEndBeat, endBeat);
                }
                result += maxEndBeat;
            }
        }
        return result;
    }

    function appendWithIndex(index, beatOffset, elements) {

        if (that.verbose) {
            logit("  Rendering at index " + index + " beat: " + beatOffset);
        }


        const beatStep = 1;
        if (index < elements.length) {
            let element = elements[index];
            element = copyObjectDeep(element);
            const primitiveElements = element.getPrimitiveControlElements(module, harmony);

            let maxEndBeat = 0;
            for (let i=0; i<primitiveElements.length; i++) {
                const pElement = primitiveElements[i];

                // Shift the position
                const startBeat = positionUnitToBeats2(pElement.startTime, pElement.startTimeUnit, 0, harmony);
                const endBeat = positionUnitToBeats2(pElement.endTime, pElement.endTimeUnit, 0, harmony);

                pElement.startTime = startBeat + beatOffset;
                pElement.startTimeUnit = PositionUnit.BEATS;
                pElement.endTime = endBeat + beatOffset;
                pElement.endTimeUnit = PositionUnit.BEATS;

                result.push(pElement);

                maxEndBeat = Math.max(maxEndBeat, endBeat);
            }
            return Math.max(1, maxEndBeat);
        }
        return beatStep;
    }

    let stepIndex = 0;
    while (currentBeat < harmonyBeatLength) {

        let beatStep = 1;

        // Check the length of the end
        const endLength = getLength(endIndices, currentBeat, this.elements);

        let renderEnd = false;

        if (stepIndex < startIndices.length) {
            var index = startIndices[stepIndex];
            beatStep = getLength([index], currentBeat, this.elements);
            if (currentBeat + beatStep + endLength <= harmonyBeatLength) {
                beatStep = appendWithIndex(index, currentBeat, this.elements);
            } else {
                renderEnd = true;
            }
        } else if (indices.length > 0) {
            var index = indices[positiveMod(stepIndex - startIndices.length, indices.length)];
            beatStep = getLength([index], currentBeat, this.elements);
            if (currentBeat + beatStep + endLength <= harmonyBeatLength) {
                beatStep = appendWithIndex(index, currentBeat, this.elements);
            } else {
                renderEnd = true;
            }
        } else if (currentBeat + beatStep + endLength > harmonyBeatLength) {
            renderEnd = true;
        }

        if (renderEnd) {
            beatStep = harmonyBeatLength - currentBeat;
            currentBeat = harmonyBeatLength - endLength;
            let totalBeatStep = 0;
            for (let i=0; i<endIndices.length; i++) {
                totalBeatStep += appendWithIndex(endIndices[i], currentBeat, this.elements);
            }
            if (totalBeatStep > 0.01) {
                beatStep = totalBeatStep;
            }
            break;
        }

        currentBeat += beatStep;
        stepIndex++;
    }

    return result;
};


function MultiParallelControlElement() {
    PositionedControlElement.call(this);
    this.indices = [];

    this.elements = [];
    this._constructorName = "MultiParallelControlElement";
}
MultiParallelControlElement.prototype = new PositionedControlElement();

MultiParallelControlElement.prototype.getPrimitiveControlElements = function(module, harmony) {
    const result = [];

    const active = getValueOrExpressionValue(this, "active", module);
    if (!active) {
        return result;
    }

    const currentBeat = positionUnitToBeats2(this.startTime, this.startTimeUnit, 0, harmony);

    const indices = getValueOrExpressionValue(this, "indices", module);

//    logit(startIndices + " " + indices + " " + endIndices);

    if (this.verbose) {
        logit(this._constructorName + " " + indices + " " + this.activeExpression + " " + this.activeUseExpression);
    }

    const that = this;


    function appendWithIndex(index, beatOffset, elements) {
        if (that.verbose) {
            logit(that._constructorName + " Rendering at index " + index + " beat: " + beatOffset);
        }
        if (index < elements.length) {
            let element = elements[index];
            element = copyObjectDeep(element);
            const primitiveElements = element.getPrimitiveControlElements(module, harmony);

            for (let i=0; i<primitiveElements.length; i++) {
                const pElement = primitiveElements[i];

                // Shift the position
                const startBeat = positionUnitToBeats2(pElement.startTime, pElement.startTimeUnit, 0, harmony);
                const endBeat = positionUnitToBeats2(pElement.endTime, pElement.endTimeUnit, 0, harmony);

                pElement.startTime = startBeat + beatOffset;
                pElement.startTimeUnit = PositionUnit.BEATS;
                pElement.endTime = endBeat + beatOffset;
                pElement.endTimeUnit = PositionUnit.BEATS;

                result.push(pElement);
            }
        }
    }

    for (let i=0; i<indices.length; i++) {
        appendWithIndex(indices[i], currentBeat, this.elements);
    }

    return result;
};


function PrimitiveControlElement() {
    PositionedControlElement.call(this);
    this.batched = false;

    this._constructorName = "PrimitiveControlElement";
}

PrimitiveControlElement.prototype = new PositionedControlElement();


PrimitiveControlElement.prototype.renderBatch = function(state) {

    const active = getValueOrExpressionValue(this, "active", state.module);

    if (!active) {
        return;
    }

    const harmony = state.constantHarmony;

    const startBeatTime = positionUnitToBeats(this.startTime, this.startTimeUnit,
        harmony.tsNumerator, harmony.tsDenominator, harmony);
    const endBeatTime = positionUnitToBeats(this.endTime, this.endTimeUnit,
        harmony.tsNumerator, harmony.tsDenominator, harmony);

    const slotData = state.controlSlotData;
    const channel = state.controlChannel;

    const startSlot = channel.slotsPerBeat * startBeatTime;
    const endSlot = channel.slotsPerBeat * endBeatTime - 1;

    const slotCount = endSlot - startSlot + 1;

    if (this.batched) {
        const slotIndices = [];
        const slotFractions = [];
        for (var i=startSlot; i<=endSlot; i++) {
            var slotFraction = (i - startSlot) / slotCount;
            slotFractions.push(slotFraction);
            slotIndices.push(i);
        }
        this.renderAtSlots(slotIndices, startSlot, endSlot, slotFractions, startBeatTime, endBeatTime, state, slotData);
    } else {
        for (var i=startSlot; i<=endSlot; i++) {
            var slotFraction = (i - startSlot) / slotCount;
            this.renderAtSlot(i, startSlot, endSlot, slotFraction, startBeatTime, endBeatTime, state, slotData);
        }
    }
};


PrimitiveControlElement.prototype.renderAtSlot = function(slotIndex, startSlot, endSlot, slotFraction,
                                                          startBeatTime, endBeatTime, state, slotData) {
};
PrimitiveControlElement.prototype.renderAtSlots = function(slotIndices, startSlot, endSlot, slotFractions,
                                                           startBeatTime, endBeatTime, state, slotData) {
};


function CurveControlElement() {
    PrimitiveControlElement.call(this);
    this.curve = "";

    this.cycles = 1.0;
    this.cyclesUnit = CyclesUnit.CYCLES_PER_PERIOD;

    this.amplitude = 1.0;
    this.bias = 0.0;
    this.phase = 0.0;
    this.frequencyMultiplier = 1.0;

    this.constantValue = 0.0; // When no curve is selected or not found

    this.theCurve = null;
    this._constructorName = "CurveControlElement";
}

CurveControlElement.prototype = new PrimitiveControlElement();



CurveControlElement.prototype.renderAtSlot = function(slotIndex, startSlot, endSlot, slotFraction,
                                                      startBeatTime, endBeatTime, state, slotData) {

    const x = slotFraction;

    this.theCurve = CurveComputation.prototype.getCurveReference(state.module, this.theCurve, this.curve);

    const rawValue = CurveComputation.prototype.getCurveOrConstantValue(state.module,
        this.frequencyMultiplier * (x + this.phase),
        this.theCurve, this.constantValue);
    const value = this.bias + this.amplitude * rawValue;

    if (this.verbose) {
        logit(this._constructorName + " writing " + value + " at " + slotIndex + " rawValue: " + rawValue + " amp: " + this.amplitude + " bias: " + this.bias + " slotFraction: " + slotFraction);
    }

    state.controlChannel.writeDouble(slotIndex, slotData, value);
};


function NaturalTempoCurveControlElement() {
    SectionModifier.call(this);
    this.baseTempo = 120.0;
    this.prevTempo = 120.0;
    this.currentTempo = 120.0;
    this.nextTempo = 120.0;

    // The default settings is to span a complete harmony
    this.startTime = 0;
    this.startTimeUnit = PositionUnit.HARMONY;
    this.endTime = 1;
    this.endTimeUnit = PositionUnit.HARMONY;


    this.batched = true; // so that renderAtSlots() is called

    this._constructorName = "NaturalTempoCurveControlElement";
}

NaturalTempoCurveControlElement.prototype = new PrimitiveControlElement();

NaturalTempoCurveControlElement.prototype.renderAtSlots = function(slotIndices, startSlot, endSlot, slotFractions,
                                                                   startBeatTime, endBeatTime, state, slotData) {

    const baseTempo = getValueOrExpressionValue(this, "baseTempo", state.module);
    const prevTempo = getValueOrExpressionValue(this, "prevTempo", state.module);
    const currentTempo = getValueOrExpressionValue(this, "currentTempo", state.module);
    const nextTempo = getValueOrExpressionValue(this, "nextTempo", state.module);

//    logit(this._constructorName + " prev: " + prevTempo + " cur: " + currentTempo + " next: " + nextTempo);

    const largeFraction = 0.95;
    const smallFraction = 1.0 - largeFraction;

    const fractionAboveCurrent = currentTempo / baseTempo;
    const fractionAbovePrev = prevTempo / baseTempo;
    const fractionAboveNext = nextTempo / baseTempo;

    const halfPrev = 0.5 * (fractionAbovePrev + 1.0);
    const halfNext = 0.5 * (fractionAboveCurrent + 1.0);

    // End increase always ends with the current fraction
    // Start increase always starts with previous fraction
    // Start decrease always starts half between prev and base fraction
    // End decrease always ends with half between current and base fraction
    //

    const increaseXValues = [0, 1];
    const increaseYValues = [fractionAbovePrev, fractionAboveCurrent];

    const increaseDecreaseXValues = [0, largeFraction, 1];
    const increaseDecreaseYValues = [fractionAbovePrev, fractionAboveCurrent, halfNext];

    const decreaseIncreaseXValues = [0.0, smallFraction, 1];
    const decreaseIncreaseYValues = [halfPrev, 1.0, fractionAboveCurrent];

    const decreaseIncreaseDecreaseXValues = [0.0, smallFraction, largeFraction, 1];
    const decreaseIncreaseDecreaseYValues = [halfPrev, 1.0, fractionAboveCurrent, halfNext];

    let xValues = increaseXValues;
    let yValues = increaseYValues;
//    logit("prev: " + prevTempo + " cur: " + currentTempo + " next: " + nextTempo);
    if (currentTempo < prevTempo) {
        if (nextTempo >= currentTempo) {
            xValues = decreaseIncreaseXValues;
            yValues = decreaseIncreaseYValues;
        } else {
            xValues = decreaseIncreaseDecreaseXValues;
            yValues = decreaseIncreaseDecreaseYValues;
        }
    } else if (currentTempo >= prevTempo) {
        // When the tempos are same, there should be an increase anyway
        if (nextTempo >= currentTempo) {
            xValues = increaseXValues;
            yValues = increaseYValues;
        } else {
            xValues = increaseDecreaseXValues;
            yValues = increaseDecreaseYValues;
        }
    }
    // Creating a new interpolator for each call, wasteful but maybe not that terrible...
    const func = new LinearInterpolator(xValues, yValues);


//    logit("  xValues: " + xValues.join(", ") + " yValues: " + yValues.join(", "));

    for (let i=0; i<slotIndices.length; i++) {
        const x = slotFractions[i];
        const slotIndex = slotIndices[i];
        const value = func.interpolate(x);

        state.controlChannel.writeDouble(slotIndex, slotData, value);
    }

//    state.controlChannel.writeDouble(slotIndex, slotData, value);
};






