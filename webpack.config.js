var path = require('path');
var webpack = require('webpack');

var plugins = [];
var entry = [];
if (process.env.DEV_SERVER) {
    plugins.push(new webpack.HotModuleReplacementPlugin());
    entry.push('webpack-dev-server/client?http://localhost:3000',
               'webpack/hot/only-dev-server');
}
entry.push('./index');
plugins.push(new webpack.NoErrorsPlugin());

module.exports = {
    devtool: 'eval',
    entry: entry,
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '/static/'
    },
    plugins: plugins,
    resolve: {
        extensions: ['', '.js']
    },
    module: {
        loaders: [{
            test: /\.js$/,
            loaders: ['babel'],
            exclude: /node_modules/
        }]
    }
};
