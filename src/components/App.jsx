'use strict';
import React from 'react';
import d3 from 'd3';
import _ from 'lodash';
import {XYPlot} from 'reactochart';

import Portal from 'react-portal';

import {urlify, deurlify, shortenUrl, getWindowSize} from 'utils';
import Tooltip from 'components/SimpleTooltip';
import TippedComponent from 'components/TippedComponent';
import makeWallpaper from 'components/Wallpaper';
import FlowField from 'components/FlowField';
import FunctionInput from 'components/FunctionInput';
import NumberInput from 'components/NumberInput';
import ControlPanel from 'components/ControlPanel';

window.d3 = d3;

export const optionPropTypes = {
    domain: React.PropTypes.shape({x: React.PropTypes.array, y: React.PropTypes.array}),
    vx: React.PropTypes.func,
    vy: React.PropTypes.func,
    vr: React.PropTypes.func,
    vTheta: React.PropTypes.func,
    color: React.PropTypes.func,
    particleCount: React.PropTypes.number,
    fadeAmount: React.PropTypes.number,
    lineWidth: React.PropTypes.number,
    screenId: React.PropTypes.any
};

class VectorWallpaper extends React.Component {
    static propTypes = _.assign({}, optionPropTypes, {
        width: React.PropTypes.number,
        height: React.PropTypes.number
    });
    static defaultProps = {
        panelWidth: 0,
        useDPI: true,
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
            panelWidth, domain, vx, vy, vr, vTheta, color, particleCount, fadeAmount, lineWidth, screenId
        } = this.props;
        const windowSize = getWindowSize(true);
        const dpiMult = (this.props.useDPI && window.devicePixelRatio >= 2) ? 2 : 1;
        const height = windowSize.height;
        const width = windowSize.width - (panelWidth * dpiMult);

        const wallpaperStyle = {
            position: 'fixed',
            top: 0,
            left: 0,
            width, height,
            zIndex: -1
        };
        _.assign(wallpaperStyle,
            (dpiMult === 2) ? {
                transform: 'scale(0.5) translate(-50%, -50%)',
                WebkitTransform: 'scale(0.5) translate(-50%, -50%)'
            } : {}
        );

        return <Portal isOpened={true}>
            <div style={wallpaperStyle}>
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
            </div>
        </Portal>;
    }
}

export default class App extends React.Component {
    constructor(props) {
        super(props);
        const aspectRatio = window ? (window.innerWidth / window.innerHeight) : 1.75;
        this._panelWidth = 250;
        this.state = {
            isPolar: false,
            // first velocity function, X (cartesian) or R (polar)
            //vA: function(x, y, r, theta, t) { return ((Math.cos(x) + Math.cos(y)) * 10); },
            vA: function(x, y, r, theta, t) { return (Math.cos(r) + Math.cos(theta)) * 10; },
            // second velocity function, Y (cartesian) or Theta (polar)
            //vB: function(x, y, r, theta, t) { return ((Math.sin(x) * Math.cos(y)) * 10); },
            vB: function(x, y, r, theta, t) { return (Math.cos(r) * Math.cos(theta)) * 10; },
            domain: {
                x: [-5, 5].map((n) => +(n * aspectRatio).toFixed(2)),
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
    _saveStateToUrl = (pushState = false) => {
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

        this.setState(newState, () => this._saveStateToUrl(false));
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
            <VectorWallpaper
                {...{useDPI: true, panelWidth: this._panelWidth}}
                {...options} {...vectorOptions}
            />
            <ControlPanel
                onChangeOption={this._onChangeOption}
                onPushHistory={() => this._saveStateToUrl(true)}
                {...options} {...{vA, vB}}
            />
        </div>;
    }
}

// http://is.gd/Oz8u2D

// http://localhost:8228/?s=eyJpc1BvbGFyIjp0cnVlLCJ2QSI6ImZ1bmN0aW9uIGFub255bW91cyh4LHkscix0aGV0YSx0XG4vKiovKSB7XG5yZXR1cm4gKHkteCkqIDVcbn0iLCJ2QiI6ImZ1bmN0aW9uIGFub255bW91cyh4LHkscix0aGV0YSx0XG4vKiovKSB7XG5yZXR1cm4gKE1hdGguc2luKHgpK01hdGguY29zKHkqdGhldGEpKSAqIDU7XG59IiwiZG9tYWluIjp7IngiOlstMTQuNDQsMTQuNDRdLCJ5IjpbLTksOV19LCJjb2xvciI6ImZ1bmN0aW9uIGFub255bW91cyh4LHkscix0aGV0YSx0XG4vKiovXG4vKiovXG4vKiovXG4vKiovXG4vKiovXG4vKiovXG4vKiovKSB7XG5yZXR1cm4gd2luZG93LmQzLmxhYig4MCAtIHIqMTAsIDMwLCB4ICogMTAgKiBNYXRoLnJhbmRvbSgpKS50b1N0cmluZygpO1xufSIsInBhcnRpY2xlQ291bnQiOjEwMDAwLCJmYWRlQW1vdW50IjowLCJsaW5lV2lkdGgiOjAuNSwic2NyZWVuSWQiOjE0NTU1MzkyMjY3MzIsImZ1bmNTdHJzIjpbInZBIiwidkIiLCJjb2xvciJdfQ==

// http://localhost:8228/?s=eyJpc1BvbGFyIjp0cnVlLCJ2QSI6ImZ1bmN0aW9uIGFub255bW91cyh4LHkscix0aGV0YSx0XG4vKiovKSB7XG5yZXR1cm4gKE1hdGguY29zKHIvdGhldGEpKSAqIDEwO1xufSIsInZCIjoiZnVuY3Rpb24gdkIoeCwgeSwgciwgdGhldGEsIHQpIHtcbiByZXR1cm4gTWF0aC5jb3MocikgKiBNYXRoLmNvcyh0aGV0YSkgKiAxMDtcbiB9IiwiZG9tYWluIjp7IngiOlstOS40NCw5LjQ0XSwieSI6Wy01LDVdfSwiY29sb3IiOiJmdW5jdGlvbiBjb2xvcih4LCB5LCByLCB0aGV0YSwgdCkge1xuIHJldHVybiB3aW5kb3cuZDMubGFiKDgwIC0gciAqIDEzLCB5ICogMjAgKiBNYXRoLnJhbmRvbSgpLCB4ICogMjAgKiBNYXRoLnJhbmRvbSgpKS50b1N0cmluZygpO1xuIH0iLCJwYXJ0aWNsZUNvdW50IjoxMDAwLCJmYWRlQW1vdW50IjowLCJsaW5lV2lkdGgiOjAuNSwic2NyZWVuSWQiOjE0NTU1NzczNzU2MzAsImZ1bmNTdHJzIjpbInZBIiwidkIiLCJjb2xvciJdfQ==

// NSFW
// http://localhost:8228/?s=eyJpc1BvbGFyIjpmYWxzZSwidkEiOiJmdW5jdGlvbiBhbm9ueW1vdXMoeCx5LHIsdGhldGEsdFxuLyoqL1xuLyoqL1xuLyoqLykge1xucmV0dXJuIChNYXRoLnNpbihyKSArIE1hdGguY29zKHRoZXRhKSkgKiAxXG59IiwidkIiOiJmdW5jdGlvbiBhbm9ueW1vdXMoeCx5LHIsdGhldGEsdFxuLyoqL1xuLyoqL1xuLyoqL1xuLyoqL1xuLyoqL1xuLyoqL1xuLyoqL1xuLyoqL1xuLyoqLykge1xucmV0dXJuIE1hdGguY29zKHIpICogTWF0aC5jb3ModGhldGEpICogMTA7XG59IiwiZG9tYWluIjp7IngiOlstOS40NCw5LjQ0XSwieSI6Wy01LDVdfSwiY29sb3IiOiJmdW5jdGlvbiBhbm9ueW1vdXMoeCx5LHIsdGhldGEsdFxuLyoqL1xuLyoqLykge1xucmV0dXJuIHdpbmRvdy5kMy5sYWIoODAgLSByKjEwLCAzMCwgeCAqIDEwICogTWF0aC5yYW5kb20oKSkudG9TdHJpbmcoKTtcbn0iLCJwYXJ0aWNsZUNvdW50Ijo3MDAwLCJmYWRlQW1vdW50IjowLCJsaW5lV2lkdGgiOjAuMiwic2NyZWVuSWQiOjE0NTU1MzUwMjkwNDUsImZ1bmNTdHJzIjpbInZBIiwidkIiLCJjb2xvciJdfQ==

