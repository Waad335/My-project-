// Metro configuration for the Dodana app.
//
// The app shares two things with the website, read straight from its source
// so they can never drift apart: the English/Arabic text files
// (src/messages) and the mobile API's response types (type-only, erased at
// build time). Metro can only bundle files inside this project and the
// folders listed in watchFolders, so the website's text folder is the one
// website location it can see — no server code and none of the website's
// own node_modules can end up in the app.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.watchFolders = [path.resolve(__dirname, "../src/messages")];

module.exports = config;
