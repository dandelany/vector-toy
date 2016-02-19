'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import d3 from 'd3';
import _ from 'lodash';

import ParticleFlowSystem from 'ParticleFlowSystem';

function interpolateGridSimple(x, y, vectorGrid, xDomain, yDomain, xBins, yBins) {
    const scaleFactor = 10;
    const xBinSize = (xDomain[1] - xDomain[0]) / xBins.length;
    const yBinSize = (yDomain[1] - yDomain[0]) / yBins.length;
    const xBinIndex = Math.min(Math.round((x - xDomain[0]) / xBinSize), xBins.length - 1);
    const yBinIndex = Math.min(Math.round((y - yDomain[0]) / yBinSize), yBins.length - 1);

    if(xBinIndex < 0 || yBinIndex < 0) return [0, 0];
    const v = vectorGrid[xBinIndex][yBinIndex];
    return [v.vx, v.vy].map(val => val * scaleFactor);
}

function interpolateGrid(x, y, vectorGrid, xDomain, yDomain, xBins, yBins, scaleFactor = 10) {
    if(!_.isFinite(x) || !_.isFinite(y)) return [0, 0];

    const [xBinIndexFloat, yBinIndexFloat] = [[x, xDomain, xBins], [y, yDomain, yBins]]
        .map(([value, domain, bins]) => {
            const binSize = (domain[1] - domain[0]) / bins.length;
            return _.clamp(((value - domain[0]) / binSize), 0, bins.length - 1);
        });

    const xBinFraction = xBinIndexFloat - Math.floor(xBinIndexFloat);
    const yBinFraction = yBinIndexFloat - Math.floor(yBinIndexFloat);
    const xBinIndices = [Math.floor(xBinIndexFloat), Math.ceil(xBinIndexFloat)];
    const yBinIndices = [Math.floor(yBinIndexFloat), Math.ceil(yBinIndexFloat)];
    const bins = xBinIndices.map(xI => yBinIndices.map(yI => vectorGrid[xI][yI]));
    const vx =
        ((bins[0][0].vx || 0) * (1 - xBinFraction) * (1 - yBinFraction)) +
        ((bins[1][0].vx || 0) * (xBinFraction) * (1 - yBinFraction)) +
        ((bins[0][1].vx || 0) * (1 - xBinFraction) * (yBinFraction)) +
        ((bins[1][1].vx || 0) * (xBinFraction) * (yBinFraction));

    const vy =
        ((bins[0][0].vy || 0) * (1 - xBinFraction) * (1 - yBinFraction)) +
        ((bins[1][0].vy || 0) * (xBinFraction) * (1 - yBinFraction)) +
        ((bins[0][1].vy || 0) * (1 - xBinFraction) * (yBinFraction)) +
        ((bins[1][1].vy || 0) * (xBinFraction) * (yBinFraction));

    return [vx, vy].map(val => val * scaleFactor);
}

function randomColor(min=0, max=255) {
    const rgb = () => _.random(min, max);
    return `rgb(${rgb()}, ${rgb()}, ${rgb()})`;
}
function randomGray(min=0, max=255) {
    const rgb = _.random(min, max);
    return `rgb(${rgb}, ${rgb}, ${rgb})`;
}


export default class FlowField extends React.Component {
    static propTypes = {
        data: React.PropTypes.arrayOf(React.PropTypes.array),
        xBins: React.PropTypes.arrayOf(React.PropTypes.array),
        yBins: React.PropTypes.arrayOf(React.PropTypes.array),
        vx: React.PropTypes.func,
        vy: React.PropTypes.func,
        vr: React.PropTypes.func,
        vTheta: React.PropTypes.func,
        color: React.PropTypes.func,
        birthplace: React.PropTypes.func,
        particleCount: React.PropTypes.number,
        lineWidth: React.PropTypes.number,

        // to clear the screen, change the screenId prop
        screenId: React.PropTypes.any,

        // positive integer for scaling up the speed of the particles
        scaleFactor: React.PropTypes.number,

        // positive integer representing how fast the trails fade out
        // fadeAmount 0 disables fade entirely,
        fadeAmount: React.PropTypes.number,

        // pass useSimpleFade = true to use the simpler/faster color fade out method
        // which has the downsides of leaving particle trails and no alpha
        useSimpleFade: React.PropTypes.bool,
        simpleFadeColor: React.PropTypes.string,

        // will use x/y scales if passed, otherwise will be created from width/height
        scale: React.PropTypes.object,
        width: React.PropTypes.number,
        height: React.PropTypes.number
    };
    static defaultProps = {
        color: () => randomGray(),
        width: 500,
        height: 500,
        particleCount: 300,
        lineWidth: 0.7,
        scaleFactor: 10,
        fadeAmount: 2,
        useSimpleFade: false,
        simpleFadeColor: "rgba(255, 255, 255, 0.05)",
        margin: {top: 0, left: 0, bottom: 0, right: 0}
    };

    componentDidMount() {
        const {particleCount, color, birthplace, useSimpleFade, simpleFadeColor} = this.props;

        const {ctx, getVector, xDomain, yDomain, isPolar} = this._initFlow(this.props);
        const particleSystem = new ParticleFlowSystem(
            {xDomain, yDomain, particleCount, getColor: color, getBirthplace: birthplace}
        );

        if(useSimpleFade) ctx.fillStyle = simpleFadeColor;
        ctx.lineWidth = this.props.lineWidth;
        ctx.globalCompositeOperation = "source-over";
        //ctx.globalCompositeOperation = "screen";
        ctx.lineCap = 'square';

        const startTime = new Date().getTime();
        const lastFrameTime = startTime;
        const curFrame = 1;

        _.assign(this, {particleSystem, ctx, getVector, xDomain, yDomain, startTime, curFrame, lastFrameTime, isPolar});

        // draw loop
        this._redraw();
    }
    componentWillReceiveProps(newProps) {
        _.assign(this, this._initFlow(newProps));
        this.particleSystem.setOptions({
            getColor: newProps.color,
            xDomain: this.xDomain,
            yDomain: this.yDomain,
            particleCount: newProps.particleCount
        });

        // clear screen on new screenId
        if(_.has(newProps, 'screenId') && newProps.screenId !== this.props.screenId) {
            this.particleSystem.reset();
            this.ctx.clearRect(0, 0, this.props.width, this.props.height);
        }

        // update number of particles without restarting from scratch
        const newCount = newProps.particleCount;
        const oldCount = this.props.particleCount;
        if(newCount > oldCount)
            this.particleSystem.add(newCount - oldCount);
        else if(newCount < oldCount)
            this.particleSystem.limit(newCount);
    }
    shouldComponentUpdate(newProps) {
        // only re-render canvas element if size changes
        return newProps.width !== this.props.width || newProps.height !== this.props.height;
    }

    _initFlow(props) {
        // cache a few things upfront, so we don't do them in every redraw call
        const ctx = ReactDOM.findDOMNode(this.refs.canvas).getContext("2d");
        ctx.lineWidth = props.lineWidth;
        const {data, scale, vx, vy, vr, vTheta, xBins, yBins, scaleFactor} = props;
        const xDomain = scale.x.domain();
        const yDomain = scale.y.domain();
        const isPolar = _.every([vr, vTheta], _.isFunction);
        const isCartesian = _.every([vx, vy], _.isFunction);
        const hasData = _.every([data, xBins, yBins], _.isArray);
        if(!(isPolar || isCartesian || hasData))
            throw new Error("Must provide {vx, vy}, {vr, vTheta}, or {data, xBins, yBins} props for vector field");

        const [vA, vB] = (isPolar ? [vr, vTheta] : (isCartesian ? [vx, vy] : [null, null]));
        const getVector = (isPolar || isCartesian) ?
            // if polar or cartesian vector functions are provided, use them to generate flow
            (...args) => [vA(...args), vB(...args)] :
            // if a grid of vector data is provided,
            // create a vector function from it which interpolates between the grid points
            (x, y) => interpolateGrid(x, y, data, xDomain, yDomain, xBins, yBins, scaleFactor);

        return {ctx, getVector, xDomain, yDomain, isPolar};
    }
    _fadeOutSimple() {
        // simple fade out by drawing transparent (fillStyle) white rectangle on top every frame
        // fast but doesn't fade lines all the way, doesn't work with transparent background
        this.ctx.fillRect(0, 0, this.props.width, this.props.height);
    }
    _fadeOut() {
        // more complicated alpha fade for real transparency - but slower
        const image = this.ctx.getImageData(0, 0, this.props.width, this.props.height);
        const imageData = image.data;
        if(imageData) {
            const len = imageData.length;
            const {fadeAmount} = this.props;
            for (let pI=3; pI<len; pI += 4) {
                imageData[pI] -= fadeAmount;
            }
            this.ctx.putImageData(image, 0, 0);
        }
    }
    _redraw = () => {
        const {scale, fadeAmount, useSimpleFade} = this.props;
        const {ctx, getVector, isPolar} = this;

        if(fadeAmount)
            useSimpleFade ? this._fadeOutSimple() : this._fadeOut();

        const translations = this.particleSystem.advect(getVector, isPolar);
        _.forEach(translations, function([x, y, x1, y1, color]) {
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(scale.x(x), scale.y(y));
            ctx.lineTo(scale.x(x1), scale.y(y1));
            ctx.stroke();
        });

        if(!(this.curFrame % 20)) {
            const currentTime = new Date().getTime();
            const dTime = currentTime - this.lastFrameTime;
            const fps = 1 / (dTime / (20 * 1000));
            console.log(fps, 'fps');
            this.lastFrameTime = currentTime;
        }
        this.curFrame++;

        requestAnimationFrame(this._redraw);
    };

    render() {
        const {margin, width, height} = this.props;
        return <canvas
            ref="canvas"
            style={{marginLeft: margin.left, marginTop: margin.top}}
            width={width}
            height={height}
        />;
    }
}

// wrapper for reactochart
class FlowFieldChart extends React.Component {
    render() {
        const dimensions = {width: this.props.scaleWidth, height: this.props.scaleHeight};
        const flowProps = _.assign({}, this.props, dimensions);

        return <g>
            <foreignObject>
                <FlowField {...flowProps} />;
            </foreignObject>
        </g>;
    }
}
