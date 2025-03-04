export function formatTime(seconds) {
    if (seconds <= 0) return "没有剩余时长啦";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    let result = "";
    if (hours > 0) result += hours + "时";
    if (minutes > 0) result += minutes + "分";
    if (remainingSeconds > 0) result += remainingSeconds + "秒";
    
    return result || "0秒";
} 