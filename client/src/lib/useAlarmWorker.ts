import { useEffect, useRef } from 'react';
import { type Alarm } from '@shared/schema';
import { useAlarms } from './useAlarms';

export function useAlarmWorker() {
  const workerRef = useRef<Worker | null>(null);
  const { alarms } = useAlarms();
  const initializingRef = useRef(false);

  useEffect(() => {
    const initializeWorker = async () => {
      if (typeof Worker === 'undefined' || initializingRef.current) {
        return;
      }

      try {
        initializingRef.current = true;

        // Cleanup existing worker if any
        if (workerRef.current) {
          workerRef.current.postMessage({ type: 'STOP' });
          workerRef.current.terminate();
          workerRef.current = null;
        }

        // Create new worker
        workerRef.current = new Worker('/alarm-worker.js');

        workerRef.current.onerror = (error) => {
          console.error('Alarm worker error:', error);
          // Attempt to recreate worker on error
          initializingRef.current = false;
          initializeWorker();
        };

        workerRef.current.onmessage = (e) => {
          if (e.data.type === 'TRIGGER_ALARM') {
            const alarm = e.data.alarm as Alarm;

            // Dispatch custom event for alarm trigger
            const event = new CustomEvent('alarmTriggered', { 
              detail: alarm,
              bubbles: true 
            });
            window.dispatchEvent(event);

            // Trigger device vibration if available
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
          }
        };

        // Initialize with current alarms
        if (alarms?.length) {
          workerRef.current.postMessage({
            type: 'UPDATE_ALARMS',
            alarms
          });
        }

      } catch (error) {
        console.error('Failed to initialize alarm worker:', error);
      } finally {
        initializingRef.current = false;
      }
    };

    initializeWorker();

    // Cleanup function
    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ type: 'STOP' });
        workerRef.current.terminate();
        workerRef.current = null;
      }
      initializingRef.current = false;
    };
  }, []); // Empty dependency array for initialization

  // Update worker whenever alarms change
  useEffect(() => {
    if (workerRef.current && alarms && !initializingRef.current) {
      workerRef.current.postMessage({
        type: 'UPDATE_ALARMS',
        alarms
      });
    }
  }, [alarms]);
}