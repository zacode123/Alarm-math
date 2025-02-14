import { motion } from "framer-motion";

export const LoadingScreen = () => {
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
              borderColor: 'hsl(var(--primary))',
              borderTopColor: 'transparent',
              top: `${i * 10}px`,
              left: `${i * 10}px`,
            }}
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.2
            }}
          />
        ))}
        <motion.div
          className="absolute inset-0 flex items-center justify-center text-primary font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Loading...
        </motion.div>
      </div>
    </motion.div>
  );
};
