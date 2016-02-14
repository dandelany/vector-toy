import React from 'react';

import d3 from 'd3';
import _ from 'lodash';
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
            isPolar: true,
            // first velocity function, X (cartesian) or R (polar)
            vA: function(x, y, r, theta, t) { return ((Math.cos(x) + Math.cos(y)) * 10); },
            // second velocity function, Y (cartesian) or Theta (polar)
            vB: function(x, y, r, theta, t) { return ((Math.sin(y) + Math.cos(x)) * 10); },
            //vr: function(x, y) { return Math.cos(x) * 10; },
            //vTheta: function(x, y) { return Math.sin(y)  * 10; },
            domain: {
                x: [-5, 5].map((n) => n * aspectRatio),
                y: [-5, 5]
            },
            //color: function(x, y, r, theta, t) { return `rgb(10, ${(t*40)%255}, ${(t*54)%255})`; },
            //color: (x, y, t) => window.d3.hsl(x * t, Math.abs(Math.sin(y)), Math.abs(Math.sin(y*1.4)) - 0.3).toString(),
            //color: (x, y, t) => window.d3.hsl(x * t, Math.abs(y * 20), Math.abs(Math.sin(y))).toString(),
            color: (x, y, r, theta, t) => window.d3.lab(Math.abs(x*10), y*10, 0).toString(),
            particleCount: 1000,
            fadeAmount: 0,
            lineWidth: 1
        };
    }

    _onChangeOption = (key, event, value) => {
        console.log(key, value);
        this.setState({[key]: value});
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
