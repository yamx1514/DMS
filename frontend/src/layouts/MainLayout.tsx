import { PropsWithChildren, ReactNode, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";

import Breadcrumbs from "../components/Breadcrumbs";

type MainLayoutProps = PropsWithChildren<{
  /**
   * Optional sidebar content. When omitted, the sidebar container collapses.
   */
  sidebar?: ReactNode;
  /**
   * Optional slot for header-level actions (buttons, search, etc.).
   */
  headerActions?: ReactNode;
  /**
   * Page title rendered in the header alongside breadcrumbs.
   */
  title?: ReactNode;
}>;

const MainLayout = ({
  sidebar,
  headerActions,
  title,
  children,
}: MainLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const hasSidebar = useMemo(() => Boolean(sidebar), [sidebar]);
  const content = children ?? <Outlet />;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 transition-colors duration-200 dark:bg-gray-950 dark:text-gray-100">
      <div className="flex h-screen flex-col">
        <header className="flex items-center gap-3 border-b border-gray-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
          {hasSidebar && (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
              onClick={() => setIsSidebarOpen((open) => !open)}
              aria-label="Toggle navigation menu"
              aria-expanded={isSidebarOpen}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5"
                />
              </svg>
            </button>
          )}

          <div className="flex flex-1 flex-col gap-1">
            {title && (
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                {title}
              </h1>
            )}
            <Breadcrumbs />
          </div>

          {headerActions && (
            <div className="flex items-center gap-2">{headerActions}</div>
          )}
        </header>

        <div className="relative flex flex-1 overflow-hidden lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
          {hasSidebar && (
            <>
              <aside className="hidden h-full shrink-0 border-r border-gray-200 bg-white/90 px-4 py-6 dark:border-gray-800 dark:bg-gray-900/90 lg:flex lg:flex-col">
                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="flex flex-col gap-4">{sidebar}</div>
                </div>
              </aside>

              {isSidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
                  <div
                    className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="relative flex h-full w-72 flex-col border-r border-gray-200 bg-white px-4 py-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
                    <button
                      type="button"
                      className="absolute right-3 top-3 inline-flex items-center justify-center rounded-md p-2 text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-300 dark:hover:bg-gray-800"
                      onClick={() => setIsSidebarOpen(false)}
                      aria-label="Close navigation menu"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="mt-8 flex-1 overflow-y-auto pr-1">
                      <div className="flex flex-col gap-4">{sidebar}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-gray-50 transition-colors duration-200 dark:bg-gray-950">
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-6xl p-4 pb-10 lg:p-6">
                <div className="flex flex-col gap-4">{content}</div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
