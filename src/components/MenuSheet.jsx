/** Menu dell'app: notifiche, liste riutilizzabili, animali,
 *  esportazione dati e uscita. */
export default function MenuSheet({ push, onTemplates, onPets, onExport, onLogout, onClose, exporting }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Menu</h3>

        {push.supported && (
          <button className="menu-row" onClick={push.toggle} disabled={push.busy}>
            {push.enabled ? '🔔' : '🔕'} Notifiche su questo dispositivo
            <span className="hint">{push.enabled ? 'attive' : 'disattivate'}</span>
          </button>
        )}
        <button className="menu-row" onClick={() => { onClose(); onTemplates() }}>
          🧳 Liste riutilizzabili
        </button>
        <button className="menu-row" onClick={() => { onClose(); onPets() }}>
          🐾 I nostri animali
        </button>
        <button className="menu-row" onClick={onExport} disabled={exporting}>
          ⬇️ Esporta i dati (backup)
          {exporting && <span className="hint">in corso…</span>}
        </button>
        <button className="menu-row" onClick={onLogout}>
          🚪 Esci
        </button>

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </div>
  )
}
