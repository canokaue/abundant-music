const MelodyOffsetLevel = {
    VERY_LOW: -2,
    LOW: -1,
    MIDDLE: 0,
    HIGH: 1,
    VERY_HIGH: 2,

    toString: function(t) {
        switch (t) {
            case MelodyOffsetLevel.HIGH:
                return "High";
            case MelodyOffsetLevel.LOW:
                return "Low";
            case MelodyOffsetLevel.MIDDLE:
                return "Middle";
            case MelodyOffsetLevel.VERY_HIGH:
                return "Very high";
            case MelodyOffsetLevel.VERY_LOW:
                return "Very low";
        }
        return "Unknown melody offset level " + t;
    }
};
addPossibleValuesFunction(MelodyOffsetLevel, MelodyOffsetLevel.VERY_LOW, MelodyOffsetLevel.VERY_HIGH);
