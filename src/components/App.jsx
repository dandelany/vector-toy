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

const optionPropTypes = {
    domain: React.PropTypes.objectOf({x: React.PropTypes.array, y: React.PropTypes.array}),
    vx: React.PropTypes.function,
    vy: React.PropTypes.function,
    color: React.PropTypes.function,
    particleCount: React.PropTypes.number,
    fadeAmount: React.PropTypes.number,
    lineWidth: React.PropTypes.number
};

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
            //color: function(x, y, t) { return `rgb(10, ${(t*40)%255}, ${(t*54)%255})`; },
            color: (x, y, t) => window.d3.hsl(x * t, Math.abs(Math.sin(y)), Math.abs(Math.sin(y*1.4)) - 0.3).toString(),
            //color: (x, y, t) => window.d3.hsl(x * t, Math.abs(y * 20), Math.abs(Math.sin(y))).toString(),
            //return window.d3.lab(Math.abs(x*10), y*10, 0).toString();
            particleCount: 1000,
            fadeAmount: 0,
            lineWidth: 1
        };
    }

    _onChangeOption(key, event, value) {
        this.setState({[key]: value});
    }

    render() {
        const options = _.pick(this.state, ['vx', 'vy', 'color', 'particleCount', 'domain', 'fadeAmount', 'lineWidth']);

        return <div>
            <VectorWallpaper useDPI={true} {...options} />
            <ControlPanel onChangeOption={this._onChangeOption.bind(this)} {...options} />
        </div>;
    }
}


const VectorWallpaper = makeWallpaper(class VectorContainer extends React.Component {
    static propTypes = _.assign({}, optionPropTypes, {
        width: React.PropTypes.number,
        height: React.PropTypes.number
    });
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
            return func(x, y, (new Date().getTime() - startTime) / 1000);
        });
    }
    render() {
        const {width, height, domain, vx, vy, color, particleCount, fadeAmount, lineWidth} = this.props;

        return <div>
            <XYPlot
                {...{height, width, domain}}
                nice={false} showLabels={false}
                showGrid={false} showTicks={false}
            >
                <FlowField {...{
                    particleCount, fadeAmount, lineWidth,
                    //useSimpleFade: true,
                    vx: this._timed(vx),
                    vy: this._timed(vy),
                    color: color ? this._timed(color) : undefined
                }} />
            </XYPlot>
        </div>;
    }
});

class ControlPanel extends React.Component {
    static propTypes = _.assign({}, optionPropTypes, {
        onChangeOption: React.PropTypes.func
    });
    render() {
        const {onChangeOption} = this.props;
        return <div className="control-panel">
            <FunctionInput {...{
                label: "X velocity",
                value: this.props.vx,
                funcParams: ['x', 'y', 't'],
                onValidChange: _.partial(onChangeOption, 'vx'),
                checkValid: checkValidVectorFunc
            }} />

            <FunctionInput {...{
                label: "Y velocity",
                value: this.props.vy,
                funcParams: ['x', 'y', 't'],
                onValidChange: _.partial(onChangeOption, 'vy'),
                checkValid: checkValidVectorFunc
            }} />

            <FunctionInput {...{
                label: "Color",
                value: this.props.color,
                funcParams: ['x', 'y', 't'],
                onValidChange: _.partial(onChangeOption, 'color'),
                checkValid: checkValidColorFunc
            }} />

            <NumberInput {...{
                label: <div>Particle count</div>,
                value: this.props.particleCount,
                onValidChange: _.partial(onChangeOption, 'particleCount')
            }} />

            <NumberInput {...{
                label: <div>Fade amount</div>,
                value: this.props.fadeAmount,
                onValidChange: _.partial(onChangeOption, 'fadeAmount')
            }} />

            <NumberInput {...{
                label: <div>Line width</div>,
                value: this.props.lineWidth,
                onValidChange: _.partial(onChangeOption, 'lineWidth')
            }} />
        </div>
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
