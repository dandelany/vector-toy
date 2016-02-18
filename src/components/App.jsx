'use strict';
import React from 'react';
import d3 from 'd3';
import _ from 'lodash';
import Portal from 'react-portal';

import {urlify, deurlify, shortenUrl} from 'utils';
import FlowWallpaper from 'components/FlowWallpaper';
import ControlPanel from 'components/ControlPanel';
import DEFAULTS from 'defaults';

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

function getStateFromUrl() {
    var query = document.location.search;
    if(_.includes(query, '?s=')) {
        try {
            const stateStr = query.replace('?s=', '');
            return deurlify(stateStr);
        } catch(e) { return undefined; }
    } else {
        return undefined;
    }
}

function getRandomState() {
    // 50/50 chance of getting a slightly randomized preset or a completely random mashup
    const coinFlip = Math.random() > 0.5;
    const template = coinFlip ? _.sample(DEFAULTS.presets) : DEFAULTS.shuffleAll;
    return _.mapValues(_.cloneDeep(template), (value) => {
        return _.isArray(value.choices) ? _.sample(value.choices) : value;
    });
}

// UI settings only control interface options,
// and are therefore not saved to the URL like the rest of the state
const defaultUISettings = {
    autosave: true
};
const uiSettingKeys = _.keys(defaultUISettings);


export default class App extends React.Component {
    static defaultProps = {
        panelWidth: 250
    };
    constructor(props) {
        super(props);

        // try to load state from the URL,
        // otherwise shuffle a random initial state from the default settings
        this.state = _.assign(
            getStateFromUrl() || this._getRandomState(),
            defaultUISettings
        );
    }

    componentDidMount() {
        window.onpopstate = () => this.setState(getStateFromUrl());
    }

    _getRandomState = () => {
        const state = getRandomState();
        state.domain.x = state.domain.x || this._xDomainFromYDomain(state.domain.y);
        return state;
    };

    _xDomainFromYDomain = (yDomain) => {
        const mainWidth = window.innerWidth - this.props.panelWidth;
        const aspectRatio = _.isFinite(mainWidth) && (mainWidth > 0) ? (mainWidth / window.innerHeight) : 1.75;
        return yDomain.map((n) => +(n * aspectRatio).toFixed(2));
    };

    _saveStateToUrl = (pushState = false) => {
        // urlify this.state, except for the parts which are UI settings
        const saveStr = urlify(_.omit(this.state, uiSettingKeys));
        // pushState or replaceState the new URL
        const updateUrl = (pushState ? history.pushState : history.replaceState).bind(history);
        updateUrl({}, 'state', `${document.location.pathname}?s=${saveStr}`);
    };

    _onChangeOption = (key, value, event) => {
        console.log('option update:', key, value);
        const newState = {[key]: value};

        // if no fade, clear screen on settings change
        if(this.state.fadeAmount === 0)
            _.assign(newState, {screenId: +(new Date())});

        this.setState(newState, () => this._saveStateToUrl(false));
    };

    _onShuffleOptions = () => {
        this.setState(
            _.assign(this._getRandomState(), {screenId: +(new Date())}),
            this._saveStateToUrl
        );
    };

    render() {
        const options = _.pick(this.state, [
            'color', 'particleCount', 'domain',
            'fadeAmount', 'lineWidth', 'screenId', 'isPolar'
        ]);
        const uiOptions = _.pick(this.state, uiSettingKeys);

        const {isPolar, vA, vB} = this.state;
        const vectorOptions = isPolar ?
            {vr: vA, vTheta: vB} :
            {vx: vA, vy: vB};

        return <div>
            <FlowWallpaper
                {...{useDPI: true, panelWidth: this.props.panelWidth}}
                {...options} {...vectorOptions}
            />
            <ControlPanel
                width={this.props.panelWidth}
                onChangeOption={this._onChangeOption}
                onShuffleOptions={this._onShuffleOptions}
                onPushHistory={() => this._saveStateToUrl(true)}
                {...options} {...{vA, vB}} {...uiOptions}
            />
        </div>;
    }
}

// http://is.gd/Oz8u2D

// http://localhost:8228/?s=eyJpc1BvbGFyIjp0cnVlLCJ2QSI6ImZ1bmN0aW9uIGFub255bW91cyh4LHkscix0aGV0YSx0XG4vKiovKSB7XG5yZXR1cm4gKHkteCkqIDVcbn0iLCJ2QiI6ImZ1bmN0aW9uIGFub255bW91cyh4LHkscix0aGV0YSx0XG4vKiovKSB7XG5yZXR1cm4gKE1hdGguc2luKHgpK01hdGguY29zKHkqdGhldGEpKSAqIDU7XG59IiwiZG9tYWluIjp7IngiOlstMTQuNDQsMTQuNDRdLCJ5IjpbLTksOV19LCJjb2xvciI6ImZ1bmN0aW9uIGFub255bW91cyh4LHkscix0aGV0YSx0XG4vKiovXG4vKiovXG4vKiovXG4vKiovXG4vKiovXG4vKiovXG4vKiovKSB7XG5yZXR1cm4gd2luZG93LmQzLmxhYig4MCAtIHIqMTAsIDMwLCB4ICogMTAgKiBNYXRoLnJhbmRvbSgpKS50b1N0cmluZygpO1xufSIsInBhcnRpY2xlQ291bnQiOjEwMDAwLCJmYWRlQW1vdW50IjowLCJsaW5lV2lkdGgiOjAuNSwic2NyZWVuSWQiOjE0NTU1MzkyMjY3MzIsImZ1bmNTdHJzIjpbInZBIiwidkIiLCJjb2xvciJdfQ==

// http://localhost:8228/?s=eyJpc1BvbGFyIjp0cnVlLCJ2QSI6ImZ1bmN0aW9uIGFub255bW91cyh4LHkscix0aGV0YSx0XG4vKiovKSB7XG5yZXR1cm4gKE1hdGguY29zKHIvdGhldGEpKSAqIDEwO1xufSIsInZCIjoiZnVuY3Rpb24gdkIoeCwgeSwgciwgdGhldGEsIHQpIHtcbiByZXR1cm4gTWF0aC5jb3MocikgKiBNYXRoLmNvcyh0aGV0YSkgKiAxMDtcbiB9IiwiZG9tYWluIjp7IngiOlstOS40NCw5LjQ0XSwieSI6Wy01LDVdfSwiY29sb3IiOiJmdW5jdGlvbiBjb2xvcih4LCB5LCByLCB0aGV0YSwgdCkge1xuIHJldHVybiB3aW5kb3cuZDMubGFiKDgwIC0gciAqIDEzLCB5ICogMjAgKiBNYXRoLnJhbmRvbSgpLCB4ICogMjAgKiBNYXRoLnJhbmRvbSgpKS50b1N0cmluZygpO1xuIH0iLCJwYXJ0aWNsZUNvdW50IjoxMDAwLCJmYWRlQW1vdW50IjowLCJsaW5lV2lkdGgiOjAuNSwic2NyZWVuSWQiOjE0NTU1NzczNzU2MzAsImZ1bmNTdHJzIjpbInZBIiwidkIiLCJjb2xvciJdfQ==

// NSFW
// http://localhost:8228/?s=eyJpc1BvbGFyIjpmYWxzZSwidkEiOiJmdW5jdGlvbiBhbm9ueW1vdXMoeCx5LHIsdGhldGEsdFxuLyoqL1xuLyoqL1xuLyoqLykge1xucmV0dXJuIChNYXRoLnNpbihyKSArIE1hdGguY29zKHRoZXRhKSkgKiAxXG59IiwidkIiOiJmdW5jdGlvbiBhbm9ueW1vdXMoeCx5LHIsdGhldGEsdFxuLyoqL1xuLyoqL1xuLyoqL1xuLyoqL1xuLyoqL1xuLyoqL1xuLyoqL1xuLyoqL1xuLyoqLykge1xucmV0dXJuIE1hdGguY29zKHIpICogTWF0aC5jb3ModGhldGEpICogMTA7XG59IiwiZG9tYWluIjp7IngiOlstOS40NCw5LjQ0XSwieSI6Wy01LDVdfSwiY29sb3IiOiJmdW5jdGlvbiBhbm9ueW1vdXMoeCx5LHIsdGhldGEsdFxuLyoqL1xuLyoqLykge1xucmV0dXJuIHdpbmRvdy5kMy5sYWIoODAgLSByKjEwLCAzMCwgeCAqIDEwICogTWF0aC5yYW5kb20oKSkudG9TdHJpbmcoKTtcbn0iLCJwYXJ0aWNsZUNvdW50Ijo3MDAwLCJmYWRlQW1vdW50IjowLCJsaW5lV2lkdGgiOjAuMiwic2NyZWVuSWQiOjE0NTU1MzUwMjkwNDUsImZ1bmNTdHJzIjpbInZBIiwidkIiLCJjb2xvciJdfQ==

