import _ from 'lodash';

function negPosRange(n) {
    // returns a range array like [-5, 5], given 5
    return [-Math.abs(n), Math.abs(n)]
}
function makeYRanges(boundaries) {
    boundaries = _.isArray(boundaries) ? boundaries : [boundaries];
    return boundaries.map(boundary => ({y: negPosRange(boundary)}));
}

const vectorFuncs = [
    function(x, y, r, theta, t) { return (Math.cos(r) + Math.cos(theta)) * 10; },
    function(x, y, r, theta, t) { return (Math.sin(r) * Math.cos(theta)) * 10; },
    function(x, y, r, theta, t) { return (Math.cos(r / theta) + Math.cos(theta)) * 10; },
    function(x, y, r, theta, t) { return (Math.cos(r * theta) + Math.sin(theta)) * 10; },
    function(x, y, r, theta, t) { return ((Math.cos(x) + Math.cos(y)) * 10); },
    function(x, y, r, theta, t) { return ((Math.sin(x) * Math.cos(y)) * 10); },
    function(x, y, r, theta, t) { return ((Math.sin(x) * Math.cos(y / x)) * 10); },
    function(x, y, r, theta, t) { return Math.sin(y & theta) * 10; },
    function(x, y, r, theta, t) { return Math.cos(x * y) * 10; },
    function(x, y, r, theta, t) { return x },
    function(x, y, r, theta, t) { return y },
    function(x, y, r, theta, t) { return r },
    function(x, y, r, theta, t) { return theta },
    function(x, y, r, theta, t) { return r / theta },
];

const colorFuncs = [
    function(x, y, r, theta, t) {
        return window.d3.lab(80 - (r * 13), y * 20 * Math.random(), x * 20 * Math.random()).toString();
    },
    function(x, y, r, theta, t) {
        return window.d3.hsl(x * t, Math.abs(y * 20), Math.abs(Math.sin(y))).toString();
    },
    function(x, y, r, theta, t) {
        return window.d3.lab(r * 13, y * 2 * Math.random(), x * 20 * Math.random()).toString();
    }
];

export default {
    // list of possible initial starting states
    // any settings which can be chosen randomly have a "choices" property which is an array of possible choices
    presets: [
        {
            isPolar: {choices: [true, false]},
            // first velocity function, X (cartesian) or R (polar)
            vA: vectorFuncs[0],
            // second velocity function, Y (cartesian) or Theta (polar)
            vB: vectorFuncs[1],
            // shuffle desired Y domains, X will be auto-created from aspect ratio
            domain: {choices: makeYRanges([3, 5, 7, 9])},
            color: colorFuncs[0],
            particleCount: 1000,
            fadeAmount: 0,
            lineWidth: 1
        },
        {
            isPolar: true,
            // first velocity function, X (cartesian) or R (polar)
            vA: function(x, y, r, theta, t) {
                return y & t;
            },
            vB: function(x, y, r, theta, t) {
                return (Math.cos(r * theta) + Math.sin(theta)) * 10;
            },
            domain: {y: negPosRange(5)},
            color: colorFuncs[0],
            particleCount: 1000,
            fadeAmount: 0,
            lineWidth: 1
        },
        {
            isPolar: true,
            particleCount: 3000,
            fadeAmount: 0,
            lineWidth: 0.3,
            domain: {y: negPosRange(5)},
            // first velocity function, X (cartesian) or R (polar)
            vA: function(x, y, r, theta, t) {
                return (Math.cos(r * theta) + Math.sin(theta)) * 10;;
            },
            vB: function(x, y, r, theta, t) {
                return (Math.cos(x) + Math.cos(y)) * 10;
            },
            color: colorFuncs[0]
        },
        {
            isPolar: false,
            particleCount: 3000,
            fadeAmount: 0,
            lineWidth: 0.1,
            domain: {y: negPosRange(7)},
            // first velocity function, X (cartesian) or R (polar)
            vA: function(x, y, r, theta, t) {
                return (Math.cos(r) + Math.floor(theta)) * 10;
            },
            vB: function(x, y, r, theta, t) {
                return Math.round(y) * Math.cos(theta) + Math.sin(x) * 10;
            },
            color: colorFuncs[2]
        }
    ],
    shuffleAll: {
        isPolar: true,
        vA: {choices: vectorFuncs},
        vB: {choices: vectorFuncs},
        domain: {choices: makeYRanges([2, 3, 4, 5, 6, 8,10])},
        color: {choices: colorFuncs},
        particleCount: {choices: [100, 300, 500, 1000, 2000, 3000]},
        fadeAmount: 0,
        lineWidth: {choices: [0.1, 0.3, 0.5, 0.8, 1, 2, 3]}
    }
};

// http://localhost:8228/?s=eyJpc1BvbGFyIjp0cnVlLCJ2QSI6ImZ1bmN0aW9uIGFub255bW91cyh4LHkscix0aGV0YSx0LGZyLHZ4LHZ5XG4vKiovXG4vKiovXG4vKiovXG4vKiovXG4vKiovKSB7XG5yZXR1cm4geSAmIHRcbn0iLCJ2QiI6ImZ1bmN0aW9uIGFub255bW91cyh4LHkscix0aGV0YSx0LGZyLHZ4LHZ5XG4vKiovXG4vKiovXG4vKiovXG4vKiovXG4vKiovXG4vKiovXG4vKiovKSB7XG5yZXR1cm4gKE1hdGguY29zKHIgKiB0aGV0YSkgKyBNYXRoLnNpbih0aGV0YSkpICogMTA7XG59IiwiZG9tYWluIjp7IngiOlstOSw5XSwieSI6Wy01LDVdfSwiY29sb3IiOiJmdW5jdGlvbiBhbm9ueW1vdXMoeCx5LHIsdGhldGEsdCxmclxuLyoqL1xuLyoqLykge1xucmV0dXJuIHdpbmRvdy5kMy5oc2woTWF0aC5hYnMoeCo0KSArIDE5MCwgTWF0aC5hYnMoMS9NYXRoLmNvcyh5KSksIF8uY2xhbXAoTWF0aC5hYnMoTWF0aC5zaW4oTWF0aC5wb3cociwgMikpKSwgMC4xLCAwLjgpKS50b1N0cmluZygpXG59IiwicGFydGljbGVDb3VudCI6MTAwMCwiZmFkZUFtb3VudCI6MCwibGluZVdpZHRoIjoxLCJzY3JlZW5JZCI6MTQ1NTc4MDI4MzA4OSwiZnVuY1N0cnMiOlsidkEiLCJ2QiIsImNvbG9yIl19