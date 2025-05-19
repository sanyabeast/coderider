const {
    VueLoaderPlugin
} = require("vue-loader");
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack');

// Simplified configuration
const env = process.env.NODE_ENV || 'development'
const sourceMap = env === 'development'
const host = 'localhost'
console.log('Current NODE_ENV:', env)


let webpackConfig = {
    devServer: {
        // host: "192.168.1.182",
        host: host,
        port: 8000,
        // https: true
    },
    devtool: sourceMap ? 'cheap-module-eval-source-map' : undefined,
    mode: 'development', // Explicitly set mode to development
    output: {
        filename: '[name].min.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'umd',
        auxiliaryComment: 'Test Comment'
    },
    module: {
        rules: [{
            test: /\.(ts|tsx)$/,
            exclude: /node_modules/,
            use: [
                {
                    loader: "babel-loader"
                },
                {
                    loader: "ts-loader",
                    options: {
                        appendTsSuffixTo: [/\.vue$/],
                        transpileOnly: true
                    }
                }
            ]
        }, {
            test: /\.(js$)/,
            // exclude: /(node_modules)/,
            use: [{
                loader: "babel-loader",
                options: {
                    // exclude: /node_modules/,
                }
            }]
        }, {
            test: /\.css$/,
            use: [
                {
                    loader: "style-loader"
                },
                {
                    loader: 'css-loader',
                }

            ]
        }, {
            test: /\.scss$/,
            use: [
                {
                    loader: "style-loader"
                },
                {
                    loader: 'css-loader',
                    options: {
                        url: false,
                        importLoaders: 1
                    }
                }
            ]
        }, {
            test: /\.(mp3|ogg)$/,
            use: [{
              loader: 'file-loader',
              options: {
                name: '[path][name].[ext]'
              }
            }]
        }, {
            test: /\.vue$/,
            use: [
                {
                    loader: "vue-loader",
                    options: {
                        hot: true
                    }

                }
            ],
        }, {
            test: /\.(ttf|eot|svg|png|woff(2)?)(\?[a-z0-9]+)?$/,
            use: [{
                loader: 'file-loader'
            }]
        }]
    },
    resolve: {
        modules: ["src", "node_modules", "res"],
        extensions: [".ts", ".tsx", ".js", ".vue", ".json"],
        alias: {
            '@': path.resolve(__dirname, 'src/'),
        }
    },
    resolveLoader: {
        alias: {
            "txt": "raw-loader"
        }
    },
    plugins: [
        new VueLoaderPlugin(),
        new HtmlWebpackPlugin({
            filename: path.join(__dirname, 'dist', 'index.html'),
            template: path.join(__dirname, 'static', 'index.html'),
            inject: true,
        }),
        new webpack.ProvidePlugin({
            "THREE": "three"
        })
    ],
};

// Simplified entry configuration
webpackConfig.entry = {
    "main": "main"
}

module.exports = webpackConfig