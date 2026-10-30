import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import {
  Bell,
  ClipboardList,
  Database,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  Menu,
  Monitor,
  Moon,
  Sun,
  TrainFront,
  UserCog,
  Users,
} from 'lucide-react'
import { LogoMark } from '@/components/LogoMark'
import { useAuth, useUser } from '@/auth/useAuth'
import type { Papel } from '@/api/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { initials } from '@/lib/format'
import { PAPEL } from '@/lib/labels'
import { cn } from '@/lib/utils'

type NavItem = { to: string; label: string; icon: LucideIcon }
type NavSection = { title: string; items: NavItem[] }

/** Menu por papel, alinhado ao SecurityConfig: o ADMIN só enxerga a gestão de contas. */
const NAVEGACAO: Record<Papel, NavSection[]> = {
  ENGENHEIRO: [
    {
      title: 'Monitoramento',
      items: [
        { to: '/painel', label: 'Painel', icon: LayoutDashboard },
        { to: '/alertas', label: 'Alertas', icon: Bell },
        { to: '/ordens', label: 'Ordens de manutenção', icon: ClipboardList },
        { to: '/frota', label: 'Frota', icon: TrainFront },
      ],
    },
    {
      title: 'Configuração',
      items: [{ to: '/cadastros', label: 'Cadastros', icon: Database }],
    },
  ],
  ADMIN: [
    {
      title: 'Administração',
      items: [{ to: '/usuarios', label: 'Usuários', icon: Users }],
    },
  ],
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-glow/25 to-violet/25 ring-1 ring-white/10">
        <LogoMark className="size-6" />
      </span>
      <div className="leading-tight">
        <span className="block text-base font-semibold tracking-tight text-sidebar-accent-foreground">RailSense</span>
        <span className="block text-[11px] text-sidebar-foreground/70">Monitoramento de rolamentos</span>
      </div>
    </div>
  )
}

function SidebarNav({ papel, onNavigate }: { papel: Papel; onNavigate?: () => void }) {
  return (
    <nav aria-label="Navegação principal" className="flex flex-col gap-6">
      {NAVEGACAO[papel].map((section) => (
        <div key={section.title} className="space-y-1">
          <p className="px-3 pb-1 text-[11px] font-medium tracking-wider text-sidebar-foreground/55 uppercase">
            {section.title}
          </p>
          {section.items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
                  isActive
                    ? [
                        'bg-sidebar-accent text-sidebar-accent-foreground',
                        // Barra luminosa à esquerda do item ativo.
                        'before:absolute before:top-2 before:bottom-2 before:-left-3 before:w-[3px] before:rounded-r-full',
                        'before:bg-sidebar-primary before:shadow-[0_0_12px_2px_var(--sidebar-primary)]',
                      ]
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                )
              }
            >
              <Icon className="size-4 group-aria-[current=page]:text-sidebar-primary" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}

function SidebarContent({ papel, onNavigate }: { papel: Papel; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-8 border-r border-sidebar-border bg-sidebar/90 px-3 py-6 text-sidebar-foreground backdrop-blur-xl">
      <Brand />
      <SidebarNav papel={papel} onNavigate={onNavigate} />
      <p className="mt-auto px-3 text-[11px] text-sidebar-foreground/50">Acesso restrito a usuários autorizados.</p>
    </div>
  )
}

function UserMenu() {
  const user = useUser()
  const { signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  async function sair() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-1.5 sm:pr-2.5" aria-label={`Menu do usuário ${user.nome}`}>
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary text-[11px] font-semibold text-primary-foreground">
              {initials(user.nome)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block max-w-40 truncate text-sm font-medium">{user.nome}</span>
            <span className="block text-[11px] text-muted-foreground">{PAPEL[user.papel].label}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-medium">{user.nome}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/conta')}>
          <UserCog /> Minha conta
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="dark:hidden" />
            <Moon className="hidden dark:block" /> Aparência
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">
                <Sun /> Claro
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon /> Escuro
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor /> Do sistema
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={sair} variant="destructive">
          <LogOut /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Estrutura das telas autenticadas: barra lateral fixa no desktop, gaveta no celular. */
export function AppShell() {
  const user = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app-backdrop min-h-svh lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <aside className="sticky top-0 z-10 hidden h-svh lg:block">
        <SidebarContent papel={user.papel} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[264px] border-none p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">Navegação principal do RailSense</SheetDescription>
          <SidebarContent papel={user.papel} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="relative z-[1] flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border/60 bg-background/60 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu />
          </Button>
          <span className="font-semibold lg:hidden">RailSense</span>
          <div className="ml-auto">
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
