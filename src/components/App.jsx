import React from 'react';
import d3 from 'd3';
import _ from 'lodash';
import {XYPlot} from 'reactochart';

//import VectorGrid from 'components/VectorGrid';
import makeWallpaper from 'components/Wallpaper';
import FlowField from 'components/FlowField';
import FunctionInput from 'components/FunctionInput';
import NumberInput from 'components/NumberInput';


const VectorWallpaper = makeWallpaper(class VectorContainer extends React.Component {
    static propTypes = {
        width: React.PropTypes.number,
        height: React.PropTypes.number,
        domain: React.PropTypes.objectOf({x: React.PropTypes.array, y: React.PropTypes.array}),
        vx: React.PropTypes.function,
        vy: React.PropTypes.function,
        color: React.PropTypes.function,
        particleCount: React.PropTypes.number
    };
    static defaultProps = {
        width: 800,
        height: 600,
        domain: {x: [-10, 10], y: [-10, 10]},
        vx: _.identity,
        vy: _.identity,
        color: () => 'black',
        particleCount: 1000
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
        const {width, height, domain, vx, vy, color, particleCount} = this.props;

        return <div>
            <XYPlot
                {...{height, width, domain}}
                nice={false} showLabels={false}
                showGrid={false} showTicks={false}
            >
                <FlowField {...{
                    vx: this._timed(vx),
                    vy: this._timed(vy),
                    color: this._timed(color),
                    particleCount
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
            color: function(x, y, t) { return `rgb(10, ${(t*40)%255}, ${(t*54)%255})`; },
            particleCount: 1000,
            fadeAmount: 1
        };
    }

    _onUpdateState(key, newFunc) {
        this.setState({[key]: newFunc});
    }

    render() {
        const {vx, vy, color, particleCount, domain} = this.state;
        return <div>
            {/* this.renderVectorField() */}
            <VectorWallpaper {...{
                vx, vy, color, particleCount, domain
            }} />
            <div>
                <FunctionInput {...{
                    value: this.state.vx,
                    funcParams: ['x', 'y', 't'],
                    onValidChange: this._onUpdateState.bind(this, 'vx'),
                    checkValid: checkValidVectorFunc
                }} />

                <FunctionInput {...{
                    value: this.state.vy,
                    funcParams: ['x', 'y', 't'],
                    onValidChange: this._onUpdateState.bind(this, 'vy'),
                    checkValid: checkValidVectorFunc
                }} />

                <FunctionInput {...{
                    value: this.state.color,
                    funcParams: ['x', 'y', 't'],
                    onValidChange: this._onUpdateState.bind(this, 'color'),
                    checkValid: checkValidColorFunc
                }} />

                <div>
                    <NumberInput {...{
                        value: this.state.particleCount,
                        onValidChange: this._onUpdateState.bind(this, 'particleCount')
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
