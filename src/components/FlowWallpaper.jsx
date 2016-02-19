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
        panelWidth: React.PropTypes.number,
        useDPI: React.PropTypes.bool,
        onClearScreen: React.PropTypes.func
    });
    static defaultProps = {
        minWidth: 400,
        panelWidth: 0,
        useDPI: true,
        domain: {x: [-10, 10], y: [-10, 10]},
        screenId: 0,
        onClearScreen: _.noop
    };

    constructor(props) {
        super(props);
        this._throttledScrollHandler =  _.throttle(this._scrollHandler, 30);
        this._throttledResizeHandler =  _.debounce(this._resizeHandler, 200);
    }
    componentDidMount() {
        //document.addEventListener('mousewheel', this._throttledScrollHandler);
        //document.addEventListener('DOMMouseScroll', this._throttledScrollHandler);
        window.addEventListener('resize', this._throttledResizeHandler);
    }
    componentWillUnmount() {
        //document.removeEventListener('mousewheel', this._throttledScrollHandler);
        //document.removeEventListener('DOMMouseScroll', this._throttledScrollHandler);
        window.removeEventListener('resize', this._throttledResizeHandler);
    }

    _scrollHandler = (e) => {
        console.log(e);
        return e;
    };
    _resizeHandler = (e) => {
        console.log(e);
        this.props.onClearScreen();
        return e;
    };

    render() {
        const {
            minWidth, panelWidth,
            domain, vx, vy, vr, vTheta, color, particleCount, fadeAmount, lineWidth, screenId
        } = this.props;
        const windowSize = getWindowSize(true);
        const dpiMult = (this.props.useDPI && window.devicePixelRatio >= 2) ? 2 : 1;
        const height = windowSize.height;
        const width = Math.max(windowSize.width - (panelWidth * dpiMult), minWidth);
        console.log(windowSize, width);

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
