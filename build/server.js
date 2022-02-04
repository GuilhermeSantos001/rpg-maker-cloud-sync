"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = __importDefault(require("express"));
var http_1 = __importDefault(require("http"));
var cors_1 = __importDefault(require("cors"));
var app = (0, express_1["default"])();
app.use((0, cors_1["default"])({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
var server = http_1["default"].createServer(app);
app.get('/', function (req, res) {
    res.send('<h1>Hello world</h1>');
});
server.listen(process.env.PORT || 4000, function () {
    console.log('listening on *:4000');
});
//# sourceMappingURL=server.js.map