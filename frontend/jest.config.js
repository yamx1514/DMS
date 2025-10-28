const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  transform: {
    ...tsJestTransformCfg,
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
};
