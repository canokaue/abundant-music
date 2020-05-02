
class Rndm {
    constructor(seed) {
        this.seed = seed;
        this.currentSeed = seed;
    }
    setSeed(newSeed) {
        this.seed = newSeed;
        this.currentSeed = newSeed;
    }
    random() {
        return (this.currentSeed = (this.currentSeed * 16807) % 2147483647) / 0x7FFFFFFF + 0.000000000233;
    }
}
