import React from 'react';

import d3 from 'd3';
import _ from 'lodash';
import {XYPlot} from 'reactochart';

//import VectorGrid from 'components/VectorGrid';
import makeWallpaper from 'components/Wallpaper';
import FlowField from 'components/FlowField';
import FunctionInput from 'components/FunctionInput';
import NumberInput from 'components/NumberInput';

window.d3 = d3;

const VectorWallpaper = makeWallpaper(class VectorContainer extends React.Component {
    static propTypes = {
        width: React.PropTypes.number,
        height: React.PropTypes.number,
        domain: React.PropTypes.objectOf({x: React.PropTypes.array, y: React.PropTypes.array}),
        vx: React.PropTypes.function,
        vy: React.PropTypes.function,
        color: React.PropTypes.function,
        particleCount: React.PropTypes.number,
        fadeAmount: React.PropTypes.number
    };
    static defaultProps = {
        width: 800,
        height: 600,
        domain: {x: [-10, 10], y: [-10, 10]},
        vx: _.identity,
        vy: _.identity
    };

    componentWillMount() {
        const startTime = new Date().getTime();
        // creates wrapped versions of vector functions with extra param: time since start
        // todo: see how slow this is, move to FlowField so it's only done once for all functions
        this._timed = (func) => ((x, y) => {
            return func(x, y, (new Date().getTime() - startTime) / 1000, d3);
            //return func(newX, newY, (new Date().getTime() - startTime) / 1000);
        });
    }
    render() {
        const {width, height, domain, vx, vy, color, particleCount, fadeAmount} = this.props;

        const dpiMult = (window.devicePixelRatio >= 2) ? 2 : 1;
        //const width = this.props.width * dpiMult;
        //const height = this.props.height * dpiMult;
        const style = (dpiMult === 2) ?
            {transform: 'scale(0.5) translate(-50% -50%)'} : {};

        return <div>
            <XYPlot
                {...{height, width, domain}}
                nice={false} showLabels={false}
                showGrid={false} showTicks={false}
            >
                <FlowField {...{
                    particleCount, fadeAmount, useSimpleFade: true,
                    lineWidth: 2,
                    vx: this._timed(vx),
                    vy: this._timed(vy),
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
            vx: function(x, y) { return ((Math.cos(x) + Math.cos(y)) * 10); },
            vy: function(x, y) { return ((Math.sin(y) + Math.cos(x)) * 10); },
            domain: {
                x: [-5, 5].map((n) => n * aspectRatio),
                y: [-5, 5]
            },
            //color: function(x, y, t) { return `rgb(${t*5}, ${t*4}, ${t*3})`; }
            //color: function(x, y, t) { return 'red'; },
            //color: function(x, y, t) { return `rgb(10, ${(t*40)%255}, ${(t*54)%255})`; },
            color: (x, y, t, d3) => d3.hsl(x*t, Math.abs(y*20), Math.abs(y)),
            //color: function(x, y, t) { window.d3.hsl(x*20, Math.abs(y*20), Math.abs(y)) },
            particleCount: 1000,
            //fadeAmount: 1
            fadeAmount: 0
        };
    }

    _onUpdateState(key, value) {
        this.setState({[key]: value});
    }
    _onChangeNumberState(key, event, value) {
        this.setState({[key]: value});
    }

    render() {
        return <div>
            {/* this.renderVectorField() */}
            <VectorWallpaper
                {..._.pick(this.state, ['vx', 'vy', 'color', 'particleCount', 'domain', 'fadeAmount'])}
                useDPI={true}
            />
            <div>
                <FunctionInput {...{
                    value: this.state.vx,
                    funcParams: ['x', 'y', 't', 'd3'],
                    onValidChange: this._onUpdateState.bind(this, 'vx'),
                    checkValid: checkValidVectorFunc
                }} />

                <FunctionInput {...{
                    value: this.state.vy,
                    funcParams: ['x', 'y', 't', 'd3'],
                    onValidChange: this._onUpdateState.bind(this, 'vy'),
                    checkValid: checkValidVectorFunc
                }} />

                <FunctionInput {...{
                    value: this.state.color,
                    funcParams: ['x', 'y', 't', 'd3'],
                    onValidChange: this._onUpdateState.bind(this, 'color'),
                    checkValid: checkValidColorFunc
                }} />

                <div>
                    <NumberInput {...{
                        value: this.state.particleCount,
                        onValidChange: this._onChangeNumberState.bind(this, 'particleCount')
                    }} />
                </div>
                <div>
                    <NumberInput {...{
                        value: this.state.fadeAmount,
                        onValidChange: this._onChangeNumberState.bind(this, 'fadeAmount')
                    }} />
                </div>
            </div>
        </div>;
    }
}

function checkValidVectorFunc(func) {
    return _.isFinite(func(0, 0, 1));
}
function checkValidColorFunc(func) {
    // hard to check valid color, just make sure it doesn't barf
    func(0, 0, 1);
    return true;
}

function unwrapFuncStr(funcStr) {
    const funcBeginRegEx =  /^\s*function\s*\w*\(([\w,\s]*[\n\/\*]*)\)\s*\{[\s\n]*/;
    const funcEndRegEx = /\s*}\s*$/; // ' } '
    // peel the "function() {}" wrapper off of a function string (to make an 'internal function string')
    return funcStr.replace(funcBeginRegEx, '').replace(funcEndRegEx, '')
}
function ensureFunc(funcStr, params) {
    return _.isString(funcStr) ? 0 : 0;
}