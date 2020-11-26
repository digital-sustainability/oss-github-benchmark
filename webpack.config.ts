import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";


const config: webpack.Configuration = {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist',
        host: "0.0.0.0",
        proxy: {
            '/api': 'http://localhost:3000'
        }
    },
    entry:'./src/main.ts',
    // target: 'node',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(html)$/,
                use: {
                    loader: 'html-loader',
                    options: {
                        // attrs: ['img:src'],
                        // root: path.resolve(__dirname)
                    }
                    //     attrs: [':data-src']
                    // }
                }
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    'style-loader',
                    // Translates CSS into CommonJS
                    'css-loader',
                    // Compiles Sass to CSS
                    'sass-loader',
                ],
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                use: [
                    {
                        loader: 'file-loader',
                    },
                ],
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'fonts/'
                        }
                    }
                ]
            },
        ],
    },
    resolve: {
        alias: {
            app: path.resolve(__dirname, 'src/'),
        },
        // modules: [ path.resolve(__dirname), 'node_modules' ],
        extensions: [ '.tsx', '.ts', '.js' ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "index.html",
            inject: "body"
        }),
        new CopyWebpackPlugin([
            {
                from: 'assets/',
                to: path.resolve(__dirname, 'dist' + '/assets'),
            },
        ])
    ],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
};

export default config;

