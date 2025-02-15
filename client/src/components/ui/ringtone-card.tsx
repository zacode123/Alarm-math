import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Check, Music2 } from "lucide-react";
import { cn, stripFileExtension } from "@/lib/utils";

interface RingtoneCardProps {
  name: string;
  isSelected: boolean;
  onClick: () => void;
}

export function RingtoneCard({ name, isSelected, onClick }: RingtoneCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={false}
      animate={isSelected ? { scale: 1, backgroundColor: "var(--primary)" } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card
        onClick={onClick}
        className={cn(
          "p-4 cursor-pointer border-2 transition-colors duration-200",
          isSelected
            ? "border-primary bg-primary/10"
            : "hover:border-primary/50"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200",
                isSelected ? "bg-primary" : "bg-muted"
              )}
              animate={{ 
                rotate: isSelected ? [0, 360] : 0,
                scale: isSelected ? [1, 1.1, 1] : 1
              }}
              transition={{ 
                duration: 0.5,
                ease: "easeInOut"
              }}
            >
              <Music2 className={cn(
                "h-5 w-5 transition-colors duration-200",
                isSelected ? "text-primary-foreground" : "text-muted-foreground"
              )} />
            </motion.div>
            <span className={cn(
              "text-base transition-colors duration-200",
              isSelected ? "text-primary font-medium" : "text-foreground"
            )}>
              {stripFileExtension(name)}
            </span>
          </div>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Check className="h-5 w-5 text-primary" />
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}