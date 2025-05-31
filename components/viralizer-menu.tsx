"use client"

import type * as React from "react"
import { motion } from "framer-motion"
import { Home, ImageIcon, Palette, Crown, User, DollarSign, Video, Edit3 } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface MenuItem {
  icon: React.ReactNode
  label: string
  href: string
  gradient: string
  iconColor: string
  requiresAuth?: boolean
  isPremium?: boolean
}

const menuItems: MenuItem[] = [
  {
    icon: <Home className="h-5 w-5" />,
    label: "Home",
    href: "/",
    gradient: "radial-gradient(circle, rgba(255,94,91,0.15) 0%, rgba(229,62,58,0.06) 50%, rgba(197,48,48,0) 100%)",
    iconColor: "text-coral-500",
  },
  {
    icon: <ImageIcon className="h-5 w-5" />,
    label: "Criar",
    href: "/criar",
    gradient: "radial-gradient(circle, rgba(58,134,255,0.15) 0%, rgba(9,105,218,0.06) 50%, rgba(5,80,174,0) 100%)",
    iconColor: "text-blue-500",
    requiresAuth: true,
  },
  {
    icon: <Edit3 className="h-5 w-5" />,
    label: "Editar",
    href: "/edit",
    gradient: "radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(147,51,234,0.06) 50%, rgba(126,34,206,0) 100%)",
    iconColor: "text-purple-500",
    requiresAuth: true,
  },
  {
    icon: <Video className="h-5 w-5" />,
    label: "Vídeo",
    href: "/video",
    gradient: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(219,39,119,0.06) 50%, rgba(190,24,93,0) 100%)",
    iconColor: "text-pink-500",
    requiresAuth: true,
  },
  {
    icon: <Palette className="h-5 w-5" />,
    label: "Estilos",
    href: "/estilos",
    gradient: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(234,88,12,0.06) 50%, rgba(194,65,12,0) 100%)",
    iconColor: "text-orange-500",
  },
  {
    icon: <Crown className="h-5 w-5" />,
    label: "Clones",
    href: "/clones",
    gradient: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(22,163,74,0.06) 50%, rgba(21,128,61,0) 100%)",
    iconColor: "text-green-500",
    requiresAuth: true,
    isPremium: true,
  },
  {
    icon: <User className="h-5 w-5" />,
    label: "Minhas Imagens",
    href: "/minhas-imagens",
    gradient: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
    iconColor: "text-red-500",
    requiresAuth: true,
  },
  {
    icon: <DollarSign className="h-5 w-5" />,
    label: "Preços",
    href: "/precos",
    gradient: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(124,58,237,0.06) 50%, rgba(109,40,217,0) 100%)",
    iconColor: "text-purple-500",
  },
]

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
}

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
}

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
}

const navGlowVariants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

const sharedTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  duration: 0.5,
}

interface ViralizerMenuProps {
  isAuthenticated?: boolean
  isPremium?: boolean
}

export function ViralizerMenu({ isAuthenticated = false, isPremium = false }: ViralizerMenuProps) {
  const { theme } = useTheme()
  const pathname = usePathname()

  const isDarkTheme = theme === "dark"

  const visibleMenuItems = menuItems
    .filter((item) => {
      if (item.requiresAuth && !isAuthenticated) return false
      if (item.isPremium && !isPremium) return false
      return true
    })
    .sort((a, b) => {
      // Simple sort to keep home first, then others
      if (a.href === "/") return -1
      if (b.href === "/") return 1
      return menuItems.indexOf(a) - menuItems.indexOf(b)
    })

  return (
    <motion.nav
      className="p-2 rounded-2xl bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-lg border border-border/40 shadow-lg relative overflow-hidden"
      initial="initial"
      whileHover="hover"
    >
      <motion.div
        className={`absolute -inset-2 bg-gradient-radial from-transparent ${
          isDarkTheme
            ? "via-violet-400/30 via-30% via-blue-400/30 via-60% via-purple-400/30 via-90%"
            : "via-violet-400/20 via-30% via-blue-400/20 via-60% via-purple-400/20 via-90%"
        } to-transparent rounded-3xl z-0 pointer-events-none`}
        variants={navGlowVariants}
      />
      <ul className="flex items-center gap-2 relative z-10">
        {visibleMenuItems.map((item, index) => {
          const isActive = pathname === item.href

          return (
            <motion.li key={item.label} className="relative">
              <motion.div
                className="block rounded-xl overflow-visible group relative"
                style={{ perspective: "600px" }}
                whileHover="hover"
                initial="initial"
              >
                <motion.div
                  className="absolute inset-0 z-0 pointer-events-none"
                  variants={glowVariants}
                  style={{
                    background: item.gradient,
                    opacity: isActive ? 0.3 : 0,
                    borderRadius: "16px",
                  }}
                />
                <motion.div
                  variants={itemVariants}
                  transition={sharedTransition}
                  style={{ transformStyle: "preserve-3d", transformOrigin: "center bottom" }}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 relative z-10 bg-transparent transition-colors rounded-xl ${
                      isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`transition-colors duration-300 ${isActive ? item.iconColor : `group-hover:${item.iconColor}`} ${isActive ? item.iconColor : "text-foreground"}`}
                    >
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                    {item.isPremium && <Crown className="h-3 w-3 text-yellow-500 ml-1" />}
                  </Link>
                </motion.div>
                <motion.div
                  className="absolute inset-0 z-10"
                  variants={backVariants}
                  transition={sharedTransition}
                  style={{ transformStyle: "preserve-3d", transformOrigin: "center top", rotateX: 90 }}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 px-4 py-2 bg-transparent text-muted-foreground group-hover:text-foreground transition-colors rounded-xl"
                  >
                    <span className={`transition-colors duration-300 group-hover:${item.iconColor} text-foreground`}>
                      {item.icon}
                    </span>
                    <span className="font-medium">{item.label}</span>
                    {item.isPremium && <Crown className="h-3 w-3 text-yellow-500 ml-1" />}
                  </Link>
                </motion.div>
              </motion.div>
            </motion.li>
          )
        })}
      </ul>
    </motion.nav>
  )
}
