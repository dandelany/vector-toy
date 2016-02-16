'use strict';
import React from 'react';
import d3 from 'd3';
import _ from 'lodash';
import Portal from 'react-portal';

import {getWindowSize} from 'utils';
import {optionPropTypes} from 'components/App';
import FlowField from 'components/FlowField';

export default class FlowWallpaper extends React.Component {
    static propTypes = _.assign({}, optionPropTypes, {
        width: React.PropTypes.number,
        height: React.PropTypes.number
    });
    static defaultProps = {
        panelWidth: 0,
        useDPI: true,
        width: 800,
        height: 600,
        domain: {x: [-10, 10], y: [-10, 10]},
        screenId: 0
    };

    render() {
        const {
            panelWidth, domain, vx, vy, vr, vTheta, color, particleCount, fadeAmount, lineWidth, screenId
        } = this.props;
        const windowSize = getWindowSize(true);
        const dpiMult = (this.props.useDPI && window.devicePixelRatio >= 2) ? 2 : 1;
        const height = windowSize.height;
        const width = windowSize.width - (panelWidth * dpiMult);

        const wallpaperStyle = {
            position: 'fixed',
            top: 0,
            left: 0,
            width, height,
            zIndex: -1
        };
        _.assign(wallpaperStyle,
            (dpiMult === 2) ? {
                transform: 'scale(0.5) translate(-50%, -50%)',
                WebkitTransform: 'scale(0.5) translate(-50%, -50%)'
            } : {}
        );

        const scale = {
            x: d3.scale.linear().domain(domain.x).range([0, width]),
            y: d3.scale.linear().domain(domain.y).range([height, 0])
        };

        return <Portal isOpened={true}>
            <div style={wallpaperStyle}>
                <FlowField {...{
                    height, width, scale,
                    particleCount, fadeAmount, lineWidth, screenId,
                    vx, vy, vr, vTheta, color
                }} />
            </div>
        </Portal>;
    }
}
