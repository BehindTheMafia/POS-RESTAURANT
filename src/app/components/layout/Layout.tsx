import { Suspense, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import {
  pageVariants, fadeVariants, slideLeftVariants,
  t, spring,
} from '../../../lib/animations'

// Lightweight skeleton shown while a lazy page chunk is downloading.
const PageSkeleton = () => (
  <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto w-full">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-6 w-40 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-4 w-24 bg-gray-100 rounded-xl animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-9 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-9 w-32 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 40}ms` }} />
      ))}
    </div>
  </div>
)

export function Layout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar — always visible, no animation needed */}
      <div className="hidden lg:block shrink-0 h-full">
        <Sidebar onClose={() => {}} />
      </div>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="backdrop"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={t.fade}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="sidebar"
            variants={slideLeftVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={spring.drawer}
            className="fixed left-0 top-0 h-full z-50 lg:hidden"
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          sidebarOpen={sidebarOpen}
        />

        <main className="flex-1 overflow-auto">
          {/* Page transition wraps the lazy Suspense boundary so the skeleton
              also animates in smoothly on first chunk load. */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={t.page}
              className="h-full"
            >
              <Suspense fallback={<PageSkeleton />}>
                <Outlet />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
