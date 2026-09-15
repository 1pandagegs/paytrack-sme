document.addEventListener("DOMContentLoaded", async () => {
  const supabaseClient = window.paytrackSupabase;

  if (!supabaseClient) {
    console.error("Supabase client is not available.");
    return;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.replace("../login.html");
    return;
  }


  /* ==================================================
     WORKSPACE IDENTITY / BRANDING / LOGOUT
  ================================================== */

  function paytrackDarkenHex(hex, amount = 22) {
    const clean = String(hex || '').replace('#','');
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) return '#1d4ed8';
    const n = int(clean, 16);
    const r = Math.max(0, (n >> 16) - amount);
    const g = Math.max(0, ((n >> 8) & 255) - amount);
    const b = Math.max(0, (n & 255) - amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6,'0')}`;
  }

  // Python-style int is not available in JavaScript; keep conversion isolated here.
  function int(value, radix) { return parseInt(value, radix); }

  function ensureWorkspaceStyles() {
    if (document.getElementById('paytrackWorkspaceStyles')) return;
    const style = document.createElement('style');
    style.id = 'paytrackWorkspaceStyles';
    style.textContent = `
      :root { --brand-color: var(--primary, #2563eb); }
      .organization-select { display:none !important; }
      .organisation-identity {
        display:flex; align-items:center; gap:10px; width:100%; padding:10px 12px;
        border:1px solid var(--border, #e5e7eb); border-radius:10px; background:#fff;
        box-sizing:border-box; min-height:44px; margin-top:12px;
      }
      .organisation-identity-mark {
        width:28px; height:28px; border-radius:8px; display:grid; place-items:center;
        color:#fff; background:var(--primary, #2563eb); font-weight:700; font-size:11px; flex:0 0 28px;
      }
      .organisation-identity-copy { min-width:0; display:flex; flex-direction:column; gap:1px; }
      .organisation-identity-copy strong { font-size:12px; color:var(--text-primary,#111827); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .organisation-identity-copy span { font-size:10px; color:var(--text-secondary,#667085); }
      .sidebar-logout-button {
        width:100%; border:0; background:transparent; cursor:pointer; text-align:left; font:inherit;
      }
      select:not(.organization-select) {
        appearance:none; -webkit-appearance:none; text-align:left; padding-right:42px !important;
        background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23667085' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
        background-repeat:no-repeat; background-position:right 13px center; background-size:14px;
      }
      select:not(.organization-select) option { text-align:left; }
      .settings-grid { display:grid; grid-template-columns:220px minmax(0,1fr); gap:24px; align-items:start; }
      .settings-tabs { display:flex; flex-direction:column; gap:6px; }
      .settings-tab { width:100%; border:0; background:transparent; padding:10px 12px; border-radius:8px; text-align:left; cursor:pointer; color:var(--text-secondary,#667085); font-weight:600; }
      .settings-tab.active { background:#eef4ff; color:var(--primary,#2563eb); }
      .settings-panel { display:none; } .settings-panel.active { display:block; }
      .settings-card { background:#fff; border:1px solid var(--border,#e5e7eb); border-radius:12px; padding:24px; }
      .settings-card + .settings-card { margin-top:16px; }
      .settings-card h2 { margin:0 0 6px; font-size:18px; }
      .settings-card > p { margin:0 0 22px; color:var(--text-secondary,#667085); font-size:13px; }
      .settings-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
      .settings-field { display:flex; flex-direction:column; gap:7px; }
      .settings-field.full { grid-column:1/-1; }
      .settings-field label { font-size:12px; font-weight:600; }
      .settings-field input, .settings-field select { width:100%; box-sizing:border-box; }
      .brand-preview { display:flex; align-items:center; gap:14px; padding:16px; border:1px solid var(--border,#e5e7eb); border-radius:10px; margin-top:16px; }
      .brand-preview-swatch { width:42px; height:42px; border-radius:10px; background:var(--primary,#2563eb); }
      .settings-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:22px; }
      .settings-success { color:#067647; font-size:12px; margin-top:12px; }
      .profile-menu-btn, .notification-button, .row-menu-button, .sidebar-bottom a[href="#"] { display:none !important; }

      /* Uniform icon + button alignment */
      iconify-icon { width:18px; height:18px; font-size:18px; flex:0 0 18px; display:inline-flex; align-items:center; justify-content:center; }
      .nav-link { display:flex !important; align-items:center !important; gap:10px !important; }
      .nav-link .nav-icon { width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center; flex:0 0 18px; margin:0 !important; }
      .nav-link iconify-icon { margin:0 !important; }
      .mobile-menu-button iconify-icon { font-size:21px; }
      button.primary-button, button.secondary-button, a.primary-button, a.secondary-button,
      .review-button, .sidebar-logout-button, .mobile-menu-button, .modal-close-button, .icon-button {
        display:inline-flex !important; align-items:center !important; justify-content:center !important;
        gap:8px !important; line-height:1 !important; white-space:nowrap;
      }
      button.primary-button iconify-icon, button.secondary-button iconify-icon,
      a.primary-button iconify-icon, a.secondary-button iconify-icon, .review-button iconify-icon,
      .sidebar-logout-button iconify-icon { margin:0 !important; }
      .sidebar-logout-button { justify-content:flex-start !important; }
      .modal-close-button, .icon-button, .mobile-menu-button { gap:0 !important; }

      /* Universal topbar search + desktop menu positioning */
      .topbar-left { display:flex; align-items:center; gap:12px !important; min-width:0; }
      .topbar-search { position:relative; min-width:0; }
      .topbar-search input { width:100%; box-sizing:border-box; }
      @media (min-width:1101px) {
        .mobile-menu-button { display:none !important; }
        .topbar-search { margin-left:0 !important; }
      }
      @media (max-width:1100px) {
        .mobile-menu-button { flex:0 0 auto; }
        .topbar-search { flex:1 1 auto; width:auto !important; max-width:560px; margin-left:0 !important; }
      }
      .paytrack-global-search-panel {
        position:absolute; top:calc(100% + 8px); left:0; width:min(560px,calc(100vw - 32px));
        max-height:420px; overflow:auto; z-index:9999; background:#fff;
        border:1px solid var(--border,#e5e7eb); border-radius:12px;
        box-shadow:0 18px 45px rgba(15,23,42,.14); padding:6px;
      }
      .paytrack-global-search-panel[hidden] { display:none !important; }
      .paytrack-search-section-label { padding:8px 10px 5px; font-size:10px; font-weight:700;
        color:var(--text-secondary,#667085); text-transform:uppercase; letter-spacing:.05em; }
      .paytrack-search-result { width:100%; border:0; background:transparent; cursor:pointer;
        display:flex; align-items:center; gap:10px; padding:10px; border-radius:8px; text-align:left; }
      .paytrack-search-result:hover, .paytrack-search-result:focus { background:#f8fafc; outline:none; }
      .paytrack-search-result-icon { width:30px; height:30px; border-radius:8px; display:grid; place-items:center;
        background:#f1f5f9; color:var(--primary,#2563eb); flex:0 0 30px; }
      .paytrack-search-result-copy { min-width:0; flex:1; display:flex; flex-direction:column; gap:2px; }
      .paytrack-search-result-copy strong { font-size:12px; color:var(--text-primary,#111827);
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .paytrack-search-result-copy span { font-size:10px; color:var(--text-secondary,#667085);
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .paytrack-search-state { padding:18px 12px; text-align:center; color:var(--text-secondary,#667085); font-size:12px; }

      /* Payment request overview spacing */
      .paytrack-request-summary-grid { gap:16px !important; margin:18px 0 16px !important; }
      .paytrack-request-summary-grid > * { min-height:86px; padding:18px 20px !important; box-sizing:border-box; }
      .paytrack-request-toolbar {
        display:grid !important; grid-template-columns:minmax(320px,1fr) 190px 190px;
        gap:12px !important; align-items:center !important; margin:0 0 16px !important;
      }
      .paytrack-request-toolbar .module-search { width:100% !important; min-width:0; }
      .paytrack-request-toolbar .filter-select { width:100% !important; min-width:0; }
      .paytrack-request-table-card { margin-top:0 !important; }

      /* Customer details visual alignment */
      .paytrack-customer-header { margin-bottom:18px !important; }
      .paytrack-customer-summary-grid {
        display:grid !important; grid-template-columns:repeat(4,minmax(0,1fr)) !important;
        gap:16px !important; margin:0 0 18px !important;
      }
      .paytrack-customer-summary-grid > * {
        min-width:0; min-height:104px; padding:18px 20px !important; box-sizing:border-box;
        display:flex; flex-direction:column; justify-content:center;
      }
      .paytrack-customer-summary-grid strong { margin-top:6px; }
      .paytrack-customer-tabs { margin:0 0 16px !important; }
      .paytrack-customer-overview-card { margin-bottom:16px !important; }
      .paytrack-customer-info-grid {
        display:grid !important; grid-template-columns:repeat(2,minmax(0,1fr)) !important;
        column-gap:24px !important; row-gap:0 !important;
      }
      .paytrack-customer-info-grid > * { min-width:0; }
      .paytrack-customer-info-grid .info-row, .paytrack-customer-info-grid > div {
        padding:14px 0 !important; border-bottom:1px solid var(--border,#e5e7eb);
      }
      .paytrack-customer-info-grid .info-row:nth-last-child(-n+2),
      .paytrack-customer-info-grid > div:nth-last-child(-n+2) { border-bottom:0; }
      .paytrack-customer-notes-card { margin-top:16px !important; }

      /* Customer detail tabs — consistent product card system */
      #customerDetailsContent .detail-tab-panel,
      #customerDetailsContent .customer-detail-tab-panel {
        padding:0 !important; margin:0 !important; background:transparent !important;
      }
      #customerDetailsContent .detail-tab-panel.active,
      #customerDetailsContent .customer-detail-tab-panel.active {
        display:block !important;
      }
      #customerDetailsContent .detail-tab-panel > section,
      #customerDetailsContent .detail-tab-panel > .module-card,
      #customerDetailsContent .detail-tab-panel > .customer-detail-card,
      #customerDetailsContent .customer-detail-tab-panel > section,
      #customerDetailsContent .customer-detail-tab-panel > .module-card,
      #customerDetailsContent .customer-detail-tab-panel > .customer-detail-card {
        background:#fff !important;
        border:1px solid var(--border,#e5e7eb) !important;
        border-radius:12px !important;
        padding:20px !important;
        margin:0 0 16px !important;
        box-sizing:border-box !important;
        overflow:hidden;
      }
      #customerDetailsContent .detail-tab-panel .section-header,
      #customerDetailsContent .customer-detail-tab-panel .section-header {
        margin:0 0 16px !important; padding:0 !important;
        display:flex; align-items:flex-start; justify-content:space-between; gap:16px;
      }
      #customerDetailsContent .detail-tab-panel .section-header h2,
      #customerDetailsContent .customer-detail-tab-panel .section-header h2,
      #customerDetailsContent .paytrack-customer-overview-card h2,
      #customerDetailsContent .paytrack-customer-notes-card h2 {
        margin:0 0 4px !important; font-size:18px !important; line-height:1.3 !important;
      }
      #customerDetailsContent .detail-tab-panel .section-header p,
      #customerDetailsContent .customer-detail-tab-panel .section-header p {
        margin:0 !important; color:var(--text-secondary,#667085) !important; font-size:12px !important;
      }
      #customerDetailsContent .table-wrapper {
        width:100% !important; overflow-x:auto !important; overflow-y:hidden !important;
        border-radius:10px; -webkit-overflow-scrolling:touch;
      }
      #customerDetailsContent .data-table { width:100% !important; min-width:760px !important; }
      #customerDetailsContent .paytrack-customer-info-grid {
        padding:0 !important; margin:0 !important; border:0 !important; background:transparent !important;
      }
      #customerDetailsContent .paytrack-customer-info-grid .info-row,
      #customerDetailsContent .paytrack-customer-info-grid > div {
        min-height:66px; display:flex; flex-direction:column; justify-content:center; gap:5px;
      }
      #customerDetailsContent .paytrack-customer-info-grid span:first-child,
      #customerDetailsContent .paytrack-customer-info-grid label {
        color:var(--text-secondary,#667085); font-size:11px;
      }
      #customerDetailsContent .paytrack-customer-info-grid strong,
      #customerDetailsContent .paytrack-customer-info-grid a {
        font-size:13px; line-height:1.35;
      }
      #customerDetailsContent .paytrack-customer-notes-card {
        background:#fff !important; border:1px solid var(--border,#e5e7eb) !important;
        border-radius:12px !important; padding:20px !important; margin:0 0 16px !important;
      }
      #customerDetailsContent .paytrack-customer-notes-card p { margin:8px 0 0 !important; }


      /* Customer Details Overview — explicit card treatment */
      #customerDetailsContent [data-panel="overview"] { padding:0 !important; background:transparent !important; }
      #customerDetailsContent [data-panel="overview"] .paytrack-overview-section {
        background:#fff !important;
        border:1px solid var(--border,#e5e7eb) !important;
        border-radius:12px !important;
        padding:20px !important;
        margin:0 0 16px !important;
        box-sizing:border-box !important;
        overflow:hidden !important;
      }
      #customerDetailsContent [data-panel="overview"] .paytrack-overview-section > h2,
      #customerDetailsContent [data-panel="overview"] .paytrack-overview-section .section-header h2 {
        margin:0 0 4px !important;
        font-size:18px !important;
        line-height:1.3 !important;
      }
      #customerDetailsContent [data-panel="overview"] .paytrack-overview-section > p,
      #customerDetailsContent [data-panel="overview"] .paytrack-overview-section .section-header p {
        margin:0 0 16px !important;
        color:var(--text-secondary,#667085) !important;
        font-size:12px !important;
      }
      #customerDetailsContent [data-panel="overview"] .paytrack-overview-section .table-wrapper {
        margin-top:14px !important;
      }
      #customerDetailsContent [data-panel="overview"] .paytrack-overview-info {
        display:grid !important;
        grid-template-columns:repeat(2,minmax(0,1fr)) !important;
        gap:0 24px !important;
      }
      #customerDetailsContent [data-panel="overview"] .paytrack-overview-info > * {
        padding:14px 0 !important;
        min-height:62px !important;
        border-bottom:1px solid var(--border,#e5e7eb) !important;
        box-sizing:border-box !important;
      }
      #customerDetailsContent [data-panel="overview"] .paytrack-overview-info > *:nth-last-child(-n+2) {
        border-bottom:0 !important;
      }
      #customerDetailsContent [data-panel="overview"] .paytrack-overview-notes p { margin:6px 0 0 !important; }
      @media (max-width:760px) {
        #customerDetailsContent [data-panel="overview"] .paytrack-overview-info { grid-template-columns:1fr !important; }
        #customerDetailsContent [data-panel="overview"] .paytrack-overview-info > *:nth-last-child(-n+2) { border-bottom:1px solid var(--border,#e5e7eb) !important; }
        #customerDetailsContent [data-panel="overview"] .paytrack-overview-info > *:last-child { border-bottom:0 !important; }
      }

      /* Payment requests — preserve readable table columns and scroll overflow */
      #paymentRequestsTableWrapper,
      #paymentRequestsTableBody.closest-table-wrapper {
        width:100% !important; max-width:100% !important; overflow-x:auto !important; overflow-y:hidden !important;
        -webkit-overflow-scrolling:touch;
      }
      #paymentRequestsTable {
        width:100% !important; min-width:1320px !important; table-layout:auto !important;
      }
      #paymentRequestsTable th, #paymentRequestsTable td { white-space:nowrap; }
      #paymentRequestsTable th:nth-child(2), #paymentRequestsTable td:nth-child(2) { min-width:210px; }
      #paymentRequestsTable th:nth-child(3), #paymentRequestsTable td:nth-child(3) { min-width:170px; }
      #paymentRequestsTable th:nth-child(4), #paymentRequestsTable td:nth-child(4) { min-width:160px; }

      @media (max-width:1100px) {
        .paytrack-request-toolbar { grid-template-columns:1fr 180px 180px; }
        .paytrack-customer-summary-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
      }
      @media (max-width:760px) {
        .paytrack-request-toolbar { grid-template-columns:1fr !important; }
        .paytrack-customer-summary-grid, .paytrack-customer-info-grid { grid-template-columns:1fr !important; }
      }
      .brand-preview-swatch { overflow:hidden; display:grid; place-items:center; }
      .brand-preview-swatch img { width:100%; height:100%; object-fit:contain; padding:4px; box-sizing:border-box; background:#fff; }
      .organisation-identity-mark.has-logo { background:#fff !important; border:1px solid var(--border,#e5e7eb); overflow:hidden; }
      .organisation-identity-mark.has-logo img { width:100%; height:100%; object-fit:contain; padding:2px; box-sizing:border-box; }
      .brand-mark.paytrack-product-logo { background:transparent !important; padding:0 !important; overflow:hidden; display:grid; place-items:center; }
      .brand-mark.paytrack-product-logo img { width:100%; height:100%; object-fit:contain; display:block; }
      .summary-grid, .customer-summary-grid, .customer-detail-summary-grid, .metric-grid, .transaction-summary-grid, .reconciliation-summary-grid, .reports-summary-grid, .request-financial-grid {
        display:grid !important; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)) !important; gap:14px !important;
      }
      .summary-grid > *, .customer-summary-grid > *, .customer-detail-summary-grid > *, .metric-grid > *, .transaction-summary-grid > *, .reconciliation-summary-grid > *, .reports-summary-grid > *, .request-financial-grid > * { min-width:0; }
      .detail-tabs, .customer-detail-tabs { overflow-x:auto; overflow-y:hidden; scrollbar-width:thin; }
      .detail-tabs::-webkit-scrollbar, .customer-detail-tabs::-webkit-scrollbar { height:5px; }
      .receipt-modal-card { width:min(760px,calc(100vw - 32px)); max-height:92vh; overflow:auto; background:#fff; border-radius:16px; box-shadow:0 24px 80px rgba(15,23,42,.2); }
      .receipt-sheet { padding:32px; background:#fff; }
      .receipt-head { display:flex; justify-content:space-between; gap:24px; padding-bottom:22px; border-bottom:2px solid var(--primary,#2563eb); }
      .receipt-brand { display:flex; align-items:center; gap:12px; }
      .receipt-logo { width:52px; height:52px; border-radius:12px; display:grid; place-items:center; color:#fff; background:var(--primary,#2563eb); font-weight:800; overflow:hidden; }
      .receipt-logo img { width:100%; height:100%; object-fit:contain; background:#fff; padding:4px; box-sizing:border-box; }
      .receipt-title { text-align:right; } .receipt-title h2 { margin:0; font-size:24px; } .receipt-title span { color:#667085; font-size:12px; }
      .receipt-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px 24px; margin:26px 0; }
      .receipt-item { padding:12px 0; border-bottom:1px solid #eef0f3; } .receipt-item span { display:block; color:#667085; font-size:11px; margin-bottom:5px; }
      .receipt-item strong { font-size:14px; } .receipt-amount { font-size:28px !important; color:var(--primary,#2563eb); }
      .receipt-note { padding:14px 16px; background:#f8fafc; border-radius:10px; color:#667085; font-size:12px; line-height:1.6; }
      .receipt-actions { display:flex; justify-content:flex-end; gap:10px; padding:18px 24px; border-top:1px solid #e5e7eb; background:#fff; position:sticky; bottom:0; }
      @media (max-width:800px) { .settings-grid{grid-template-columns:1fr;} .settings-tabs{flex-direction:row;overflow:auto;} .settings-form-grid{grid-template-columns:1fr;} .summary-grid, .customer-summary-grid, .customer-detail-summary-grid, .metric-grid, .transaction-summary-grid, .reconciliation-summary-grid, .reports-summary-grid, .request-financial-grid{grid-template-columns:1fr 1fr !important;} .receipt-grid{grid-template-columns:1fr;} }
      @media (max-width:520px) { .summary-grid, .customer-summary-grid, .customer-detail-summary-grid, .metric-grid, .transaction-summary-grid, .reconciliation-summary-grid, .reports-summary-grid, .request-financial-grid{grid-template-columns:1fr !important;} }
    `;
    document.head.appendChild(style);
  }

  ensureWorkspaceStyles();

  /* ==================================================
     PAYTRACK PRODUCT LOGO
  ================================================== */

  function applyPayTrackProductLogo() {
    const logoPath = window.location.pathname.includes('/pages/')
      ? '../Paytrack Logo.png'
      : 'Paytrack Logo.png';

    document.querySelectorAll('.brand-mark').forEach(mark => {
      mark.classList.add('paytrack-product-logo');
      mark.textContent = '';

      const image = document.createElement('img');
      image.src = logoPath;
      image.alt = 'PayTrack SME';
      image.decoding = 'async';

      mark.appendChild(image);
    });
  }

  applyPayTrackProductLogo();

  let globalWorkspace = null;

  async function loadGlobalWorkspace() {
    try {
      const { data, error } = await supabaseClient
        .from('user_organisations')
        .select(`organisation_id, organisation_role, organisations(id,name,code)`);
      if (error) throw error;
      const rows = (data || []).filter(item => item.organisations);
      const preferred = rows.find(item => item.organisations?.code === 'AS5') || rows[0] || null;
      globalWorkspace = preferred;

      const meta = session.user?.user_metadata || {};
      const org = preferred?.organisations || null;
      const workspaceName = meta.workspace_name || org?.name || 'My Organisation';
      const workspaceCode = meta.organisation_code || org?.code || 'WORKSPACE';
      const brandColor = /^#[0-9a-fA-F]{6}$/.test(meta.brand_color || '') ? meta.brand_color : '#2563eb';
      const logoData = meta.organisation_logo_data_url || '';

      document.documentElement.style.setProperty('--primary', brandColor);
      document.documentElement.style.setProperty('--brand-color', brandColor);
      document.documentElement.style.setProperty('--primary-hover', paytrackDarkenHex(brandColor));

      document.querySelectorAll('.brand-mark').forEach(el => { el.style.background = brandColor; });

      const sidebarTop = document.querySelector('.sidebar-top');
      const oldIdentity = document.querySelector('.organisation-identity');
      if (oldIdentity) oldIdentity.remove();
      if (sidebarTop) {
        const identity = document.createElement('div');
        identity.className = 'organisation-identity';
        const mark = document.createElement('div');
        mark.className = 'organisation-identity-mark';
        if (logoData) { mark.classList.add('has-logo'); const img=document.createElement('img'); img.src=logoData; img.alt=workspaceName+' logo'; mark.appendChild(img); } else { mark.textContent = (workspaceName || 'O').trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()).join('') || 'O'; }
        const copy = document.createElement('div');
        copy.className = 'organisation-identity-copy';
        const strong = document.createElement('strong'); strong.textContent = workspaceName;
        const small = document.createElement('span'); small.textContent = workspaceCode;
        copy.append(strong, small); identity.append(mark, copy); sidebarTop.appendChild(identity);
      }

      const fullName = meta.full_name || meta.name || session.user?.email?.split('@')[0] || 'User';
      document.querySelectorAll('.user-details strong').forEach(el => el.textContent = fullName);
      document.querySelectorAll('.user-avatar').forEach(el => {
        el.textContent = fullName.trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()).join('') || 'U';
      });
      document.querySelectorAll('.user-details span').forEach(el => {
        if (preferred?.organisation_role) el.textContent = String(preferred.organisation_role).replaceAll('_',' ').replace(/\b\w/g, c => c.toUpperCase());
      });

      return { org, membership: preferred, meta, workspaceName, workspaceCode, brandColor, logoData };
    } catch (error) {
      console.warn('Workspace identity could not be loaded:', error);
      return null;
    }
  }

  const workspaceState = await loadGlobalWorkspace();

  /* ==================================================
     UNIVERSAL SEARCH
     Searches customers, payment requests and transactions
  ================================================== */
  function installUniversalSearch() {
    const container = document.querySelector('.topbar-search');
    const input = container?.querySelector('input[type="search"]');
    if (!container || !input || input.dataset.paytrackUniversalSearch === 'true') return;

    input.dataset.paytrackUniversalSearch = 'true';
    input.placeholder = 'Search customer, payment or reference...';
    input.setAttribute('autocomplete','off');

    const panel = document.createElement('div');
    panel.className = 'paytrack-global-search-panel';
    panel.hidden = true;
    container.appendChild(panel);

    let timer = null;
    let requestToken = 0;

    const label = value => String(value || '').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());

    function setState(message) {
      panel.replaceChildren();
      const state = document.createElement('div');
      state.className = 'paytrack-search-state';
      state.textContent = message;
      panel.appendChild(state);
      panel.hidden = false;
    }

    function appendSection(title, rows, config) {
      if (!rows.length) return;
      const heading = document.createElement('div');
      heading.className = 'paytrack-search-section-label';
      heading.textContent = title;
      panel.appendChild(heading);

      rows.slice(0,5).forEach(row => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'paytrack-search-result';

        const iconWrap = document.createElement('span');
        iconWrap.className = 'paytrack-search-result-icon';
        iconWrap.appendChild(makeIcon(config.icon));

        const copy = document.createElement('span');
        copy.className = 'paytrack-search-result-copy';
        const strong = document.createElement('strong');
        strong.textContent = config.title(row);
        const meta = document.createElement('span');
        meta.textContent = config.meta(row);
        copy.append(strong, meta);
        button.append(iconWrap, copy);
        button.addEventListener('click', () => { window.location.href = config.href(row); });
        panel.appendChild(button);
      });
    }

    async function runSearch(term) {
      const token = ++requestToken;
      const q = term.trim();
      if (q.length < 2) { panel.hidden = true; panel.replaceChildren(); return; }

      const orgId = workspaceState?.org?.id || workspaceState?.membership?.organisation_id || null;
      if (!orgId) { setState('Workspace is still loading. Try again.'); return; }
      setState('Searching…');

      try {
        const pattern = `%${q}%`;
        const [customersRes, requestsRes, transactionsRes] = await Promise.all([
          supabaseClient.from('customers')
            .select('id,customer_code,name,email,phone,customer_type')
            .eq('organisation_id',orgId)
            .or(`name.ilike.${pattern},customer_code.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`)
            .limit(5),
          supabaseClient.from('payment_requests')
            .select('id,request_number,purpose,external_business_reference,status,customers(name)')
            .eq('organisation_id',orgId)
            .or(`request_number.ilike.${pattern},purpose.ilike.${pattern},external_business_reference.ilike.${pattern}`)
            .limit(5),
          supabaseClient.from('transactions')
            .select('id,transaction_number,external_reference,payment_method,amount,customers(name),payment_requests(request_number)')
            .eq('organisation_id',orgId)
            .or(`transaction_number.ilike.${pattern},external_reference.ilike.${pattern}`)
            .limit(5)
        ]);

        if (token !== requestToken) return;
        const firstError = customersRes.error || requestsRes.error || transactionsRes.error;
        if (firstError) throw firstError;

        const customers = customersRes.data || [];
        const requests = requestsRes.data || [];
        const transactions = transactionsRes.data || [];
        panel.replaceChildren();

        appendSection('Customers', customers, {
          icon:'lucide:user-round',
          title:r=>r.name || 'Customer',
          meta:r=>`${r.customer_code || 'No code'} · ${label(r.customer_type)}`,
          href:r=>`customer-details.html?id=${encodeURIComponent(r.id)}`
        });
        appendSection('Payment Requests', requests, {
          icon:'lucide:receipt-text',
          title:r=>r.request_number || 'Payment Request',
          meta:r=>`${r.customers?.name || 'Unknown customer'} · ${r.purpose || r.external_business_reference || label(r.status)}`,
          href:r=>`payment-request-details.html?id=${encodeURIComponent(r.id)}`
        });
        appendSection('Transactions', transactions, {
          icon:'lucide:arrow-left-right',
          title:r=>r.transaction_number || 'Transaction',
          meta:r=>`${r.customers?.name || 'Unidentified'} · ${r.external_reference || label(r.payment_method)}`,
          href:r=>`transaction-details.html?id=${encodeURIComponent(r.id)}`
        });

        if (!panel.children.length) setState(`No results found for “${q}”.`);
        else panel.hidden = false;
      } catch (error) {
        console.error('Universal search failed:', error);
        setState('Search could not be completed. Please try again.');
      }
    }

    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => runSearch(input.value), 220);
    });
    input.addEventListener('focus', () => {
      if (input.value.trim().length >= 2 && panel.children.length) panel.hidden = false;
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') { panel.hidden = true; input.blur(); }
      if (event.key === 'Enter') {
        const first = panel.querySelector('.paytrack-search-result');
        if (first) { event.preventDefault(); first.click(); }
      }
    });
    document.addEventListener('click', event => {
      if (!container.contains(event.target)) panel.hidden = true;
    });
  }

  async function loadScriptOnce(src, id) {
    if (id && document.getElementById(id)) return;
    if ([...document.scripts].some(x => x.src === src)) return;
    await new Promise((resolve, reject) => {
      const script=document.createElement('script'); if(id) script.id=id; script.src=src; script.async=true;
      script.onload=resolve; script.onerror=reject; document.head.appendChild(script);
    });
  }

  function makeIcon(name, className='') {
    const el=document.createElement('iconify-icon'); el.setAttribute('icon',name); if(className) el.className=className; return el;
  }

  function installProductIconsAndCleanup() {
    loadScriptOnce('https://code.iconify.design/iconify-icon/3.0.0/iconify-icon.min.js','paytrackIconify').catch(()=>{});
    const map={Overview:'lucide:layout-dashboard',Customers:'lucide:users-round','Payment Requests':'lucide:receipt-text',Transactions:'lucide:arrow-left-right',Reconciliation:'lucide:badge-check',Reports:'lucide:chart-no-axes-combined',Settings:'lucide:settings',Logout:'lucide:log-out','Sign Out':'lucide:log-out'};
    document.querySelectorAll('.nav-link').forEach(link=>{
      const labelText=[...link.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim() || link.textContent.trim();
      const key=Object.keys(map).find(k=>labelText.includes(k)); if(!key)return;
      let holder=link.querySelector('.nav-icon'); if(!holder){holder=document.createElement('span');holder.className='nav-icon';link.prepend(holder);}
      holder.replaceChildren(makeIcon(map[key]));
    });
    const menu=document.getElementById('mobileMenuButton'); if(menu) menu.replaceChildren(makeIcon('lucide:menu'));
    document.querySelectorAll('.search-icon').forEach(el=>el.replaceChildren(makeIcon('lucide:search')));
    document.querySelectorAll('.profile-menu-btn,.notification-button,.row-menu-button').forEach(el=>el.remove());
    document.querySelectorAll('.sidebar-bottom a[href="#"]').forEach(el=>el.remove());
    document.querySelectorAll('.modal-close-button').forEach(el=>el.replaceChildren(makeIcon('lucide:x')));
    document.querySelectorAll('button').forEach(btn=>{
      const raw=btn.textContent.trim(); if(!raw.startsWith('+')) return;
      const clean=raw.replace(/^\+\s*/, ''); const icon=clean.toLowerCase().includes('customer')?'lucide:user-plus':clean.toLowerCase().includes('payment')?'lucide:circle-dollar-sign':'lucide:file-plus-2';
      btn.replaceChildren(makeIcon(icon),document.createTextNode(' '+clean));
    });
    document.querySelectorAll('.toast-icon').forEach(el=>el.replaceChildren(makeIcon('lucide:circle-check')));
    document.querySelectorAll('.empty-icon').forEach(el=>el.replaceChildren(makeIcon('lucide:inbox')));
    document.querySelectorAll('.reconciliation-explainer-icon').forEach(el=>el.replaceChildren(makeIcon('lucide:info')));
  }
  installProductIconsAndCleanup();
  installUniversalSearch();

  /* ==================================================
     FINAL LAYOUT POLISH — REQUESTS / CUSTOMER DETAILS
  ================================================== */
  function applyFinalLayoutPolish() {
    // Payment Requests list: normalise spacing between metrics, filters and table.
    if (document.getElementById('paymentRequestsTableBody')) {
      const summary = document.getElementById('paymentRequestTotalCount')?.closest('section');
      if (summary) summary.classList.add('paytrack-request-summary-grid');

      const search = document.getElementById('paymentRequestSearch');
      const toolbar = search?.closest('section') || search?.parentElement?.parentElement;
      if (toolbar) toolbar.classList.add('paytrack-request-toolbar');

      const tableCard = document.getElementById('paymentRequestsTableBody')?.closest('section');
      if (tableCard) tableCard.classList.add('paytrack-request-table-card');
      const requestTableWrapper = document.getElementById('paymentRequestsTableWrapper') || document.getElementById('paymentRequestsTable')?.closest('.table-wrapper');
      if (requestTableWrapper) { requestTableWrapper.style.overflowX='auto'; requestTableWrapper.style.overflowY='hidden'; requestTableWrapper.style.width='100%'; requestTableWrapper.style.maxWidth='100%'; }
    }

    // Customer Details: make the page use the same card rhythm as the rest of the product.
    if (document.getElementById('customerDetailsContent')) {
      const name = document.getElementById('customerDetailName');
      const header = name?.closest('.customer-detail-header') || name?.parentElement?.parentElement;
      if (header) header.classList.add('paytrack-customer-header');

      const metricIds = ['customerTotalDue','customerTotalPaid','customerOutstanding','customerActiveRequests'];
      const metricCards = metricIds.map(id => document.getElementById(id)?.parentElement).filter(Boolean);
      if (metricCards.length) {
        const parent = metricCards[0].parentElement;
        if (parent) parent.classList.add('paytrack-customer-summary-grid');
      }

      const tabs = document.querySelector('.detail-tabs, .customer-detail-tabs');
      if (tabs) tabs.classList.add('paytrack-customer-tabs');

      const overviewBody = document.getElementById('customerOverviewRequestsBody');
      const overviewCard = overviewBody?.closest('.customer-detail-card, .module-card, section');
      if (overviewCard) overviewCard.classList.add('paytrack-customer-overview-card');

      const infoIds = ['customerInfoCode','customerInfoType','customerInfoEmail','customerInfoPhone','customerInfoIdentifier','customerInfoAddress'];
      const infoEls = infoIds.map(id => document.getElementById(id)).filter(Boolean);
      let infoParent = null;
      if (infoEls.length) {
        const wrappers = infoEls.map(el => el.closest('.info-row') || el.parentElement).filter(Boolean);
        infoParent = wrappers[0]?.parentElement || null;
        if (infoParent) infoParent.classList.add('paytrack-customer-info-grid');
      }

      const notes = document.getElementById('customerInfoNotes');
      const notesCard = notes?.closest('.customer-detail-card, .module-card, section') || notes?.parentElement?.parentElement;
      if (notesCard) notesCard.classList.add('paytrack-customer-notes-card');

      // Overview uses a slightly different HTML structure from the other tabs.
      // Apply the product card system explicitly to its three sections.
      const overviewPanel = document.querySelector('[data-panel="overview"]');
      if (overviewPanel) {
        const overviewTableWrapper = overviewBody?.closest('.table-wrapper');
        const recentSection = overviewTableWrapper?.parentElement;
        if (recentSection && overviewPanel.contains(recentSection)) recentSection.classList.add('paytrack-overview-section');

        if (infoParent) {
          infoParent.classList.add('paytrack-overview-info');
          const infoSection = infoParent.parentElement;
          if (infoSection && overviewPanel.contains(infoSection)) infoSection.classList.add('paytrack-overview-section');
        }

        if (notes) {
          const notesContent = notes.parentElement;
          const notesSection = notesContent?.parentElement;
          if (notesSection && overviewPanel.contains(notesSection)) {
            notesSection.classList.add('paytrack-overview-section','paytrack-overview-notes');
          }
        }
      }
    }

    // Re-run button alignment after dynamic content is rendered.
    document.querySelectorAll('.primary-button,.secondary-button,.review-button,.sidebar-logout-button').forEach(btn => {
      btn.style.alignItems='center'; btn.style.justifyContent=btn.classList.contains('sidebar-logout-button')?'flex-start':'center';
    });
  }

  applyFinalLayoutPolish();
  setTimeout(applyFinalLayoutPolish, 400);
  setTimeout(applyFinalLayoutPolish, 1200);

  const dashboardButtons=[...document.querySelectorAll('.dashboard-actions button')];
  dashboardButtons.forEach(btn=>{
    const text=btn.textContent.trim().toLowerCase();
    if(text.includes('add customer')) btn.addEventListener('click',()=>location.href='customers.html?action=add');
    if(text.includes('record payment')) btn.addEventListener('click',()=>location.href='payment-requests.html?action=record');
    if(text.includes('create request')) btn.addEventListener('click',()=>location.href='payment-requests.html?action=create');
  });
  setTimeout(()=>{
    const action=new URLSearchParams(location.search).get('action');
    if(action==='add') document.getElementById('addCustomerButton')?.click();
    if(action==='create') document.getElementById('createPaymentRequestButton')?.click();
    if(action==='record' && document.getElementById('paymentRequestsTableBody')) alert('Select a payment request to record a payment against it.');
  },250);

  function fileToLogoDataUrl(file) {
    return new Promise((resolve,reject)=>{
      if(!file){resolve('');return;}
      if(file.size>2*1024*1024){reject(new Error('Logo must be smaller than 2 MB.'));return;}
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error('Unable to read logo file.'));
      reader.onload=()=>{
        if(file.type==='image/svg+xml'){resolve(reader.result);return;}
        const img=new Image(); img.onload=()=>{
          const max=420, scale=Math.min(1,max/Math.max(img.width,img.height));
          const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(img.width*scale)); c.height=Math.max(1,Math.round(img.height*scale));
          const ctx=c.getContext('2d'); ctx.drawImage(img,0,0,c.width,c.height); resolve(c.toDataURL('image/webp',0.82));
        }; img.onerror=()=>reject(new Error('Unsupported logo image.')); img.src=reader.result;
      }; reader.readAsDataURL(file);
    });
  }

  async function ensureJsPdf() {
    if(window.jspdf?.jsPDF) return window.jspdf.jsPDF;
    await loadScriptOnce('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js','paytrackJsPdf');
    return window.jspdf.jsPDF;
  }

  async function downloadReceiptPdf({tx, receipt, workspace}) {
    const jsPDF=await ensureJsPdf(); const doc=new jsPDF(); const brand=workspace?.brandColor||'#2563eb';
    const rgb=[parseInt(brand.slice(1,3),16),parseInt(brand.slice(3,5),16),parseInt(brand.slice(5,7),16)];
    doc.setFillColor(...rgb); doc.rect(0,0,210,10,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.text(workspace?.workspaceName||'PayTrack SME',18,27);
    doc.setFontSize(22); doc.text('PAYMENT RECEIPT',192,27,{align:'right'});
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(100); doc.text(receipt?.receipt_number||'Receipt',192,34,{align:'right'});
    doc.setTextColor(20); let y=52;
    const line=(labelText,value)=>{doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(110);doc.text(labelText,18,y);doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(20);doc.text(String(value||'—'),18,y+7);y+=20;};
    line('Customer',tx.customers?.name||'Unidentified'); line('Transaction',tx.transaction_number); line('Payment Request',tx.payment_requests?.request_number||'—'); line('Payment Date',dateOnly(tx.payment_date)); line('Payment Method',label(tx.payment_method)); line('Payment Reference',tx.external_reference||'—');
    doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(110);doc.text('AMOUNT RECEIVED',128,52);doc.setFontSize(22);doc.setTextColor(...rgb);doc.text(money(tx.amount),192,64,{align:'right'});
    doc.setDrawColor(225); doc.line(18,y,192,y); y+=14; doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(100);doc.text('This receipt confirms a payment recorded in PayTrack SME. The payment itself was completed through an external payment channel.',18,y,{maxWidth:174});
    doc.save(`${receipt?.receipt_number||tx.transaction_number}-receipt.pdf`);
  }

  function openReceiptPreview({tx, receipt, workspace}) {
    document.getElementById('paytrackReceiptModal')?.remove();
    const overlay=document.createElement('div'); overlay.id='paytrackReceiptModal'; overlay.className='modal-backdrop'; overlay.style.display='grid'; overlay.style.placeItems='center'; overlay.style.zIndex='9999';
    const card=document.createElement('div'); card.className='receipt-modal-card';
    const sheet=document.createElement('div'); sheet.className='receipt-sheet';
    const logo=workspace?.logoData ? `<img src="${workspace.logoData}" alt="${workspace.workspaceName||'Organisation'} logo">` : initials(workspace?.workspaceName||'PT');
    sheet.innerHTML=`<div class="receipt-head"><div class="receipt-brand"><div class="receipt-logo">${logo}</div><div><strong style="font-size:17px">${workspace?.workspaceName||'PayTrack SME'}</strong><div style="font-size:11px;color:#667085;margin-top:4px">${workspace?.workspaceCode||''}</div></div></div><div class="receipt-title"><h2>Payment Receipt</h2><span>${receipt?.receipt_number||'Receipt'}</span></div></div><div class="receipt-grid"><div class="receipt-item"><span>Customer</span><strong>${tx.customers?.name||'Unidentified'}</strong></div><div class="receipt-item"><span>Amount Received</span><strong class="receipt-amount">${money(tx.amount)}</strong></div><div class="receipt-item"><span>Transaction</span><strong>${tx.transaction_number}</strong></div><div class="receipt-item"><span>Payment Request</span><strong>${tx.payment_requests?.request_number||'—'}</strong></div><div class="receipt-item"><span>Payment Date</span><strong>${dateOnly(tx.payment_date)}</strong></div><div class="receipt-item"><span>Method</span><strong>${label(tx.payment_method)}</strong></div><div class="receipt-item"><span>Payment Reference</span><strong>${tx.external_reference||'—'}</strong></div><div class="receipt-item"><span>Generated</span><strong>${receipt?.generated_at?dateTime(receipt.generated_at):dateTime(new Date().toISOString())}</strong></div></div><div class="receipt-note">This receipt confirms a payment recorded in PayTrack SME. PayTrack SME manages the payment record and does not itself initiate or settle funds.</div>`;
    const actions=document.createElement('div'); actions.className='receipt-actions'; const closeBtn=document.createElement('button'); closeBtn.className='secondary-button'; closeBtn.type='button'; closeBtn.textContent='Close'; const dl=document.createElement('button'); dl.className='primary-button'; dl.type='button'; dl.append(makeIcon('lucide:download')); dl.append(document.createTextNode(' Download PDF')); actions.append(closeBtn,dl); card.append(sheet,actions); overlay.appendChild(card); document.body.appendChild(overlay); document.body.style.overflow='hidden';
    const close=()=>{overlay.remove();document.body.style.overflow='';}; closeBtn.addEventListener('click',close); overlay.addEventListener('click',e=>{if(e.target===overlay)close();}); dl.addEventListener('click',async()=>{dl.disabled=true;try{await downloadReceiptPdf({tx,receipt,workspace});}catch(e){alert('Unable to create the PDF receipt. '+(e.message||''));}finally{dl.disabled=false;}});
  }

  function ensureLogoutButton() {
    const sidebarBottom = document.querySelector('.sidebar-bottom');
    if (!sidebarBottom) return;
    let button = document.getElementById('logoutButton');
    if (!button) {
      button = document.createElement('button');
      button.id = 'logoutButton';
      button.type = 'button';
      button.className = 'nav-link sidebar-logout-button';
      const icon = document.createElement('span'); icon.className = 'nav-icon'; icon.textContent = '↪';
      button.append(icon, document.createTextNode(' Logout'));
      sidebarBottom.appendChild(button);
    }
    if (!button.dataset.bound) {
      button.dataset.bound = 'true';
      button.addEventListener('click', async () => {
        button.disabled = true;
        await supabaseClient.auth.signOut();
        window.location.replace('../login.html');
      });
    }
  }

  ensureLogoutButton();

  /* ==================================================
     SETTINGS
  ================================================== */
  const settingsRoot = document.getElementById('settingsRoot');
  if (settingsRoot) {
    const meta = session.user?.user_metadata || {};
    const org = workspaceState?.org || null;
    const byId = id => document.getElementById(id);

    byId('settingsFullName').value = meta.full_name || meta.name || '';
    byId('settingsEmail').value = session.user?.email || '';
    byId('settingsWorkspaceName').value = meta.workspace_name || org?.name || '';
    byId('settingsWorkspaceCode').value = meta.organisation_code || org?.code || '';
    byId('settingsBrandColor').value = /^#[0-9a-fA-F]{6}$/.test(meta.brand_color || '') ? meta.brand_color : '#2563eb';
    byId('settingsBrandHex').value = byId('settingsBrandColor').value;
    let pendingLogoData = meta.organisation_logo_data_url || '';
    const logoPreview=byId('settingsLogoPreview'); const logoWrap=byId('settingsLogoPreviewWrap');
    if(pendingLogoData && logoPreview){logoPreview.src=pendingLogoData;logoPreview.hidden=false;logoWrap.style.background='#fff';}

    const updatePreview = value => {
      if (!/^#[0-9a-fA-F]{6}$/.test(value || '')) return;
      document.documentElement.style.setProperty('--primary', value);
      document.documentElement.style.setProperty('--brand-color', value);
      document.documentElement.style.setProperty('--primary-hover', paytrackDarkenHex(value));
      document.querySelectorAll('.brand-mark,.organisation-identity-mark,.brand-preview-swatch').forEach(el => el.style.background = value);
    };

    byId('settingsBrandColor').addEventListener('input', e => { byId('settingsBrandHex').value=e.target.value; updatePreview(e.target.value); });
    byId('settingsBrandHex').addEventListener('input', e => { if(/^#[0-9a-fA-F]{6}$/.test(e.target.value)){byId('settingsBrandColor').value=e.target.value;updatePreview(e.target.value);} });
    byId('settingsLogoUpload')?.addEventListener('change', async e => { const file=e.target.files?.[0]; if(!file)return; const msg=byId('settingsBrandMessage'); try{pendingLogoData=await fileToLogoDataUrl(file); if(logoPreview){logoPreview.src=pendingLogoData;logoPreview.hidden=false;logoWrap.style.background='#fff';} msg.textContent='Logo ready. Click Save Branding to apply it.';msg.style.color='#067647';}catch(err){msg.textContent=err.message;msg.style.color='#b42318';e.target.value='';} });

    document.querySelectorAll('.settings-tab').forEach(tab => tab.addEventListener('click', () => {
      document.querySelectorAll('.settings-tab').forEach(x=>x.classList.remove('active'));
      document.querySelectorAll('.settings-panel').forEach(x=>x.classList.remove('active'));
      tab.classList.add('active'); byId(`settingsPanel-${tab.dataset.settingsTab}`)?.classList.add('active');
    }));

    byId('settingsProfileForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      const full_name = byId('settingsFullName').value.trim();
      const { error } = await supabaseClient.auth.updateUser({ data: { ...session.user.user_metadata, full_name } });
      const msg=byId('settingsProfileMessage');
      if(error){msg.textContent=error.message;msg.style.color='#b42318';return;}
      msg.textContent='Profile saved.';msg.style.color='#067647';
      document.querySelectorAll('.user-details strong').forEach(el=>el.textContent=full_name||'User');
    });

    byId('settingsBrandForm')?.addEventListener('submit', async e => {
      e.preventDefault();
      const workspace_name = byId('settingsWorkspaceName').value.trim();
      const organisation_code = byId('settingsWorkspaceCode').value.trim();
      const brand_color = byId('settingsBrandHex').value.trim();
      const msg=byId('settingsBrandMessage');
      if(!workspace_name || !/^#[0-9a-fA-F]{6}$/.test(brand_color)){msg.textContent='Enter a workspace name and a valid six-digit hex colour.';msg.style.color='#b42318';return;}
      const { error } = await supabaseClient.auth.updateUser({ data: { ...session.user.user_metadata, workspace_name, organisation_code, brand_color, organisation_logo_data_url: pendingLogoData } });
      if(error){msg.textContent=error.message;msg.style.color='#b42318';return;}
      msg.textContent='Branding saved and applied.';msg.style.color='#067647'; updatePreview(brand_color);
      await loadGlobalWorkspace();
    });

    byId('resetBrandButton')?.addEventListener('click', () => {
      byId('settingsBrandColor').value='#2563eb';byId('settingsBrandHex').value='#2563eb';updatePreview('#2563eb');
    });
  }

  const sidebar = document.querySelector(".sidebar");
  const mobileMenuButton = document.getElementById("mobileMenuButton");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const closeMobileNav = () => {
    sidebar?.classList.remove("open", "active");
    sidebarOverlay?.classList.remove("active", "show");
    document.body.classList.remove("sidebar-open");
  };
  if (mobileMenuButton) {
    mobileMenuButton.addEventListener("click", () => {
      sidebar?.classList.toggle("open");
      sidebar?.classList.toggle("active");
      sidebarOverlay?.classList.toggle("active");
      sidebarOverlay?.classList.toggle("show");
      document.body.classList.toggle("sidebar-open");
    });
  }
  sidebarOverlay?.addEventListener("click", closeMobileNav);

  const money = value => new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", maximumFractionDigits: 0
  }).format(Number(value) || 0).replace("NGN", "₦");

  const dateOnly = value => {
    if (!value) return "—";
    return new Intl.DateTimeFormat("en-GB", {day:"2-digit", month:"short", year:"numeric"})
      .format(new Date(`${String(value).slice(0,10)}T00:00:00`));
  };

  const dateTime = value => {
    if (!value) return "—";
    return new Intl.DateTimeFormat("en-GB", {day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit"})
      .format(new Date(value));
  };

  const label = value => !value ? "—" : String(value).replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
  const initials = name => (name || "?").trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()).join("") || "?";
  const statusClass = status => ({
    active:"status-success", paid:"status-success", reconciled:"status-success", resolved:"status-success",
    pending:"status-pending", draft:"status-pending", cancelled:"status-pending", recorded:"status-pending",
    partially_paid:"status-partial", overdue:"status-overdue", needs_review:"status-warning", unidentified:"status-unidentified"
  }[status] || "status-pending");
  const setStatus = (el,status) => {
    if (!el) return;
    el.className = `status-chip ${statusClass(status)}`;
    el.textContent = label(status);
  };
  const td = (text, cls="") => { const x=document.createElement("td"); if(cls)x.className=cls; x.textContent=text; return x; };

  async function memberships(selectEl) {
    const {data,error}=await supabaseClient.from("user_organisations").select(`organisation_id, organisation_role, organisations(id,name,code)`);
    if(error) throw error;
    const list=(data||[]).filter(x=>x.organisations);
    if(selectEl){
      selectEl.replaceChildren();
      list.forEach(x=>{const o=document.createElement("option");o.value=x.organisations.id;o.textContent=x.organisations.name;selectEl.appendChild(o);});
    }
    const preferred=list.find(x=>x.organisations.code==="AS5")||list[0];
    if(selectEl && preferred) selectEl.value=preferred.organisations.id;
    return {list, active: preferred?.organisations || null};
  }

  async function nextNumber(table,column,prefix,orgId,width=5) {
    const {data,error}=await supabaseClient.from(table).select(column).eq("organisation_id",orgId);
    if(error) throw error;
    let high=0;
    (data||[]).forEach(r=>{const m=String(r[column]||"").match(/(\d+)$/);if(m)high=Math.max(high,Number(m[1]));});
    return `${prefix}${String(high+1).padStart(width,"0")}`;
  }

  async function generateReceipt(orgId, transactionId, userId) {
    try {
      const receiptNumber=await nextNumber("receipts","receipt_number","RCP-2026-",orgId,5);
      let payload={organisation_id:orgId,transaction_id:transactionId,receipt_number:receiptNumber,generated_at:new Date().toISOString(),created_by:userId};
      let {error}=await supabaseClient.from("receipts").insert(payload);
      if(error){
        delete payload.created_by;
        ({error}=await supabaseClient.from("receipts").insert(payload));
      }
      if(error) console.warn("Receipt could not be generated:",error);
    } catch(e){ console.warn("Receipt generation skipped:",e); }
  }

/* ==================================================
   PAYMENT REQUESTS — SUPABASE
================================================== */

const paymentRequestsTableBody =
  document.getElementById(
    "paymentRequestsTableBody"
  );


if (paymentRequestsTableBody) {

  const supabaseClient =
    window.paytrackSupabase;


  const organisationSelect =
    document.getElementById(
      "organisationSelect"
    );


  const paymentRequestSearch =
    document.getElementById(
      "paymentRequestSearch"
    );


  const paymentRequestStatusFilter =
    document.getElementById(
      "paymentRequestStatusFilter"
    );


  const paymentRequestCustomerFilter =
    document.getElementById(
      "paymentRequestCustomerFilter"
    );


  const paymentRequestCount =
    document.getElementById(
      "paymentRequestCount"
    );


  const paymentRequestEmptyState =
    document.getElementById(
      "paymentRequestEmptyState"
    );


  const paymentRequestsLoadingState =
    document.getElementById(
      "paymentRequestsLoadingState"
    );


  const paymentRequestsTableWrapper =
    document.getElementById(
      "paymentRequestsTableWrapper"
    );


  const createPaymentRequestButton =
    document.getElementById(
      "createPaymentRequestButton"
    );


  const paymentRequestModalBackdrop =
    document.getElementById(
      "paymentRequestModalBackdrop"
    );


  const closePaymentRequestModalButton =
    document.getElementById(
      "closePaymentRequestModal"
    );


  const cancelPaymentRequestModalButton =
    document.getElementById(
      "cancelPaymentRequestModal"
    );


  const createPaymentRequestForm =
    document.getElementById(
      "createPaymentRequestForm"
    );


  const paymentRequestToast =
    document.getElementById(
      "paymentRequestToast"
    );


  const savePaymentRequestButton =
    document.getElementById(
      "savePaymentRequestButton"
    );


  const paymentRequestFormError =
    document.getElementById(
      "paymentRequestFormError"
    );


  let paymentRequestRecords = [];

  let requestCustomerRecords = [];

  let requestOrganisationMemberships = [];

  let requestActiveOrganisation = null;



  function formatRequestNaira(
    value
  ) {

    return new Intl.NumberFormat(
      "en-NG",
      {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0
      }
    )
      .format(
        Number(value) || 0
      )
      .replace(
        "NGN",
        "₦"
      );

  }



  function formatLiveRequestDate(
    value
  ) {

    if (!value) {
      return "—";
    }


    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    ).format(
      new Date(
        `${value}T00:00:00`
      )
    );

  }



  function formatRequestLabel(
    value
  ) {

    if (!value) {
      return "—";
    }


    return value
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        character =>
          character.toUpperCase()
      );

  }



  function requestInitials(
    name
  ) {

    return (
      name
        ?.trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
          item =>
            item[0]
              ?.toUpperCase()
        )
        .join("") ||
      "?"
    );

  }



  function getRequestStatusClass(
    status
  ) {

    const map = {

      draft:
        "status-pending",

      pending:
        "status-pending",

      partially_paid:
        "status-partial",

      paid:
        "status-success",

      overdue:
        "status-overdue",

      cancelled:
        "status-pending"

    };


    return (
      map[status] ||
      "status-pending"
    );

  }



  function showPaymentRequestFormError(
    message
  ) {

    paymentRequestFormError.textContent =
      message;


    paymentRequestFormError.hidden =
      false;

  }



  function clearPaymentRequestFormError() {

    paymentRequestFormError.textContent =
      "";


    paymentRequestFormError.hidden =
      true;

  }



  function showLivePaymentRequestToast() {

    paymentRequestToast.hidden =
      false;


    setTimeout(
      () => {

        paymentRequestToast.hidden =
          true;

      },
      3000
    );

  }



  async function loadRequestOrganisations() {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "user_organisations"
        )
        .select(`
          organisation_id,
          organisation_role,
          organisations (
            id,
            name,
            code
          )
        `);


    if (error) {

      console.error(
        "Unable to load organisations:",
        error
      );


      paymentRequestsLoadingState.textContent =
        "Unable to load organisation.";

      return false;

    }


    requestOrganisationMemberships =
      data || [];


    organisationSelect.replaceChildren();


    requestOrganisationMemberships.forEach(
      membership => {

        if (!membership.organisations) {
          return;
        }


        const option =
          document.createElement(
            "option"
          );


        option.value =
          membership.organisations.id;


        option.textContent =
          membership.organisations.name;


        organisationSelect.appendChild(
          option
        );

      }
    );


    if (
      requestOrganisationMemberships.length ===
      0
    ) {

      paymentRequestsLoadingState.textContent =
        "Your account does not belong to an organisation.";

      return false;

    }


    const preferred =
      requestOrganisationMemberships.find(
        membership =>
          membership.organisations
            ?.code === "AS5"
      ) ||
      requestOrganisationMemberships[0];


    requestActiveOrganisation =
      preferred.organisations;


    organisationSelect.value =
      requestActiveOrganisation.id;


    return true;

  }



  async function loadRequestCustomers() {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("customers")
        .select(`
          id,
          customer_code,
          customer_type,
          name
        `)
        .eq(
          "organisation_id",
          requestActiveOrganisation.id
        )
        .eq(
          "status",
          "active"
        )
        .order(
          "name",
          {
            ascending: true
          }
        );


    if (error) {

      console.error(
        "Unable to load request customers:",
        error
      );


      return false;

    }


    requestCustomerRecords =
      data || [];


    populateRequestCustomerControls();


    return true;

  }



  function populateRequestCustomerControls() {

    const requestCustomer =
      document.getElementById(
        "requestCustomer"
      );


    requestCustomer.replaceChildren();


    const placeholder =
      document.createElement(
        "option"
      );


    placeholder.value = "";

    placeholder.textContent =
      "Select customer";


    requestCustomer.appendChild(
      placeholder
    );


    paymentRequestCustomerFilter
      .replaceChildren();


    const allOption =
      document.createElement(
        "option"
      );


    allOption.value =
      "all";


    allOption.textContent =
      "All customers";


    paymentRequestCustomerFilter
      .appendChild(
        allOption
      );


    requestCustomerRecords.forEach(
      customer => {

        const formOption =
          document.createElement(
            "option"
          );


        formOption.value =
          customer.id;


        formOption.textContent =
          customer.name;


        requestCustomer.appendChild(
          formOption
        );


        const filterOption =
          document.createElement(
            "option"
          );


        filterOption.value =
          customer.id;


        filterOption.textContent =
          customer.name;


        paymentRequestCustomerFilter
          .appendChild(
            filterOption
          );

      }
    );

  }



  async function loadPaymentRequests() {

    paymentRequestsLoadingState.hidden =
      false;


    paymentRequestsTableWrapper.hidden =
      true;


    paymentRequestEmptyState.hidden =
      true;


    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "payment_requests"
        )
        .select(`
          id,
          request_number,
          customer_id,
          business_reference_type,
          external_business_reference,
          purpose,
          description,
          amount_due,
          total_paid,
          outstanding_balance,
          due_date,
          status,
          created_at,
          customers (
            id,
            name,
            customer_type,
            customer_code
          )
        `)
        .eq(
          "organisation_id",
          requestActiveOrganisation.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    paymentRequestsLoadingState.hidden =
      true;


    if (error) {

      console.error(
        "Unable to load payment requests:",
        error
      );


      paymentRequestEmptyState.hidden =
        false;


      paymentRequestEmptyState
        .querySelector("strong")
        .textContent =
        "Unable to load payment requests";


      paymentRequestEmptyState
        .querySelector("p")
        .textContent =
        error.message;


      return;

    }


    paymentRequestRecords =
      data || [];


    paymentRequestsTableWrapper.hidden =
      false;


    renderLivePaymentRequests();

  }



  function renderLivePaymentRequests() {

    const searchValue =
  (
    paymentRequestSearch?.value ||
    ""
  )
    .trim()
    .toLowerCase();


    const statusValue =
      paymentRequestStatusFilter.value;


    const customerValue =
      paymentRequestCustomerFilter.value;


    const filtered =
      paymentRequestRecords.filter(
        request => {

          const searchable =
            [
              request.request_number,
              request.customers?.name,
              request.customers?.customer_code,
              request.external_business_reference,
              request.business_reference_type,
              request.purpose,
              request.description
            ]
              .filter(Boolean)
              .map(
                value =>
                  String(value)
                    .toLowerCase()
              )
              .join(" ");


          const matchesSearch =
            searchable.includes(
              searchValue
            );


          const matchesStatus =
            statusValue === "all" ||
            request.status ===
              statusValue;


          const matchesCustomer =
            customerValue === "all" ||
            request.customer_id ===
              customerValue;


          return (
            matchesSearch &&
            matchesStatus &&
            matchesCustomer
          );

        }
      );


    paymentRequestsTableBody
      .replaceChildren();


    filtered.forEach(
      request => {

        const row =
          document.createElement(
            "tr"
          );


        row.className =
          "clickable-row";


        row.addEventListener(
          "click",
          event => {

            if (
              event.target.closest(
                ".row-menu-button"
              )
            ) {

              return;

            }


            window.location.href =
              `payment-request-details.html?id=${encodeURIComponent(
                request.id
              )}`;

          }
        );


        const requestCell =
          document.createElement(
            "td"
          );


        const requestWrapper =
          document.createElement(
            "div"
          );


        requestWrapper.className =
          "request-id-cell";


        const requestNumber =
          document.createElement(
            "strong"
          );


        requestNumber.textContent =
          request.request_number;


        const requestCreated =
          document.createElement(
            "span"
          );


        requestCreated.textContent =
          new Intl.DateTimeFormat(
            "en-GB",
            {
              day: "2-digit",
              month: "short",
              year: "numeric"
            }
          ).format(
            new Date(
              request.created_at
            )
          );


        requestWrapper.append(
          requestNumber,
          requestCreated
        );


        requestCell.appendChild(
          requestWrapper
        );


        const customerCell =
          document.createElement(
            "td"
          );


        const customerWrapper =
          document.createElement(
            "div"
          );


        customerWrapper.className =
          "customer-cell";


        const avatar =
          document.createElement(
            "div"
          );


        avatar.className =
          request.customers
            ?.customer_type ===
          "business"
            ? "customer-avatar business-avatar"
            : "customer-avatar";


        avatar.textContent =
          requestInitials(
            request.customers?.name
          );


        const customerText =
          document.createElement(
            "div"
          );


        const customerName =
          document.createElement(
            "strong"
          );


        customerName.textContent =
          request.customers?.name ||
          "Unknown customer";


        const customerType =
          document.createElement(
            "span"
          );


        customerType.textContent =
          formatRequestLabel(
            request.customers
              ?.customer_type
          );


        customerText.append(
          customerName,
          customerType
        );


        customerWrapper.append(
          avatar,
          customerText
        );


        customerCell.appendChild(
          customerWrapper
        );


        const referenceCell =
          document.createElement(
            "td"
          );


        const referenceWrapper =
          document.createElement(
            "div"
          );


        referenceWrapper.className =
          "business-reference-cell";


        const reference =
          document.createElement(
            "strong"
          );


        reference.textContent =
          request
            .external_business_reference;


        const referenceType =
          document.createElement(
            "span"
          );


        referenceType.textContent =
          request
            .business_reference_type;


        referenceWrapper.append(
          reference,
          referenceType
        );


        referenceCell.appendChild(
          referenceWrapper
        );


        const purposeCell =
          document.createElement(
            "td"
          );


        purposeCell.textContent =
          request.purpose;


        const amountCell =
          document.createElement(
            "td"
          );


        amountCell.className =
          "currency";


        amountCell.textContent =
          formatRequestNaira(
            request.amount_due
          );


        const paidCell =
          document.createElement(
            "td"
          );


        paidCell.className =
          "currency paid-value";


        paidCell.textContent =
          formatRequestNaira(
            request.total_paid
          );


        const outstandingCell =
          document.createElement(
            "td"
          );


        outstandingCell.className =
          "currency";


        outstandingCell.textContent =
          formatRequestNaira(
            request
              .outstanding_balance
          );


        const dueDateCell =
          document.createElement(
            "td"
          );


        dueDateCell.textContent =
          formatLiveRequestDate(
            request.due_date
          );


        const statusCell =
          document.createElement(
            "td"
          );


        const status =
          document.createElement(
            "span"
          );


        status.className =
          `status-chip ${getRequestStatusClass(
            request.status
          )}`;


        status.textContent =
          formatRequestLabel(
            request.status
          );


        statusCell.appendChild(
          status
        );


        const actionCell =
          document.createElement(
            "td"
          );


        const menuButton =
          document.createElement(
            "button"
          );


        menuButton.className =
          "row-menu-button";


        menuButton.type =
          "button";


        menuButton.textContent =
          "•••";


        actionCell.appendChild(
          menuButton
        );


        row.append(
          requestCell,
          customerCell,
          referenceCell,
          purposeCell,
          amountCell,
          paidCell,
          outstandingCell,
          dueDateCell,
          statusCell,
          actionCell
        );


        paymentRequestsTableBody
          .appendChild(
            row
          );

      }
    );


    const visibleCount =
      filtered.length;


    paymentRequestCount.textContent =
      `Showing ${visibleCount} ${
        visibleCount === 1
          ? "payment request"
          : "payment requests"
      }`;


    paymentRequestEmptyState.hidden =
      visibleCount !== 0;


    updatePaymentRequestSummary();

  }



  function updatePaymentRequestSummary() {

    document.getElementById(
      "paymentRequestTotalCount"
    ).textContent =
      paymentRequestRecords.length;


    document.getElementById(
      "paymentRequestPendingCount"
    ).textContent =
      paymentRequestRecords.filter(
        request =>
          request.status ===
          "pending"
      ).length;


    document.getElementById(
      "paymentRequestPartialCount"
    ).textContent =
      paymentRequestRecords.filter(
        request =>
          request.status ===
          "partially_paid"
      ).length;


    document.getElementById(
      "paymentRequestPaidCount"
    ).textContent =
      paymentRequestRecords.filter(
        request =>
          request.status ===
          "paid"
      ).length;


    document.getElementById(
      "paymentRequestOverdueCount"
    ).textContent =
      paymentRequestRecords.filter(
        request =>
          request.status ===
          "overdue"
      ).length;

  }



  async function generateRequestNumber() {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "payment_requests"
        )
        .select(
          "request_number"
        )
        .eq(
          "organisation_id",
          requestActiveOrganisation.id
        );


    if (error) {

      throw error;

    }


    let highest = 0;


    (data || []).forEach(
      request => {

        const match =
          request.request_number
            ?.match(
              /(\d+)$/
            );


        if (!match) {
          return;
        }


        const number =
          Number(match[1]);


        if (number > highest) {

          highest =
            number;

        }

      }
    );


    const next =
      String(
        highest + 1
      ).padStart(
        5,
        "0"
      );


    return (
      `PAY-2026-${next}`
    );

  }



  function openLivePaymentRequestModal() {

    clearPaymentRequestFormError();


    paymentRequestModalBackdrop.hidden =
      false;


    document.body.style.overflow =
      "hidden";

  }



  function closeLivePaymentRequestModal() {

    paymentRequestModalBackdrop.hidden =
      true;


    document.body.style.overflow =
      "";

  }



  createPaymentRequestButton
    .addEventListener(
      "click",
      openLivePaymentRequestModal
    );


  closePaymentRequestModalButton
    .addEventListener(
      "click",
      closeLivePaymentRequestModal
    );


  cancelPaymentRequestModalButton
    .addEventListener(
      "click",
      closeLivePaymentRequestModal
    );


  paymentRequestModalBackdrop
    .addEventListener(
      "click",
      event => {

        if (
          event.target ===
          paymentRequestModalBackdrop
        ) {

          closeLivePaymentRequestModal();

        }

      }
    );



  createPaymentRequestForm
    .addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        clearPaymentRequestFormError();


        const customerId =
          document.getElementById(
            "requestCustomer"
          ).value;


        const referenceType =
          document.getElementById(
            "businessReferenceType"
          ).value;


        const businessReference =
          document.getElementById(
            "businessReference"
          ).value.trim();


        const purpose =
          document.getElementById(
            "requestPurpose"
          ).value.trim();


        const amount =
          Number(
            document.getElementById(
              "requestAmount"
            ).value
          );


        const dueDate =
          document.getElementById(
            "requestDueDate"
          ).value;


        const description =
          document.getElementById(
            "requestDescription"
          ).value.trim();


        if (
          !customerId ||
          !referenceType ||
          !businessReference ||
          !purpose ||
          !dueDate
        ) {

          showPaymentRequestFormError(
            "Complete all required fields."
          );

          return;

        }


        if (
          !Number.isFinite(amount) ||
          amount <= 0
        ) {

          showPaymentRequestFormError(
            "Amount due must be greater than zero."
          );

          return;

        }


        savePaymentRequestButton.disabled =
          true;


        savePaymentRequestButton.textContent =
          "Saving...";


        try {

          const requestNumber =
            await generateRequestNumber();


          const {
            data: {
              user
            }
          } =
            await supabaseClient.auth
              .getUser();


          const record = {

            organisation_id:
              requestActiveOrganisation.id,

            customer_id:
              customerId,

            request_number:
              requestNumber,

            business_reference_type:
              referenceType,

            external_business_reference:
              businessReference,

            purpose,

            description:
              description || null,

            amount_due:
              amount,

            total_paid:
              0,

            outstanding_balance:
              amount,

            due_date:
              dueDate,

            status:
              "pending",

            created_by:
              user?.id || null

          };


          const {
            error
          } =
            await supabaseClient
              .from(
                "payment_requests"
              )
              .insert(
                record
              );


          if (error) {

            throw error;

          }


          createPaymentRequestForm
            .reset();


          closeLivePaymentRequestModal();


          showLivePaymentRequestToast();


          await loadPaymentRequests();

        }
        catch (error) {

          console.error(
            "Unable to create payment request:",
            error
          );


          showPaymentRequestFormError(
            error.message ||
            "Unable to create payment request."
          );

        }
        finally {

          savePaymentRequestButton.disabled =
            false;


          savePaymentRequestButton.textContent =
            "Create Request";

        }

      }
    );



  /* ==================================================
   LIVE PAYMENT REQUEST FILTERS
================================================== */

function handlePaymentRequestFilters() {

  renderLivePaymentRequests();

}


if (paymentRequestSearch) {

  paymentRequestSearch.addEventListener(
    "input",
    handlePaymentRequestFilters
  );

  paymentRequestSearch.addEventListener(
    "keyup",
    handlePaymentRequestFilters
  );

}


if (paymentRequestStatusFilter) {

  paymentRequestStatusFilter.addEventListener(
    "change",
    handlePaymentRequestFilters
  );

}


if (paymentRequestCustomerFilter) {

  paymentRequestCustomerFilter.addEventListener(
    "change",
    handlePaymentRequestFilters
  );

}


  organisationSelect.addEventListener(
    "change",
    async () => {

      const membership =
        requestOrganisationMemberships.find(
          item =>
            item.organisations?.id ===
            organisationSelect.value
        );


      if (!membership) {
        return;
      }


      requestActiveOrganisation =
        membership.organisations;


      await loadRequestCustomers();

      await loadPaymentRequests();

    }
  );



  const requestOrganisationsLoaded =
    await loadRequestOrganisations();


  if (requestOrganisationsLoaded) {

    await loadRequestCustomers();

    await loadPaymentRequests();

  }

}


/* ==================================================
   CUSTOMERS — SUPABASE
================================================== */

const customersTableBody =
  document.getElementById(
    "customersTableBody"
  );


if (customersTableBody) {

  const supabaseClient =
    window.paytrackSupabase;


  const organisationSelect =
    document.getElementById(
      "organisationSelect"
    );


  const customerSearch =
    document.getElementById(
      "customerSearch"
    );


  const customerStatusFilter =
    document.getElementById(
      "customerStatusFilter"
    );


  const customerCount =
    document.getElementById(
      "customerCount"
    );


  const customerEmptyState =
    document.getElementById(
      "customerEmptyState"
    );


  const customersLoadingState =
    document.getElementById(
      "customersLoadingState"
    );


  const customersTableWrapper =
    document.getElementById(
      "customersTableWrapper"
    );


  const addCustomerButton =
    document.getElementById(
      "addCustomerButton"
    );


  const addCustomerModalBackdrop =
    document.getElementById(
      "addCustomerModalBackdrop"
    );


  const closeAddCustomerModal =
    document.getElementById(
      "closeAddCustomerModal"
    );


  const cancelAddCustomerModal =
    document.getElementById(
      "cancelAddCustomerModal"
    );


  const addCustomerForm =
    document.getElementById(
      "addCustomerForm"
    );


  const saveCustomerButton =
    document.getElementById(
      "saveCustomerButton"
    );


  const addCustomerError =
    document.getElementById(
      "addCustomerError"
    );


  const customerToast =
    document.getElementById(
      "customerToast"
    );


  let customerRecords = [];

  let organisationMemberships = [];

  let activeOrganisation = null;



  /* ==================================================
     HELPERS
  ================================================== */

  function formatCustomerDate(
    value
  ) {

    if (!value) {
      return "—";
    }


    const date =
      new Date(value);


    return date.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );

  }



  function getCustomerInitials(
    name
  ) {

    if (!name) {
      return "?";
    }


    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(
        word =>
          word.charAt(0)
            .toUpperCase()
      )
      .join("");

  }



  function formatCustomerType(
    customerType
  ) {

    if (
      customerType ===
      "business"
    ) {

      return "Business";

    }


    return "Individual";

  }



  function showCustomerError(
    message
  ) {

    if (!addCustomerError) {
      return;
    }


    addCustomerError.textContent =
      message;


    addCustomerError.hidden =
      false;

  }



  function clearCustomerError() {

    if (!addCustomerError) {
      return;
    }


    addCustomerError.textContent =
      "";


    addCustomerError.hidden =
      true;

  }



  function showCustomerToast() {

    if (!customerToast) {
      return;
    }


    customerToast.hidden =
      false;


    setTimeout(
      () => {

        customerToast.hidden =
          true;

      },
      3000
    );

  }



  /* ==================================================
     LOAD ORGANISATIONS
  ================================================== */

  async function loadUserOrganisations() {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "user_organisations"
        )
        .select(`
          organisation_id,
          organisation_role,
          organisations (
            id,
            name,
            code
          )
        `);


    if (error) {

      console.error(
        "Unable to load organisations:",
        error
      );


      customersLoadingState.textContent =
        "Unable to load organisation.";

      return false;

    }


    organisationMemberships =
      data || [];


    organisationSelect.replaceChildren();


    organisationMemberships.forEach(
      membership => {

        const organisation =
          membership.organisations;


        if (!organisation) {
          return;
        }


        const option =
          document.createElement(
            "option"
          );


        option.value =
          organisation.id;


        option.textContent =
          organisation.name;


        organisationSelect.appendChild(
          option
        );

      }
    );


    if (
      organisationMemberships.length === 0
    ) {

      customersLoadingState.textContent =
        "Your account does not belong to an organisation.";

      return false;

    }


    const as5Membership =
      organisationMemberships.find(
        membership =>
          membership.organisations
            ?.code === "AS5"
      );


    const selectedMembership =
      as5Membership ||
      organisationMemberships[0];


    activeOrganisation =
      selectedMembership.organisations;


    organisationSelect.value =
      activeOrganisation.id;


    return true;

  }



  /* ==================================================
     LOAD CUSTOMERS
  ================================================== */

  async function loadCustomers() {

    if (!activeOrganisation) {
      return;
    }


    customersLoadingState.hidden =
      false;


    customersTableWrapper.hidden =
      true;


    customerEmptyState.hidden =
      true;


    const {
      data,
      error
    } =
      await supabaseClient
        .from("customers")
        .select(`
          id,
          customer_code,
          customer_type,
          name,
          identifier,
          email,
          phone,
          address,
          notes,
          status,
          created_at
        `)
        .eq(
          "organisation_id",
          activeOrganisation.id
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        );


    customersLoadingState.hidden =
      true;


    if (error) {

      console.error(
        "Unable to load customers:",
        error
      );


      customerEmptyState.hidden =
        false;


      customerEmptyState
        .querySelector("strong")
        .textContent =
        "Unable to load customers";


      customerEmptyState
        .querySelector("p")
        .textContent =
        error.message;


      return;

    }


    customerRecords =
      data || [];


    customersTableWrapper.hidden =
      false;


    renderCustomers();

  }



  /* ==================================================
     RENDER CUSTOMERS
  ================================================== */

  function renderCustomers() {

    const searchValue =
      customerSearch
        ? customerSearch.value
            .trim()
            .toLowerCase()
        : "";


    const statusValue =
      customerStatusFilter
        ? customerStatusFilter.value
        : "all";


    const filteredCustomers =
      customerRecords.filter(
        customer => {

          const searchable =
            [
              customer.name,
              customer.customer_code,
              customer.email,
              customer.phone,
              customer.identifier
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();


          const matchesSearch =
            searchable.includes(
              searchValue
            );


          const matchesStatus =
            statusValue === "all" ||
            customer.status ===
              statusValue;


          return (
            matchesSearch &&
            matchesStatus
          );

        }
      );


    customersTableBody.replaceChildren();


    filteredCustomers.forEach(
      customer => {

        const row =
          document.createElement(
            "tr"
          );


        row.dataset.customerId =
          customer.id;


        /* CUSTOMER */

        const customerCell =
          document.createElement(
            "td"
          );


        const customerWrapper =
          document.createElement(
            "div"
          );


        customerWrapper.className =
          "customer-cell";


        const avatar =
          document.createElement(
            "div"
          );


        avatar.className =
          customer.customer_type ===
          "business"
            ? "customer-avatar business-avatar"
            : "customer-avatar";


        avatar.textContent =
          getCustomerInitials(
            customer.name
          );


        const customerText =
          document.createElement(
            "div"
          );


        const customerName =
          document.createElement(
            "strong"
          );


        customerName.textContent =
          customer.name;


        const customerEmail =
          document.createElement(
            "span"
          );


        customerEmail.textContent =
          customer.email || "No email";


        customerText.append(
          customerName,
          customerEmail
        );


        customerWrapper.append(
          avatar,
          customerText
        );


        customerCell.appendChild(
          customerWrapper
        );


        /* CUSTOMER CODE */

        const codeCell =
          document.createElement(
            "td"
          );


        const codeStrong =
          document.createElement(
            "strong"
          );


        codeStrong.textContent =
          customer.customer_code;


        codeCell.appendChild(
          codeStrong
        );


        /* TYPE */

        const typeCell =
          document.createElement(
            "td"
          );


        typeCell.textContent =
          formatCustomerType(
            customer.customer_type
          );


        /* CONTACT */

        const contactCell =
          document.createElement(
            "td"
          );


        contactCell.textContent =
          customer.phone || "—";


        /* STATUS */

        const statusCell =
          document.createElement(
            "td"
          );


        const statusChip =
          document.createElement(
            "span"
          );


        statusChip.className =
          customer.status === "active"
            ? "status-chip status-success"
            : "status-chip status-pending";


        statusChip.textContent =
          customer.status === "active"
            ? "Active"
            : "Archived";


        statusCell.appendChild(
          statusChip
        );


        /* CREATED */

        const createdCell =
          document.createElement(
            "td"
          );


        createdCell.textContent =
          formatCustomerDate(
            customer.created_at
          );


        /* ACTION */

        const actionCell =
          document.createElement(
            "td"
          );


        const menuButton =
          document.createElement(
            "button"
          );


        menuButton.className =
          "row-menu-button";


        menuButton.type =
          "button";


        menuButton.textContent =
          "•••";


        actionCell.appendChild(
          menuButton
        );


        row.append(
          customerCell,
          codeCell,
          typeCell,
          contactCell,
          statusCell,
          createdCell,
          actionCell
        );


       row.classList.add(
  "clickable-row"
);


row.addEventListener(
  "click",
  event => {

    if (
      event.target.closest(
        ".row-menu-button"
      )
    ) {

      return;

    }


    window.location.href =
      `customer-details.html?id=${encodeURIComponent(
        customer.id
      )}`;

  }
);


        customersTableBody.appendChild(
          row
        );

      }
    );


    const visibleCount =
      filteredCustomers.length;


    customerCount.textContent =
      `Showing ${visibleCount} ${
        visibleCount === 1
          ? "customer"
          : "customers"
      }`;


    customerEmptyState.hidden =
      visibleCount !== 0;


    customersTableWrapper.hidden =
      false;

  }



  /* ==================================================
     CUSTOMER CODE
  ================================================== */

  async function generateCustomerCode() {

    const organisationCode =
      activeOrganisation.code
        .toUpperCase()
        .replace(
          /[^A-Z0-9]/g,
          ""
        );


    const {
      data,
      error
    } =
      await supabaseClient
        .from("customers")
        .select(
          "customer_code"
        )
        .eq(
          "organisation_id",
          activeOrganisation.id
        );


    if (error) {

      throw error;

    }


    let highestNumber = 0;


    (data || []).forEach(
      customer => {

        const match =
          customer.customer_code
            ?.match(
              /(\d+)$/
            );


        if (!match) {
          return;
        }


        const value =
          Number(match[1]);


        if (
          value >
          highestNumber
        ) {

          highestNumber =
            value;

        }

      }
    );


    const nextNumber =
      String(
        highestNumber + 1
      ).padStart(
        3,
        "0"
      );


    return (
      `CUS-${organisationCode}-${nextNumber}`
    );

  }



  /* ==================================================
     ADD CUSTOMER MODAL
  ================================================== */

  function openAddCustomerModal() {

    clearCustomerError();


    addCustomerModalBackdrop.hidden =
      false;


    document.body.style.overflow =
      "hidden";


    document
      .getElementById(
        "customerName"
      )
      .focus();

  }



  function closeCustomerModal() {

    addCustomerModalBackdrop.hidden =
      true;


    document.body.style.overflow =
      "";

  }



  if (addCustomerButton) {

    addCustomerButton
      .addEventListener(
        "click",
        openAddCustomerModal
      );

  }


  if (closeAddCustomerModal) {

    closeAddCustomerModal
      .addEventListener(
        "click",
        closeCustomerModal
      );

  }


  if (cancelAddCustomerModal) {

    cancelAddCustomerModal
      .addEventListener(
        "click",
        closeCustomerModal
      );

  }


  if (addCustomerModalBackdrop) {

    addCustomerModalBackdrop
      .addEventListener(
        "click",
        event => {

          if (
            event.target ===
            addCustomerModalBackdrop
          ) {

            closeCustomerModal();

          }

        }
      );

  }



  /* ==================================================
     INSERT CUSTOMER
  ================================================== */

  if (addCustomerForm) {

    addCustomerForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        clearCustomerError();


        if (!activeOrganisation) {

          showCustomerError(
            "No active organisation is available."
          );

          return;

        }


        const name =
          document
            .getElementById(
              "customerName"
            )
            .value
            .trim();


        const customerType =
          document
            .getElementById(
              "customerType"
            )
            .value;


        if (
          !name ||
          !customerType
        ) {

          showCustomerError(
            "Customer name and type are required."
          );

          return;

        }


        saveCustomerButton.disabled =
          true;


        saveCustomerButton.textContent =
          "Saving...";


        try {

          const customerCode =
            await generateCustomerCode();


          const {
            data: {
              user
            }
          } =
            await supabaseClient.auth
              .getUser();


          const customerRecord = {

            organisation_id:
              activeOrganisation.id,

            customer_code:
              customerCode,

            customer_type:
              customerType,

            name,

            identifier:
              document
                .getElementById(
                  "customerIdentifier"
                )
                .value
                .trim() || null,

            email:
              document
                .getElementById(
                  "customerEmail"
                )
                .value
                .trim() || null,

            phone:
              document
                .getElementById(
                  "customerPhone"
                )
                .value
                .trim() || null,

            address:
              document
                .getElementById(
                  "customerAddress"
                )
                .value
                .trim() || null,

            notes:
              document
                .getElementById(
                  "customerNotes"
                )
                .value
                .trim() || null,

            status:
              "active",

            created_by:
              user?.id || null

          };


          const {
            error
          } =
            await supabaseClient
              .from("customers")
              .insert(
                customerRecord
              );


          if (error) {

            throw error;

          }


          addCustomerForm.reset();


          closeCustomerModal();


          showCustomerToast();


          await loadCustomers();

        }
        catch (error) {

          console.error(
            "Unable to add customer:",
            error
          );


          showCustomerError(
            error.message ||
            "Unable to add customer."
          );

        }
        finally {

          saveCustomerButton.disabled =
            false;


          saveCustomerButton.textContent =
            "Add Customer";

        }

      }
    );

  }



  /* ==================================================
     SEARCH / FILTER
  ================================================== */

  if (customerSearch) {

    customerSearch.addEventListener(
      "input",
      renderCustomers
    );

  }


  if (customerStatusFilter) {

    customerStatusFilter.addEventListener(
      "change",
      renderCustomers
    );

  }



  /* ==================================================
     ORGANISATION SWITCHING
  ================================================== */

  organisationSelect.addEventListener(
    "change",
    async () => {

      const membership =
        organisationMemberships.find(
          item =>
            item.organisations?.id ===
            organisationSelect.value
        );


      if (!membership) {
        return;
      }


      activeOrganisation =
        membership.organisations;


      await loadCustomers();

    }
  );



  /* ==================================================
     INITIALISE
  ================================================== */

  const organisationsLoaded =
    await loadUserOrganisations();


  if (organisationsLoaded) {

    await loadCustomers();

  }

}
    

/* ==================================================
   CUSTOMER DETAILS — SUPABASE
================================================== */

const customerDetailsContent =
  document.getElementById(
    "customerDetailsContent"
  );


if (customerDetailsContent) {

  const supabaseClient =
    window.paytrackSupabase;


  const customerDetailsLoading =
    document.getElementById(
      "customerDetailsLoading"
    );


  const customerDetailsError =
    document.getElementById(
      "customerDetailsError"
    );


  const customerDetailsErrorText =
    document.getElementById(
      "customerDetailsErrorText"
    );


  const customerId =
    new URLSearchParams(
      window.location.search
    ).get("id");


  function formatDetailNaira(
    value
  ) {

    return new Intl.NumberFormat(
      "en-NG",
      {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0
      }
    )
      .format(
        Number(value) || 0
      )
      .replace(
        "NGN",
        "₦"
      );

  }



  function formatDetailDate(
    value
  ) {

    if (!value) {
      return "—";
    }


    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    ).format(
      new Date(
        `${value}T00:00:00`
      )
    );

  }



  function formatDetailDateTime(
    value
  ) {

    if (!value) {
      return "—";
    }


    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    ).format(
      new Date(value)
    );

  }



  function formatDetailLabel(
    value
  ) {

    if (!value) {
      return "—";
    }


    return value
      .replaceAll(
        "_",
        " "
      )
      .replace(
        /\b\w/g,
        character =>
          character.toUpperCase()
      );

  }



  function getDetailInitials(
    name
  ) {

    return (
      name
        ?.trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
          part =>
            part[0]
              ?.toUpperCase()
        )
        .join("") ||
      "?"
    );

  }



  function setDetailStatusChip(
    element,
    status
  ) {

    if (!element) {
      return;
    }


    element.classList.remove(
      "status-success",
      "status-pending",
      "status-warning",
      "status-partial",
      "status-overdue"
    );


    const statusClasses = {

      active:
        "status-success",

      archived:
        "status-pending",

      paid:
        "status-success",

      pending:
        "status-pending",

      partially_paid:
        "status-partial",

      overdue:
        "status-overdue",

      cancelled:
        "status-pending",

      reconciled:
        "status-success",

      needs_review:
        "status-warning",

      unidentified:
        "status-warning",

      recorded:
        "status-pending",

      resolved:
        "status-success"

    };


    element.classList.add(
      statusClasses[status] ||
      "status-pending"
    );


    element.textContent =
      formatDetailLabel(
        status
      );

  }



  function createTextCell(
    value,
    className = ""
  ) {

    const cell =
      document.createElement(
        "td"
      );


    if (className) {

      cell.className =
        className;

    }


    cell.textContent =
      value;


    return cell;

  }



  function showCustomerDetailError(
    message
  ) {

    customerDetailsLoading.hidden =
      true;


    customerDetailsContent.hidden =
      true;


    customerDetailsError.hidden =
      false;


    customerDetailsErrorText.textContent =
      message;

  }



  async function loadCustomerDetails() {

    if (!customerId) {

      showCustomerDetailError(
        "No customer was selected."
      );

      return;

    }


    const {
      data: customer,
      error: customerError
    } =
      await supabaseClient
        .from("customers")
        .select(`
          id,
          organisation_id,
          customer_code,
          customer_type,
          name,
          identifier,
          email,
          phone,
          address,
          notes,
          status,
          created_at
        `)
        .eq(
          "id",
          customerId
        )
        .maybeSingle();


    if (
      customerError ||
      !customer
    ) {

      console.error(
        "Unable to load customer:",
        customerError
      );


      showCustomerDetailError(
        "The selected customer does not exist or you do not have permission to view it."
      );

      return;

    }


    const {
      data: requests,
      error: requestsError
    } =
      await supabaseClient
        .from(
          "payment_requests"
        )
        .select(`
          id,
          request_number,
          business_reference_type,
          external_business_reference,
          purpose,
          amount_due,
          total_paid,
          outstanding_balance,
          due_date,
          status,
          created_at
        `)
        .eq(
          "customer_id",
          customer.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (requestsError) {

      console.error(
        "Unable to load customer requests:",
        requestsError
      );

    }


    const {
      data: transactions,
      error: transactionsError
    } =
      await supabaseClient
        .from("transactions")
        .select(`
          id,
          transaction_number,
          amount,
          payment_date,
          payment_method,
          external_reference,
          reconciliation_status,
          created_at
        `)
        .eq(
          "customer_id",
          customer.id
        )
        .order(
          "payment_date",
          {
            ascending: false
          }
        );


    if (transactionsError) {

      console.error(
        "Unable to load customer transactions:",
        transactionsError
      );

    }


    const customerTransactions =
      transactions || [];


    let receipts = [];


    if (
      customerTransactions.length >
      0
    ) {

      const transactionIds =
        customerTransactions.map(
          transaction =>
            transaction.id
        );


      const {
        data: receiptRecords,
        error: receiptsError
      } =
        await supabaseClient
          .from("receipts")
          .select(`
            id,
            receipt_number,
            transaction_id,
            generated_at
          `)
          .in(
            "transaction_id",
            transactionIds
          )
          .order(
            "generated_at",
            {
              ascending: false
            }
          );


      if (receiptsError) {

        console.error(
          "Unable to load receipts:",
          receiptsError
        );

      }
      else {

        receipts =
          receiptRecords || [];

      }

    }


    renderCustomerProfile(
      customer
    );


    renderCustomerSummary(
      requests || []
    );


    renderCustomerRequests(
      requests || []
    );


    renderCustomerPayments(
      customerTransactions
    );


    renderCustomerReceipts(
      receipts,
      customerTransactions
    );


    customerDetailsLoading.hidden =
      true;


    customerDetailsError.hidden =
      true;


    customerDetailsContent.hidden =
      false;

  }



  function renderCustomerProfile(
    customer
  ) {

    document.getElementById(
      "customerBreadcrumbName"
    ).textContent =
      customer.name;


    document.getElementById(
      "customerDetailName"
    ).textContent =
      customer.name;


    document.getElementById(
      "customerDetailAvatar"
    ).textContent =
      getDetailInitials(
        customer.name
      );


    document.getElementById(
      "customerDetailMeta"
    ).textContent =
      `${customer.customer_code} • ${formatDetailLabel(
        customer.customer_type
      )}`;


    setDetailStatusChip(
      document.getElementById(
        "customerDetailStatus"
      ),
      customer.status
    );


    document.getElementById(
      "customerInfoCode"
    ).textContent =
      customer.customer_code;


    document.getElementById(
      "customerInfoType"
    ).textContent =
      formatDetailLabel(
        customer.customer_type
      );


    document.getElementById(
      "customerInfoEmail"
    ).textContent =
      customer.email || "—";


    document.getElementById(
      "customerInfoPhone"
    ).textContent =
      customer.phone || "—";


    document.getElementById(
      "customerInfoIdentifier"
    ).textContent =
      customer.identifier || "—";


    document.getElementById(
      "customerInfoAddress"
    ).textContent =
      customer.address || "—";


    document.getElementById(
      "customerInfoNotes"
    ).textContent =
      customer.notes ||
      "No notes added.";

  }



  function renderCustomerSummary(
    requests
  ) {

    const totalDue =
      requests.reduce(
        (
          total,
          request
        ) =>
          total +
          Number(
            request.amount_due ||
            0
          ),
        0
      );


    const totalPaid =
      requests.reduce(
        (
          total,
          request
        ) =>
          total +
          Number(
            request.total_paid ||
            0
          ),
        0
      );


    const outstanding =
      requests.reduce(
        (
          total,
          request
        ) =>
          total +
          Number(
            request.outstanding_balance ||
            0
          ),
        0
      );


    const activeRequests =
      requests.filter(
        request =>
          ![
            "paid",
            "cancelled"
          ].includes(
            request.status
          )
      ).length;


    document.getElementById(
      "customerTotalDue"
    ).textContent =
      formatDetailNaira(
        totalDue
      );


    document.getElementById(
      "customerTotalPaid"
    ).textContent =
      formatDetailNaira(
        totalPaid
      );


    document.getElementById(
      "customerOutstanding"
    ).textContent =
      formatDetailNaira(
        outstanding
      );


    document.getElementById(
      "customerActiveRequests"
    ).textContent =
      String(
        activeRequests
      );

  }



  function buildRequestRow(
    request,
    compact = false
  ) {

    const row =
      document.createElement(
        "tr"
      );


    row.classList.add(
      "clickable-row"
    );


    row.addEventListener(
      "click",
      () => {

        window.location.href =
          `payment-request-details.html?id=${encodeURIComponent(
            request.id
          )}`;

      }
    );


    row.appendChild(
      createTextCell(
        request.request_number
      )
    );


    if (!compact) {

      row.appendChild(
        createTextCell(
          request.external_business_reference ||
          "—"
        )
      );

    }


    row.appendChild(
      createTextCell(
        request.purpose
      )
    );


    row.appendChild(
      createTextCell(
        formatDetailNaira(
          request.amount_due
        ),
        "currency"
      )
    );


    row.appendChild(
      createTextCell(
        formatDetailNaira(
          request.total_paid
        ),
        "currency paid-value"
      )
    );


    row.appendChild(
      createTextCell(
        formatDetailNaira(
          request.outstanding_balance
        ),
        "currency"
      )
    );


    if (!compact) {

      row.appendChild(
        createTextCell(
          formatDetailDate(
            request.due_date
          )
        )
      );

    }


    const statusCell =
      document.createElement(
        "td"
      );


    const status =
      document.createElement(
        "span"
      );


    status.className =
      "status-chip";


    setDetailStatusChip(
      status,
      request.status
    );


    statusCell.appendChild(
      status
    );


    row.appendChild(
      statusCell
    );


    return row;

  }



  function renderCustomerRequests(
    requests
  ) {

    const body =
      document.getElementById(
        "customerRequestsBody"
      );


    const empty =
      document.getElementById(
        "customerRequestsEmpty"
      );


    body.replaceChildren();


    requests.forEach(
      request => {

        body.appendChild(
          buildRequestRow(
            request,
            false
          )
        );

      }
    );


    empty.hidden =
      requests.length !== 0;


    const overviewBody =
      document.getElementById(
        "customerOverviewRequestsBody"
      );


    const overviewEmpty =
      document.getElementById(
        "customerOverviewRequestsEmpty"
      );


    overviewBody.replaceChildren();


    requests
      .slice(
        0,
        3
      )
      .forEach(
        request => {

          overviewBody.appendChild(
            buildRequestRow(
              request,
              true
            )
          );

        }
      );


    overviewEmpty.hidden =
      requests.length !== 0;

  }



  function renderCustomerPayments(
    transactions
  ) {

    const body =
      document.getElementById(
        "customerPaymentsBody"
      );


    const empty =
      document.getElementById(
        "customerPaymentsEmpty"
      );


    body.replaceChildren();


    transactions.forEach(
      transaction => {

        const row =
          document.createElement(
            "tr"
          );


        row.classList.add(
          "clickable-row"
        );


        row.addEventListener(
          "click",
          () => {

            window.location.href =
              `transaction-details.html?id=${encodeURIComponent(
                transaction.id
              )}`;

          }
        );


        row.append(
          createTextCell(
            transaction.transaction_number
          ),

          createTextCell(
            formatDetailDate(
              transaction.payment_date
            )
          ),

          createTextCell(
            formatDetailNaira(
              transaction.amount
            ),
            "currency paid-value"
          ),

          createTextCell(
            formatDetailLabel(
              transaction.payment_method
            )
          ),

          createTextCell(
            transaction.external_reference ||
            "—"
          )
        );


        const statusCell =
          document.createElement(
            "td"
          );


        const status =
          document.createElement(
            "span"
          );


        status.className =
          "status-chip";


        setDetailStatusChip(
          status,
          transaction.reconciliation_status
        );


        statusCell.appendChild(
          status
        );


        row.appendChild(
          statusCell
        );


        body.appendChild(
          row
        );

      }
    );


    empty.hidden =
      transactions.length !== 0;

  }



  function renderCustomerReceipts(
    receipts,
    transactions
  ) {

    const body =
      document.getElementById(
        "customerReceiptsBody"
      );


    const empty =
      document.getElementById(
        "customerReceiptsEmpty"
      );


    body.replaceChildren();


    receipts.forEach(
      receipt => {

        const transaction =
          transactions.find(
            item =>
              item.id ===
              receipt.transaction_id
          );


        const row =
          document.createElement(
            "tr"
          );


        row.append(
          createTextCell(
            receipt.receipt_number
          ),

          createTextCell(
            transaction
              ?.transaction_number ||
            "—"
          ),

          createTextCell(
            formatDetailNaira(
              transaction?.amount
            ),
            "currency paid-value"
          ),

          createTextCell(
            formatDetailDate(
              transaction
                ?.payment_date
            )
          ),

          createTextCell(
            formatDetailDateTime(
              receipt.generated_at
            )
          )
        );


        body.appendChild(
          row
        );

      }
    );


    empty.hidden =
      receipts.length !== 0;

  }



  loadCustomerDetails();

}



        /* ==================================================
        CUSTOMER DETAIL TABS
        ================================================== */

        const detailTabs =
        document.querySelectorAll(
            ".detail-tab"
        );

        const detailPanels =
        document.querySelectorAll(
            ".detail-tab-panel"
        );


        detailTabs.forEach((tab) => {

        tab.addEventListener(
            "click",
            () => {

            const target =
                tab.dataset.tab;


            detailTabs.forEach(
                (currentTab) => {

                currentTab.classList.remove(
                    "active"
                );

                }
            );


            detailPanels.forEach(
                (panel) => {

                panel.classList.remove(
                    "active"
                );

                }
            );


            tab.classList.add(
                "active"
            );


            const targetPanel =
                document.querySelector(
                `[data-panel="${target}"]`
                );


            if (targetPanel) {

                targetPanel.classList.add(
                "active"
                );

            }

            }
        );

        });
      

/* ==================================================
   PAYMENT REQUEST DETAIL — SUPABASE MVP
================================================== */
const requestDetailRoot=document.getElementById("requestDetailNumber");
if(requestDetailRoot){
  const requestId=new URLSearchParams(location.search).get("id");
  let currentRequest=null;
  let currentTransactions=[];

  async function loadRequestDetail(){
    if(!requestId){ alert("No payment request selected."); location.href="payment-requests.html"; return; }
    const {data,error}=await supabaseClient.from("payment_requests").select(`
      id, organisation_id, customer_id, request_number, business_reference_type,
      external_business_reference, purpose, description, amount_due, total_paid,
      outstanding_balance, due_date, status, created_at,
      customers(id,name,customer_code,customer_type)
    `).eq("id",requestId).maybeSingle();
    if(error||!data){console.error(error);alert("Unable to load this payment request.");return;}
    currentRequest=data;
    const {data:tx,error:txErr}=await supabaseClient.from("transactions").select(`
      id, transaction_number, amount, payment_date, payment_method, external_reference,
      reconciliation_status, notes, created_at
    `).eq("payment_request_id",requestId).order("payment_date",{ascending:false});
    if(txErr) console.error(txErr);
    currentTransactions=tx||[];
    renderRequestDetail();
  }

  function renderRequestDetail(){
    const r=currentRequest;
    document.title=`${r.request_number} | PayTrack SME`;
    const byId=(id)=>document.getElementById(id);
    byId("requestBreadcrumbNumber").textContent=r.request_number;
    byId("requestDetailNumber").textContent=r.request_number;
    byId("requestDetailPurpose").textContent=r.purpose;
    setStatus(byId("requestStatus"),r.status); setStatus(byId("requestInfoStatus"),r.status);
    byId("requestAmountDue").textContent=money(r.amount_due);
    byId("requestTotalPaid").textContent=money(r.total_paid);
    byId("requestOutstanding").textContent=money(r.outstanding_balance);
    byId("requestDueDate").textContent=dateOnly(r.due_date);
    const pct=Number(r.amount_due)>0?Math.min(100,(Number(r.total_paid)/Number(r.amount_due))*100):0;
    byId("requestProgressPercentage").textContent=`${pct.toFixed(1)}%`;
    byId("requestProgressFill").style.width=`${pct}%`;
    byId("requestPaidSummary").textContent=`${money(r.total_paid)} paid`;
    byId("requestOutstandingSummary").textContent=`${money(r.outstanding_balance)} remaining`;
    byId("requestInfoCustomer").textContent=r.customers?.name||"—";
    byId("requestInfoCustomer").href=`customer-details.html?id=${encodeURIComponent(r.customer_id)}`;
    byId("requestInfoPurpose").textContent=r.purpose;
    byId("requestInfoBusinessReference").textContent=r.external_business_reference||"—";
    byId("requestInfoReferenceType").textContent=r.business_reference_type||"—";
    byId("requestInfoCreated").textContent=dateTime(r.created_at);
    byId("requestInfoDueDate").textContent=dateOnly(r.due_date);
    byId("requestNotes").textContent=r.description||"No additional notes were recorded for this request.";
    byId("modalCustomerName").textContent=r.customers?.name||"—";
    byId("modalOutstandingAmount").textContent=money(r.outstanding_balance);
    byId("recordPaymentModalText").textContent=`Record a payment received for ${r.request_number}.`;
    const recordBtn=byId("recordPaymentButton");
    recordBtn.disabled = Number(r.outstanding_balance)<=0 || ["paid","cancelled"].includes(r.status);
    recordBtn.textContent = recordBtn.disabled ? "Fully Paid" : "+ Record Payment";

    const body=byId("requestPaymentHistoryBody"); body.replaceChildren();
    currentTransactions.forEach(t=>{
      const row=document.createElement("tr"); row.className="clickable-row";
      row.addEventListener("click",()=>location.href=`transaction-details.html?id=${encodeURIComponent(t.id)}`);
      row.append(td(t.transaction_number),td(dateOnly(t.payment_date)),td(money(t.amount),"currency paid-value"),td(label(t.payment_method)),td(t.external_reference||"—"));
      const s=td(""); const chip=document.createElement("span"); setStatus(chip,t.reconciliation_status); s.appendChild(chip); row.appendChild(s); body.appendChild(row);
    });
    if(!currentTransactions.length){ const row=document.createElement("tr"); const c=td("No payments have been recorded against this request."); c.colSpan=6; row.appendChild(c); body.appendChild(row); }
  }

  const modal=document.getElementById("recordPaymentModalBackdrop");
  const open=()=>{ document.getElementById("modalOutstandingAmount").textContent=money(currentRequest.outstanding_balance); const d=document.getElementById("paymentDate"); if(!d.value)d.value=new Date().toISOString().slice(0,10); modal.hidden=false; document.body.style.overflow="hidden"; };
  const close=()=>{ modal.hidden=true; document.body.style.overflow=""; };
  document.getElementById("recordPaymentButton")?.addEventListener("click",open);
  document.getElementById("closeRecordPaymentModal")?.addEventListener("click",close);
  document.getElementById("cancelRecordPaymentModal")?.addEventListener("click",close);
  modal?.addEventListener("click",e=>{if(e.target===modal)close();});

  document.getElementById("recordPaymentForm")?.addEventListener("submit",async e=>{
    e.preventDefault();
    const amount=Number(document.getElementById("paymentAmount").value);
    const paymentDate=document.getElementById("paymentDate").value;
    const paymentMethod=document.getElementById("paymentMethod").value;
    const externalReference=document.getElementById("paymentExternalReference").value.trim()||null;
    const notes=document.getElementById("paymentNotes").value.trim()||null;
    const outstanding=Number(currentRequest.outstanding_balance);
    document.getElementById("paymentAmountError").textContent=""; document.getElementById("paymentDateError").textContent=""; document.getElementById("paymentMethodError").textContent="";
    if(!amount||amount<=0){document.getElementById("paymentAmountError").textContent="Payment amount must be greater than zero.";return;}
    if(amount>outstanding){document.getElementById("paymentAmountError").textContent=`Payment cannot exceed ${money(outstanding)}.`;return;}
    if(!paymentDate){document.getElementById("paymentDateError").textContent="Select the payment date.";return;}
    if(!paymentMethod){document.getElementById("paymentMethodError").textContent="Select a payment method.";return;}
    const saveBtn=document.getElementById("saveRecordedPaymentButton"); saveBtn.disabled=true; saveBtn.textContent="Saving...";
    try{
      const {data:{user}}=await supabaseClient.auth.getUser();
      const transactionNumber=await nextNumber("transactions","transaction_number","TXN-2026-",currentRequest.organisation_id,5);
      const transactionPayload={organisation_id:currentRequest.organisation_id,customer_id:currentRequest.customer_id,payment_request_id:currentRequest.id,transaction_number:transactionNumber,amount,payment_date:paymentDate,payment_method:paymentMethod,external_reference:externalReference,reconciliation_status:"needs_review",notes};
      const {data:inserted,error:insertError}=await supabaseClient.from("transactions").insert(transactionPayload).select("id").single();
      if(insertError) throw insertError;
      const newTotal=Number(currentRequest.total_paid)+amount;
      const newOutstanding=Math.max(Number(currentRequest.amount_due)-newTotal,0);
      const today=new Date().toISOString().slice(0,10);
      let newStatus="pending";
      if(newOutstanding===0)newStatus="paid";
      else if(newTotal>0)newStatus="partially_paid";
      else if(currentRequest.due_date && currentRequest.due_date<today)newStatus="overdue";
      const {error:updateError}=await supabaseClient.from("payment_requests").update({total_paid:newTotal,outstanding_balance:newOutstanding,status:newStatus}).eq("id",currentRequest.id);
      if(updateError) throw updateError;
      await generateReceipt(currentRequest.organisation_id,inserted.id,user?.id||null);
      document.getElementById("recordPaymentForm").reset(); close();
      const toast=document.getElementById("recordPaymentToast"); if(toast){toast.hidden=false;setTimeout(()=>toast.hidden=true,2500);}
      await loadRequestDetail();
    }catch(err){console.error(err);document.getElementById("paymentAmountError").textContent=err.message||"Unable to record payment.";}
    finally{saveBtn.disabled=false;saveBtn.textContent="Record Payment";}
  });
  const editRequestBackdrop=document.getElementById("editPaymentRequestModalBackdrop");
  const editRequestForm=document.getElementById("editPaymentRequestForm");
  function openEditRequestModal(){
    if(!currentRequest||!editRequestBackdrop)return;
    document.getElementById("editRequestPurpose").value=currentRequest.purpose||"";
    document.getElementById("editRequestDueDate").value=currentRequest.due_date||"";
    document.getElementById("editBusinessReferenceType").value=currentRequest.business_reference_type||"Other";
    document.getElementById("editBusinessReference").value=currentRequest.external_business_reference||"";
    document.getElementById("editRequestDescription").value=currentRequest.description||"";
    const err=document.getElementById("editPaymentRequestError"); if(err){err.hidden=true;err.textContent="";}
    editRequestBackdrop.hidden=false;document.body.style.overflow="hidden";
  }
  function closeEditRequestModal(){if(editRequestBackdrop){editRequestBackdrop.hidden=true;document.body.style.overflow="";}}
  document.getElementById("editPaymentRequestButton")?.addEventListener("click",openEditRequestModal);
  document.getElementById("closeEditPaymentRequestModal")?.addEventListener("click",closeEditRequestModal);
  document.getElementById("cancelEditPaymentRequestModal")?.addEventListener("click",closeEditRequestModal);
  editRequestBackdrop?.addEventListener("click",e=>{if(e.target===editRequestBackdrop)closeEditRequestModal();});
  editRequestForm?.addEventListener("submit",async e=>{
    e.preventDefault(); if(!currentRequest)return;
    const purpose=document.getElementById("editRequestPurpose").value.trim();
    const dueDate=document.getElementById("editRequestDueDate").value;
    const referenceType=document.getElementById("editBusinessReferenceType").value;
    const reference=document.getElementById("editBusinessReference").value.trim();
    const description=document.getElementById("editRequestDescription").value.trim()||null;
    const err=document.getElementById("editPaymentRequestError");
    if(!purpose||!dueDate||!referenceType||!reference){if(err){err.textContent="Complete all required fields.";err.hidden=false;}return;}
    const btn=document.getElementById("saveEditPaymentRequestButton"); if(btn){btn.disabled=true;btn.textContent="Saving...";}
    try{
      const {error}=await supabaseClient.from("payment_requests").update({purpose,due_date:dueDate,business_reference_type:referenceType,external_business_reference:reference,description}).eq("id",currentRequest.id);
      if(error)throw error; closeEditRequestModal(); await loadRequestDetail();
    }catch(error){console.error(error);if(err){err.textContent=error.message||"Unable to update request.";err.hidden=false;}}
    finally{if(btn){btn.disabled=false;btn.textContent="Save Changes";}}
  });
  await loadRequestDetail();
}

/* ==================================================
   TRANSACTIONS — SUPABASE MVP
================================================== */
const txBody=document.getElementById("transactionsTableBody");
if(txBody){
  const orgSelect=document.getElementById("organisationSelect"); let allTx=[]; let activeOrg=null; let orgs=[];
  const init=await memberships(orgSelect); orgs=init.list; activeOrg=init.active;
  async function loadTx(){
    if(!activeOrg)return;
    const {data,error}=await supabaseClient.from("transactions").select(`id,organisation_id,customer_id,payment_request_id,transaction_number,amount,payment_date,payment_method,external_reference,reconciliation_status,created_at,customers(id,name,customer_type),payment_requests(id,request_number,purpose)`).eq("organisation_id",activeOrg.id).order("payment_date",{ascending:false});
    if(error){console.error(error);return;} allTx=data||[]; renderTx();
  }
  function renderTx(){
    const q=(document.getElementById("transactionSearch")?.value||"").toLowerCase().trim();
    const method=document.getElementById("transactionMethodFilter")?.value||"all";
    const status=document.getElementById("transactionStatusFilter")?.value||"all";
    const rows=allTx.filter(t=>[t.transaction_number,t.customers?.name,t.payment_requests?.request_number,t.external_reference,label(t.payment_method)].filter(Boolean).join(" ").toLowerCase().includes(q) && (method==="all"||t.payment_method===method) && (status==="all"||t.reconciliation_status===status));
    txBody.replaceChildren(); rows.forEach(t=>{
      const row=document.createElement("tr");row.className="transaction-row clickable-row";row.addEventListener("click",e=>{if(!e.target.closest(".row-menu-button"))location.href=`transaction-details.html?id=${encodeURIComponent(t.id)}`;});
      const a=td("");a.innerHTML=`<div class="transaction-id-cell"><strong></strong><span></span></div>`;a.querySelector("strong").textContent=t.transaction_number;a.querySelector("span").textContent=`Recorded ${dateOnly(t.payment_date)}`;
      const c=td("");c.innerHTML=`<div class="customer-cell"><div class="customer-avatar"></div><div><strong></strong><span></span></div></div>`;c.querySelector(".customer-avatar").textContent=initials(t.customers?.name);if(t.customers?.customer_type==="business")c.querySelector(".customer-avatar").classList.add("business-avatar");c.querySelector("strong").textContent=t.customers?.name||"Unidentified Payment";c.querySelector("span").textContent=t.customers?label(t.customers.customer_type):"Customer not matched";
      const r=td(""); if(t.payment_requests){r.innerHTML=`<div class="linked-record-cell"><strong></strong><span></span></div>`;r.querySelector("strong").textContent=t.payment_requests.request_number;r.querySelector("span").textContent=t.payment_requests.purpose;} else r.textContent="—";
      row.append(a,c,r,td(money(t.amount),"currency paid-value"),td(dateOnly(t.payment_date)),td(label(t.payment_method)),td(t.external_reference||"—"));
      const sc=td("");const chip=document.createElement("span");setStatus(chip,t.reconciliation_status);sc.appendChild(chip);row.appendChild(sc);const ac=td("");ac.innerHTML='<button class="row-menu-button">•••</button>';row.appendChild(ac);txBody.appendChild(row);
    });
    document.getElementById("transactionCount").textContent=`Showing ${rows.length} ${rows.length===1?"transaction":"transactions"}`;
    document.getElementById("transactionEmptyState").hidden=rows.length!==0;
    document.getElementById("txTotalTransactions").textContent=allTx.length;
    document.getElementById("txTotalReceived").textContent=money(allTx.reduce((s,t)=>s+Number(t.amount||0),0));
    document.getElementById("txReconciled").textContent=allTx.filter(t=>t.reconciliation_status==="reconciled").length;
    document.getElementById("txNeedsReview").textContent=allTx.filter(t=>t.reconciliation_status==="needs_review").length;
    document.getElementById("txUnidentified").textContent=allTx.filter(t=>t.reconciliation_status==="unidentified").length;
  }
  document.getElementById("transactionSearch")?.addEventListener("input",renderTx);document.getElementById("transactionMethodFilter")?.addEventListener("change",renderTx);document.getElementById("transactionStatusFilter")?.addEventListener("change",renderTx);
  orgSelect?.addEventListener("change",async()=>{activeOrg=orgs.find(x=>x.organisations.id===orgSelect.value)?.organisations;await loadTx();}); await loadTx();
}

/* ==================================================
   TRANSACTION DETAIL — SUPABASE MVP
================================================== */
const txDetailNumber=document.getElementById("transactionDetailNumber");
if(txDetailNumber){
  const txId=new URLSearchParams(location.search).get("id"); let tx=null; let receipt=null;
  async function loadTxDetail(){
    const {data,error}=await supabaseClient.from("transactions").select(`id,organisation_id,customer_id,payment_request_id,transaction_number,amount,payment_date,payment_method,external_reference,reconciliation_status,notes,created_at,customers(id,name,customer_code,customer_type),payment_requests(id,request_number,purpose)`).eq("id",txId).maybeSingle();
    if(error||!data){console.error(error);alert("Unable to load transaction.");return;} tx=data;
    const {data:rec}=await supabaseClient.from("receipts").select("id,receipt_number,generated_at").eq("transaction_id",tx.id).maybeSingle(); receipt=rec||null; renderTxDetail();
  }
  function renderTxDetail(){
    document.title=`${tx.transaction_number} | PayTrack SME`;
    const b=id=>document.getElementById(id);
    b("transactionBreadcrumbNumber").textContent=tx.transaction_number;b("transactionDetailNumber").textContent=tx.transaction_number;setStatus(b("transactionReconciliationStatus"),tx.reconciliation_status);b("transactionDetailSubtitle").textContent=`Recorded payment${tx.customers?` from ${tx.customers.name}`:""}`;
    b("transactionAmount").textContent=money(tx.amount);b("transactionMethod").textContent=label(tx.payment_method);b("transactionDate").textContent=dateOnly(tx.payment_date);b("transactionReconciliationSummary").textContent=label(tx.reconciliation_status);b("transactionInfoId").textContent=tx.transaction_number;b("transactionInfoAmount").textContent=money(tx.amount);b("transactionInfoMethod").textContent=label(tx.payment_method);b("transactionInfoDate").textContent=dateOnly(tx.payment_date);b("transactionInfoExternalReference").textContent=tx.external_reference||"—";b("transactionInfoRecordedOn").textContent=dateTime(tx.created_at);setStatus(b("transactionInfoReconciliationStatus"),tx.reconciliation_status);b("transactionNotes").textContent=tx.notes||"No additional notes were recorded.";
    b("linkedCustomerName").textContent=tx.customers?.name||"Unidentified Payment";b("linkedCustomerCode").textContent=tx.customers?.customer_code||"Not matched";if(tx.customer_id){b("linkedCustomerCard").href=`customer-details.html?id=${encodeURIComponent(tx.customer_id)}`;}else{b("linkedCustomerCard").removeAttribute("href");b("linkedCustomerCard").style.pointerEvents="none";}
    b("linkedRequestNumber").textContent=tx.payment_requests?.request_number||"No linked request";b("linkedRequestPurpose").textContent=tx.payment_requests?.purpose||"—";if(tx.payment_request_id){b("linkedRequestCard").href=`payment-request-details.html?id=${encodeURIComponent(tx.payment_request_id)}`;}else{b("linkedRequestCard").removeAttribute("href");b("linkedRequestCard").style.pointerEvents="none";}
    b("transactionSideReference").textContent=tx.external_reference||"—";b("transactionSideCustomer").textContent=tx.customers?.name||"Unidentified";b("transactionSideRequest").textContent=tx.payment_requests?.request_number||"—";b("transactionSideReceipt").textContent=receipt?.receipt_number||"—";
    const rb=b("reconcileTransactionButton"); if(tx.reconciliation_status==="reconciled"){rb.disabled=true;rb.textContent="Reconciled";} else {rb.disabled=false;rb.textContent="Reconcile";}
  }
  const modal=document.getElementById("reconciliationModalBackdrop");const open=()=>{document.getElementById("verificationDate").value ||= new Date().toISOString().slice(0,10);modal.hidden=false;};const close=()=>modal.hidden=true;
  document.getElementById("reconcileTransactionButton")?.addEventListener("click",open);document.getElementById("closeReconciliationModal")?.addEventListener("click",close);document.getElementById("cancelReconciliationModal")?.addEventListener("click",close);
  document.getElementById("reconciliationForm")?.addEventListener("submit",async e=>{e.preventDefault();const rawMethod=document.getElementById("verificationMethod").value,date=document.getElementById("verificationDate").value;const verificationMethodMap={"Bank Statement":"bank_statement","Bank Alert":"bank_alert","POS Record":"pos_record","Cash Record":"cash_record","Other Verified Evidence":"other_verified_evidence"};const method=verificationMethodMap[rawMethod]||rawMethod;if(!method||!date){alert("Select a verification method and date.");return;}try{const ref=document.getElementById("verificationReference").value.trim()||null;const notes=document.getElementById("reconciliationNotes").value.trim()||null;const payload={organisation_id:tx.organisation_id,transaction_id:tx.id,verification_method:method,verification_date:date,verification_reference:ref,notes};const {error}=await supabaseClient.from("reconciliations").insert(payload);if(error)throw error;const {error:u}=await supabaseClient.from("transactions").update({reconciliation_status:"reconciled"}).eq("id",tx.id);if(u)throw u;close();await loadTxDetail();const toast=document.getElementById("reconciliationToast");if(toast){toast.hidden=false;setTimeout(()=>toast.hidden=true,2500);}}catch(err){console.error(err);alert(err.message||"Unable to reconcile transaction.");}});
  document.getElementById("viewReceiptButton")?.addEventListener("click",async()=>{ if(!receipt && tx){try{const {data:{user}}=await supabaseClient.auth.getUser();await generateReceipt(tx.organisation_id,tx.id,user?.id||null);const {data:rec}=await supabaseClient.from("receipts").select("id,receipt_number,generated_at").eq("transaction_id",tx.id).maybeSingle();receipt=rec||null;}catch(e){console.error(e);}} if(!receipt){alert("No receipt is available for this transaction.");return;} openReceiptPreview({tx,receipt,workspace:workspaceState}); });
  await loadTxDetail();
}

/* ==================================================
   RECONCILIATION LIST — SUPABASE MVP
================================================== */
const reconBody=document.getElementById("reconciliationTableBody");
if(reconBody){
  const orgSelect=document.getElementById("organisationSelect");let records=[],activeOrg=null,orgs=[];const init=await memberships(orgSelect);activeOrg=init.active;orgs=init.list;
  async function loadRecon(){const {data,error}=await supabaseClient.from("transactions").select(`id,transaction_number,amount,payment_date,payment_method,external_reference,reconciliation_status,created_at,customers(id,name,customer_type),payment_requests(id,request_number,purpose)`).eq("organisation_id",activeOrg.id).order("payment_date",{ascending:false});if(error){console.error(error);return;}records=data||[];renderRecon();}
  function renderRecon(){const q=(document.getElementById("reconciliationSearch")?.value||"").toLowerCase().trim(),status=document.getElementById("reconciliationStatusFilter")?.value||"all";const filtered=records.filter(t=>[t.transaction_number,t.customers?.name,t.payment_requests?.request_number,t.external_reference,label(t.payment_method)].filter(Boolean).join(" ").toLowerCase().includes(q)&&(status==="all"||t.reconciliation_status===status));reconBody.replaceChildren();filtered.forEach(t=>{const row=document.createElement("tr");row.className="reconciliation-row";row.append(td(t.transaction_number),td(t.customers?.name||"Unidentified Payment"),td(t.payment_requests?.request_number||"—"),td(money(t.amount),"currency paid-value"),td(t.external_reference||"—"),td(label(t.payment_method)),td(dateOnly(t.payment_date)));const sc=td("");const chip=document.createElement("span");setStatus(chip,t.reconciliation_status);sc.appendChild(chip);row.appendChild(sc);const ac=td("");const btn=document.createElement("button");btn.className="review-button";btn.textContent=t.reconciliation_status==="reconciled"?"Reconciled":"Review";btn.disabled=t.reconciliation_status==="reconciled";btn.addEventListener("click",()=>location.href=`transaction-details.html?id=${encodeURIComponent(t.id)}`);ac.appendChild(btn);row.appendChild(ac);reconBody.appendChild(row);});document.getElementById("reconciliationCount").textContent=`Showing ${filtered.length} ${filtered.length===1?"payment record":"payment records"}`;document.getElementById("reconciliationEmptyState").hidden=filtered.length!==0;document.getElementById("reconRecorded").textContent=records.length;document.getElementById("reconReconciled").textContent=records.filter(x=>x.reconciliation_status==="reconciled").length;document.getElementById("reconNeedsReview").textContent=records.filter(x=>x.reconciliation_status==="needs_review").length;document.getElementById("reconUnidentified").textContent=records.filter(x=>x.reconciliation_status==="unidentified").length;}
  document.getElementById("reconciliationSearch")?.addEventListener("input",renderRecon);document.getElementById("reconciliationStatusFilter")?.addEventListener("change",renderRecon);orgSelect?.addEventListener("change",async()=>{activeOrg=orgs.find(x=>x.organisations.id===orgSelect.value)?.organisations;await loadRecon();});await loadRecon();
}

/* ==================================================
   DASHBOARD — SUPABASE MVP
================================================== */
const dashboardRecent=document.getElementById("dashboardRecentTransactions");
if(dashboardRecent){
  const orgSelect=document.getElementById("organisationSelect");let activeOrg=(await memberships(orgSelect)).active;
  async function loadDashboard(){
    const [{data:reqs},{data:txs}]=await Promise.all([
      supabaseClient.from("payment_requests").select("id,request_number,customer_id,purpose,total_paid,outstanding_balance,status,customers(name)").eq("organisation_id",activeOrg.id),
      supabaseClient.from("transactions").select("id,transaction_number,amount,payment_date,payment_method,reconciliation_status,customer_id,payment_request_id,customers(name),payment_requests(request_number)").eq("organisation_id",activeOrg.id).order("payment_date",{ascending:false})
    ]);
    const r=reqs||[],t=txs||[];document.getElementById("dashTotalReceived").textContent=money(t.reduce((s,x)=>s+Number(x.amount||0),0));document.getElementById("dashReceivedNote").textContent=`${t.length} recorded ${t.length===1?"payment":"payments"}`;document.getElementById("dashOutstanding").textContent=money(r.reduce((s,x)=>s+Number(x.outstanding_balance||0),0));const active=r.filter(x=>!["paid","cancelled"].includes(x.status));document.getElementById("dashOutstandingNote").textContent=`Across ${active.length} active ${active.length===1?"request":"requests"}`;document.getElementById("dashPending").textContent=r.filter(x=>x.status==="pending").length;document.getElementById("dashPartial").textContent=r.filter(x=>x.status==="partially_paid").length;document.getElementById("dashOverdue").textContent=r.filter(x=>x.status==="overdue").length;
    const attention=t.filter(x=>["needs_review","unidentified"].includes(x.reconciliation_status));document.getElementById("dashboardAttentionCount").textContent=attention.length;const al=document.getElementById("dashboardAttentionList");al.replaceChildren();attention.slice(0,4).forEach(x=>{const btn=document.createElement("button");btn.className="attention-item";btn.innerHTML='<div class="attention-icon">!</div><div class="attention-content"><strong></strong><span></span><small></small></div><span class="attention-arrow">→</span>';btn.querySelector("strong").textContent=x.reconciliation_status==="unidentified"?"Unidentified payment":"Reconciliation required";btn.querySelector("span:not(.attention-arrow)").textContent=x.transaction_number;btn.querySelector("small").textContent=`${x.customers?.name||"Unidentified"} · ${money(x.amount)}`;btn.addEventListener("click",()=>location.href=`transaction-details.html?id=${encodeURIComponent(x.id)}`);al.appendChild(btn);});
    dashboardRecent.replaceChildren();t.slice(0,5).forEach(x=>{const row=document.createElement("tr");row.className="clickable-row";row.addEventListener("click",()=>location.href=`transaction-details.html?id=${encodeURIComponent(x.id)}`);row.append(td(x.transaction_number),td(x.customers?.name||"Unidentified"),td(x.payment_requests?.request_number||"—"),td(money(x.amount),"currency"),td(dateOnly(x.payment_date)),td(label(x.payment_method)));const s=td("");const chip=document.createElement("span");setStatus(chip,x.reconciliation_status);s.appendChild(chip);row.appendChild(s);dashboardRecent.appendChild(row);});
  }
  await loadDashboard();
}

/* ==================================================
   REPORTS — SUPABASE MVP
================================================== */
const reportTableBody=document.getElementById("reportTableBody");
if(reportTableBody){
  const orgSelect=document.getElementById("organisationSelect");let activeOrg=(await memberships(orgSelect)).active;let reqs=[],txs=[];
  async function loadReports(){const [rq,tr]=await Promise.all([supabaseClient.from("payment_requests").select("id,request_number,amount_due,total_paid,outstanding_balance,status,due_date,created_at,customers(name)").eq("organisation_id",activeOrg.id),supabaseClient.from("transactions").select("id,transaction_number,amount,payment_date,reconciliation_status").eq("organisation_id",activeOrg.id)]);reqs=rq.data||[];txs=tr.data||[];renderReports();}
  function filteredRequests(){const start=document.getElementById("reportStartDate").value,end=document.getElementById("reportEndDate").value,status=document.getElementById("reportStatusFilter").value;return reqs.filter(r=>(!start||String(r.created_at).slice(0,10)>=start)&&(!end||String(r.created_at).slice(0,10)<=end)&&(status==="all"||r.status===status));}
  function filteredTransactions(){const start=document.getElementById("reportStartDate").value,end=document.getElementById("reportEndDate").value;return txs.filter(t=>(!start||t.payment_date>=start)&&(!end||t.payment_date<=end));}
  function renderReports(){const r=filteredRequests(),t=filteredTransactions();document.getElementById("reportTotalReceived").textContent=money(t.reduce((s,x)=>s+Number(x.amount||0),0));document.getElementById("reportReceivedNote").textContent=`Across ${t.length} recorded ${t.length===1?"transaction":"transactions"}`;document.getElementById("reportOutstanding").textContent=money(r.reduce((s,x)=>s+Number(x.outstanding_balance||0),0));document.getElementById("reportRequestCount").textContent=r.length;document.getElementById("reportReconciledCount").textContent=t.filter(x=>x.reconciliation_status==="reconciled").length;
    const counts={pending:0,partially_paid:0,paid:0,overdue:0};r.forEach(x=>{if(x.status in counts)counts[x.status]++;});document.getElementById("reportStatusPending").textContent=counts.pending;document.getElementById("reportStatusPartial").textContent=counts.partially_paid;document.getElementById("reportStatusPaid").textContent=counts.paid;document.getElementById("reportStatusOverdue").textContent=counts.overdue;
    document.getElementById("reportReconReconciled").textContent=t.filter(x=>x.reconciliation_status==="reconciled").length;document.getElementById("reportReconNeedsReview").textContent=t.filter(x=>x.reconciliation_status==="needs_review").length;document.getElementById("reportReconUnidentified").textContent=t.filter(x=>x.reconciliation_status==="unidentified").length;
    const out=document.getElementById("reportOutstandingList");out.replaceChildren();r.filter(x=>Number(x.outstanding_balance)>0).sort((a,b)=>Number(b.outstanding_balance)-Number(a.outstanding_balance)).slice(0,5).forEach(x=>{const d=document.createElement("div");d.className="outstanding-report-row";d.innerHTML='<div><div class="customer-avatar"></div><div><strong></strong><span></span></div></div><strong></strong>';d.querySelector(".customer-avatar").textContent=initials(x.customers?.name);d.querySelector("div div strong").textContent=x.customers?.name||"—";d.querySelector("span").textContent=x.request_number;d.lastElementChild.textContent=money(x.outstanding_balance);out.appendChild(d);});
    reportTableBody.replaceChildren();r.forEach(x=>{const row=document.createElement("tr");row.append(td(x.request_number),td(x.customers?.name||"—"),td(money(x.amount_due),"currency"),td(money(x.total_paid),"currency paid-value"),td(money(x.outstanding_balance),"currency"));const s=td("");const chip=document.createElement("span");setStatus(chip,x.status);s.appendChild(chip);row.appendChild(s);reportTableBody.appendChild(row);});
  }
  const toast=(title,text)=>{document.getElementById("reportToastTitle").textContent=title;document.getElementById("reportToastText").textContent=text;const x=document.getElementById("reportToast");x.hidden=false;setTimeout(()=>x.hidden=true,2200);};
  document.getElementById("applyReportFilters")?.addEventListener("click",()=>{const s=document.getElementById("reportStartDate").value,e=document.getElementById("reportEndDate").value;if(s&&e&&s>e){toast("Invalid date range","The start date cannot be later than the end date.");return;}renderReports();toast("Report updated","The selected report filters have been applied.");});
  document.getElementById("exportCsvButton")?.addEventListener("click",()=>{const rows=filteredRequests();const csv=[["Request","Customer","Amount Due","Total Paid","Outstanding","Status"],...rows.map(x=>[x.request_number,x.customers?.name||"",x.amount_due,x.total_paid,x.outstanding_balance,x.status])].map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");const blob=new Blob([csv],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="paytrack-payment-report.csv";a.click();URL.revokeObjectURL(a.href);});
  document.getElementById("exportPdfButton")?.addEventListener("click",async()=>{try{const jsPDF=await ensureJsPdf();const doc=new jsPDF();doc.setFont("helvetica","bold");doc.setFontSize(18);doc.text(`${workspaceState?.workspaceName||"PayTrack SME"} — Payment Report`,14,18);doc.setFont("helvetica","normal");doc.setFontSize(9);doc.text(`Generated ${new Date().toLocaleString("en-GB")}`,14,25);let y=36;filteredRequests().forEach((x,i)=>{if(y>275){doc.addPage();y=18;}doc.setFont("helvetica","bold");doc.setFontSize(10);doc.text(`${x.request_number}  ${x.customers?.name||"—"}`,14,y);doc.setFont("helvetica","normal");doc.setFontSize(9);doc.text(`Due: ${money(x.amount_due)}   Paid: ${money(x.total_paid)}   Outstanding: ${money(x.outstanding_balance)}   Status: ${label(x.status)}`,14,y+6);y+=16;});doc.save("paytrack-payment-report.pdf");toast("PDF exported","Your payment report has been downloaded.");}catch(e){console.error(e);toast("Export failed",e.message||"Unable to create PDF.");}});await loadReports();
}
});
