"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = registerCommand;
exports.registerCommandOverrides = registerCommandOverrides;
var commands = exports.commands = {};

function registerCommand(moduleName, name, command) {
  commands[moduleName + "." + name] = command;
}

function registerCommandOverrides(moduleName, overrides) {
  Object.keys(overrides).forEach(function (override) {
    var handler = void 0;

    if (commands[moduleName + "." + overrides[override]]) {
      handler = commands[moduleName + "." + overrides[override]];
    } else if (commands[overrides[override]]) {
      handler = commands[overrides[override]];
    } else {
      console.log("Handler " + overrides[override] + " in module " + moduleName);
      console.log("to override " + override + " does not exist");
    }
    commands[override] = handler;
  });
}
//# sourceMappingURL=commands.js.map