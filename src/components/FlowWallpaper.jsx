'use strict';
import React from 'react';
import * as d3 from 'd3';
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
        _.assign(this, this._initScale(props));
        this._throttledScrollHandler =  _.throttle(this._scrollHandler, 30);
        this._throttledResizeHandler =  _.debounce(this._resizeHandler, 200);
        this._throttledMoveHandler =  _.throttle(this._moveHandler, 20);
    }

    componentDidMount() {
        //document.addEventListener('mousewheel', this._throttledScrollHandler);
        //document.addEventListener('DOMMouseScroll', this._throttledScrollHandler);
        window.addEventListener('resize', this._throttledResizeHandler);
        window.addEventListener('mousemove', this._throttledMoveHandler);
    }
    componentWillUnmount() {
        //document.removeEventListener('mousewheel', this._throttledScrollHandler);
        //document.removeEventListener('DOMMouseScroll', this._throttledScrollHandler);
        window.removeEventListener('resize', this._throttledResizeHandler);
        window.removeEventListener('mousemove', this._throttledMoveHandler);
    }
    componentWillReceiveProps(newProps) {
        // todo: don't do this every time...
        _.assign(this, this._initScale(newProps))
    }

    _initScale(props) {
        const {minWidth, panelWidth, useDPI} = props;

        const windowSize = getWindowSize(true);
        const dpiMult = (useDPI && window.devicePixelRatio >= 2) ? 2 : 1;

        const height = windowSize.height;
        const width = Math.max(windowSize.width - (panelWidth * dpiMult), minWidth);
        const scale = {
            x: d3.scaleLinear().domain(props.domain.x).range([0, width]),
            y: d3.scaleLinear().domain(props.domain.y).range([height, 0])
        };

        return {height, width, scale};
    }

    _scrollHandler = (e) => {
        console.log(e);
        return e;
    };
    _resizeHandler = (e) => {
        this.props.onClearScreen();
    };
    _moveHandler = (e) => {
        window.mouseX = this.scale.x.invert(e.clientX);
        window.mouseY = this.scale.y.invert(e.clientY);
    };

    render() {
        const {
            minWidth, panelWidth,
            particleCount, fadeAmount, lineWidth, screenId,
            domain, vx, vy, vr, vTheta, color, birthplace
        } = this.props;
        const {height, width, scale} = this;

        const windowSize = getWindowSize(true);
        const dpiMult = (this.props.useDPI && window.devicePixelRatio >= 2) ? 2 : 1;


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

        return <Portal isOpened={true}>
            <div style={wallpaperStyle}>
                <FlowField {...{
                    height, width, scale,
                    particleCount, fadeAmount, lineWidth, screenId,
                    vx, vy, vr, vTheta, color, birthplace
                }} />
            </div>
        </Portal>;
    }
}
