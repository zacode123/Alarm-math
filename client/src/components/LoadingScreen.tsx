import { motion } from "framer-motion";

export const LoadingScreen = () => {
  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--primary))",
    "hsl(var(--primary))"
  ];

  return (
    <motion.div
      className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              width: `${120 - i * 20}px`,
              height: `${120 - i * 20}px`,
              border: '4px solid',
              borderRadius: '50%',
              borderColor: colors[i],
              borderTopColor: 'transparent',
              top: `${i * 10}px`,
              left: `${i * 10}px`,
              filter: `hue-rotate(${i * 45}deg)`,
            }}
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
              scale: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }
            }}
          />
        ))}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-primary font-semibold"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0, 1, 0],
            scale: [0.9, 1, 0.9],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          Loading...
        </motion.div>
      </div>
    </motion.div>
  );
};