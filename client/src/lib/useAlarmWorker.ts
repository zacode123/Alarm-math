import { useEffect, useRef } from 'react';
import { type Alarm } from '@shared/schema';
import { useAlarms } from './useAlarms';

export function useAlarmWorker() {
  const workerRef = useRef<Worker | null>(null);
  const { alarms } = useAlarms();

  useEffect(() => {
    if (typeof Worker !== 'undefined' && !workerRef.current) {
      workerRef.current = new Worker('/alarm-worker.js');

      workerRef.current.onmessage = (e) => {
        if (e.data.type === 'TRIGGER_ALARM') {
          // Handle alarm trigger
          const alarm = e.data.alarm as Alarm;
          // Dispatch a custom event that the main app can listen to
          window.dispatchEvent(new CustomEvent('alarmTriggered', { detail: alarm }));
        }
      };
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'STOP' });
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Update worker whenever alarms change
  useEffect(() => {
    if (workerRef.current && alarms) {
      workerRef.current.postMessage({
        type: 'UPDATE_ALARMS',
        alarms
      });
    }
  }, [alarms]);
}
