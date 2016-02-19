import React from 'react';
import _ from 'lodash';

import Tooltip from 'components/SimpleTooltip';

function isTouchDevice(){
    return !!("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
}

export default class TippedComponent extends React.Component {
    state = {
        isActive: false
    };
    _onMouseEnter = () => {
        this.setState({isActive: true});
    };
    _onMouseLeave = () => {
        this.setState({isActive: false});
    };

    render() {
        // disable for mobile devices, it just gets in the way :(
        // todo: figure out a solution for mobile tooltips
        if(isTouchDevice())
            return this.props.children;

        const child = React.Children.only(this.props.children);
        const tooltip = this.state.isActive && this.props.tipContent ?
            <Tooltip>{this.props.tipContent}</Tooltip>
            : null;
        const newChildren = React.Children.toArray(child.props.children).concat(tooltip);

        return React.cloneElement(child, {
            onMouseOver: this._onMouseEnter,
            onMouseOut: this._onMouseLeave
        }, newChildren);
    }
}
