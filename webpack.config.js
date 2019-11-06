/*var path = require('path');
 var webpack = require('webpack');
     
 module.exports = {
     entry: './js/app.js',
     output: {
         path: path.resolve(__dirname, 'build'),
         filename: 'app.bundle.js'
     },
     module: {
         loaders: [
             {
                 test: /\.js$/,
                 loader: 'babel-loader',
                 query: {
                     presets: ['es2015', 'react']
                 }
             }
         ]
     },
     stats: {
         colors: true
     },
     devtool: 'source-map'
 };*/

/*var HTMLWebpackPlugin = require('html-webpack-plugin');
var HTMLWebpackPluginConfig = new HTMLWebpackPlugin({
    template: __dirname + "/app/index.html",
    filename: "index.html",
    inject: "body"
});*/

module.exports = {
    entry: __dirname + '/app/index.js',
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            }
        ]
    },
    output: {
        filename: 'transformed.js',
        path: __dirname + '/build',
        publicPath: '/'
    },
    devServer: {
        historyApiFallback: true,
      }/*,
    plugins: [HTMLWebpackPluginConfig]*/
};

/*
Note to self: 

On glitch, when webpack runs build, the file will be created in the specified path. 
However, it will not show up in the side bar. 
You must go into the console and 'ls' to list the directory. You will find the build folder with the build file inside. 
type "refresh" into the console. 
If the new folder has a file inside of it, the folder will now show up in the side bar

Also, please note that the index.html file will now have  src = '/transformed' inserted into the body, as per the instruction in the webpack.
This is fine on your own computer, but on glitch, change the route to './transformed'. 
Actually, if you're done styling, the html file won't be changing anymore. YOu can just comment out the HTMLWebpackPluginCOnfig so that it doesn't
create a new index.html file each and every time you run 'build' in the command line. 
*/