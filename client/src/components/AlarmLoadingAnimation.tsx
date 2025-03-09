import { motion } from "framer-motion";
import { Clock, Bell } from "lucide-react";

export const AlarmLoadingAnimation = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
      <div className="relative">
        <motion.div
          className="text-primary"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Clock className="h-16 w-16" />
        </motion.div>
        <motion.div
          className="absolute -top-2 -right-2 text-primary"
          animate={{
            rotate: [0, 15, -15, 0],
            scale: [1, 1.1, 1.1, 1],
          }}
          transition={{
            duration: 0.75,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Bell className="h-6 w-6" />
        </motion.div>
      </div>
      <motion.div
        className="text-lg text-muted-foreground font-medium"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        Waking up your alarms...
      </motion.div>
    </div>
  );
};
