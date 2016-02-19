import 'styles/main.less';

import React from 'react';
import ReactDOM from 'react-dom';
import App from 'components/App';

_.assign(window, {
    mouseX: 0,
    mouseY: 0
});

ReactDOM.render(<App />, document.getElementById('container'));
