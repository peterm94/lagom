/**
 * Function called by react-app-rewired to modify Create React App's Webpack configuration.
 *
 * @param config Webpack config.
 * @param env
 * @returns {*} The modified Webpack config.
 */
module.exports = function override(config, env) {

    // Set the public path to '' from '/' so that the built app can be run locally.
    config.output.publicPath = '';
    return config;
};
