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
class ParticleFlowSystem {
    constructor(xDomain, yDomain, particleCount = 0, getColor = 'black', maxAge = 100, dt = 0.005) {
        _.assign(this, {xDomain, yDomain, getColor, maxAge, dt, particles: []});
        this.add(particleCount);
    }

    add(count) {
        // add new particles to system
        const {particles} = this;
        const newParticles = _.range(count).map(() => this._createParticle());
        particles.push.apply(particles, newParticles);
    }
    limit(limit) {
        // limit system to a max # of particles, remove the rest
        this.particles = this.particles.slice(0, limit);
    }
    advect(getVector, callback) {
        // advect (push) each particle along a cartesian vector field
        // expects a function which returns a velocity vector [vx, vy]
        // given a particle's [x, y] or [r, theta] position
        const {particles, maxAge, dt} = this;

        return particles.map((particle) => {
            const [x, y, r, theta, age, color] = particle;
            const [vx, vy] = getVector(x, y, r, theta);

            const x1 = x + (vx * dt);
            const y1 = y + (vy * dt);
            const [r1, theta1] = cartesianToPolar(x1, y1);

            if((age + 1) > maxAge) {
                // kill the old particle and make a new one out of its dead body
                this._createParticle(particle);
            } else {
                // update the particle with its new position and age
                particle.splice(0, 5, x1, y1, r1, theta1, age + 1);
            }

            // call the callback
            //callback(x, y, x1, y1, color);
            return [x, y, x1, y1, color];
        });

        //for (var i = 0; i < particles.length; i++) {
        //    const particle = particles[i];
        //    const [x, y, r, theta, age, color] = particle;
        //    const [vx, vy] = getVector(x, y, r, theta);
        //
        //    const x1 = x + (vx * dt);
        //    const y1 = y + (vy * dt);
        //    const [r1, theta1] = cartesianToPolar(x1, y1);
        //
        //    if((age + 1) > maxAge) {
        //        // kill the old particle and make a new one out of its dead body
        //        this._createParticle(particle);
        //    } else {
        //        // update the particle with its new position and age
        //        particle.splice(0, 5, x1, y1, r1, theta1, age + 1);
        //    }
        //
        //    // call the callback
        //    callback(x, y, x1, y1, color);
        //}
    }

    _createParticle = (particle) => {
        // create a new particle with random starting position and age
        // pass particle arg to reuse obj reference, otherwise created from scratch
        const {particles, xDomain, yDomain, getColor} = this;

        const x = _.random(xDomain[0], xDomain[1], true);
        const y = _.random(yDomain[0], yDomain[1], true);
        const [r, theta] = cartesianToPolar(x, y);
        const color = _.isFunction(getColor) ?
            getColor(x, y, r, theta) : getColor;
        const age = randomAge();

        // arrays still faster than objects :(
        return particle ?
            particle.splice(0, 6, x, y, r, theta, age, color) :
            [x, y, r, theta, age, color];
    };
}

function cartesianToPolar(x, y) {
    const r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    const theta = Math.atan2(y, x);
    //const theta = // check which quadrant the point is in
    //    (x > 0 && y > 0) ? theta1 :
    //    (x < 0 && y > 0) ? Math.PI - theta1 :
    //    (x < 0 && y < 0) ? Math.PI + theta1 :
    //    (2 * Math.PI) + theta1;

    return [r, theta];
}

function polarToCartesian(r, theta) {
    return [r * Math.cos(theta), r * Math.sin(theta)];
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
        scaleFactor: 10,
        fadeAmount: 2,
        useSimpleFade: false,
        simpleFadeColor: "rgba(255, 255, 255, 0.05)"
    };

    componentDidMount() {
        const {particleCount, color, useSimpleFade, simpleFadeColor} = this.props;

        const {ctx, getVector, xDomain, yDomain} = this._initFlow(this.props);
        const particles = initParticles(xDomain, yDomain, particleCount, color);
        const particleSystem = new ParticleFlowSystem(xDomain, yDomain, particleCount, color);

        if(useSimpleFade) ctx.fillStyle = simpleFadeColor;
        ctx.lineWidth = this.props.lineWidth;
        ctx.globalCompositeOperation = "source-over";
        //ctx.globalCompositeOperation = "screen";

        const startTime = new Date().getTime();
        const lastFrameTime = startTime;
        const curFrame = 1;

        _.assign(this, {particles, particleSystem, ctx, getVector, xDomain, yDomain, startTime, curFrame, lastFrameTime});

        // draw loop
        //d3.timer(() => { this.redraw(); }, 30);
        this._redraw();
    }
    componentWillReceiveProps(newProps) {
        _.assign(this, this._initFlow(newProps));

        if(_.has(newProps, 'screenId') && newProps.screenId !== this.props.screenId) {
            this.ctx.clearRect(0, 0, this.props.scaleWidth, this.props.scaleHeight);
        }

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
                trimParticles(this.particles, newCount);

            newCount > oldCount ?
                this.particleSystem.add(newCount - oldCount) :
                this.particleSystem.limit(newCount)
        }
    }
    shouldComponentUpdate() {
        return false;
    }

    _initFlow(props) {
        // cache a few things upfront, so we don't do them in every redraw call
        const ctx = ReactDOM.findDOMNode(this.refs.canvas).getContext("2d");
        ctx.lineWidth = props.lineWidth;
        const {data, scale, vx, vy, xBins, yBins, scaleFactor} = props;
        const xDomain = scale.x.domain();
        const yDomain = scale.y.domain();

        //const getVector = (x, y) => {
        //    const [r, theta] = cartesianToPolar(x, y);
        //    const [vR, vTheta] = [vx(x, theta, this.props), vy(y, theta, this.props)];
        //    //const [vR, vTheta] = [vx(r, theta, this.props), vy(r, theta, this.props)];
        //    const [r1, theta1] = [r + vR, theta + vTheta];
        //    const [x1, y1] = polarToCartesian(r1, theta1);
        //    return [x1 - x, y1 - y];
        //    //return [vR, vTheta];
        //    return polarToCartesian(vR, vTheta);
        //};

        const getVector = _.every([vx, vy], _.isFunction) ?
            // if vector functions are provided, use them to generate flow
            (xVal, yVal) => [vx(xVal, yVal, this.props), vy(xVal, yVal, this.props)] :
            // if a grid of vector data is provided,
            // create a vector function from it which interpolates between the grid points
            (xVal, yVal) => interpolateGrid(xVal, yVal, data, xDomain, yDomain, xBins, yBins, scaleFactor);

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
            const {fadeAmount} = this.props;
            for (let pI=3; pI<len; pI += 4) {
                imageData[pI] -= fadeAmount;
            }
            this.ctx.putImageData(image, 0, 0);
        }
    }
    _redraw = () => {
        const {scale, fadeAmount, useSimpleFade} = this.props;
        const {ctx, particles, getVector} = this;

        if(fadeAmount)
            useSimpleFade ? this._fadeOutSimple() : this._fadeOut();

        const translations = this.particleSystem.advect(getVector);
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
