import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Outlet } from 'react-router-dom';
import { CommandMenu } from './CommandMenu';

export function Layout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <CommandMenu />
      <Sidebar />
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
