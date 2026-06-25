import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useCatalog } from '../store/useCatalog'
import { reviewBuckets, attentionCount } from '../store/selectors'
import { SignIn } from './SignIn'
import { AddItemPanel } from './AddItemPanel'
import { AddPanelContext } from './addPanelContext'
import { TopSearch } from './TopSearch'

interface NavItem {
  to: string
  label: string
  icon: string
  end?: boolean
}

export function Layout() {
  const { items, readOnly, cloud, userEmail, status, notice, signOut } = useCatalog()
  const location = useLocation()
  // The Catalog page has its own search + Add button, so the global top bar is
  // redundant there, so hide it on /catalog.
  const showTopbar = location.pathname !== '/catalog'
  const [moreOpen, setMoreOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const [noticeDismissed, setNoticeDismissed] = useState(false)
  // The "Add item" overlay opens in place over whatever page you're on (no nav).
  const [addOpen, setAddOpen] = useState(false)
  const openAdd = () => {
    if (!readOnly) setAddOpen(true)
  }

  const attention = readOnly ? 0 : attentionCount(reviewBuckets(items))

  // Nav adapts to whether the viewer can edit.
  const primaryNav: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: '◇', end: true },
    { to: '/about', label: 'About', icon: 'ℹ' },
    { to: '/catalog', label: 'Catalog', icon: '▤' },
    { to: '/shelves', label: 'Shelves', icon: '▥' },
  ]
  const moreNav: NavItem[] = readOnly
    ? [
        { to: '/labels', label: 'Labels', icon: '🏷' },
        { to: '/export', label: 'Export', icon: '⬇' },
      ]
    : [
        { to: '/labels', label: 'Labels', icon: '🏷' },
        { to: '/review', label: 'Review', icon: '✦' },
        { to: '/lost', label: 'Lost item', icon: '⌕' },
        { to: '/export', label: 'Export', icon: '⬇' },
      ]
  const sideNav: NavItem[] = [...primaryNav, ...moreNav]

  if (status === 'loading') {
    return (
      <div className="loadscreen">
        <span className="loadscreen__mark" aria-hidden>
          ❦
        </span>
        <p className="muted">Loading the catalog…</p>
      </div>
    )
  }

  const accountBlock = cloud ? (
    userEmail ? (
      <div className="account">
        <span className="account__who">Signed in · editing on</span>
        <button type="button" className="account__btn" onClick={() => signOut()}>
          Sign out
        </button>
      </div>
    ) : (
      <div className="account">
        <span className="account__who">Viewing the official catalog</span>
        <button type="button" className="account__btn" onClick={() => setSignInOpen(true)}>
          Teacher sign in
        </button>
      </div>
    )
  ) : (
    <p className="sidebar__foot muted">Local demo · saved on this device</p>
  )

  return (
    <AddPanelContext.Provider value={openAdd}>
    <div className="shell">
      {/* ---- Desktop sidebar ---- */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark" aria-hidden>
            ❦
          </span>
          <span className="brand__name">
            English Dept
            <small>Catalog</small>
          </span>
        </div>
        <nav className="sidenav">
          {sideNav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="sidenav__link">
              <span className="sidenav__icon" aria-hidden>
                {n.icon}
              </span>
              {n.label}
              {n.to === '/review' && attention > 0 && <span className="badge">{attention}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__foot">
          {!readOnly && (
            <p className="export-tip">
              Export regularly. Even if a student gets the login, an exported copy keeps your data safe.
            </p>
          )}
          {accountBlock}
        </div>
      </aside>

      {/* ---- Main column ---- */}
      <div className="main">
        {showTopbar && (
          <header className="topbar">
            <TopSearch />
            {!readOnly && (
              <button type="button" className="btn btn--primary topbar__add" onClick={openAdd}>
                ＋ Add item
              </button>
            )}
          </header>
        )}

        {notice && !noticeDismissed && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button type="button" onClick={() => setNoticeDismissed(true)} aria-label="Dismiss">
              ✕
            </button>
          </div>
        )}

        <main>
          <Outlet />
        </main>
      </div>

      {/* ---- Mobile FAB (editing only) ---- */}
      {!readOnly && (
        <button type="button" className="fab" aria-label="Add item" onClick={openAdd}>
          ＋
        </button>
      )}

      {/* ---- Mobile bottom bar ---- */}
      <nav className={'bottombar' + (readOnly ? '' : ' bottombar--withfab')}>
        {primaryNav.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className="bottombar__link">
            <span aria-hidden>{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
        <button
          type="button"
          className={'bottombar__link' + (moreOpen ? ' is-active' : '')}
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
        >
          <span aria-hidden>⋯</span>
          More
          {attention > 0 && <span className="badge badge--float">{attention}</span>}
        </button>
      </nav>

      {/* ---- "More" sheet (mobile) ---- */}
      {moreOpen && (
        <>
          <div className="sheet__scrim" onClick={() => setMoreOpen(false)} />
          <div className="sheet" role="dialog" aria-label="More pages">
            {moreNav.map((n) => (
              <NavLink key={n.to} to={n.to} className="sheet__link" onClick={() => setMoreOpen(false)}>
                <span aria-hidden>{n.icon}</span>
                {n.label}
                {n.to === '/review' && attention > 0 && <span className="badge">{attention}</span>}
              </NavLink>
            ))}
            {!readOnly && (
              <p className="export-tip">
                Export regularly. Even if a student gets the login, an exported copy keeps your data safe.
              </p>
            )}
            {cloud && (
              <button
                type="button"
                className="sheet__link sheet__link--btn"
                onClick={() => {
                  setMoreOpen(false)
                  if (userEmail) signOut()
                  else setSignInOpen(true)
                }}
              >
                <span aria-hidden>{userEmail ? '⎋' : '🔑'}</span>
                {userEmail ? 'Sign out' : 'Teacher sign in'}
              </button>
            )}
          </div>
        </>
      )}

      {signInOpen && <SignIn onClose={() => setSignInOpen(false)} />}

      {!readOnly && addOpen && <AddItemPanel onClose={() => setAddOpen(false)} />}
    </div>
    </AddPanelContext.Provider>
  )
}
