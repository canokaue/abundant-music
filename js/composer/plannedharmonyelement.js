class PlannedHarmonyElement extends SequenceHarmonyElement{
    constructor() {
        super()
        this.scaleBaseNote = 60;
        this.scaleType = ScaleType.MAJOR;
        this.seed = 12345;
        this._constructorName = "PlannedHarmonyElement";
    }

    // Options for the planner
    fillOptions (options, module) {
        const lengths = this.getBeatLengths(module);
        const count = lengths.length;

        // All stuff that can be expressions comes here...
        options.scaleBaseNote = getValueOrExpressionValue(this, "scaleBaseNote", module);

        // The actual lengths of the chords must be determined here since the position snapping can
        // decrease the count.

        options.count = count;
        options.seed = this.seed;
    }

    setCount(v) {
        this.count = v;
        return this;
    }
}

class StaticSequenceHarmonyElement extends PlannedHarmonyElement {
    constructor() {
        super()
        this.baseRoot = 0;
        this.baseToBaseLikelihood = 0.01;
        this.baseToNeighbourLikelihood = 1;
        this.baseToPassingLikelihood = 1;
        this.baseToAuxiliaryLikelihood = 1;
        this.auxiliaryToAuxiliaryLikelihood = 0.01;
        this.auxiliaryToBaseLikelihood = 1;
        this.auxiliaryToNeighbourLikelihood = 1;
        this.auxiliaryToPassingLikelihood = 1;
        this.auxiliaryChordRoots = [3, 4];
        this.auxiliaryChordRootLikelihoods = [1, 1];
        this.fromBasePassingChordRoots = [0, 1, 2, 3, 4, 5, 6];
        this.fromBasePassingChordRootLikelihoods = [1];
        this.fromBasePassingIncrements = [-2, 1, 1, 2];
        this.fromBasePassingIncrementLikelihoods = [0.5, 1, 1, 0.5];
        this.fromBasePassingInversions = [0, 1, 2];
        this.fromBasePassingInversionLikelihoods = [0.5, 1, 0.5];
        this.fromBaseNeighbourChordRoots = [0, 1, 2, 3, 4, 5, 6];
        this.fromBaseNeighbourChordRootLikelihoods = [1];
        this.fromAuxiliaryPassingChordRoots = [0, 1, 2, 3, 4, 5, 6];
        this.fromAuxiliaryPassingChordRootLikelihoods = [1];
        this.fromAuxiliaryPassingIncrements = [-2, -1, 1, 2];
        this.fromAuxiliaryPassingIncrementLikelihoods = [0.5, 1, 1, 0.5];
        this.fromAuxiliaryNeighbourChordRoots = [0, 1, 2, 3, 4, 5, 6];
        this.fromAuxiliaryNeighbourChordRootLikelihoods = [1];
        this.canEndWithBase = true;
        this.canEndWithAuxiliary = false;
        this.possibleAuxiliaryEndRoots = [3, 4];
        this._constructorName = "StaticSequenceHarmonyElement";
    }

    fillOptions(options, module) {
        copyObjectPropertiesDeep(options, this);
        PlannedHarmonyElement.prototype.fillOptions.call(this, options, module);
    }
    
    getConstantHarmonyElements(module, beatOffset) {
        if (!module) {
            logit("module missing in " + this._constructorName + "<br />");
            showStacktraceDialog(null, "static sequence harmony");
        }

        const options = {};
        this.fillOptions(options, module);

        const generator = new StaticHarmonyGenerator(options);
        const solution = generator.searchML();

        this.setLengthsAndPhraseStructure(solution, module);

        return solution;
    }
}

class DynamicSequenceHarmonyElement extends PlannedHarmonyElement{
    constructor() {
        super()
        this.modulate = false;
        this.majorModulationTarget = DynamicHarmonyModulationTarget.DOMINANT;
        this.minorModulationTarget = DynamicHarmonyModulationTarget.MEDIANT;
        this.majorStartRoots = [0];
        this.majorStartRootLikelihoods = [1];
        this.majorProgressionRoots = [[0, 1, 2, 3, 4, 5]];
        this.majorProgressionRootLikelihoods = [[1]];
        this.minorProgressionRoots = [[0, 2, 3, 4, 5, 6]];
        this.minorProgressionRootLikelihoods = [[1]];
        this.majorProgressionMovements = [[-4, -2, 1]];
        this.startMajorProgressionMovements = [];
        this.endMajorProgressionMovements = [];
        this.majorProgressionMovementLikelihoods = [[1]];
        this.startMajorProgressionMovementLikelihoods = [];
        this.endMajorProgressionMovementLikelihoods = [];
        this.minorProgressionMovements = [[-4, -2, 1]];
        this.startMinorProgressionMovements = [];
        this.endMinorProgressionMovements = [];
        this.minorProgressionMovementLikelihoods = [[1]];
        this.startMinorProgressionMovementLikelihoods = [];
        this.endMinorProgressionMovementLikelihoods = [];
        this.majorPossibleEndRoots = [1, 3];
        this.minorPossibleEndRoots = [3];
        this.majorModulationPossibleEndRoots = [1, 3];
        this.minorModulationPossibleEndRoots = [3];
        this.passingRoots = [0, 1, 2, 3, 4, 5, 6];
        this.passingRootLikelihoods = [1];
        const options = null;
        this.passingInversions = getValueOrDefault(options, "passingInversions", [1, 2]);
        this.passingInversionLikelihoods = getValueOrDefault(options, "passingInversionLikelihoods", [1, 0.5]);
        this.passingIncrements = getValueOrDefault(options, "passingIncrements", [-2, -1, 1, 2]);
        this.passingIncrementLikelihoods = getValueOrDefault(options, "passingIncrementLikelihoods", [0.5, 1, 1, 0.5]);
        this.neighbourRoots = getValueOrDefault(options, "neighbourRoots", [0, 1, 2, 3, 4, 5, 6]);
        this.neighbourRootLikelihoods = getValueOrDefault(options, "neighbourRootLikelihoods", [1]);
        this.neighbourInversions = getValueOrDefault(options, "neighbourInversions", [1, 2]);
        this.neighbourInversionLikelihoods = getValueOrDefault(options, "neighbourInversionLikelihoods", [1, 0.5]);
        this.expansionRoots = getValueOrDefault(options, "expansionRoots", [0, 1, 2, 3, 4, 5, 6]);
        this.expansionRootLikelihoods = getValueOrDefault(options, "expansionRootLikelihoods", [1]);
        this.expansionInversions = getValueOrDefault(options, "expansionInversions", [1]);
        this.expansionInversionLikelihoods = getValueOrDefault(options, "expansionInversionLikelihoods", [1]);
        this.rootProgressionLikelihood = getValueOrDefault(options, "rootProgressionLikelihood", 1);
        this.repeatRootLikelihood = getValueOrDefault(options, "repeatRootLikelihood", 0);
        this.passingLikelihood = getValueOrDefault(options, "passingLikelihood", 1);
        this.neighbourLikelihood = getValueOrDefault(options, "neighbourLikelihood", 1);
        this.expansionLikelihood = getValueOrDefault(options, "expansionLikelihood", 1);
        this.modulateLikelihoods = [1];
        this.startModulateLikelihoods = [0.01];
        this.endModulateLikelihoods = [0.01];
        this.majorAppliedChords = getValueOrDefault(options, "majorAppliedChords", [AppliedChordType.V, AppliedChordType.V7]);
        this.majorAppliedChordLikelihoods = getValueOrDefault(options, "majorAppliedChordLikelihoods", [1]);
        this.minorAppliedChords = getValueOrDefault(options, "minorAppliedChords", [AppliedChordType.V, AppliedChordType.V7]);
        this.minorAppliedChordLikelihoods = getValueOrDefault(options, "minorAppliedChordLikelihoods", [1]);
        this.addAllMovements = getValueOrDefault(options, "addAllMovements", true); // Adding all possible roots
        this.addAllStarts = getValueOrDefault(options, "addAllStarts", true);
        this._constructorName = "DynamicSequenceHarmonyElement";
    }

    fillOptions(options, module) {
        copyObjectPropertiesDeep(options, this);
        PlannedHarmonyElement.prototype.fillOptions.call(this, options, module);

        options.modulateLikelihoods = [1];
        for (let i=0; i<options.count; i++) {
            options.modulateLikelihoods[i] = getItemFromArrayWithStartEndItems(1, this.modulateLikelihoods, options.count, i, this.startModulateLikelihoods, this.endModulateLikelihoods);
            const progressionCount = options.count > 1 ? options.count - 1 : 1;
            options.majorProgressionMovements[i] = getItemFromArrayWithStartEndItems([-4, -2, 1], this.majorProgressionMovements, progressionCount, i, this.startMajorProgressionMovements, this.endMajorProgressionMovements);
            options.minorProgressionMovements[i] = getItemFromArrayWithStartEndItems([-4, -2, 1], this.minorProgressionMovements, progressionCount, i, this.startMinorProgressionMovements, this.endMinorProgressionMovements);
        }
        
    //    logit("fklsjd: " + options.modulateLikelihoods.join(", ") + " <br />");
    }

    getConstantHarmonyElements(module, beatOffset) {

        if (!module) {
            logit("module missing in " + this._constructorName + "<br />");
            showStacktraceDialog(null, "static sequence harmony");
        }

        const options = {};
        this.fillOptions(options, module);

        const generator = new DynamicHarmonyGenerator(options);
        const solution = generator.searchML();

        // Set the lengths of the solution here... The planner doesn't do that, it is just concerned with strong/weak

        this.setLengthsAndPhraseStructure(solution, module);

        //    logit("Found dynamic solution " + solution + "<br />");
        return solution;
    }
}



const PhraseHarmonyElementShorteningMode = {
    BEATS: 0,

    toString: function(type) {
        switch (type) {
            case PhraseHarmonyElementShorteningMode.BEATS:
                return "Beats";
        }
        return "Unknown phrase harmony element shortening mode " + type;
    }

};
addPossibleValuesFunction(PhraseHarmonyElementShorteningMode, PhraseHarmonyElementShorteningMode.BEATS, PhraseHarmonyElementShorteningMode.BEATS);


class PhraseHarmonyElement extends PlannedHarmonyElement{
    constructor() {
        super()
        this.phraseType = PhraseHarmonyElementType.COMPLETE;
        this.harmonyReference = ""; // Used for derived consequent phrases
        this.modulate = false;
        this.modulateInvertScaleType = false;
        this.majorModulationTarget = DynamicHarmonyModulationTarget.DOMINANT;
        this.minorModulationTarget = DynamicHarmonyModulationTarget.MEDIANT;
        this.modulateRemoveDominant = true;
        this.modulateRemoveInitialTonic = true;
        this.modulateStaticLengthFactor = 0.2;
        this.modulateDynamicLengthFactor = 5;
        this.modulateDominantCadenceLengthFactor = 0.2;
        this.modulateTonicCadenceLengthFactor = 0.2;
        this.majorDeceptiveRoot = 5;
        this.majorDeceptiveInversions = 0;
        this.minorDeceptiveRoot = 5;
        this.minorDeceptiveInversions = 0;
        // LengthAndCountUnit.LENGTH is interpreted as beats
        this.staticHarmonyLength = 25;
        this.staticHarmonyLengthUnit = LengthAndCountUnit.LENGTH_PERCENT;
        this.staticHarmonyLengthLimits = [0, 100];
        this.staticHarmonyLengthLimitsUnit = LengthAndCountUnit.LENGTH_PERCENT;
        this.staticHarmonyLengthImportance = 1.0;
        this.staticHarmonyUseLocalSeed = false;
        this.staticHarmonySeed = 12345;
        this.staticHarmonyRaiseLeadingToneRoots = [4, 6];
        this.staticHarmonyPassingChordLikelihood = 1;
        this.staticHarmonyNeighbourChordLikelihood = 1;
        this.staticHarmonySus2ChordLikelihood = 1;
        this.staticHarmonySus4ChordLikelihood = 1;
        this.staticHarmonySimpleMixtureLikelihood = 1;
        this.dynamicHarmonyLength = 25;
        this.dynamicHarmonyLengthUnit = LengthAndCountUnit.LENGTH_PERCENT;
        this.dynamicHarmonyLengthLimits = [0, 100];
        this.dynamicHarmonyLengthLimitsUnit = LengthAndCountUnit.LENGTH_PERCENT;
        this.dynamicHarmonyLengthImportance = 1.0;
        this.dynamicHarmonyUseLocalSeed = false;
        this.dynamicHarmonySeed = 12345;
        this.dynamicHarmonyRaiseLeadingToneRoots = [];
        this.dynamicHarmonyRaiseLeadingToneAppliedRoots = [4, 6]; // Default is to raise for applied chords
        this.dynamicHarmonyPassingChordLikelihood = 1;
        this.dynamicHarmonyNeighbourChordLikelihood = 1;
        this.dynamicHarmonySus2ChordLikelihood = 1;
        this.dynamicHarmonySus4ChordLikelihood = 1;
        this.dynamicHarmonySimpleMixtureLikelihood = 1;
        this.dominantCadenceHarmonyLength = 1;
        this.dominantCadenceHarmonyLengthUnit = LengthAndCountUnit.COUNT;
        this.dominantCadenceHarmonyLengthLimits = [0, 100];
        this.dominantCadenceHarmonyLengthLimitsUnit = LengthAndCountUnit.LENGTH_PERCENT;
        this.dominantCadenceHarmonyLengthImportance = 1.0;
        this.dominantCadenceHarmonyUseLocalSeed = false;
        this.dominantCadenceHarmonySeed = 12345;
        this.dominantCadenceHarmonyRaiseLeadingToneRoots = [4, 6];
        this.dominantCadenceHarmonyPassingChordLikelihood = 1;
        this.dominantCadenceHarmonyNeighbourChordLikelihood = 1;
        this.dominantCadenceHarmonySus2ChordLikelihood = 1;
        this.dominantCadenceHarmonySus4ChordLikelihood = 1;
        this.dominantCadenceHarmonySimpleMixtureLikelihood = 1;
        this.tonicCadenceHarmonyLength = 1;
        this.tonicCadenceHarmonyLengthUnit = LengthAndCountUnit.COUNT;
        this.tonicCadenceHarmonyLengthLimits = [0, 100];
        this.tonicCadenceHarmonyLengthLimitsUnit = LengthAndCountUnit.LENGTH_PERCENT;
        this.tonicCadenceHarmonyLengthImportance = 1.0;
        this.tonicCadenceHarmonyUseLocalSeed = false;
        this.tonicCadenceHarmonySeed = 12345;
        this.tonicCadenceHarmonyRaiseLeadingToneRoots = [4, 6];
        this.tonicCadenceHarmonyPassingChordLikelihood = 1;
        this.tonicCadenceHarmonyNeighbourChordLikelihood = 1;
        this.tonicCadenceHarmonySus2ChordLikelihood = 1;
        this.tonicCadenceHarmonySus4ChordLikelihood = 1;
        this.tonicCadenceHarmonySimpleMixtureLikelihood = 1;
        this.overrideDefaultPhraseStructure = false; // Set this to true to use the phrase structure counts instead
        // For shortening the phrase, for example in antecedent/consequent phrases
        this.phraseShorteningMode = PhraseHarmonyElementShorteningMode.BEATS;
        this.phraseShorteningBeats = [[4], [4], [2], [2], [2], [1], [1], [1]];
        this.phraseShorteningMinLengths = [1];
        this.phraseShorteningMinLengthUnit = PositionUnit.BEATS;
        this.raiseLeadingTone = true;
        this.maxLengthSearchSteps = 200;
        this._constructorName = "PhraseHarmonyElement";
    }
}
