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
        this.props.onChangeOption('screenId', {}, +(new Date()));
    };
    _onChangePolar = (value, event) => {
        const isPolar = (value.toLowerCase() === 'polar');
        this.props.onChangeOption('isPolar', {}, isPolar);
    };
    render() {
        const {onChangeOption, isPolar} = this.props;
        return <div className="control-panel">
            <button onClick={this._onClearScreen}>
                Clear Screen
            </button>

            <RadioGroup {...{
                name: 'isPolar',
                value: this.props.isPolar ? 'polar' : 'cartesian',
                items: ['polar', 'cartesian'],
                onChange: this._onChangePolar
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

            <FunctionInput {...{
                label: `${isPolar ? "R" : "X"} velocity`,
                value: this.props.vA,
                funcParams: ['x', 'y', 'r', 'theta', 't'],
                onValidChange: _.partial(onChangeOption, 'vA'),
                checkValid: checkValidVectorFunc
            }} />

            <FunctionInput {...{
                label: `${isPolar ? "Theta" : "Y"} velocity`,
                value: this.props.vB,
                funcParams: ['x', 'y', 'r', 'theta', 't'],
                onValidChange: _.partial(onChangeOption, 'vB'),
                checkValid: checkValidVectorFunc
            }} />

            <FunctionInput {...{
                label: "Color",
                value: this.props.color,
                funcParams: ['x', 'y', 'r', 'theta', 't'],
                onValidChange: _.partial(onChangeOption, 'color'),
                checkValid: checkValidColorFunc
            }} />
        </div>
    }
}

function checkValidVectorFunc(func) {
    return _.isFinite(func(1, 1, 1, 1, 1));
}
function checkValidColorFunc(func) {
    // hard to check valid color, just make sure it doesn't barf
    func(1, 1, 1, 1, 1);
    return true;
}
