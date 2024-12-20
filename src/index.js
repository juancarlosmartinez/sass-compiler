"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var sass_1 = require("sass");
var promises_1 = require("node:fs/promises");
var node_path_1 = require("node:path");
var fs_1 = require("./util/fs");
var yargs_1 = require("yargs");
var helpers_1 = require("yargs/helpers");
var loadConfig = function () { return __awaiter(void 0, void 0, void 0, function () {
    var configPath;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                configPath = node_path_1.default.join(__dirname, 'sass-compiler.config.js');
                return [4 /*yield*/, (0, fs_1.exists)(configPath)];
            case 1:
                if (!(_a.sent())) {
                    return [2 /*return*/, Promise.reject(new Error('Configuration file not found'))];
                }
                return [2 /*return*/, require(configPath)];
        }
    });
}); };
var processEntry = function (entry) { return __awaiter(void 0, void 0, void 0, function () {
    var baseDir, outputDir, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                baseDir = "".concat(__dirname, "/").concat(entry.baseDir);
                outputDir = "".concat(__dirname, "/").concat(entry.outputDir);
                return [4 /*yield*/, (0, fs_1.isDir)(baseDir)];
            case 1:
                if (!(_a.sent())) {
                    return [2 /*return*/, Promise.reject(new Error("Base directory ".concat(baseDir, " not found")))];
                }
                return [4 /*yield*/, (0, fs_1.isDir)(outputDir)];
            case 2:
                if (!!(_a.sent())) return [3 /*break*/, 4];
                return [4 /*yield*/, (0, promises_1.mkdir)(outputDir, {
                        recursive: true
                    })];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4: return [4 /*yield*/, processDir(baseDir, outputDir).catch(function () {
                    return Promise.reject(new Error("Error processing directory ".concat(entry.baseDir)));
                })];
            case 5:
                _a.sent();
                return [3 /*break*/, 7];
            case 6:
                e_1 = _a.sent();
                console.error("Error processing entry ".concat(entry.baseDir), e_1);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
var processDir = function (dir, outputDir) { return __awaiter(void 0, void 0, void 0, function () {
    var files;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, promises_1.readdir)(dir)];
            case 1:
                files = _a.sent();
                return [4 /*yield*/, Promise.all(files.map(function (file) { return __awaiter(void 0, void 0, void 0, function () {
                        var fullPath;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    fullPath = node_path_1.default.join(dir, file);
                                    return [4 /*yield*/, (0, fs_1.isDir)(fullPath)];
                                case 1:
                                    if (!_a.sent()) return [3 /*break*/, 3];
                                    return [4 /*yield*/, processDir(fullPath, node_path_1.default.join(outputDir, file))];
                                case 2:
                                    _a.sent();
                                    return [3 /*break*/, 5];
                                case 3: return [4 /*yield*/, processFile(fullPath)];
                                case 4:
                                    _a.sent();
                                    _a.label = 5;
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); }))];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var processFile = function (file) { return __awaiter(void 0, void 0, void 0, function () {
    var ext, css, outFile;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                ext = node_path_1.default.extname(file);
                if (!(ext === '.scss' || ext === '.sass')) return [3 /*break*/, 2];
                css = sass_1.default.compile(file).css;
                outFile = file.replace(ext, '.css');
                return [4 /*yield*/, (0, fs_1.writeFile)(outFile, css)];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); };
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var config;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, loadConfig()];
            case 1:
                config = _a.sent();
                // Compile all entries
                return [4 /*yield*/, Promise.all(config.entries.map(processEntry))];
            case 2:
                // Compile all entries
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var args = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv)).parseSync();
console.log(args.argv);
main().then(function () {
    process.exit(0);
}).catch(function (err) {
    console.error(err);
    process.exit(1);
});
