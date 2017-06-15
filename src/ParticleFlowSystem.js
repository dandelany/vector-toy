'use strict';

import _ from 'lodash';
import * as d3 from 'd3';

function cartesianToPolar(x, y) {
    const r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    const theta = Math.atan2(y, x);

    return [r, theta];
}

function polarToCartesian(r, theta) {
    return [r * Math.cos(theta), r * Math.sin(theta)];
}

function randomAge() {
    return Math.round(Math.random() * 100);
}
function randomGray(min=0, max=255) {
    const rgb = _.random(min, max);
    return `rgb(${rgb}, ${rgb}, ${rgb})`;
}

function uniformXY(xDomain, yDomain) {
    const x = _.random(xDomain[0], xDomain[1], true);
    const y = _.random(yDomain[0], yDomain[1], true);
    return {x, y};
}
function uniformGrid(xDomain, yDomain, gridPrecision = 1) {
    const x = +_.random(xDomain[0], xDomain[1], true).toFixed(gridPrecision);
    const y = +_.random(yDomain[0], yDomain[1], true).toFixed(gridPrecision);
    return {x, y};
}

function normalXY(xDomain, yDomain) {
    const [xMean, yMean] = [xDomain, yDomain].map(_.mean);
    const [xDev, yDev] = [xDomain, yDomain].map(d => Math.abs(d[1] - d[0]) / 10);
    return {
        x: d3.randomNormal(xMean, xDev)(),
        y: d3.randomNormal(yMean, yDev)()
    }
}

const defaultOptions = {
    particleCount: 100,
    getColor: randomGray,
    maxAge: 100,
    dt: 0.005,
    // getBirthplace: uniformXY
    getBirthplace: normalXY
};

export default class ParticleFlowSystem {
    constructor(options = {}) {
        this.setOptions(options);
        this.reset();
    }

    setOptions(options) {
        _.assign(this, _.defaults(options, (this.options || defaultOptions)));
    }
    reset() {
        this.startTime = +(new Date());
        this.ticks = 0;
        this.particles = [];
        this.add(this.particleCount);
    }

    add(count) {
        // add new particles to system
        const {particles} = this;
        const newParticles = _.range(count).map((i) => this._createParticle(null, i));
        particles.push.apply(particles, newParticles);
    }
    limit(limit) {
        // limit system to a max # of particles, remove the rest
        this.particles = this.particles.slice(0, limit);
    }
    advect(getVector, polar = true) {
        // advect (push) each particle along a cartesian vector field
        // expects a function which returns a velocity vector [vx, vy]
        // given a particle's [x, y] or [r, theta] position
        const {particles, maxAge, dt, ticks} = this;
        const time = this._getTime();
        this.ticks += 1;

        // return an array of particle translations which are used to draw lines
        return particles.map((particle, index) => {
            const [x, y, r, theta, age, color, vxLast, vyLast, vrLast, vThetaLast, indexLast] = particle;
            const vectorArgs = [x, y, r, theta, time, ticks, vxLast, vyLast, vrLast, vThetaLast, indexLast];
            let vx, vy, vr, vTheta, x1, y1, r1, theta1;

            if(polar) {
                [vr, vTheta] = getVector.apply(null, vectorArgs);
                [vx, vy] = polarToCartesian(vr, vTheta);
                r1 = r + (vr * dt);
                theta1 = theta + (vTheta * dt);
                [x1, y1] = polarToCartesian(r1, theta1);
            } else {
                [vx, vy] = getVector.apply(null, vectorArgs);
                x1 = x + (vx * dt);
                y1 = y + (vy * dt);
                [r1, theta1] = cartesianToPolar(x1, y1);
            }

            // if((age + 1) > maxAge) {
            if(false) {
                // kill the old particle and make a new one out of its dead body
                this._createParticle(particle, index);
            } else {
                // update the particle with its new position and age
                particle.splice(0, 11, x1, y1, r1, theta1, age + 1, color, vx, vy, vr, vTheta, index);
            }

            return [x, y, x1, y1, color];
        });
    }

    _createParticle = (particle, index) => {
        // create a new particle with random starting position and age
        // pass particle arg to reuse obj reference, otherwise created from scratch
        const {xDomain, yDomain, getColor, ticks} = this;
        const time = this._getTime();

        //const x = _.random(xDomain[0], xDomain[1], true);
        //const y = _.random(yDomain[0], yDomain[1], true);
        let {x, y, r, theta} = this.getBirthplace(xDomain, yDomain);
        if(_.every([x, y], _.isFinite)) {
            ([r, theta] = cartesianToPolar(x, y));
        } else {
            ([x, y] = polarToCartesian(r, theta));
        }

        const colorArgs = [x, y, r, theta, time, ticks];
        const color = _.isFunction(getColor) ?
            getColor.apply(null, colorArgs) : getColor;
        const age = randomAge();

        // arrays still faster than objects :(
        return particle ?
            particle.splice(0, 8, x, y, r, theta, age, color, 0, 0, 0, 0, index) :
            [x, y, r, theta, age, color, 0, 0, 0, 0, index];
    };

    _getTime = () => {
        if(!this.startTime) this.startTime = +(new Date());
        return (+(new Date()) - this.startTime) / 1000;
    };
}
