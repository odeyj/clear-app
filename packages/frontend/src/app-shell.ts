import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { sharedStyles } from './styles/shared-styles.js';
import { StoreController } from './state/store-controller.js';
import { store } from './state/store.js';
import { api } from './services/api-client.js';

// Import all components
import './components/scanner/route-input.js';
import './components/map/route-map.js';
import './components/risk/risk-dashboard.js';
import './components/alternatives/safe-alternatives.js';
import './components/advisory/advisory-sidebar.js';
import './components/anomaly/anomaly-list.js';
import './components/airline/airline-profile.js';
import './components/common/loading-spinner.js';

@customElement('app-shell')
export class AppShell extends LitElement {
  private ctrl = new StoreController(this);
  @state() private selectedRouteIndex = 0;
  private eventSource: EventSource | null = null;

  static styles = [sharedStyles, css`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--color-bg, #1c1c1e);
    }

    /* ── Dark header ── */
    header {
      position: sticky;
      top: 0;
      z-index: 100;
      padding: var(--space-4, 1rem) var(--space-8, 2rem);
      background: var(--color-bg, #1c1c1e);
      border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.08));
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: var(--space-3, 0.75rem);
    }
    .brand-icon {
      width: 32px;
      height: 32px;
      border: 2px solid var(--color-text-secondary, #a1a1a6);
      border-radius: var(--radius-full, 9999px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-sm, 0.8125rem);
    }
    .logo {
      font-size: var(--text-lg, 1.0625rem);
      font-weight: 700;
      letter-spacing: 0.04em;
      color: var(--color-text, #f5f5f7);
    }
    nav {
      display: flex;
      align-items: center;
      gap: var(--space-6, 1.5rem);
    }
    nav button {
      padding: 0;
      border: none;
      background: none;
      font-size: var(--text-sm, 0.8125rem);
      font-weight: 400;
      cursor: pointer;
      color: var(--color-text-secondary, #a1a1a6);
      font-family: inherit;
      transition: color var(--duration-fast, 0.15s) var(--ease-default);
      -webkit-font-smoothing: antialiased;
    }
    nav button.active {
      color: var(--color-text, #f5f5f7);
      font-weight: 500;
    }
    nav button:hover {
      color: var(--color-text, #f5f5f7);
    }
    .nav-sign-in {
      padding: 6px 18px !important;
      border: 1px solid var(--color-border-strong, rgba(255,255,255,0.14)) !important;
      border-radius: var(--radius-full, 9999px) !important;
    }

    /* ── Hero section (shown before scan) ── */
    .hero {
      text-align: center;
      padding: var(--space-16, 4rem) var(--space-8, 2rem) var(--space-12, 3rem);
      max-width: 800px;
      margin: 0 auto;
    }
    .hero-tagline {
      font-size: var(--text-sm, 0.8125rem);
      color: var(--color-text-secondary, #a1a1a6);
      letter-spacing: 0.02em;
      margin-bottom: var(--space-6, 1.5rem);
    }
    .hero h1 {
      font-size: var(--text-5xl, 3.5rem);
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.03em;
      color: var(--color-text, #f5f5f7);
      margin-bottom: var(--space-6, 1.5rem);
    }
    .hero h1 .highlight {
      color: var(--color-accent, #c4a265);
    }
    .hero-desc {
      font-size: var(--text-lg, 1.0625rem);
      color: var(--color-text-secondary, #a1a1a6);
      line-height: 1.6;
      max-width: 620px;
      margin: 0 auto;
    }

    /* ── Stats bar ── */
    .stats-bar {
      display: flex;
      justify-content: center;
      gap: var(--space-12, 3rem);
      padding: var(--space-8, 2rem) var(--space-8, 2rem);
      border-top: 1px solid var(--color-border, rgba(255,255,255,0.08));
      max-width: 900px;
      margin: 0 auto;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: var(--text-2xl, 1.5rem);
      font-weight: 700;
      color: var(--color-text, #f5f5f7);
    }
    .stat-label {
      font-size: var(--text-xs, 0.6875rem);
      color: var(--color-text-muted, #6e6e73);
      margin-top: var(--space-1, 0.25rem);
    }

    /* ── Results layout ── */
    .layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 0;
      max-width: 1440px;
      margin: 0 auto;
    }
    .main {
      min-width: 0;
      padding: var(--space-6, 1.5rem);
    }
    .sidebar {
      background: var(--color-surface, #2c2c2e);
      border-left: 1px solid var(--color-border, rgba(255,255,255,0.08));
      padding: var(--space-6, 1.5rem);
      min-height: calc(100vh - 60px);
    }
    .section {
      margin-bottom: var(--space-6, 1.5rem);
    }
    .map-results-placeholder {
      min-height: 400px;
      height: 400px;
      box-sizing: border-box;
      border: 1px dashed var(--color-border, #e0e0e0);
      border-radius: var(--radius-lg, 8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      text-align: center;
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-muted, #999);
      background: var(--color-surface, #f8f8f8);
    }
    .error {
      padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
      background: rgba(255, 59, 48, 0.12);
      border: 1px solid rgba(255, 59, 48, 0.2);
      border-radius: var(--radius-lg, 12px);
      color: var(--color-risk-high, #ff3b30);
      font-size: var(--text-sm, 0.8125rem);
      font-weight: 500;
    }

    /* ── Results header ── */
    .results-header {
      padding: var(--space-4, 1rem) var(--space-6, 1.5rem);
      border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.08));
      display: flex;
      align-items: center;
      gap: var(--space-4, 1rem);
    }
    .back-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full, 9999px);
      border: 1px solid var(--color-border-strong, rgba(255,255,255,0.14));
      background: transparent;
      color: var(--color-text, #f5f5f7);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-lg, 1.0625rem);
    }
    .results-header-text h2 {
      font-size: var(--text-lg, 1.0625rem);
      font-weight: 700;
    }
    .results-header-meta {
      font-size: var(--text-sm, 0.8125rem);
      color: var(--color-text-secondary, #a1a1a6);
    }

    @media (max-width: 900px) {
      header {
        padding: var(--space-4, 1rem);
      }
      .hero h1 {
        font-size: var(--text-3xl, 2rem);
      }
      .stats-bar {
        flex-wrap: wrap;
        gap: var(--space-6, 1.5rem);
      }
      .layout {
        grid-template-columns: 1fr;
      }
      .sidebar {
        border-left: none;
        border-top: 1px solid var(--color-border, rgba(255,255,255,0.08));
        min-height: auto;
      }
    }
  `];

  connectedCallback() {
    super.connectedCallback();
    this.loadAdvisories();
    this.eventSource = api.subscribeAdvisories((advisories) => {
      store.update({ advisories });
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.eventSource?.close();
  }

  private async loadAdvisories() {
    store.update({ advisoriesLoading: true });
    try {
      const advisories = await api.getAdvisories();
      store.update({ advisories, advisoriesLoading: false });
    } catch {
      store.update({ advisoriesLoading: false });
    }
  }

  private async handleScan(e: CustomEvent<{ origin: string; destination: string }>) {
    const { origin, destination } = e.detail;
    store.update({ scanLoading: true, scanError: null, scanResult: null });
    this.selectedRouteIndex = 0;

    try {
      const result = await api.scanRoute(origin, destination);
      store.update({ scanLoading: false, scanResult: result });

      // Also load anomalies and airline profiles
      const route = `${origin}-${destination}`;
      api.getAnomalies(route).then(anomalies => store.update({ anomalies })).catch(() => {});
      api.getAirlineProfiles(route).then(airlineProfiles => store.update({ airlineProfiles })).catch(() => {});
    } catch (err) {
      store.update({ scanLoading: false, scanError: (err as Error).message });
    }
  }

  private handleItinerarySelect(e: CustomEvent<{ index: number }>) {
    this.selectedRouteIndex = e.detail.index;
  }

  private handleRouteSelect() {
    // Route selected from scan-results sidebar — no-op for now, selection handled via index
  }

  private setView(view: 'scanner' | 'airlines' | 'anomalies') {
    store.update({ activeView: view });
  }

  private handleBackToSearch() {
    store.update({ scanResult: null, scanError: null });
  }

  render() {
    const s = this.ctrl.state;
    const result = s.scanResult;
    const useItineraryAlts = Boolean(result && result.alternatives.length > 0);

    return html`
      <header>
        <div class="brand">
          <div class="brand-icon">&#x25CE;</div>
          <span class="logo">CLEAR</span>
        </div>
        <nav>
          <button class=${s.activeView === 'scanner' ? 'active' : ''} @click=${() => this.setView('scanner')}>How it works</button>
          <button class=${s.activeView === 'airlines' ? 'active' : ''} @click=${() => this.setView('airlines')}>Data</button>
          <button class=${s.activeView === 'anomalies' ? 'active' : ''} @click=${() => this.setView('anomalies')}>Enterprise</button>
          <button class="nav-sign-in">Sign in</button>
        </nav>
      </header>

      ${!result && !s.scanLoading ? html`
        <div class="hero">
          <div class="hero-tagline">Conflict-aware Live Environment for Air Route</div>
          <h1>Know what's above the <span class="highlight">clouds</span> before you book.</h1>
          <p class="hero-desc">CLEAR shows you which flight paths cross active conflict zones, which airlines are rerouting, and which routes are safest right now.</p>
        </div>

        <div style="max-width: 700px; margin: 0 auto; padding: 0 var(--space-8, 2rem) var(--space-12, 3rem);">
          <route-input @scan=${this.handleScan}></route-input>
        </div>

        <div class="stats-bar">
          <div class="stat">
            <div class="stat-value">180+</div>
            <div class="stat-label">Airlines tracked</div>
          </div>
          <div class="stat">
            <div class="stat-value">24 hr</div>
            <div class="stat-label">Conflict data refresh</div>
          </div>
          <div class="stat">
            <div class="stat-value">94</div>
            <div class="stat-label">Active conflict zones</div>
          </div>
          <div class="stat">
            <div class="stat-value">7 day</div>
            <div class="stat-label">Rerouting history</div>
          </div>
        </div>
      ` : ''}

      ${s.scanLoading ? html`
        <div style="text-align:center;padding:var(--space-16, 4rem);">
          <loading-spinner>Analyzing route...</loading-spinner>
        </div>
      ` : ''}
      ${s.scanError ? html`<div class="error" style="max-width:600px;margin:var(--space-8, 2rem) auto;">${s.scanError}</div>` : ''}

      ${result ? html`
        <div class="results-header">
          <button class="back-btn" @click=${this.handleBackToSearch}>&lsaquo;</button>
          <div class="results-header-text">
            <h2>${result.origin.code} &#x2192; ${result.destination.code}</h2>
            <div class="results-header-meta">
              ${result.routes.length} routes found &middot; Analysed against ${result.routes[0]?.nearbyZones?.length ?? 0}+ conflict zones
            </div>
          </div>
        </div>

        <div class="layout">
          <div class="main">
            <div class="section">
              <route-map
                .alternatives=${useItineraryAlts ? result.alternatives : []}
                .routes=${useItineraryAlts ? [] : result.routes}
                .origin=${{ lat: result.origin.lat, lon: result.origin.lon, code: result.origin.code }}
                .destination=${{ lat: result.destination.lat, lon: result.destination.lon, code: result.destination.code }}
                .selectedRouteIndex=${this.selectedRouteIndex}
              ></route-map>
            </div>


            <!-- Itinerary options are the primary content -->
            <div class="section">
              <safe-alternatives
                .alternatives=${result.alternatives}
                .fallbackRoutes=${result.routes}
                .selectedIndex=${this.selectedRouteIndex}
                @itinerary-select=${this.handleItinerarySelect}
              ></safe-alternatives>
            </div>

            <div class="section">
              <risk-dashboard .risk=${result.riskScore}></risk-dashboard>
            </div>

            ${s.activeView === 'airlines' ? html`
              <div class="section">
                <airline-profiles .profiles=${s.airlineProfiles}></airline-profiles>
              </div>
            ` : ''}

            ${s.activeView === 'anomalies' ? html`
              <div class="section">
                <anomaly-list .anomalies=${s.anomalies}></anomaly-list>
              </div>
            ` : ''}
          </div>

          <div class="sidebar">
            <div class="section">
              <scan-results .routes=${result.routes} @route-select=${this.handleRouteSelect}></scan-results>
            </div>
            <advisory-sidebar
              .advisories=${s.advisories}
              .loading=${s.advisoriesLoading}
            ></advisory-sidebar>
          </div>
        </div>
      ` : ''}
    `;
  }
}
