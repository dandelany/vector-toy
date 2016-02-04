import React from 'react';
import ReactDOM from 'react-dom';
import d3 from 'd3';
import _ from 'lodash';

const dt = 0.005;
const maxAge = 100; // # timesteps before restart

// vector field function

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

function interpolateGrid(x, y, vectorGrid, xDomain, yDomain, xBins, yBins) {
    if(!_.isFinite(x) || !_.isFinite(y)) return [0, 0];

    const scaleFactor = 10;

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

function randomAge() {
    return Math.round(Math.random() * 100);
}
function randomColor(min=0, max=255) {
    const rgb = () => _.random(min, max);
    return `rgb(${rgb()}, ${rgb()}, ${rgb()})`;
}
function randomGray(min=0, max=255) {
    const rgb = _.random(min, max);
    return `rgb(${rgb}, ${rgb}, ${rgb})`;
}

function initParticles(xDomain, yDomain, particleCount, colorFunc = () => 'black') {
    let particles = {x: [], y: [], color: [], age: []};
    _.range(particleCount).forEach(i => {
        addParticle(particles, xDomain, yDomain, colorFunc);
    });
    return particles;
}
function addParticle(particles, xDomain, yDomain, colorFunc = () => 'black') {
    const x = _.random(xDomain[0], xDomain[1] - 1) + Math.random();
    const y = _.random(yDomain[0], yDomain[1] - 1) + Math.random();
    particles.x.push(x);
    particles.y.push(y);
    particles.color.push(colorFunc(x, y));
    particles.age.push(randomAge());
    return particles;
}
function trimParticles(particles, limit) {
    particles.x = particles.x.slice(0, limit);
    particles.y = particles.y.slice(0, limit);
    particles.color = particles.color.slice(0, limit);
    particles.age = particles.age.slice(0, limit);
    return particles;
}

export default class FlowField extends React.Component {
    static propTypes = {
        data: React.PropTypes.arrayOf(React.PropTypes.array),
        xBins: React.PropTypes.arrayOf(React.PropTypes.array),
        yBins: React.PropTypes.arrayOf(React.PropTypes.array),
        vx: React.PropTypes.function,
        vy: React.PropTypes.function,
        color: React.PropTypes.function,
        particleCount: React.PropTypes.number,
        lineWidth: React.PropTypes.number,

        // positive integer representing how fast the trails fade out
        // fadeAmount 0 disables fade entirely,
        fadeAmount: React.PropTypes.number,

        // pass useSimpleFade = true to use the simpler/faster color fade out method
        // which has the downsides of leaving particle trails and no alpha
        useSimpleFade: React.PropTypes.bool,
        simpleFadeColor: React.PropTypes.string,

        // expected to be rendered inside a Reactochart XYPlot, which will pass these props
        scale: React.PropTypes.obj,
        scaleWidth: React.PropTypes.number,
        scaleHeight: React.PropTypes.number
    };
    static defaultProps = {
        color: () => randomGray(),
        width: 500,
        height: 500,
        particleCount: 300,
        lineWidth: 0.7,
        fadeAmount: 2,
        useSimpleFade: false,
        simpleFadeColor: "rgba(255, 255, 255, 0.05)"
    };

    componentDidMount() {
        const {particleCount, color, useSimpleFade, simpleFadeColor} = this.props;

        const {ctx, getVector, xDomain, yDomain} = this._initFlow(this.props);
        const particles = initParticles(xDomain, yDomain, particleCount, color);

        if(useSimpleFade) ctx.fillStyle = simpleFadeColor;
        ctx.lineWidth = this.props.lineWidth;
        ctx.globalCompositeOperation = "source-over";

        const startTime = new Date().getTime();
        const lastFrameTime = startTime;
        const curFrame = 1;

        Object.assign(this, {particles, ctx, getVector, xDomain, yDomain, startTime, curFrame, lastFrameTime});

        // draw loop
        //d3.timer(() => { this.redraw(); }, 30);
        this._redraw();
    }
    componentWillReceiveProps(newProps) {
        Object.assign(this, this._initFlow(newProps));

        // update number of particles without restarting from scratch
        const newCount = newProps.particleCount;
        const oldCount = this.props.particleCount;
        if(newCount != oldCount) {
            const xDomain = this.props.scale.x.domain();
            const yDomain = this.props.scale.y.domain();
            newCount > oldCount ?
                _.times(newCount - oldCount, () => {
                    addParticle(this.particles, xDomain, yDomain, this.props.color);
                }) :
                trimParticles(this.particles, newCount)
        }
    }
    shouldComponentUpdate() {
        return false;
    }

    _initFlow(props) {
        // cache a few things upfront, so we don't do them in every redraw call
        const ctx = ReactDOM.findDOMNode(this.refs.canvas).getContext("2d");
        const {data, scale, vx, vy, xBins, yBins} = props;
        const xDomain = scale.x.domain();
        const yDomain = scale.y.domain();

        const getVector = _.every([vx, vy], _.isFunction) ?
            // if vector functions are provided, use them to generate flow
            (xVal, yVal) => [vx(xVal, yVal, this.props), vy(xVal, yVal, this.props)] :
            // if a grid of vector data is provided,
            // create a vector function from it which interpolates between the grid points
            (xVal, yVal) => interpolateGrid(xVal, yVal, data, xDomain, yDomain, xBins, yBins);

        return {ctx, getVector, xDomain, yDomain};
    }
    _fadeOutSimple() {
        // simple fade out by drawing transparent (fillStyle) white rectangle on top every frame
        // fast but doesn't fade lines all the way, doesn't work with transparent background
        this.ctx.fillRect(0, 0, this.props.scaleWidth, this.props.scaleHeight);
    }
    _fadeOut() {
        // more complicated alpha fade for real transparency - but slower
        const image = this.ctx.getImageData(0, 0, this.props.scaleWidth, this.props.scaleHeight);
        const imageData = image.data;
        if(imageData) {
            const len = imageData.length;
            for (let pI=3; pI<len; pI += 4) {
                imageData[pI] -= this.props.fadeAmount;
            }
            this.ctx.putImageData(image, 0, 0);
        }
    }
    _redraw = () => {
        const {scale, fadeAmount, useSimpleFade} = this.props;
        const {ctx, particles, getVector} = this;
        const {x, y, color, age} = particles;
        const getColor = this.props.color;

        const xDomain = scale.x.domain();
        const yDomain = scale.y.domain();

        if(fadeAmount)
            useSimpleFade ? this._fadeOutSimple() : this._fadeOut();

        const rX = (x, y) => y * Math.cos(x);
        const rY = (x, y) => x * Math.cos(y);

        //console.log(rX(x[1], y[1]));
        for (var i = 0; i < x.length; i++) {
            const dr = getVector(x[i], y[i]);

            ctx.strokeStyle = color[i];
            ctx.beginPath();
            ctx.moveTo(scale.x(x[i]), scale.y(y[i])); // start point of path
            //ctx.moveTo(scale.x(rY(x[i], y[i])), scale.y(rX(x[i], y[i]))); // start point of path
            // simlutaneously draw line to end point & increment position
            ctx.lineTo(scale.x(x[i] += dr[0] * dt), scale.y(y[i] += dr[1] * dt));
            //x[i] += dr[0] * dt;
            //y[i] += dr[1] * dt;
            //ctx.lineTo(scale.x(rY(x[i], y[i])), scale.y(rX(x[i], y[i])));
            ctx.stroke();

            // increment age of each curve, restart if maxAge is reached
            if (age[i]++ > maxAge) {
                age[i] = randomAge();
                x[i] = _.random(xDomain[0], xDomain[1] - 1) + Math.random();
                y[i] = _.random(yDomain[0], yDomain[1] - 1) + Math.random();
                color[i] = getColor(x[i], y[i]);
                //color[i] = `rgb(0, ${Math.floor(scale.x(x[i])) % 255}, ${Math.floor(scale.y(y[i])) % 255})`;
                //color[i] = `rgb(255, 0, 0)`;
                //color[i] = randomGray(50);
                //color[i] = 'black';
            }
        }

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
        const {margin, scaleWidth, scaleHeight} = this.props;
        return <g>
            <foreignObject>
                <canvas
                    ref="canvas"
                    style={{marginLeft: margin.left, marginTop: margin.top}}
                    width={scaleWidth}
                    height={scaleHeight}
                />;
            </foreignObject>
        </g>;
    }
};
