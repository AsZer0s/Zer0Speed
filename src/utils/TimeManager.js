export class TimeManager {
    static toSeconds(milliseconds) {
        return Math.floor(milliseconds / 1000);
    }
    
    static toMilliseconds(seconds) {
        return seconds * 1000;
    }
    
    static getElapsedSeconds(startTime) {
        return this.toSeconds(Date.now() - startTime);
    }
    
    static updateUserTime(currentTime, elapsedSeconds) {
        return Math.max(0, currentTime - elapsedSeconds);
    }
} 