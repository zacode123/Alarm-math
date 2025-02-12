
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckSquare, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TabsLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (value: string) => void;
  hideNavigation?: boolean;
}

export function TabsLayout({ children, activeTab, onTabChange, hideNavigation }: TabsLayoutProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full h-full">
      <div className="pb-16">
        {children}
      </div>
      <AnimatePresence initial={false}>
        {!hideNavigation && (
          <motion.div
            key="navigation"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 bg-background z-50"
          >
            <TabsList className="grid w-full grid-cols-3 border-t">
              <TabsTrigger value="recent" className="flex flex-col gap-1 py-2">
                <Clock className="h-5 w-5" />
                <span className="text-xs">Recent</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex flex-col gap-1 py-2">
                <CheckSquare className="h-5 w-5" />
                <span className="text-xs">Completed</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex flex-col gap-1 py-2">
                <Settings className="h-5 w-5" />
                <span className="text-xs">Settings</span>
              </TabsTrigger>
            </TabsList>
          </motion.div>
        )}
      </AnimatePresence>
    </Tabs>
  );
}
