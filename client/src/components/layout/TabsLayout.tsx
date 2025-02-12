import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, CheckSquare, Settings } from "lucide-react";

interface TabsLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function TabsLayout({ children, activeTab, onTabChange }: TabsLayoutProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full h-full">
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
      <div className="pb-16">
        {children}
      </div>
    </Tabs>
  );
}
