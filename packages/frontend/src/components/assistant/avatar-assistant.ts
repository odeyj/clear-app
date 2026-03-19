import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

// ── Shadow-DOM helpers ──────────────────────────────────────────────────────

function getShell(): ShadowRoot | null {
  return (document.querySelector('app-shell') as any)?.shadowRoot ?? null;
}

function qs(root: ShadowRoot | Element | null | undefined, sel: string): Element | null {
  return (root as Element | null)?.querySelector(sel) ?? null;
}

// ── Step definitions ────────────────────────────────────────────────────────

interface StepDef {
  title: string;
  text: string;
  getTarget?: () => Element | null;
  pad?: number;
}

const STEPS: StepDef[] = [
  {
    title: 'Welcome to FRCS!',
    text: "I'm your Flight Route Conflict Scanner assistant. Follow me — I'll guide you through every feature of the app!",
  },
  {
    title: 'Enter Airports',
    text: 'Type an airport code (e.g. "JFK") or city name here. The autocomplete will suggest matching airports for both origin and destination.',
    getTarget: () => qs(getShell(), 'route-input'),
    pad: 12,
  },
  {
    title: 'Scan Route',
    text: 'After selecting both airports, click Scan Route. The engine checks conflict zones, NOTAMs, and geopolitical risks along the entire flight path.',
    getTarget: () =>
      qs((qs(getShell(), 'route-input') as any)?.shadowRoot, 'button[type="submit"]') ??
      qs(getShell(), 'route-input'),
    pad: 10,
  },
  {
    title: 'Interactive Map',
    text: 'The map renders your route and nearby conflict zones as red circles. Multiple path variants are calculated — click any route to select it and see details.',
    getTarget: () => qs(getShell(), 'route-map') ?? qs(getShell(), '.main'),
    pad: 8,
  },
  {
    title: 'Risk Dashboard',
    text: 'Your overall safety score (0–100) appears here alongside a factor breakdown: conflicts, NOTAMs, flight anomalies, and active advisories.',
    getTarget: () => qs(getShell(), 'risk-dashboard') ?? qs(getShell(), '.main'),
    pad: 8,
  },
  {
    title: 'Safe Alternatives',
    text: 'When risk exceeds the threshold, safer alternatives are listed here with trade-off details: extra distance, extra flight time, and number of waypoints.',
    getTarget: () => qs(getShell(), 'safe-alternatives') ?? qs(getShell(), '.main'),
    pad: 8,
  },
  {
    title: 'Airlines Tab',
    text: 'Switch here to see which carriers operate your route, their average proximity to conflict zones, and individual risk ratings.',
    getTarget: () => (Array.from(getShell()?.querySelectorAll('nav button') ?? []))[1] as Element | null,
    pad: 8,
  },
  {
    title: 'Anomalies Tab',
    text: 'This tab shows unusual deviations detected in historical flight data — a strong signal that pilots are already routing around dangerous airspace.',
    getTarget: () => (Array.from(getShell()?.querySelectorAll('nav button') ?? []))[2] as Element | null,
    pad: 8,
  },
  {
    title: 'Live Advisories',
    text: 'The sidebar streams real-time NOTAMs, airspace closures, and conflict alerts. Color-coded: blue = NOTAM, red = conflict, amber = anomaly, purple = closure.',
    getTarget: () => qs(getShell(), 'advisory-sidebar'),
    pad: 8,
  },
  {
    title: "You're all set!",
    text: "That's the full tour! Press Ctrl+Shift+A or click the avatar in the corner to revisit this guide anytime. Fly safe!",
  },
];

// ── Layout types ────────────────────────────────────────────────────────────

interface SpotRect { top: number; left: number; width: number; height: number; }
interface PanelPos { top: number; left: number; }

// ── Component ───────────────────────────────────────────────────────────────

@customElement('avatar-assistant')
export class AvatarAssistant extends LitElement {
  @state() private open = true;
  @state() private step = 0;
  @state() private talking = false;
  @state() private spotRect: SpotRect | null = null;
  @state() private panelPos: PanelPos = { top: -500, left: -500 };

  private _keyHandler = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      this.toggle();
    }
  };

  private _resizeHandler = () => { if (this.open) this.updateLayout(); };

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this._keyHandler);
    window.addEventListener('resize', this._resizeHandler);
    // Delay so other components finish rendering first
    this.updateComplete.then(() => setTimeout(() => { if (this.open) this.goToStep(0); }, 300));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this._keyHandler);
    window.removeEventListener('resize', this._resizeHandler);
  }

  private toggle() {
    if (this.open) {
      this.open = false;
    } else {
      this.open = true;
      this.updateComplete.then(() => setTimeout(() => this.goToStep(0), 50));
    }
  }

  private async goToStep(n: number) {
    this.talking = true;
    this.step = n;
    setTimeout(() => { this.talking = false; }, 700);
    await this.updateComplete;

    const el = STEPS[n].getTarget?.();
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      await new Promise(r => setTimeout(r, 420));
    }
    this.updateLayout();
  }

  private updateLayout() {
    const stepDef = STEPS[this.step];
    const el = stepDef.getTarget?.();

    if (!el) {
      this.spotRect = null;
      this.panelPos = this.centerPos();
      return;
    }

    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) {
      this.spotRect = null;
      this.panelPos = this.centerPos();
      return;
    }

    const pad = stepDef.pad ?? 10;
    const spot: SpotRect = {
      top:    r.top    - pad,
      left:   r.left   - pad,
      width:  r.width  + pad * 2,
      height: r.height + pad * 2,
    };
    this.spotRect = spot;
    this.panelPos = this.computePanelPos(spot);
  }

  private centerPos(): PanelPos {
    return {
      top:  Math.max(16, window.innerHeight / 2 - 100),
      left: Math.max(16, window.innerWidth  / 2 - 146),
    };
  }

  private computePanelPos(s: SpotRect): PanelPos {
    const PW = 292, PH = 210, GAP = 16;
    const VW = window.innerWidth, VH = window.innerHeight;
    const sBottom = s.top + s.height;

    const top = sBottom + PH + GAP < VH ? sBottom + GAP
              : s.top - PH - GAP > 0   ? s.top - PH - GAP
              : Math.max(GAP, VH / 2 - PH / 2);

    const left = Math.max(GAP, Math.min(s.left, VW - PW - GAP));
    return { top, left };
  }

  private next() {
    if (this.step < STEPS.length - 1) {
      this.goToStep(this.step + 1);
    } else {
      this.open = false;
    }
  }

  private prev() {
    if (this.step > 0) this.goToStep(this.step - 1);
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  static styles = css`
    :host { display: block; }

    /* ── Spotlight ── */
    .spotlight {
      position: fixed;
      border-radius: 10px;
      pointer-events: none;
      z-index: 9990;
      /* The huge spread creates the dark vignette around the lit area */
      box-shadow: 0 0 0 9000px rgba(0, 0, 0, 0.68);
      outline: 2.5px solid rgba(255, 255, 255, 0.35);
      outline-offset: 0px;
      transition:
        top    0.5s cubic-bezier(0.4, 0, 0.2, 1),
        left   0.5s cubic-bezier(0.4, 0, 0.2, 1),
        width  0.5s cubic-bezier(0.4, 0, 0.2, 1),
        height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Full-screen dim for steps without a specific target */
    .dim {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.58);
      pointer-events: none;
      z-index: 9989;
    }

    /* ── Floating panel (bubble + avatar) ── */
    .panel {
      position: fixed;
      z-index: 9995;
      width: 292px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
      pointer-events: all;
      transition:
        top  0.5s cubic-bezier(0.4, 0, 0.2, 1),
        left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* ── Speech bubble ── */
    .bubble {
      background: #ffffff;
      border: 1.5px solid #e2e2e2;
      border-radius: 14px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.12);
      padding: 1rem;
      width: 100%;
      box-sizing: border-box;
    }

    .bubble-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.45rem;
    }

    .bubble-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: #111;
      letter-spacing: -0.01em;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #bbb;
      font-size: 0.9rem;
      padding: 0;
      line-height: 1;
      transition: color 0.15s;
      font-family: inherit;
    }
    .close-btn:hover { color: #111; }

    .bubble-text {
      font-size: 0.8rem;
      color: #444;
      line-height: 1.6;
      margin-bottom: 0.8rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }

    .bubble-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .step-dots { display: flex; gap: 4px; align-items: center; }
    .dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: #ddd;
      transition: background 0.2s, transform 0.2s;
    }
    .dot.active { background: #111; transform: scale(1.3); }

    .nav-btns { display: flex; gap: 0.3rem; }
    .nav-btn {
      padding: 0.3rem 0.7rem;
      font-size: 0.73rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      border-radius: 5px;
      cursor: pointer;
      border: 1px solid #ddd;
      background: #f6f6f6;
      color: #555;
      transition: background 0.15s;
    }
    .nav-btn:hover { background: #eee; }
    .nav-btn.primary {
      background: #111; color: #fff; border-color: #111;
    }
    .nav-btn.primary:hover { background: #2c2c2c; border-color: #2c2c2c; }

    .shortcut-hint {
      font-size: 0.63rem;
      color: #c0c0c0;
      text-align: right;
      margin-top: 0.35rem;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }
    .kbd {
      background: #f0f0f0;
      border: 1px solid #ccc;
      border-radius: 3px;
      padding: 0 3px;
      font-family: monospace;
    }

    /* ── Avatar row below bubble ── */
    .avatar-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding-left: 0.25rem;
    }

    .avatar-img {
      width: 90px;
      height: 90px;
      object-fit: contain;
      animation: bob 2.8s ease-in-out infinite;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));
    }
    .avatar-img.talking {
      animation: talk 0.13s ease-in-out 5;
    }

    @keyframes bob {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-5px); }
    }
    @keyframes talk {
      0%, 100% { transform: scale(1); }
      50%       { transform: scale(1.07) translateY(-3px); }
    }

    /* ── Closed corner button ── */
    .corner-btn {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9995;
      cursor: pointer;
      display: inline-block;
    }

    .corner-img {
      width: 90px;
      height: 90px;
      object-fit: contain;
      animation: bob 2.8s ease-in-out infinite;
      display: block;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
      transition: transform 0.15s, filter 0.15s;
    }
    .corner-img:hover {
      transform: scale(1.09);
      filter: drop-shadow(0 6px 12px rgba(0,0,0,0.4));
    }

    .corner-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: #fff;
      font-size: 0.6rem;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      border-radius: 999px;
      padding: 1px 5px;
      border: 2px solid #fff;
    }
  `;

  // ── Render ─────────────────────────────────────────────────────────────────

  render() {
    if (!this.open) {
      return html`
        <div class="corner-btn" @click=${this.toggle} title="Open assistant (Ctrl+Shift+A)">
          <img class="corner-img" src="/avatar.png" alt="FRCS Assistant" />
          <span class="corner-badge">?</span>
        </div>
      `;
    }

    const s   = STEPS[this.step];
    const last = this.step === STEPS.length - 1;
    const sp  = this.spotRect;
    const pp  = this.panelPos;

    return html`
      ${sp
        ? html`<div class="spotlight" style="top:${sp.top}px;left:${sp.left}px;width:${sp.width}px;height:${sp.height}px;"></div>`
        : html`<div class="dim"></div>`}

      <div class="panel" style="top:${pp.top}px;left:${pp.left}px;">
        <div class="bubble">
          <div class="bubble-header">
            <span class="bubble-title">${s.title}</span>
            <button class="close-btn" @click=${() => { this.open = false; }}>✕</button>
          </div>
          <div class="bubble-text">${s.text}</div>
          <div class="bubble-footer">
            <div class="step-dots">
              ${STEPS.map((_, i) => html`<div class="dot ${i === this.step ? 'active' : ''}"></div>`)}
            </div>
            <div class="nav-btns">
              ${this.step > 0 ? html`<button class="nav-btn" @click=${this.prev}>Back</button>` : ''}
              <button class="nav-btn primary" @click=${() => this.next()}>
                ${last ? 'Done' : 'Next'}
              </button>
            </div>
          </div>
          <div class="shortcut-hint"><span class="kbd">Ctrl+Shift+A</span> to toggle</div>
        </div>
        <div class="avatar-row">
          <img
            class="avatar-img ${this.talking ? 'talking' : ''}"
            src="/avatar.png"
            alt="FRCS Assistant"
          />
        </div>
      </div>
    `;
  }
}
