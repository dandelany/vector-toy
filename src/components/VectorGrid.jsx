import React from 'react';

export default class VectorGrid extends React.Component {
    static defaultProps = {
        cellSize: 20,
        xDomain: [0, 100],
        yDomain: [0, 100]
    };

    render() {
        const {scale, data} = this.props;
        const vScaleFactor = 0.3;

        return <g>
            {data.map(row => {
                return <g className="row">
                    {row.map(d => {
                        const x1 = scale.x(d.x);
                        const y1 = scale.y(d.y);
                        const x2 = scale.x(d.x + (d.vx * vScaleFactor));
                        const y2 = scale.y(d.y + (d.vy * vScaleFactor));
                        const style = {stroke: 'red'};
                        return <g>
                            <line {...{x1, y1, x2, y2, style}} />
                            <circle cx={x1} cy={y1} r={1} style={{fill: 'red'}} />
                        </g>;
                    })}
                </g>;
            })}
        </g>
    }
}
