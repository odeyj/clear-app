import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sharedStyles } from '../../styles/shared-styles.js';
import type { AlternativeRoute, ScoredRoute } from '@frcs/shared';
import '../common/risk-badge.js';

/**
 * Booking-style itinerary list (connecting flights) or fallback great-circle options.
 */
@customElement('safe-alternatives')
export class SafeAlternatives extends LitElement {
  @property({ type: Array }) alternatives: AlternativeRoute[] = [];
  /** Used when there are no hub itineraries — same map selection index as scored routes */
  @property({ type: Array }) fallbackRoutes: ScoredRoute[] = [];
  @property({ type: Number }) selectedIndex = 0;

  static styles = [sharedStyles, css`
    :host { display: block; }
    .header {
      font-size: var(--text-xs, 0.75rem);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted, #999);
      font-weight: 600;
      margin-bottom: var(--space-3, 0.75rem);
    }
    .card {
      padding: var(--space-4, 1rem);
      border: 1px solid var(--color-border, #e0e0e0);
      border-radius: var(--radius, 4px);
      margin-bottom: var(--space-2, 0.5rem);
      cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .card:hover { border-color: var(--color-text-muted, #999); }
    .card.selected {
      border-color: var(--color-text, #111);
      box-shadow: 0 0 0 1px var(--color-text, #111);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-2, 0.5rem);
      gap: var(--space-2, 0.5rem);
    }
    .title { font-weight: 600; font-size: var(--text-sm, 0.875rem); line-height: 1.35; }
    .tradeoffs {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-4, 1rem);
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-secondary, #666);
      margin-bottom: var(--space-2, 0.5rem);
    }
    .tradeoff {
      display: flex;
      flex-direction: column;
    }
    .tradeoff-label {
      font-size: var(--text-xs, 0.75rem);
      color: var(--color-text-muted, #999);
    }
    .tradeoff-value {
      font-family: var(--font-mono, monospace);
      font-weight: 600;
    }
    .reasoning {
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-secondary, #666);
      line-height: 1.5;
    }
    .route-meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-4, 1rem);
      font-size: var(--text-sm, 0.875rem);
      color: var(--color-text-secondary, #666);
      margin-bottom: var(--space-2, 0.5rem);
    }
    .score {
      font-family: var(--font-mono, monospace);
      font-weight: 700;
      font-size: var(--text-base, 1rem);
    }
  `];

  private emitSelect(index: number) {
    this.dispatchEvent(new CustomEvent('itinerary-select', {
      detail: { index },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    if (this.alternatives.length > 0) {
      return html`
        <div class="header">Itinerary options</div>
        ${this.alternatives.map((alt, i) => html`
          <div
            class="card ${this.selectedIndex === i ? 'selected' : ''}"
            @click=${() => this.emitSelect(i)}
          >
            <div class="card-header">
              <span class="title">${alt.description}</span>
              <risk-badge .level=${alt.riskLevel} .score=${alt.score}></risk-badge>
            </div>
            <div class="tradeoffs">
              <div class="tradeoff">
                <span class="tradeoff-label">Total distance</span>
                <span class="tradeoff-value">${alt.distanceKm.toLocaleString()} km</span>
              </div>
              <div class="tradeoff">
                <span class="tradeoff-label">Extra vs nonstop</span>
                <span class="tradeoff-value">+${alt.extraDistanceKm.toLocaleString()} km</span>
              </div>
              <div class="tradeoff">
                <span class="tradeoff-label">Extra time (est.)</span>
                <span class="tradeoff-value">+${alt.extraTimeMinutes} min</span>
              </div>
              <div class="tradeoff">
                <span class="tradeoff-label">Stops</span>
                <span class="tradeoff-value">${alt.stops}</span>
              </div>
            </div>
            <div class="reasoning">${alt.reasoning}</div>
          </div>
        `)}
      `;
    }

    if (this.fallbackRoutes.length > 0) {
      return html`
        <div class="header">Great-circle path options</div>
        ${this.fallbackRoutes.map((route, i) => html`
          <div
            class="card ${this.selectedIndex === i ? 'selected' : ''}"
            @click=${() => this.emitSelect(i)}
          >
            <div class="card-header">
              <span class="title">${i + 1}. ${route.name}</span>
              <div style="display:flex;align-items:center;gap:0.5rem">
                <span class="score risk-${route.riskLevel}">${route.score}</span>
                <risk-badge .level=${route.riskLevel}></risk-badge>
              </div>
            </div>
            <div class="route-meta">
              <span>${route.distanceKm.toLocaleString()} km</span>
              <span>${route.nearbyZones.length} conflict zone${route.nearbyZones.length !== 1 ? 's' : ''} nearby</span>
            </div>
            <div class="reasoning">${route.reasoning}</div>
          </div>
        `)}
      `;
    }

    return nothing;
  }
}
