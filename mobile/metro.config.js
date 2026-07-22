const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Combine existing blockList rules safely for Windows build compatibility
const existingBlockList = config.resolver.blockList;
const customBlockList = [
  /.*expo-module-gradle-plugin.*bin.*/,
  /.*\.kotlin.*/
];

if (Array.isArray(existingBlockList)) {
  config.resolver.blockList = existingBlockList.concat(customBlockList);
} else if (existingBlockList) {
  config.resolver.blockList = [existingBlockList, ...customBlockList];
} else {
  config.resolver.blockList = customBlockList;
}

module.exports = config;
