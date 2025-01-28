import { readFileSync, existsSync } from "fs";
import { mcBuffer } from "./mcProt.js";
import { createConnection } from "net";
import { mcSocket } from "./mcSock.js";
import { userMap } from "./userList.js";
import { userBind } from './UserBind.js';

export var opt = JSON.parse(readFileSync("./option.json"));
if (!opt.modifyIp)
    opt.modifyIp = opt.remoteIP;
var MOTD_cache = null;
var SERVER_ICON = null;
try {
    if (existsSync("./icon.txt")) {
        SERVER_ICON = readFileSync("./icon.txt", 'utf8').trim();
        console.log("[+]成功加载服务器图标");
    }
} catch (error) {
    console.error("[!]加载服务器图标失败:", error);
}
export function createCont(cliObj, clientId)
{
    var SerBuffer = new mcBuffer();
    var CliBuffer = new mcBuffer();
    var server = null;
    var client = new mcSocket(cliObj);
    var toServer = toServerF();
    var toClient = toClientF();
    var ret = {
        s: toServer,
        c: toClient,
        o: null,
        d: function ()
        {
            toServer.return();
            toClient.return();
        },
        thr: false,
        so: null,
        CDK: "",
        startTime: 0,
        state: 0,
        user: false
    };
    var toClientThr = false;
    var nowModifyMOTD = false;
    function* toServerF()
    {
        var p_len = yield* CliBuffer.gVInt();
        var p_handshaking = yield* CliBuffer.getT("v v ls 2 v");
        
        let savedLoginPacket = null;
        
        // 先处理 CDK
        if (opt.CDKey_mod) {
            var o_ip = p_handshaking[2];
            var ind_ip = o_ip.indexOf(".");
            var CDK = o_ip.slice(0, ind_ip);
            if (!((/[0-9a-f]+/).test(CDK))) {
                return;
            }
            ret.CDK = CDK;
            ret.startTime = Date.now();
            ret.state = p_handshaking[4];
            if (ret.state == 2) {
                if (userMap.has(CDK) && userMap.get(CDK) > 0)
                    ret.user = true;
                else
                    return;
            }
        }
        
        if (p_handshaking[4] == 2) {
            p_len = yield* CliBuffer.gVInt();
            savedLoginPacket = yield* CliBuffer.getT("v ls");
            const playerName = savedLoginPacket[1];
            console.log(`[+]玩家登录: ${playerName}`);
            
            if (ret.CDK && userBind.isBound(ret.CDK)) {
                console.log(`[DEBUG]卡密 ${ret.CDK} 已绑定: ${userBind.getBoundUser(ret.CDK)}`);
                if (!userBind.checkBinding(ret.CDK, playerName)) {
                    console.log(`[!]用户 ${playerName} 未绑定卡密 ${ret.CDK}`);
                    return;
                }
            } else if (ret.CDK) {
                userBind.bind(ret.CDK, playerName);
            } else {
            }
        }

        server = new mcSocket(ret.o = createConnection(opt.remotePort, opt.remoteIP, function ()
        {
            console.log("[=]连接成功: " + clientId);
            ret.o.setNoDelay(true);
            if (opt.modifyIp_HS)
            {
                let ind_ipSur = p_handshaking[2].indexOf("\0");
                let ipSuf = (ind_ipSur == -1 ? "" : p_handshaking[2].slice(ind_ipSur));
                p_handshaking[2] = opt.modifyIp + ipSuf;
            }
            if (p_handshaking[4] == 1 && opt.modifyP_MOTD)
                nowModifyMOTD = true;
            server.s.on("data", function (data)
            {
                if (toClientThr)
                    cliObj.write(data);
                else
                    toClient.next(data);
            });
            server.writeP("v v ls 2 v", p_handshaking);

            if (savedLoginPacket) {
                server.writeP("v ls", savedLoginPacket);
            }
            
            toServer.next();
        }));

        server.s.on("error", function ()
        {
            console.log("[x]连接错误: " + clientId);
            server.s.destroy();
            cliObj.destroy();
        });
        server.s.on("end", function ()
        {
            cliObj.destroy();
        });

        yield* CliBuffer.wait();
        server.s.write(yield* CliBuffer.readAllBytes());
        ret.so = server.s;
        ret.thr = true;
        while (1)
            server.s.write(yield);
    }
    function* toClientF()
    {
        var len = yield* SerBuffer.gVInt();
        if (nowModifyMOTD)
        {
            var pack = yield* SerBuffer.getT("v ls");
            if (!MOTD_cache)
            {
                MOTD_cache = JSON.parse(pack[1]);
                
                if (SERVER_ICON) {
                    MOTD_cache.favicon = "data:image/png;base64," + SERVER_ICON;
                }
            }
            MOTD_cache.description = opt.modifyMOTD;
            var MOTD_Time = "";
            if (userMap.has(ret.CDK))
            {
                var user_time = userMap.get(ret.CDK);
                if (user_time > 0)
                    MOTD_Time = Math.floor(user_time / (60 * 60)) + "时" + (Math.floor(user_time / 60) % 60) + "分" + (user_time % 60) + "秒";
                else if (user_time <= 0)
                    MOTD_Time = "没有剩余时长啦";
            }
            else
                MOTD_Time = "已失效";
            MOTD_cache.description = MOTD_cache.description.replace("${time}", MOTD_Time);
            pack[1] = JSON.stringify(MOTD_cache);
            client.writeP("v ls", pack);
        }
        else
        {
            var b = yield* SerBuffer.readBytes(len);
            client.pushT("v", [len]);
            client.sendA();
            cliObj.write(b);
        }
        toClientThr = true;
        while (1)
            cliObj.write(yield);
    }
    toServer.next();
    toClient.next();
    return ret;
}