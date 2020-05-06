
function applyHarmonyModifiers(elements, modifiers, module) {
    for (let i=0; i<modifiers.length; i++) {
        const modifier = modifiers[i];
        elements = modifier.modifyConstantHarmonyElements(elements, module);
    }
    return elements;
}


function ConstantHarmonicRythm(harmonyElements) {
    this.harmonyElements = harmonyElements ? harmonyElements : [];
    this.modifiers = [];
    this._constructorName = "ConstantHarmonicRythm";
}

ConstantHarmonicRythm.prototype.toRomanString = function() {
    let result = "[";
    let prevScaleBase = -1;
    let prevScaleType = -1;
    for (let i=0; i<this.harmonyElements.length; i++) {
        const e = this.harmonyElements[i];
        result += e.toRomanString();
        const baseNote = e.getBaseNote();
        const scaleType = e.getScaleType();
        if (baseNote != prevScaleBase || scaleType != prevScaleType) {
            result += "(" + toPitchClassString(baseNote) + " " + ScaleType.toString(scaleType) + ")";
            prevScaleBase = baseNote;
            prevScaleType = scaleType;
        }
        if (i<this.harmonyElements.length - 1) {
            result += ", ";
        }
    }
    result += "]";
    return result;
};


ConstantHarmonicRythm.prototype.getCount = function() {
    return this.harmonyElements.length;
};

ConstantHarmonicRythm.prototype.get = function(index) {
    return this.harmonyElements[index];
};

ConstantHarmonicRythm.prototype.getConstantHarmonyElements = function(module, beatOffset) {
    const result = [];
    for (let i=0; i<this.harmonyElements.length; i++) {
        const element = this.harmonyElements[i];
        const list = element.getConstantHarmonyElements(module, beatOffset);
        addAll(result, list);
    }
    return applyHarmonyModifiers(result, this.modifiers, module);
};

ConstantHarmonicRythm.prototype.getPhraseRanges = function() {
    const result = [];
    let prevStartIndex = 0;
    for (let i=0; i<this.getCount(); i++) {
        const he = this.get(i);
        if (he instanceof ConstantHarmonyElement) {
            if (he.startsPhrase && i > 0) {
                result.push([prevStartIndex, i - 1]);
                prevStartIndex = i;
            }
        }
    }
    result.push([prevStartIndex, this.getCount() - 1]);
    return result;
};

ConstantHarmonicRythm.prototype.getPhraseRangeBeatLength = function(range) {
    let result = 0;
    for (let i=range[0]; i<=range[1]; i++) {
        const he = this.get(i);
        if (he instanceof ConstantHarmonyElement) {
            result += he.getBeatLength();
        } else {
            logit("Please do not call getPhraseRangeBeatLength() on " + he._constructorName + " <br />");
        }
    }
    return result;
};

ConstantHarmonicRythm.prototype.getPhraseRangeAt = function(beatTime) {
    const harmonyIndex = this.getHarmonyIndexAt(beatTime);
    const phraseRanges = this.getPhraseRanges();
    for (let i=0; i<phraseRanges.length; i++) {
        const range = phraseRanges[i];
        if (range[0] <= harmonyIndex && harmonyIndex <= range[1]) {
            return [range[0], range[1]];
        }
    }
    return [0, this.getCount() - 1];
};

ConstantHarmonicRythm.prototype.getHarmonyIndexAt = function(beatTime) {
    if (beatTime < 0.0) {
        return 0;
    }

    let result = this.harmonyElements.length - 1;
    let currentTime = 0.0;
    for (let i=0; i<this.harmonyElements.length; i++) {
        const e = this.harmonyElements[i];
        const beatLength = positionUnitToBeats(e.length, e.lengthUnit, e.tsNumerator, e.tsDenominator);

        if (beatTime >= currentTime && beatTime < currentTime + beatLength) {
            result = i;
            break;
        }
        currentTime += beatLength;
    }

    return result;
};

ConstantHarmonicRythm.prototype.getHarmonyAt = function(beatTime) {
    return this.harmonyElements[this.getHarmonyIndexAt(beatTime)];
};

ConstantHarmonicRythm.prototype.getBeatLengthUntilIndex = function(endIndex) {
    let result = 0.0;
    for (let i=0; i<Math.min(this.harmonyElements.length, endIndex); i++) {
        const e = this.harmonyElements[i];
        const beatLength = positionUnitToBeats(e.length, e.lengthUnit, e.tsNumerator, e.tsDenominator);
        result += beatLength;
    }
    return result;
};


ConstantHarmonicRythm.prototype.getBeatLength = function() {
    let result = 0.0;
    for (let i=0; i<this.harmonyElements.length; i++) {
        const e = this.harmonyElements[i];
        const beatLength = positionUnitToBeats(e.length, e.lengthUnit, e.tsNumerator, e.tsDenominator);
        result += beatLength;
    }
    return result;
};


