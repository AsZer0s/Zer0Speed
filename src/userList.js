import { readFileSync, writeFileSync, watch } from "fs";

export const userMap = new Map();

var saveTime = 0;
export function saveList()
{
    var str = "HoweCraft key list\n";
    userMap.forEach((o, i) =>
    {
        if (o > 0)
            str += i + " " + o + "\n";
    });
    str += "HoweCraft key list end";
    saveTime = Date.now();
    writeFileSync("./key.txt", str, { encoding: "utf-8" });
}

export function readList()
{
        var str = readFileSync("./key.txt", { encoding: "utf-8" }).replace("\r", "");
        var list = str.split("\n");
    if (list[0] != "HoweCraft key list" || list[list.length - 1] != "HoweCraft key list end")
    {
        console.log("[x]读取卡密失败");
            return;
        }
    list.slice(1, -1);
    list.forEach((o, i) =>
    {
            var tmp = o.split(" ");
                userMap.set(tmp[0], parseInt(tmp[1]));
        });
}

readList();

watch("./key.txt", () =>
{
    if (Math.abs(Date.now() - saveTime) > 900)
        setTimeout(readList, 100);
});