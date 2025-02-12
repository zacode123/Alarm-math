// Alarm checking worker
let alarms = [];
let checkInterval;

self.onmessage = function(e) {
  if (e.data.type === 'UPDATE_ALARMS') {
    alarms = e.data.alarms;
    startChecking();
  } else if (e.data.type === 'STOP') {
    stopChecking();
  }
};

function startChecking() {
  if (checkInterval) {
    clearInterval(checkInterval);
  }

  checkInterval = setInterval(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentDay = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];

    alarms.forEach(alarm => {
      if (alarm.enabled && alarm.time === currentTime && alarm.days.includes(currentDay)) {
        self.postMessage({
          type: 'TRIGGER_ALARM',
          alarm
        });
      }
    });
  }, 1000);
}

function stopChecking() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}
