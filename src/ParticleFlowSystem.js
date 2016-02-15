'use strict';

import _ from 'lodash';
import d3 from 'd3';

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

function normalXY(xDomain, yDomain) {
    const [xMean, yMean] = [xDomain, yDomain].map(_.mean);
    const [xDev, yDev] = [xDomain, yDomain].map(d => Math.abs(d[1] - d[0]) / 4);
    return {
        x: d3.random.normal(xMean, xDev)(),
        y: d3.random.normal(yMean, yDev)()
    }
}

const defaultOptions = {
    particleCount: 100,
    getColor: randomGray,
    maxAge: 100,
    dt: 0.005,
    startCoords: uniformXY
    //startCoords: normalXY
};

export default class ParticleFlowSystem {
    constructor(options = {}) {
        this.setOptions(options);
        this.particles = [];
        this.add(this.particleCount);
    }
    setOptions(options) {
        _.assign(this, _.defaults(options, (this.options || defaultOptions)));
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
    advect(getVector, polar = true) {
        // advect (push) each particle along a cartesian vector field
        // expects a function which returns a velocity vector [vx, vy]
        // given a particle's [x, y] or [r, theta] position
        const {particles, maxAge, dt} = this;

        // return an array of particle translations which are used to draw lines
        return particles.map((particle) => {
            const [x, y, r, theta, age, color] = particle;
            let x1, y1, r1, theta1;

            if(polar) {
                let [vr, vTheta] = getVector(x, y, r, theta);
                r1 = r + (vr * dt);
                theta1 = theta + (vTheta * dt);
                [x1, y1] = polarToCartesian(r1, theta1);
            } else {
                let [vx, vy] = getVector(x, y, r, theta);
                x1 = x + (vx * dt);
                y1 = y + (vy * dt);
                [r1, theta1] = cartesianToPolar(x1, y1);
            }

            if((age + 1) > maxAge) {
                // kill the old particle and make a new one out of its dead body
                this._createParticle(particle);
            } else {
                // update the particle with its new position and age
                particle.splice(0, 5, x1, y1, r1, theta1, age + 1);
            }

            return [x, y, x1, y1, color];
        });
    }

    _createParticle = (particle) => {
        // create a new particle with random starting position and age
        // pass particle arg to reuse obj reference, otherwise created from scratch
        const {xDomain, yDomain, getColor} = this;

        //const x = _.random(xDomain[0], xDomain[1], true);
        //const y = _.random(yDomain[0], yDomain[1], true);
        let {x, y, r, theta} = this.startCoords(xDomain, yDomain);
        if(_.every([x, y], _.isFinite)) {
            ([r, theta] = cartesianToPolar(x, y));
        } else {
            ([x, y] = polarToCartesian(r, theta));
        }

        const color = _.isFunction(getColor) ?
            getColor(x, y, r, theta) : getColor;
        const age = randomAge();

        // arrays still faster than objects :(
        return particle ?
            particle.splice(0, 6, x, y, r, theta, age, color) :
            [x, y, r, theta, age, color];
    };
}
