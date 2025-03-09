
import { useState, useEffect } from "react";

const useAnimationFlag = () => {
  const [hasPlayed, setHasPlayed] = useState(() => {
    const playedFlag = sessionStorage.getItem('hasPlayed');
    return playedFlag === 'true';
  });

  useEffect(() => {
    if (!hasPlayed) {
      sessionStorage.setItem('hasPlayed', 'true');
    }
  }, [hasPlayed]);

  return [hasPlayed, setHasPlayed] as const;
};

export default useAnimationFlag;
