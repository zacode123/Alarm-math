import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
      <AnimatePresence>
        {!hideNavigation && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <TabsList className="fixed bottom-0 left-0 right-0 grid w-full grid-cols-3 bg-background border-t">
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