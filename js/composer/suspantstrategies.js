

function SuspAntStrategy() {
    this.id = "";
    this.voiceLines = [];
    
    this._constructorName = "SuspAntStrategy";
}

SuspAntStrategy.prototype.getNewLengthsSuspend = function(toIncreaseBeatLength, toDecreaseBeatLength, harmony, harmonyBeatOffset) {
    const newIncreasedBeatLength = toIncreaseBeatLength;
    const newDecreasedBeatLength = toDecreaseBeatLength;

    return [newIncreasedBeatLength, newDecreasedBeatLength];
};

SuspAntStrategy.prototype.getNewLengthsAnticipate = function(toIncreaseBeatLength, toDecreaseBeatLength, harmony, harmonyBeatOffset) {
    return this.getNewLengthsSuspend(toIncreaseBeatLength, toDecreaseBeatLength, harmony, harmonyBeatOffset);
};


SuspAntStrategy.prototype.changeLengths = function(incIndex, decIndex, suspend, harmony) {
    const toInc = harmony.get(incIndex);
    const toDec = harmony.get(decIndex);

    const incBeats = toInc.getBeatLength();
    const decBeats = toDec.getBeatLength();

    let newLengths = [];
    if (suspend) {
        newLengths = this.getNewLengthsSuspend(incBeats, decBeats, harmony, 0);
    } else {
        newLengths = this.getNewLengthsAnticipate(incBeats, decBeats, harmony, 0);
    }

    toInc.length = newLengths[0];
    toInc.lengthUnit = PositionUnit.BEATS;
    toDec.length = newLengths[1];
    toDec.lengthUnit = PositionUnit.BEATS;

//    function strangeLength(l) {
//        return l != 1 || l != 2 || l != 3 || l != 4 || l != 6 || l != 8;
//    }
//    if (strangeLength(toInc.length)) {
//        logit("Strange length detected in toInc " + toInc.length);
//    }
//    if (strangeLength(toDec.length)) {
//        logit("Strange length detected in toDec " + toDec.length);
//    }

};

SuspAntStrategy.prototype.createVoiceLineHarmony = function(voiceLine, harmony, module) {
    //    logit("Entering voice line harmony " + voiceLine.size() + " <br />");
    for (let i=0; i<voiceLine.size(); i++) {
        const vle = voiceLine.get(i);
        if (vle.suspend) {
//            logit("suspending " + i + ": " + arrayElementsPropertyToString(harmony.harmonyElements, "length").join(", ") + "<br /><br /><br />");
            harmony = this.suspend(i, harmony, module);
//            logit("suspending result: " + arrayElementsPropertyToString(harmony.harmonyElements, "length").join(", ") + "<br /><br /><br />");
        } else if (vle.anticipate) {
            harmony = this.anticipate(i, harmony, module);
        }
    }
    return harmony;
};


SuspAntStrategy.prototype.suspend = function(index, harmony, module) {
    let result = harmony;

    // Can not suspend final harmony element
    if (index < result.getCount() - 1) {
        result = copyValueDeep(result);
        this.changeLengths(index, index + 1, true, result);
    }
    return result;
};

SuspAntStrategy.prototype.anticipate = function(index, harmony, module) {
    let result = harmony;

    // Can not anticipate the first harmony element
    if (index > 0) {
        result = copyValueDeep(result);
        this.changeLengths(index, index - 1, false, result);
    }
    return result;
};




function SimpleSuspAntStrategy() {
    SuspAntStrategy.call(this);
    this.possibleLengthIncrements = [1];
    this.possibleLengthIncrementUnit = PositionUnit.BEATS;

    this.possibleNewLengths = [1, 2, 3, 4, 6, 8];

    this.minLength = 1;
    this.minLengthUnit = PositionUnit.BEATS;

    this._constructorName = "SimpleSuspAntStrategy";
}

SimpleSuspAntStrategy.prototype = new SuspAntStrategy();

SimpleSuspAntStrategy.prototype.getNewLengthsSuspend = function(toIncreaseBeatLength, toDecreaseBeatLength, harmony, harmonyBeatOffset) {
    let newIncreasedBeatLength = toIncreaseBeatLength;
    let newDecreasedBeatLength = toDecreaseBeatLength;

    const minBeatLength = positionUnitToBeats2(this.minLength, this.minLengthUnit, harmonyBeatOffset, harmony);

    for (let i=0; i<this.possibleLengthIncrements.length; i++) {
        const testLength = this.possibleLengthIncrements[i];
        const testBeats = positionUnitToBeats2(testLength, this.possibleLengthIncrementUnit, harmonyBeatOffset, harmony);

        if (!arrayContains(this.possibleNewLengths, toDecreaseBeatLength - testBeats)) {
            continue;
        }
        if (!arrayContains(this.possibleNewLengths, toIncreaseBeatLength + testBeats)) {
            continue;
        }

        if (toDecreaseBeatLength - testBeats >= minBeatLength) {
            newDecreasedBeatLength -= testBeats;
            newIncreasedBeatLength += testBeats;
            break;
        }

    }
    return [newIncreasedBeatLength, newDecreasedBeatLength];
};
