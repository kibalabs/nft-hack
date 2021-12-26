"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.render = exports.findAncestorSibling = void 0;
/* eslint-disable no-console */
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var process_1 = __importDefault(require("process"));
var react_1 = __importDefault(require("react"));
// @ts-ignore
var common_webpack_1 = __importDefault(require("@kibalabs/build/scripts/common/common.webpack"));
// @ts-ignore
var css_webpack_1 = __importDefault(require("@kibalabs/build/scripts/common/css.webpack"));
// @ts-ignore
var images_webpack_1 = __importDefault(require("@kibalabs/build/scripts/common/images.webpack"));
// @ts-ignore
var js_webpack_1 = __importDefault(require("@kibalabs/build/scripts/common/js.webpack"));
// @ts-ignore
var webpackUtil_1 = require("@kibalabs/build/scripts/common/webpackUtil");
// @ts-ignore
var app_webpack_1 = __importDefault(require("@kibalabs/build/scripts/react-app/app.webpack"));
// @ts-ignore
var component_webpack_1 = __importDefault(require("@kibalabs/build/scripts/react-component/component.webpack"));
var server_1 = require("@loadable/server");
var server_2 = __importDefault(require("react-dom/server"));
var styled_components_1 = require("styled-components");
var webpack_merge_1 = __importDefault(require("webpack-merge"));
var findAncestorSibling = function (name, startingDirectory) {
    var directory = path_1["default"].resolve(startingDirectory || '');
    var rootDirectory = path_1["default"].parse(directory).root;
    var output = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
        var potentialDirectory = path_1["default"].join(directory, name);
        if (fs_1["default"].existsSync(potentialDirectory)) {
            output.push(potentialDirectory);
        }
        if (directory === rootDirectory) {
            break;
        }
        directory = path_1["default"].dirname(directory);
    }
    return output;
};
exports.findAncestorSibling = findAncestorSibling;
var render = function (sourceDirectoryPath, buildDirectoryPath, outputDirectoryPath, inputParams) { return __awaiter(void 0, void 0, void 0, function () {
    var defaultParams, params, sourceDirectory, buildDirectory, outputDirectory, pages, nodeModulesPaths, nodeWebpackConfig, webWebpackConfig;
    return __generator(this, function (_a) {
        defaultParams = {
            configModifier: undefined,
            dev: false,
            webpackConfigModifier: undefined,
            analyzeBundle: false,
            shouldAliasModules: false,
            addHtmlOutput: false
        };
        params = __assign(__assign({}, defaultParams), inputParams);
        sourceDirectory = sourceDirectoryPath;
        buildDirectory = buildDirectoryPath || path_1["default"].join(process_1["default"].cwd(), 'build');
        outputDirectory = outputDirectoryPath || path_1["default"].join(process_1["default"].cwd(), 'dist');
        pages = [{
                path: '/',
                filename: 'index.html'
            }, {
                path: '/about',
                filename: 'about/index.html'
            }, {
                path: '/roadmap',
                filename: 'roadmap/index.html'
            }];
        nodeModulesPaths = (0, exports.findAncestorSibling)('node_modules');
        nodeWebpackConfig = (0, webpack_merge_1["default"])((0, common_webpack_1["default"])(__assign(__assign({}, params), { name: 'site-node' })), (0, js_webpack_1["default"])(__assign(__assign({}, params), { polyfill: false, react: true })), (0, images_webpack_1["default"])(params), (0, css_webpack_1["default"])(params), (0, component_webpack_1["default"])(__assign(__assign({}, params), { entryFilePath: path_1["default"].join(sourceDirectory, './app.tsx'), outputDirectory: buildDirectory, excludeAllNodeModules: true, nodeModulesPaths: nodeModulesPaths })));
        webWebpackConfig = (0, webpack_merge_1["default"])((0, common_webpack_1["default"])(__assign(__assign({}, params), { name: 'site' })), (0, js_webpack_1["default"])(__assign(__assign({}, params), { polyfill: true, react: true })), (0, images_webpack_1["default"])(params), (0, css_webpack_1["default"])(params), (0, app_webpack_1["default"])(__assign(__assign({}, params), { entryFilePath: path_1["default"].join(sourceDirectory, './index.tsx'), outputDirectory: outputDirectory })));
        console.log('EP: generating node output');
        return [2 /*return*/, (0, webpackUtil_1.createAndRunCompiler)(nodeWebpackConfig).then(function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    console.log('EP: generating web output');
                    return [2 /*return*/, (0, webpackUtil_1.createAndRunCompiler)(webWebpackConfig)];
                });
            }); }).then(function (webpackBuildStats) { return __awaiter(void 0, void 0, void 0, function () {
                var App;
                return __generator(this, function (_a) {
                    console.log('EP: generating static html');
                    App = require(path_1["default"].resolve(buildDirectory, 'index.js')).App;
                    pages.forEach(function (page) {
                        console.log("EP: rendering page ".concat(page.path, " to ").concat(page.filename));
                        var pageHead = { headId: '', base: null, title: null, links: [], metas: [], styles: [], scripts: [], noscripts: [] };
                        var setHead = function (newHead) { pageHead = newHead; };
                        var styledComponentsSheet = new styled_components_1.ServerStyleSheet();
                        var extractor = new server_1.ChunkExtractor({ stats: webpackBuildStats });
                        var bodyString = server_2["default"].renderToString(react_1["default"].createElement(server_1.ChunkExtractorManager, { extractor: extractor },
                            react_1["default"].createElement(styled_components_1.StyleSheetManager, { sheet: styledComponentsSheet.instance },
                                react_1["default"].createElement(App, { staticPath: page.path, setHead: setHead }))));
                        var tags = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], (pageHead.title ? [pageHead.title] : []), true), (pageHead.base ? [pageHead.base] : []), true), pageHead.links, true), pageHead.metas, true), pageHead.styles, true), pageHead.scripts, true);
                        var headString = server_2["default"].renderToStaticMarkup(react_1["default"].createElement("head", null,
                            tags.map(function (tag, index) { return (react_1["default"].createElement(tag.type, __assign(__assign({}, tag.attributes), { key: index, 'ui-react-head': tag.headId }), tag.content)); }),
                            extractor.getPreAssets().map(function (asset) { return (react_1["default"].createElement('link', { key: asset.filename, 'data-chunk': asset.chunk, rel: asset.linkType, as: asset.scriptType, href: asset.url })); }),
                            styledComponentsSheet.getStyleElement()));
                        var bodyAssetsString = server_2["default"].renderToStaticMarkup(react_1["default"].createElement(react_1["default"].Fragment, null, extractor.getMainAssets().map(function (asset) { return (react_1["default"].createElement(asset.scriptType, { key: asset.filename, 'data-chunk': asset.chunk, async: true, src: asset.url })); })));
                        var output = "<!DOCTYPE html>\n        <html lang=\"en\">\n          ".concat(headString, "\n          <body>\n            <div id=\"root\">").concat(bodyString, "</div>\n            ").concat(bodyAssetsString, "\n          </body>\n        </html>\n      ");
                        var outputPath = path_1["default"].join(outputDirectory, page.filename);
                        fs_1["default"].mkdirSync(path_1["default"].dirname(outputPath), { recursive: true });
                        fs_1["default"].writeFileSync(outputPath, output);
                        console.log("EP: done rendering page ".concat(page.path, " to ").concat(page.filename));
                    });
                    console.log('EP: done generating static html');
                    return [2 /*return*/];
                });
            }); })];
    });
}); };
exports.render = render;
