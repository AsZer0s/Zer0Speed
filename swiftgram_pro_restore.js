/**
 * Swiftgram Pro 恢复购买 — 全面注入脚本
 *
 * 劫持以下域名的 JSON 响应:
 *   - api.swiftgram.app
 *   - my.swiftgram.app
 *   - raw.githubusercontent.com (Swiftgram/settings)
 *   - buy.itunes.apple.com / sandbox.itunes.apple.com (收据验证)
 *
 * 递归注入 premium / pro / subscription 字段，模拟有效订阅。
 */

// ---- 注入数据 ----
var PRO_PAYLOAD = {
    // Swiftgram Pro 状态
    is_premium: true,
    premium: true,
    pro: true,
    has_premium: true,
    premium_type: "pro",
    forceHasPremium: true,
    force_has_premium: true,

    // 订阅信息
    active: true,
    status: "active",
    auto_renew: true,
    auto_renew_status: "1",
    is_trial: false,
    is_trial_period: false,
    is_in_billing_retry: false,
    is_in_billing_retry_period: "0",
    expires_at: "2099-12-31T23:59:59Z",
    expires_date: "2099-12-31T23:59:59Z",
    expires_date_ms: "4102444799000",
    expiration_intent: null,
    purchase_date: "2024-01-01T00:00:00Z",

    // Apple 收据验证注入
    receipt: {
        receipt_type: "Production",
        adam_id: 0,
        app_item_id: 0,
        bundle_id: "app.swiftgram.ios",
        application_version: "278",
        download_id: 0,
        version_external_identifier: 0,
        receipt_creation_date: "2024-01-01T00:00:00Z",
        receipt_creation_date_ms: "1704067200000",
        receipt_creation_date_pst: "2024-01-01 00:00:00 America/Los_Angeles",
        request_date: "2024-01-01T00:00:00Z",
        request_date_ms: "1704067200000",
        request_date_pst: "2024-01-01 00:00:00 America/Los_Angeles",
        original_purchase_date: "2024-01-01T00:00:00Z",
        original_purchase_date_ms: "1704067200000",
        original_purchase_date_pst: "2024-01-01 00:00:00 America/Los_Angeles",
        original_application_version: "278",
        in_app: [{
            quantity: "1",
            product_id: "app.swiftgram.subscription.pro.monthly",
            transaction_id: "990000000000000",
            original_transaction_id: "990000000000000",
            purchase_date: "2024-01-01T00:00:00Z",
            purchase_date_ms: "1704067200000",
            purchase_date_pst: "2024-01-01 00:00:00 America/Los_Angeles",
            original_purchase_date: "2024-01-01T00:00:00Z",
            original_purchase_date_ms: "1704067200000",
            original_purchase_date_pst: "2024-01-01 00:00:00 America/Los_Angeles",
            expires_date: "2099-12-31T23:59:59Z",
            expires_date_ms: "4102444799000",
            expires_date_pst: "2099-12-31 23:59:59 America/Los_Angeles",
            web_order_line_item_id: "990000000000000",
            is_trial_period: "false",
            is_in_intro_offer_period: "false"
        }],
        latest_receipt_info: [{
            quantity: "1",
            product_id: "app.swiftgram.subscription.pro.monthly",
            transaction_id: "990000000000000",
            original_transaction_id: "990000000000000",
            purchase_date: "2024-01-01T00:00:00Z",
            purchase_date_ms: "1704067200000",
            purchase_date_pst: "2024-01-01 00:00:00 America/Los_Angeles",
            original_purchase_date: "2024-01-01T00:00:00Z",
            original_purchase_date_ms: "1704067200000",
            original_purchase_date_pst: "2024-01-01 00:00:00 America/Los_Angeles",
            expires_date: "2099-12-31T23:59:59Z",
            expires_date_ms: "4102444799000",
            expires_date_pst: "2099-12-31 23:59:59 America/Los_Angeles",
            web_order_line_item_id: "990000000000000",
            is_trial_period: "false",
            is_in_intro_offer_period: "false"
        }],
        pending_renewal_info: [{
            auto_renew_product_id: "app.swiftgram.subscription.pro.monthly",
            product_id: "app.swiftgram.subscription.pro.monthly",
            original_transaction_id: "990000000000000",
            auto_renew_status: "1"
        }]
    },

    // 订阅数组
    subscription: {
        product_id: "app.swiftgram.subscription.pro.monthly",
        status: "active",
        active: true,
        auto_renew: true,
        expires_at: "2099-12-31T23:59:59Z",
        expires_date: "2099-12-31T23:59:59Z",
        is_trial: false,
        is_in_billing_retry: false
    },
    subscriptions: [{
        product_id: "app.swiftgram.subscription.pro.monthly",
        status: "active",
        active: true,
        auto_renew: true,
        expires_at: "2099-12-31T23:59:59Z"
    }],

    // GitHub 设置注入
    forceHasPremium: true,
    force_has_premium: true,
    forceHasSettings: true,
    debugActionsEnabled: true,
    enableDebugActions: true,

    // Nyaa 格式
    environment: "Production",
    latest_receipt: "dummy_base64_receipt_data",
    status: 0,
    is_retryable: false,
    grace_period_expires_date: null
};

// ---- 递归注入 ----
function inject(obj, depth) {
    if (depth === undefined) depth = 0;
    if (depth > 60) return;
    if (obj === null || obj === undefined) return;
    if (typeof obj !== "object") return;

    if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) inject(obj[i], depth + 1);
        return;
    }

    // 在此层注入
    for (var k in PRO_PAYLOAD) {
        if (PRO_PAYLOAD.hasOwnProperty(k)) {
            // 不覆盖已有的 receipt 顶层 (避免覆盖原始 Apple 响应结构中的 receipt key)
            if (k === "receipt" && obj[k] !== undefined && obj.status !== undefined) continue;
            obj[k] = PRO_PAYLOAD[k];
        }
    }

    // 递归子对象
    for (var k2 in obj) {
        if (obj.hasOwnProperty(k2)) inject(obj[k2], depth + 1);
    }
}

// ---- Content-Type 检查 ----
function isJSON(headers) {
    if (!headers) return false;
    var ct = headers["Content-Type"] || headers["content-type"] || "";
    return ct.indexOf("application/json") !== -1 ||
           ct.indexOf("text/json") !== -1 ||
           ct.indexOf("text/javascript") !== -1 ||
           ct.indexOf("application/octet-stream") !== -1; // Apple receipt 返回 binary
}

// ---- 强制 Pro ----
function force() {
    if (typeof $response === "undefined" || !$response) {
        $done({});
        return;
    }

    // 无论 Content-Type，尝试解析 JSON
    if ($response.body) {
        try {
            var body = JSON.parse($response.body);
            inject(body);
            $done({
                status: $response.status || 200,
                headers: $response.headers,
                body: JSON.stringify(body)
            });
            return;
        } catch (e) {
            // 非 JSON，原样放行
        }
    }

    $done({});
}

force();
