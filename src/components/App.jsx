import React from 'react';
import d3 from 'd3';
import _ from 'lodash';
import qs from 'qs';
import {XYPlot} from 'reactochart';
import RadioGroup from 'react-radio';

import makeWallpaper from 'components/Wallpaper';
import FlowField from 'components/FlowField';
import FunctionInput from 'components/FunctionInput';
import NumberInput from 'components/NumberInput';
import ControlPanel from 'components/ControlPanel';

window.d3 = d3;

export const optionPropTypes = {
    domain: React.PropTypes.objectOf({x: React.PropTypes.array, y: React.PropTypes.array}),
    vx: React.PropTypes.function,
    vy: React.PropTypes.function,
    vR: React.PropTypes.function,
    vTheta: React.PropTypes.function,
    color: React.PropTypes.function,
    particleCount: React.PropTypes.number,
    fadeAmount: React.PropTypes.number,
    lineWidth: React.PropTypes.number,
    screenId: React.PropTypes.any
};


const VectorWallpaper = makeWallpaper(class VectorContainer extends React.Component {
    static propTypes = _.assign({}, optionPropTypes, {
        width: React.PropTypes.number,
        height: React.PropTypes.number
    });
    static defaultProps = {
        width: 800,
        height: 600,
        domain: {x: [-10, 10], y: [-10, 10]},
        screenId: 0
    };

    componentWillMount() {
        const startTime = new Date().getTime();
        // creates wrapped versions of vector functions with extra param: time since start
        // todo: see how slow this is, move to FlowField so it's only done once for all functions
        this._timed = (func) => ((x, y, r, theta) => {
            return func(x, y, r, theta, (new Date().getTime() - startTime) / 1000);
        });
    }
    render() {
        const {
            width, height, domain, vx, vy, vr, vTheta, color, particleCount, fadeAmount, lineWidth, screenId
            } = this.props;

        return <div>
            <XYPlot
                {...{height, width, domain}}
                nice={false} showLabels={false}
                showGrid={false} showTicks={false}
            >
                <FlowField {...{
                    particleCount, fadeAmount, lineWidth, screenId,
                    //useSimpleFade: true,
                    vx: vx ? this._timed(vx) : undefined,
                    vy: vy ? this._timed(vy) : undefined,
                    vr: vr ? this._timed(vr) : undefined,
                    vTheta: vTheta ? this._timed(vTheta) : undefined,
                    color: color ? this._timed(color) : undefined
                }} />
            </XYPlot>
        </div>;
    }
});

export default class App extends React.Component {
    constructor(props) {
        super(props);
        const aspectRatio = window ? (window.innerWidth / window.innerHeight) : 1.75;

        this.state = {
            isPolar: false,
            // first velocity function, X (cartesian) or R (polar)
            //vA: function(x, y, r, theta, t) { return ((Math.cos(x) + Math.cos(y)) * 10); },
            vA: function(x, y, r, theta, t) { return (Math.cos(r) + Math.cos(theta)) * 10; },
            // second velocity function, Y (cartesian) or Theta (polar)
            //vB: function(x, y, r, theta, t) { return ((Math.sin(x) * Math.cos(y)) * 10); },
            vB: function(x, y, r, theta, t) { return (Math.cos(r) * Math.cos(theta)) * 10; },
            //vr: function(x, y) { return Math.cos(x) * 10; },
            //vTheta: function(x, y) { return Math.sin(y)  * 10; },
            domain: {
                x: [-5, 5].map((n) => n * aspectRatio),
                y: [-5, 5]
            },
            //color: function(x, y, r, theta, t) { return `rgb(10, ${(t*40)%255}, ${(t*54)%255})`; },
            //color: (x, y, t) => window.d3.hsl(x * t, Math.abs(Math.sin(y)), Math.abs(Math.sin(y*1.4)) - 0.3).toString(),
            //color: (x, y, t) => window.d3.hsl(x * t, Math.abs(y * 20), Math.abs(Math.sin(y))).toString(),
            color: (x, y, r, theta, t) => window.d3.lab(80 - (r * 13), y * 20 * Math.random(), x * 20 * Math.random()).toString(),
            particleCount: 1000,
            fadeAmount: 0,
            lineWidth: 2
        };
    }

    componentDidMount() {
        this._loadStateFromUrl();
        window.onpopstate = this._loadStateFromUrl;
    }

    _loadStateFromUrl = () => {
        var query = document.location.search;
        if(_.includes(query, '?s=')) {
            const stateStr = query.replace('?s=', '');
            const stateObj = deurlify(stateStr);
            this.setState(stateObj);
        }
    };

    _saveStateToUrl = (pushState = true) => {
        const saveStr = urlify(this.state);
        const updateUrl = (pushState ? history.pushState : history.replaceState).bind(history);
        updateUrl({}, 'state', `${document.location.pathname}?s=${saveStr}`);
    };

    _onChangeOption = (key, value, event) => {
        console.log('state update:', key, value);
        const newState = {[key]: value};

        // if no fade, clear screen on settings change
        if(this.state.fadeAmount === 0)
            _.assign(newState, {screenId: +(new Date())});

        this.setState(newState, () => this._saveStateToUrl(true));
    };

    render() {
        const options = _.pick(this.state, [
            'color', 'particleCount', 'domain',
            'fadeAmount', 'lineWidth', 'screenId', 'isPolar'
        ]);
        const {isPolar, vA, vB} = this.state;

        const vectorOptions = this.state.isPolar ?
            {vr: vA, vTheta: vB} :
            {vx: vA, vy: vB};

        return <div>
            <VectorWallpaper useDPI={true} {...options} {...vectorOptions} />
            <ControlPanel onChangeOption={this._onChangeOption} {...options} {...{vA, vB}} />
        </div>;
    }
}

var funcBeginRegEx =  /^\s*function\s*\w*\(([\w,\s]*[\n\/\*]*)\)\s*\{[\s\n]*/, // 'function(a,b,c) { '
    funcEndRegEx = /\s*}\s*$/; // ' } '

function unwrapFuncStr(funcStr) {
    // peel the "function() {}" wrapper off of a function string (to make an 'internal function string')
    return funcStr.replace(funcBeginRegEx, '').replace(funcEndRegEx, '')
}

function urlify(obj, preserveWhitespace = true) {
    // given a nested JS object which may contain functions
    // encode it into a URL-safe string
    const objCopy = _.cloneDeep(obj);
    objCopy.funcStrs = [];
    _.forEach(objCopy, (val, key) => {
        if(!_.isFunction(val)) return;
        let str = val.toString()
            .replace(/(\{)\n\t(\s+)/g, '{\n ')
            .replace(/\n\t(\s+)(\})/g, '\n }');
        objCopy[key] = preserveWhitespace ? str : str.replace(/\s+/g, ' ');
        objCopy.funcStrs.push(key); // save functions as strings, and note which so we can undo
    });

    const objStr = JSON.stringify(objCopy);
    //const qStr = qs.stringify(savedState);
    // base64 encode it, shorter than query string encoding
    return btoa(objStr);
}

function deurlify(str) {
    const objStr = atob(str);
    const obj = JSON.parse(objStr);

    _.forEach(obj.funcStrs || [], funcStrKey => {
        // slightly nicer way to make a function from a string than eval(). only slightly. that regex is badbad
        try {
            var funcStr = obj[funcStrKey];
            var argsMatch = funcStr.match(funcBeginRegEx);
            var args = argsMatch.length ? argsMatch[1].split(/,\s*/) : [];
            if(args.length == 1 && args[0] == '') args = [];

            obj[funcStrKey] = Function.apply(this, _.flatten([args, unwrapFuncStr(funcStr)]));
        } catch(e) {
            throw "failed to parse url function key" + funcStrKey;
        }
    });

    return obj;
}

