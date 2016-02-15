import _ from 'lodash';
import React from 'react';

const funcBeginRegEx =  /^\s*function\s*\w*\(([\w,\s]*[\n\/\*]*)\)\s*\{[\s\n]*/, // 'function(a,b,c) { '
    funcEndRegEx = /\s*}\s*$/; // ' } '

function unwrapFuncStr(funcStr) {
    // peel the "function() {}" wrapper off of a function string (to make an 'internal function string')
    return funcStr.replace(funcBeginRegEx, '').replace(funcEndRegEx, '')
}

const FunctionInput = React.createClass({
    propTypes: {
        value: React.PropTypes.func,
        funcParams: React.PropTypes.array,
        label: React.PropTypes.string,
        // test function which will be called with generated function,
        // to test validity of generated function before calling onValidChange
        checkValid: React.PropTypes.func,
        // callback called when generated function changes, if it's valid
        onValidChange: React.PropTypes.func
    },
    getDefaultProps() {
        return {
            checkValid: () => true,
            funcParams: []
        }
    },
    getInitialState: function() {
        return {
            inputValue: function() {},
            isValid: false
        };
    },

    // we're tracking what's displayed in the input (this.state.inputValue)
    // separately from the true state value (this.props.value),
    // so we have to update inputValue state manually when the component mounts
    componentWillMount: function() {
        this.setState({inputValue: unwrapFuncStr(this.props.value.toString()), isValid: true});
    },
    componentWillReceiveProps(newProps) {
        this.setState({inputValue: unwrapFuncStr(newProps.value.toString()), isValid: true});
    },

    isValid: function(newFunc) {
        let isValid = false;
        if(!_.isFunction(newFunc)) return false;
        try {
            isValid = this.props.checkValid(newFunc);
        } catch(e) {
            console.error(e);
            return false;
        }
        return isValid;
    },

    onChange: function(event) { // when user changes input
        const inputValue = event.target.value;
        let isValid = false;
        let funcValue;

        try {
            // try to make a new function with the input value
            // this is the unsafe bit - executing arbitrary js from a string
            funcValue = Function.apply(this, _.flatten([this.props.funcParams, inputValue]));
            isValid = this.isValid(funcValue);
        } catch(e) { }

        // allow input text to contain whatever value user types in, good or bad...
        this.setState({inputValue: inputValue, isValid: isValid}, function() {
            // ...but only call callback to change app state if it's a valid function
            // note: setState is asynchronous so do this in callback to ensure state has updated
            if(isValid) this.props.onValidChange(funcValue, event);
        });
    },
    render: function() {
        return (
            <div className={`function-input function-input-${this.state.isValid ? 'valid' : 'invalid'}`}>
                <div>
                    {this.props.label}
                </div>
                <div className="function-signature">
                    ({this.props.funcParams.join(', ')}) =>
                </div>
                <textarea value={this.state.inputValue} onChange={this.onChange} />
            </div>
        );
    }
});

export default FunctionInput;
