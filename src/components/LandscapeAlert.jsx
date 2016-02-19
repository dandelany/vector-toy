'use strict';
import React from 'react';
import _ from 'lodash';
import Portal from 'react-portal';

const alertStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    WebkitTransform: 'translate(-50%, -50%)',
    background: '#e9e9e9',
    width: 200,
    height: 200
};

export default class LandscapeAlert extends React.Component {
    state = {
        dismissed: false
    };

    render() {
        // only show if height is greater than width
        if(this.state.dismissed || window.innerHeight <= window.innerWidth)
            return null;

        return <Portal isOpened={true}>
            <div className="landscape-alert" style={alertStyle} onClick={() => this.setState({dismissed: true})}>
                Turn your phone sideways
                <h1>{"\uD83C\uDCA0 \u2935"}</h1>
                It's better I promise
            </div>
        </Portal>;
    }
}