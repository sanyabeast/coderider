const {
    VueLoaderPlugin
} = require("vue-loader");
const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')
const JsDocPlugin = require('jsdoc-webpack4-plugin')
const jsonfile = require("jsonfile")
const HtmlWebpackPlugin = require('html-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const ip = require("ip")
const CopyPlugin = require('copy-webpack-plugin');

const packageJSON = jsonfile.readFileSync("package.json")


const env = process.env.NODE_ENV
const sourceMap = env === 'development'
let host = ip.address()

env == "production" && increaseVersionBuildNumber();


let webpackConfig = {
    devServer: {
        host: host,
        port: 8000,
        https: true
    },
    devtool: sourceMap ? 'cheap-module-eval-source-map' : undefined,
    mode: env,
    output: {
        filename: '[name].min.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'umd',
        auxiliaryComment: 'Test Comment'
    },
    module: {
        rules: [{
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
                }, {
                    loader: 'sass-loader',
                }

            ]
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
    ],
};

if (env == "production") {
    webpackConfig.entry = {
        "main": "main"
    }

    webpackConfig.optimization = {
        minimizer: [new TerserPlugin({
            test: /\.js(\?.*)?$/i,
            terserOptions: {
                ecma: 5,
                warnings: false,
                parse: {},
                compress: {},
                mangle: true, // Note `mangle.properties` is `false` by default.
                module: false,
                output: null,
                toplevel: false,
                nameCache: null,
                ie8: false,
                keep_classnames: undefined,
                keep_fnames: false,
                safari10: true
            }
        })]
    }

    webpackConfig.plugins.push( new CopyPlugin([
      { from: 'res', to: 'res' },
    ]) )

    webpackConfig.plugins.push( new BundleAnalyzerPlugin({
        reportFilename: "../misc/bundle-stats.html",
        analyzerMode: "static",
        openAnalyzer: false
    }) )
} else {
    webpackConfig.entry = {
        "main": "main",
    }
}

function increaseVersionBuildNumber() {
    var splittedVersion = packageJSON.version.split(".");
    var splittedMinorBuild = splittedVersion[2].split("-");
    splittedMinorBuild[0]++;
    var newVersion = [splittedVersion[0], splittedVersion[1], splittedMinorBuild.join("-")].join(".");
    packageJSON.version = newVersion;

    jsonfile.writeFileSync("package.json", packageJSON, {
        spaces: 4
    });
}

module.exports = webpackConfig