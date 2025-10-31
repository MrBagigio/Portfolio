const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    main: './src/core/app/main.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: false
    }),
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
      inject: 'body',
      scriptLoading: 'defer'
    })
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        three: {
          test: /[\\/]node_modules[\\/]three[\\/]/,
          name: 'three',
          chunks: 'all',
          priority: 20
        },
        ai: {
          test: /[\\/]src[\\/]features[\\/]ai-chat[\\/]/,
          name: 'ai-chat',
          chunks: 'all',
          priority: 15
        },
        webgl: {
          test: /[\\/]src[\\/](core[\\/]rendering|components[\\/]effects|components[\\/]ui[\\/]GlobalCRTBackground)[\\/]/,
          name: 'webgl',
          chunks: 'all',
          priority: 15
        }
      }
    },
    usedExports: true, // Tree shaking
    minimize: true
  },
  devtool: false, // Rimuoviamo source maps per produzione
  performance: {
    hints: 'warning',
    maxAssetSize: 500000, // 500KB
    maxEntrypointSize: 500000
  }
};