

class LatticeNoise {
    constructor(rnd, sizeExponent) {
        sizeExponent = sizeExponent ? Math.min(12, Math.max(2, sizeExponent)) : 9;
        this.TAB_SIZE = Math.round(Math.pow(2, sizeExponent));
        this.TAB_MASK = this.TAB_SIZE - 1;
        this.valueTab = [];
        this.rnd = rnd ? rnd : Math.random;
        this.fillValueTab();
    }
    fillValueTab() {
        for (let i = 0; i < this.TAB_SIZE; i++) {
            this.valueTab[i] = 1.0 - 2.0 * this.rnd.random();
        }
    }
    whiteNoise1(x) {
        const ix = Math.floor(x);
        return this.latticeValue1(ix);
    }
    whiteNoise2(x, y) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        return this.latticeValue2(ix, iy);
    }
    lerpNoise1(x) {
        const ix = Math.floor(x);
        const fx = x - ix;
        return lerp(fx, this.latticeValue1(ix), this.latticeValue1(ix + 1));
    }
    cubicNoise1(x) {
        const ix = Math.floor(x);
        const fx = x - ix;
        const xknots4 = [];
        for (let i = -1; i <= 2; i++) {
            xknots4[i + 1] = this.latticeValue1(ix + i);
        }
        return SplineInterpolation.interpolate(fx, xknots4);
    }
    quadraticNoise1(x) {
        const ix = Math.floor(x);
        const fx = x - ix;
        const xknots3 = [];
        for (let i = -1; i <= 1; i++) {
            xknots3[i + 1] = this.latticeValue1(ix + i);
        }
        return QuadraticSplineInterpolation.interpolate(fx, xknots3);
    }
    latticeValue1(ix) {
        return this.valueTab[this.index1(ix)];
    }
    latticeValue2(ix, iy) {
        return this.valueTab[this.index2(ix, iy)];
    }
    index1(ix) {
        return hash(ix) & this.TAB_MASK;
    }
    index2(ix, iy) {
        return hash(iy + hash(ix)) & this.TAB_MASK;
    }
}
