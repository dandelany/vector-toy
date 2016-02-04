import React from 'react';
import ReactDOM from 'react-dom';
import Layer from 'react-layer';

function getWindowSize(useDPI = false) {
    // is2x for double resolution retina displays
    const dpiMult = (useDPI && window.devicePixelRatio >= 2) ? 2 : 1;
    return {
        width: window.innerWidth * dpiMult,
        height: window.innerHeight * dpiMult
    };
}

const defaultStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -1
};
const makeWallpaper = (ComposedComponent) => class extends React.Component {
    static defaultProps = {
        useDPI: true
    };
    constructor(props) {
        super(props);
        this.state = getWindowSize(props.useDPI);
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
        this.setState(getWindowSize(this.props.useDPI));
    }
    _renderLayer() {
        if (!this._layer) {
            //const {width, height} = this.state;
            //const {is2x} = this.props;
            const dpiMult = (this.props.useDPI && window.devicePixelRatio >= 2) ? 2 : 1;
            const style2x = (dpiMult === 2) ? {
                transform: 'scale(0.5) translate(-50%, -50%)',
                WebkitTransform: 'scale(0.5) translate(-50%, -50%)'
            } : {};
            const style = _.assign({}, defaultStyle, style2x);
            //const style = defaultStyle;

            this._layer = new Layer(document.body, () => {
                return <div style={style}>
                    <ComposedComponent
                        {...this.props}
                        {...getWindowSize(this.props.useDPI)}
                    />
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
