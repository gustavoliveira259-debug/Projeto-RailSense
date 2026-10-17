import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import logo from '../assets/Logo.png'
import type { Papel } from '../api/types'
import { useAuth } from '../auth/useAuth'
import { ROTULO_PAPEL } from '../lib/format'
import { Icon, type IconName } from './Icon'

type ItemMenu = { para: string; rotulo: string; icone: IconName }

const MENU: Record<Papel, ItemMenu[]> = {
  ENGENHEIRO: [
    { para: '/trens', rotulo: 'Trens', icone: 'train' },
    { para: '/alertas', rotulo: 'Alertas', icone: 'alert' },
  ],
  GERENTE: [
    { para: '/trens', rotulo: 'Trens', icone: 'train' },
    { para: '/alertas', rotulo: 'Alertas', icone: 'alert' },
  ],
  ADMIN: [
    { para: '/ti/usuarios', rotulo: 'Usuários', icone: 'users' },
    { para: '/ti/estrutura', rotulo: 'Estrutura e sensores', icone: 'structure' },
  ],
}

/** Vagão e rolamento são telas "dentro" de Trens: o item continua destacado. */
function secaoAtiva(para: string, pathname: string) {
  return para === '/trens' && /^\/(vagoes|rolamentos)\//.test(pathname)
}

export function AppShell() {
  const { usuario, sair } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!usuario) return null

  async function aoSair() {
    await sair()
    navigate('/login', { replace: true })
  }

  const itens = [...MENU[usuario.papel], { para: '/conta', rotulo: 'Minha conta', icone: 'account' as const }]

  return (
    <div className="app">
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <aside className="barra-lateral">
        <div className="marca">
          <img src={logo} alt="" />
          <span>RailSense</span>
        </div>
        <p className="visao">{usuario.papel === 'ADMIN' ? 'Visão da TI' : 'Monitoramento'}</p>

        <nav aria-label="Navegação principal" className="menu">
          {itens.map((item) => (
            <NavLink
              key={item.para}
              to={item.para}
              className={({ isActive }) => `menu-item ${isActive || secaoAtiva(item.para, location.pathname) ? 'ativo' : ''}`}
            >
              <Icon name={item.icone} className="menu-icone" />
              <span>{item.rotulo}</span>
            </NavLink>
          ))}
        </nav>

        <div className="usuario">
          <div className="avatar" aria-hidden="true">
            {usuario.nome.trim().charAt(0).toUpperCase() || '?'}
          </div>
          <div className="usuario-info">
            <strong title={usuario.nome}>{usuario.nome}</strong>
            <span>{ROTULO_PAPEL[usuario.papel]}</span>
          </div>
          <button type="button" className="botao-sair" onClick={aoSair} aria-label="Sair da conta" title="Sair">
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}
