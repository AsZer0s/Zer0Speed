/**
 * Swiftgram Pro — 恢复购买脚本
 * 劫持 api.swiftgram.app / my.swiftgram.app 的所有 HTTP 响应，
 * 递归注入 premium / pro / subscription 字段，模拟有效订阅。
 *
 * 用法：放入 Loon 可访问的 URL 或本地路径，在插件 [script] 段引用。
 */

const PRO_PAYLOAD = {
    is_premium: true,
    premium: true,
    pro: true,
    has_premium: true,
    premium_type: "pro",
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
    }]
};

/**
 * 递归遍历对象，注入 PRO_PAYLOAD 中存在的 key
 */
function inject(obj, depth) {
    if (depth === undefined) depth = 0;
    if (depth > 50) return;           // 防止循环引用
    if (obj === null || obj === undefined) return;
    if (typeof obj !== "object") return;
    if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) inject(obj[i], depth + 1);
        return;
    }
    // 在此层注入
    for (var k in PRO_PAYLOAD) {
        if (PRO_PAYLOAD.hasOwnProperty(k)) obj[k] = PRO_PAYLOAD[k];
    }
    // 递归子对象
    for (var k2 in obj) {
        if (obj.hasOwnProperty(k2)) inject(obj[k2], depth + 1);
    }
}

/**
 * 判断响应 Content-Type 是否可能是 JSON
 */
function isJSON(headers) {
    if (!headers) return false;
    var ct = headers["Content-Type"] || headers["content-type"] || "";
    return ct.indexOf("application/json") !== -1 || ct.indexOf("text/javascript") !== -1;
}

// ----- 主入口 -----
if (typeof $response === "undefined" || !$response) {
    $done({});
} else if ($response.body && isJSON($response.headers)) {
    try {
        var body = JSON.parse($response.body);
        inject(body);
        $done({
            status: $response.status || 200,
            headers: $response.headers,
            body: JSON.stringify(body)
        });
    } catch (e) {
        // 非 JSON 或解析失败，原样放行
        $done({});
    }
} else {
    // 非 JSON 响应，原样放行
    $done({});
}
