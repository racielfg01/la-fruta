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
var pocketbase_1 = require("pocketbase");
var fs = require("fs");
var path = require("path");
var envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    var lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        var trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            var eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
                var key = trimmed.slice(0, eqIdx).trim();
                var val = trimmed.slice(eqIdx + 1).trim();
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                if (!process.env[key])
                    process.env[key] = val;
            }
        }
    }
}
var PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://everything-hay-mercatoma.pockethost.io';
var ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
var ADMIN_PASS = process.env.POCKETBASE_ADMIN_PASSWORD;
function createCollection(pb, name, schema, options) {
    return __awaiter(this, void 0, void 0, function () {
        var existing, _a, e_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, pb.collections.getOne(name).catch(function () { return null; })];
                case 1:
                    existing = _b.sent();
                    if (existing) {
                        console.log("Collection \"".concat(name, "\" already exists, skipping"));
                        return [2 /*return*/];
                    }
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 3:
                    _b.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, pb.collections.create(__assign({ name: name, type: 'base', schema: schema }, options))];
                case 4:
                    _b.sent();
                    console.log("Created collection \"".concat(name, "\""));
                    return [3 /*break*/, 6];
                case 5:
                    e_1 = _b.sent();
                    console.error("Failed to create \"".concat(name, "\":"), e_1.message);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function setup() {
    return __awaiter(this, void 0, void 0, function () {
        var pb;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Connecting to ".concat(PB_URL, "..."));
                    pb = new pocketbase_1.default(PB_URL);
                    return [4 /*yield*/, pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASS)];
                case 1:
                    _a.sent();
                    console.log('Authenticated as admin');
                    // Roles (simple collection, no special auth handling needed)
                    return [4 /*yield*/, createCollection(pb, 'roles', [
                            { name: 'name', type: 'text', required: true, unique: true },
                            { name: 'description', type: 'text' },
                        ])
                        // Categories
                    ];
                case 2:
                    // Roles (simple collection, no special auth handling needed)
                    _a.sent();
                    // Categories
                    return [4 /*yield*/, createCollection(pb, 'categories', [
                            { name: 'name', type: 'text', required: true },
                            { name: 'description', type: 'text', required: true },
                            { name: 'image', type: 'text' },
                        ])
                        // Products
                    ];
                case 3:
                    // Categories
                    _a.sent();
                    // Products
                    return [4 /*yield*/, createCollection(pb, 'products', [
                            { name: 'name', type: 'text', required: true },
                            { name: 'description', type: 'text' },
                            { name: 'price', type: 'number', required: true },
                            { name: 'unit', type: 'text' },
                            { name: 'image', type: 'text' },
                            { name: 'category', type: 'text' },
                            { name: 'origin', type: 'text' },
                            { name: 'stock', type: 'number' },
                            { name: 'in_stock', type: 'bool' },
                            { name: 'is_visible', type: 'bool' },
                        ])
                        // Delivery Zones
                    ];
                case 4:
                    // Products
                    _a.sent();
                    // Delivery Zones
                    return [4 /*yield*/, createCollection(pb, 'delivery_zones', [
                            { name: 'name', type: 'text', required: true },
                            { name: 'min_distance', type: 'number', required: true },
                            { name: 'max_distance', type: 'number', required: true },
                            { name: 'price', type: 'number', required: true },
                            { name: 'estimated_time', type: 'text' },
                            { name: 'active', type: 'bool' },
                        ])
                        // Orders
                    ];
                case 5:
                    // Delivery Zones
                    _a.sent();
                    // Orders
                    return [4 /*yield*/, createCollection(pb, 'orders', [
                            { name: 'user_id', type: 'text' },
                            { name: 'user_name', type: 'text' },
                            { name: 'user_email', type: 'text' },
                            { name: 'subtotal', type: 'number' },
                            { name: 'delivery_fee', type: 'number' },
                            { name: 'total', type: 'number' },
                            { name: 'status', type: 'text' },
                            { name: 'payment_method', type: 'text' },
                            { name: 'payment_status', type: 'text' },
                            { name: 'delivery_address', type: 'text' },
                            { name: 'delivery_notes', type: 'text' },
                        ])
                        // Order Items
                    ];
                case 6:
                    // Orders
                    _a.sent();
                    // Order Items
                    return [4 /*yield*/, createCollection(pb, 'order_items', [
                            { name: 'order_id', type: 'text' },
                            { name: 'product_id', type: 'text' },
                            { name: 'product_name', type: 'text' },
                            { name: 'quantity', type: 'number' },
                            { name: 'price', type: 'number' },
                        ])
                        // Currencies
                    ];
                case 7:
                    // Order Items
                    _a.sent();
                    // Currencies
                    return [4 /*yield*/, createCollection(pb, 'currencies', [
                            { name: 'code', type: 'text', required: true },
                            { name: 'name', type: 'text', required: true },
                            { name: 'symbol', type: 'text' },
                            { name: 'exchange_rate', type: 'number' },
                            { name: 'is_default', type: 'bool' },
                            { name: 'is_active', type: 'bool' },
                        ])];
                case 8:
                    // Currencies
                    _a.sent();
                    console.log('Setup complete!');
                    process.exit(0);
                    return [2 /*return*/];
            }
        });
    });
}
setup().catch(function (e) {
    console.error('Setup failed:', e);
    process.exit(1);
});
