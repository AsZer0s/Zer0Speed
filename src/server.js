import { createServer } from "net";
import { userMap, saveList } from "./userList.js";

var clientCount = 0;
export function createSer(callBack, port)
{
    createServer(function (client)
    {
        var clientId = clientCount++;
        var context = callBack(client, clientId);
        console.log("[+]客户端连接: " + clientId);
        client.setNoDelay(true);
        var toServer = context.s;
        client.on("end", function ()
        {
            console.log("[-]客户端断开: " + clientId);
            if (context.user && context.state == 2)
            {
                userMap.set(context.CDK, userMap.get(context.CDK) - Math.round((Date.now() - context.startTime) / 1000));
                saveList();
            }
            if (context.o)
                context.o.destroy();
        });
        client.on("error", function ()
        {
            console.log("[x]连接错误: " + clientId);
            client.destroy();
            if (context.o)
                context.o.destroy();
        });
        client.on("data", function (data)
        {
            if (context.thr)
            {
                context.so.write(data);
            }
            else if (toServer.next(data).done)
            {
                console.log("[-]踢出: " + clientId);
                client.destroy();
                if (context.o)
                    context.o.destroy();
            }
        });
    }).listen(port, () =>
    {
        console.log("TCP服务已启动在端口: " + port);
    });
}
