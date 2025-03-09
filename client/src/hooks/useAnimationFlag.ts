
import { useState, useEffect, useRef } from "react";

const useAnimationFlag = () => {
  const [hasPlayed, setHasPlayed] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setHasPlayed(true);
    }, 3500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setHasPlayed(false);
    };
  }, []);

  return [hasPlayed, setHasPlayed] as const;
};

export default useAnimationFlag;
