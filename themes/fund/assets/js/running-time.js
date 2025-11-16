const RunningTimerInterval = 1000;
const startStr = document.querySelector('meta[name="start-time"]').getAttribute('content');
const StartTime = new Date(startStr);

function prefixZero(num)
{
    if (num < 10)
    {
        num = "0" + num;
    }
    return num;
}

function updateTime() {
    const currentTime = new Date();
    let runningTime = currentTime.getTime() - StartTime.getTime();

    const dayMs = 24 * 60 * 60 * 1000;
    const runningDays = Math.floor(runningTime / dayMs);

    runningTime -= runningDays * dayMs;

    const hourMs = 60 * 60 * 1000;
    const runningHours = Math.floor(runningTime / hourMs);

    runningTime -= runningHours * hourMs;

    const minuteMs = 60 * 1000;
    const runningMinutes = Math.floor(runningTime / minuteMs);

    runningTime -= runningMinutes * minuteMs;

    const runningSeconds = Math.floor(runningTime / 1000);

    const showTime = document.getElementById("running-time");
    if (showTime) {
        showTime.innerText =
            runningDays + "天" + prefixZero(runningHours) + "小时" + prefixZero(runningMinutes) + "分" + prefixZero(runningSeconds) + "秒";
    }
}


document.addEventListener('DOMContentLoaded', () => { let RunningTimer = setInterval(updateTime, RunningTimerInterval); });