import _ from 'lodash';
import React from 'react';

export default class NumberInput extends React.Component {
    static propTypes = {
        value: React.PropTypes.oneOfType([React.PropTypes.number, React.PropTypes.string]),
        label: React.PropTypes.node,
        onChange: React.PropTypes.func,
        onValidChange: React.PropTypes.func
    };
    static defaultProps = {
        value: 0,
        onChange: _.noop,
        onValidChange: _.noop
    };

    constructor(props) {
        super(props);
        this.state = {
            inputValue: props.value,
            isValid: _.isFinite(Number(props.value))
        };
    }

    // since we're tracking what's displayed in the input (inputValue) separately from the true props value,
    // we have to update inputValue state manually when receiving new props
    componentWillReceiveProps(nextProps) {
        // Check if the new value prop is actually a different *Number* (not just a different string),
        // and only update the state if so. This avoids the situation of:

        // 1. this.state.inputValue is "0"
        // 2. user types "." so the inputValue becomes "0."
        // 3. onChange calls parent's onValidChange callback, passing Number("0.") [which is 0] to parent
        // 4. parent updates its state to 0, triggering a re-render
        // 5. this receives new props, and this.props.value is 0, so the input text gets updated to "0"
        // 6. therefore the user cannot type "0." because it will always get 'corrected' to the new true state, "0"

        // This check stops the update in #5 because Number("0.") === Number("0")

        var isSameNumberAsInputValue = (Number(nextProps.value) === Number(this.state.inputValue));
        if(!isSameNumberAsInputValue) this.setState({inputValue: nextProps.value, isValid: true});
    }

    _onChange = (event) => {
        const inputValue = event.target.value;
        const numberValue = Number(inputValue);
        const isValid = _.isFinite(numberValue);

        // allow input text to contain whatever value you type in, good or bad...
        this.setState({inputValue: inputValue, isValid: isValid}, () => {
            // call the onChange callback for any change, valid or otherwise, with the event and string
            this.props.onChange(event, inputValue);
            // ... but only call onValidChange if it's really a Number, and pass the valid number
            if(isValid) this.props.onValidChange(event, numberValue);
            // note setState is asynchronous so we do this in callback to ensure state has updated
        });
    };

    render() {
        return (
            <span className={`number-input number-input-${this.state.isValid ? 'valid' : 'invalid'}`}>
                <label>
                    {this.props.label}
                    <input type="text" value={this.state.inputValue} onChange={this._onChange} />
                </label>
            </span>
        );
    }
}
