import { motion } from "framer-motion";
import { Clock, Bell } from "lucide-react";

export const AlarmLoadingAnimation = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.5,
          ease: "easeOut"
        }}
      >
        <motion.div
          className="text-primary"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 0, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <Clock className="h-16 w-16" />
        </motion.div>
        <motion.div
          className="absolute -top-2 -right-2 text-primary"
          animate={{
            rotate: [-10, 10, -10],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 0.75,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Bell className="h-6 w-6" />
        </motion.div>

        {/* Add pulse effect ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-primary/30"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0, 0.3]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      <motion.div
        className="flex flex-col items-center space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="text-lg font-medium text-primary"
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          Waking up your alarms...
        </motion.div>
        <motion.div
          className="flex space-x-1"
          animate={{
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};