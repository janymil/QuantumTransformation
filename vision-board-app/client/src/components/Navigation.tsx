import { Link, useLocation } from 'wouter'
import { Sparkles, Target, Heart, Calendar, TrendingUp, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navigationItems = [
  { href: '/', label: 'Home', icon: Sparkles },
  { href: '/onboarding', label: 'Start', icon: Target },
  { href: '/vision-board', label: 'Vision Board', icon: Heart },
  { href: '/daily-ritual', label: 'Daily Ritual', icon: Calendar },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
]

export default function Navigation() {
  const [location] = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="glass rounded-2xl px-6 py-3 quantum-particles">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-glow to-accent flex items-center justify-center animate-pulse-glow">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-semibold text-lg text-gradient-primary">
                Vision Transform
              </span>
            </Link>
            
            <div className="flex items-center space-x-6">
              {navigationItems.slice(1).map((item) => {
                const Icon = item.icon
                const isActive = location === item.href
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 focus-quantum",
                      isActive
                        ? "bg-primary/20 text-primary-glow shadow-glow"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div className="glass border-b border-white/10">
          <div className="flex items-center justify-between p-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-glow to-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-semibold text-gradient-primary">
                Vision Transform
              </span>
            </Link>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-surface-elevated/50 transition-colors focus-quantum"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
          
          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="border-t border-white/10 p-4">
              <div className="space-y-2">
                {navigationItems.slice(1).map((item) => {
                  const Icon = item.icon
                  const isActive = location === item.href
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 focus-quantum",
                        isActive
                          ? "bg-primary/20 text-primary-glow shadow-glow"
                          : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/50"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Spacer */}
      <div className="md:hidden h-20" />
    </>
  )
}