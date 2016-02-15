import React from 'react';
import _ from 'lodash';
import RadioGroup from 'react-radio';
import {optionPropTypes} from 'components/App';

import FunctionInput from 'components/FunctionInput';
import NumberInput from 'components/NumberInput';

export default class ControlPanel extends React.Component {
    static propTypes = _.assign({}, optionPropTypes, {
        onChangeOption: React.PropTypes.func
    });
    _onClearScreen = () => {
        this.props.onChangeOption('screenId', +(new Date()));
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
        const {onChangeOption, isPolar} = this.props;
        return <div className="control-panel">
            <div className="panel head-panel">
                <div className="panel-left">
                    <h3>Vector Toy</h3>
                    <span className="subtitle">v1.0</span>
                </div>
                <div className="panel-right">
                    <span className="byline">by dandelany</span>
                </div>
            </div>

            <div className="panel">
                <button onClick={this._onClearScreen}>
                    Clear Screen
                </button>
            </div>

            <div className="panel">
                <RadioGroup {...{
                    name: 'isPolar',
                    value: this.props.isPolar ? 'polar' : 'cartesian',
                    items: ['polar', 'cartesian'],
                    onChange: this._onChangePolar
                }} />
            </div>

            <NumberPanel {...{
                label: <div>Particles</div>,
                value: this.props.particleCount,
                onValidChange: _.partial(onChangeOption, 'particleCount')
            }} />

            <NumberPanel {...{
                label: <div>Fade out</div>,
                value: this.props.fadeAmount,
                onValidChange: _.partial(onChangeOption, 'fadeAmount')
            }} />

            <NumberPanel {...{
                label: <div>Line width</div>,
                value: this.props.lineWidth,
                onValidChange: _.partial(onChangeOption, 'lineWidth')
            }} />

            <NumberRangePanel {...{
                label: "X Domain",
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
                label: "Y Domain",
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
                funcParams: ['x', 'y', 'r', 'theta', 't'],
                onValidChange: _.partial(onChangeOption, 'vA'),
                checkValid: checkValidVectorFunc
            }} />

            <FunctionPanel {...{
                label: `${isPolar ? "Theta" : "Y"} velocity`,
                value: this.props.vB,
                funcParams: ['x', 'y', 'r', 'theta', 't'],
                onValidChange: _.partial(onChangeOption, 'vB'),
                checkValid: checkValidVectorFunc
            }} />

            <FunctionPanel {...{
                label: "Color",
                value: this.props.color,
                funcParams: ['x', 'y', 'r', 'theta', 't'],
                onValidChange: _.partial(onChangeOption, 'color'),
                checkValid: checkValidColorFunc
            }} />
        </div>
    }
}

const FunctionPanel = (props) => (
    <div className="panel function-panel">
        <FunctionInput {...props} />
    </div>
);

const NumberPanel = (props) => (
    <div className="panel number-panel">
        <NumberInput {...props} />
    </div>
);

const NumberRangePanel = (props) => (
    <div className="panel number-range-panel">
        <span className="panel-label">
            {props.label}
        </span>

        <span className="panel-input">
            <NumberInput {...props.min} />
            <NumberInput {...props.max} />
        </span>
    </div>
);

function checkValidVectorFunc(func) {
    return _.isFinite(func(1, 1, 1, 1, 1));
}
function checkValidColorFunc(func) {
    // hard to check valid color, just make sure it doesn't barf
    func(1, 1, 1, 1, 1);
    return true;
}
