var _ = require('lodash'),
    React = require('react');

var NumberInput = React.createClass({
    getInitialState: function() {
        return { inputValue: '' };
    },
    // since we're tracking what's displayed in the input (inputValue) separately from the true state value,
    // we have to update inputValue state manually when receiving new props
    componentWillMount: function() {
        this.setState({inputValue: this.props.value, isValid: true});
    },
    componentWillReceiveProps: function(nextProps) {
        var isSameNumberAsInputValue = (Number(nextProps.value) === Number(this.state.inputValue));
        if(!isSameNumberAsInputValue) this.setState({inputValue: nextProps.value, isValid: true});
    },

    onChange: function(event) {
        var inputValue = event.target.value,
            numberValue = Number(inputValue),
            isValid = !_.isNaN(numberValue);

        // allow input text to contain whatever value you type in, good or bad...
        this.setState({inputValue: inputValue, isValid: isValid}, function() {
            // ... but only call callback to change app state if it's really a Number
            if(isValid) this.props.onValidChange(numberValue);
            // note setState is asynchronous so we do this in callback to ensure state has updated
        });
    },
    render: function() {
        return (
            <label className='number-input'>
                {this.props.label}
                <input type="text" value={this.state.inputValue} onChange={this.onChange} />
            </label>
        );
    }
});

module.exports = NumberInput;
