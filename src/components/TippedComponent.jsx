import React from 'react';
import _ from 'lodash';

import Tooltip from 'components/SimpleTooltip';

export default class TippedComponent extends React.Component {
    state = {
        isActive: false
    };
    _onMouseEnter = () => {
        this.setState({isActive: true});
    };
    _onMouseLeave = () => {
        console.log('ok')
        this.setState({isActive: false});
    };

    render() {
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
