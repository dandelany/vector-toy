import React from 'react';
import ReactDOM from 'react-dom';
import Layer from 'react-layer';

const defaultStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'red',
    zIndex: -1
};
const makeWallpaper = (ComposedComponent) => class extends React.Component {
    constructor() {
        super();
        this.state = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        this._throttledUpdateSize =  _.throttle(this._updateSize.bind(this), 30);
    }

    componentDidMount() {
        this._renderLayer();
        window.addEventListener('resize', this._throttledUpdateSize);
    }
    componentDidUpdate() {
        this._renderLayer();
    }
    componentWillUnmount() {
        this._layer.destroy();
        this._layer = null;
        window.removeEventListener('resize', this._throttledUpdateSize);
    }

    _updateSize() {
        this.setState({width: window.innerWidth, height: window.innerHeight});
    }
    _renderLayer() {
        if (!this._layer) {
            this._layer = new Layer(document.body, () => {
                return <div style={defaultStyle}>
                    <ComposedComponent {...this.props} {...{width: this.state.width, height: this.state.height}} />
                </div>;
            });
        }

        this._layer.render()
    }

    render() {
        return null;
    }
};

export default makeWallpaper;
