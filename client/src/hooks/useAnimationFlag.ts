
import { useState, useEffect } from "react";

const useAnimationFlag = () => {
  const [hasPlayed, setHasPlayed] = useState(() => {
    const playedFlag = sessionStorage.getItem('hasPlayed');
    return playedFlag === 'true';
  });

  useEffect(() => {
    if (!hasPlayed) {
      const timer = setTimeout(() => {
        setHasPlayed(true);
        sessionStorage.setItem('hasPlayed', 'true');
      }, 3500); // 3.5 seconds

      return () => clearTimeout(timer);
    }
  }, [hasPlayed]);

  return [hasPlayed, setHasPlayed] as const;
};

export default useAnimationFlag;
