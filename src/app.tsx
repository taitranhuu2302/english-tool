import React, { useEffect, useState } from 'react';
import { Languages, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Providers } from './renderer/app/providers';
import { TranslatePage } from './renderer/features/translate/translate-page';
import { SettingsPage } from './renderer/features/settings/settings-page';
import { bridge } from './renderer/lib/bridge';

type TabValue = 'translate' | 'settings';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabValue>('translate');

  useEffect(() => {
    const unsub = bridge.app.onNavigate((route) => {
      if (route === '/settings') setActiveTab('settings');
      else setActiveTab('translate');
    });
    return unsub;
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabValue)}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        {/* Tab bar */}
        <div className="shrink-0 border-b px-3 pt-2 pb-0">
          <TabsList className="h-8">
            <TabsTrigger value="translate" className="gap-1.5 text-sm">
              <Languages className="size-4" />
              Translate
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 text-sm">
              <Settings className="size-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="translate"
          className="flex-1 min-h-0 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col"
        >
          <TranslatePage />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 overflow-auto m-0">
          <SettingsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function App() {
  return (
    <Providers>
      <AppContent />
    </Providers>
  );
}
