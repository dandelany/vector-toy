import React from 'react';
import _ from 'lodash';
import RadioGroup from 'react-radio';

import {shortenUrl} from 'utils';
import {optionPropTypes} from 'components/App';
import TippedComponent from 'components/TippedComponent';
import FunctionInput from 'components/FunctionInput';
import NumberInput from 'components/NumberInput';

const tipContent = {
    shuffle: "Shuffle random values and functions for all settings",
    clear: "Clear the screen and reset time variables to zero",
    stash: "Stash the current settings in your browser history, so you can access them again with the 'back' button",
    autoStash: "Automatically stash old settings in your browser history every time you change any of them",
    shorten: "Make a short URL for these settings, so you can share them easily with others",
    mode: "Whether the vector field should be represented in a polar (R, θ) or cartesian (X, Y) coordinate system",
    particleCount: "Total number of particles to draw simultaneously",
    lineWidth: "Thickness of the particle trail line",
    fadeAmount: `Amount to fade out particle trails every frame (positive number).\
        Zero fade is always fastest, fading affects performance especially at high resolutions.`,
    xRange: "Visible range of X values; increase/decrease to zoom out/in",
    yRange: "Visible range of Y values; increase/decrease to zoom out/in",

    vectorFunc: (props) => {
        return <div>
            Editable Javascript function which controls each particle's {props.label}. Parameters: <br/>
            <ul>
                <li><strong>x, y</strong>: particle X & Y coordinates</li>
                <li><strong>r, th</strong>: particle R & θ (polar) coordinates</li>
                <li><strong>t, fr</strong>: time since start, in seconds and # of frames</li>
            </ul>
            Globals: <strong>mouseX</strong>, <strong>mouseY</strong>, <strong>d3</strong>, <strong>_</strong>
        </div>;
    }
};

export default class ControlPanel extends React.Component {
    static propTypes = _.assign({}, optionPropTypes, {
        width: React.PropTypes.number,
        onChangeOption: React.PropTypes.func,
        onShuffleOptions: React.PropTypes.func,
        onShuffleOption: React.PropTypes.func,
        onPushHistory: React.PropTypes.func,
    });
    state = {
        shortUrl: ''
    };
    _onClearScreen = () => {
        this.props.onChangeOption('screenId', +(new Date()));
    };
    _onPushHistory = () => {
        this.props.onPushHistory();
    };
    _onShortenUrl = () => {
        shortenUrl(document.location.href, (err, shortUrl) => {
            if(err) this.setState({shortUrl: document.location.href});
            else this.setState({shortUrl});
        });
    };
    _onChangePolar = (value, event) => {
        const isPolar = (value.toLowerCase() === 'polar');
        this.props.onChangeOption('isPolar', isPolar, event);
    };
    _onChangeDomain = (key, index, value, event) => {
        const keyDomain = this.props.domain[key].slice();
        keyDomain.splice(index, 1, value);
        const domain = _.assign({}, this.props.domain, {[key]: keyDomain});
        this.props.onChangeOption('domain', domain, event);
    };

    render() {
        const {onChangeOption, onShuffleOption, isPolar} = this.props;
        return <div className="control-panel" style={{width: this.props.width, height: window.innerHeight}}>
            <div className="panel head-panel">
                <div className="panel-left">
                    <h3><a href="http://dandelany.github.io/vector-toy">Vector Toy</a></h3>
                    <span className="subtitle"><a href="https://github.com/dandelany/vector-toy" target="_blank">v1.0</a></span>
                </div>
                <div className="panel-right">
                    <span className="byline">
                        <a href="https://github.com/dandelany/vector-toy" target="_blank">by dandelany</a>
                    </span>
                </div>
            </div>

            <div className="panel">
                <TippedComponent {...{tipContent: tipContent.shuffle}}>
                    <button className="special" onClick={this.props.onShuffleOptions}>
                        Shuffle
                    </button>
                </TippedComponent>

                <TippedComponent {...{tipContent: tipContent.clear}}>
                    <button onClick={this._onClearScreen}>
                        Clear
                    </button>
                </TippedComponent>

                <TippedComponent {...{tipContent: tipContent.stash}}>
                    <button onClick={this._onPushHistory}>
                        Stash
                    </button>
                </TippedComponent>

                <TippedComponent {...{tipContent: tipContent.autoStash}}>
                    <button
                        className={`${this.props.autosave ? 'active' : 'inactive'}`}
                        onClick={_.partial(onChangeOption, 'autosave', !this.props.autosave)}
                    >
                        Auto-stash
                    </button>
                </TippedComponent>
            </div>

            <div className="panel">
                <TippedComponent {...{tipContent: tipContent.shorten}}>
                    <button onClick={this._onShortenUrl}>
                        Shorten URL
                    </button>
                </TippedComponent>

                <div className="panel-right">
                    <input type="text" ref="shortUrl" value={this.state.shortUrl} />
                </div>
            </div>

            <div className="panel">
                <TippedComponent {...{tipContent: tipContent.mode}}>
                    <div className="panel-left">
                        Mode
                    </div>
                </TippedComponent>
                <div className="panel-right">
                    <RadioGroup {...{
                        name: 'isPolar',
                        value: this.props.isPolar ? 'polar' : 'cartesian',
                        items: ['polar', 'cartesian'],
                        onChange: this._onChangePolar
                    }} />
                </div>
            </div>

            <NumberPanel {...{
                label: <div>Particles</div>,
                description: tipContent.particleCount,
                value: this.props.particleCount,
                onValidChange: _.partial(onChangeOption, 'particleCount')
            }} />

            <NumberPanel {...{
                label: <div>Fade out</div>,
                description: tipContent.fadeAmount,
                value: this.props.fadeAmount,
                onValidChange: _.partial(onChangeOption, 'fadeAmount')
            }} />

            <NumberPanel {...{
                label: <div>Line width</div>,
                description: tipContent.lineWidth,
                value: this.props.lineWidth,
                onValidChange: _.partial(onChangeOption, 'lineWidth')
            }} />

            <NumberRangePanel {...{
                label: "X Range",
                description: tipContent.xRange,
                min: {
                    value: this.props.domain.x[0],
                    onValidChange: _.partial(this._onChangeDomain, 'x', 0)
                },
                max: {
                    value: this.props.domain.x[1],
                    onValidChange: _.partial(this._onChangeDomain, 'x', 1)
                }
            }} />

            <NumberRangePanel {...{
                label: "Y Range",
                description: tipContent.yRange,
                min: {
                    value: this.props.domain.y[0],
                    onValidChange: _.partial(this._onChangeDomain, 'y', 0)
                },
                max: {
                    value: this.props.domain.y[1],
                    onValidChange: _.partial(this._onChangeDomain, 'y', 1)
                }
            }} />

            <FunctionPanel {...{
                label: `${isPolar ? "R" : "X"} velocity`,
                value: this.props.vA,
                funcParams: ['x', 'y', 'r', 'th', 't', 'fr', 'vx', 'vy'],
                onValidChange: _.partial(onChangeOption, 'vA'),
                checkValid: checkValidVectorFunc,
                onShuffle: _.partial(onShuffleOption, 'vA')
            }} />

            <FunctionPanel {...{
                label: `${isPolar ? "Theta" : "Y"} velocity`,
                value: this.props.vB,
                funcParams: ['x', 'y', 'r', 'th', 't', 'fr', 'vx', 'vy'],
                onValidChange: _.partial(onChangeOption, 'vB'),
                checkValid: checkValidVectorFunc,
                onShuffle: _.partial(onShuffleOption, 'vB')
            }} />

            <FunctionPanel {...{
                label: "Color",
                value: this.props.color,
                funcParams: ['x', 'y', 'r', 'th', 't', 'fr'],
                onValidChange: _.partial(onChangeOption, 'color'),
                checkValid: checkValidColorFunc,
                onShuffle: _.partial(onShuffleOption, 'color')
            }} />

            {/*
            <FunctionPanel {...{
                label: "Particle birthplace",
                value: this.props.birthplace,
                funcParams: ['xRange', 'yRange'],
                onValidChange: _.partial(onChangeOption, 'birthplace'),
                checkValid: checkValidBirthplaceFunc,
                onShuffle: _.partial(onShuffleOption, 'birthplace')
            }} />
            */}
        </div>
    }
}

const FunctionPanel = (props) => {
    return <TippedComponent {...{tipContent: tipContent.vectorFunc(props)}}>
        <div className="panel function-panel">
            <div className="panel-label" style={{lineHeight: '32px'}}>
                {props.label}
                {props.onShuffle ?
                    <button onClick={props.onShuffle} style={{marginLeft: 6}}>Shuffle</button>
                    : null
                }
            </div>

            <FunctionInput {..._.omit(props, 'label')} onMouseOver={(e) => (e.stopPropagation())} />
        </div>
    </TippedComponent>
};

const NumberPanel = (props) => {
    const label = (props.description) ?
        <TippedComponent tipContent={props.description}>{props.label}</TippedComponent>
        : props.label;
    const newProps = _.assign({}, props, {label});

    return <div className="panel number-panel">
        <NumberInput {...newProps} />
    </div>;
};

const NumberRangePanel = (props) => {
    let label = <span className="panel-left">{props.label}</span>;
    label = !(props.description) ? {label} :
        <TippedComponent tipContent={props.description}>{label}</TippedComponent>;

    return <div className="panel number-range-panel">
        {label}
        <span className="panel-right">
            <NumberInput {...props.min} />
            <span className="range-delimiter">to</span>
            <NumberInput {...props.max} />
        </span>
    </div>;
};

function checkValidVectorFunc(func) {
    return _.isFinite(func(1, 1, 1, 1, 1, 1, 1, 1));
}
function checkValidColorFunc(func) {
    // hard to check valid color, just make sure it doesn't barf
    func(1, 1, 1, 1, 1, 1, 1, 1);
    return true;
}
function checkValidBirthplaceFunc(func) {
    // hard to check valid color, just make sure it doesn't barf
    const coord = func([0, 10], [0, 10]);
    return _.isFinite(coord.x) && _.isFinite(coord.y);
}
