import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sharedStyles } from '../../styles/shared-styles.js';
import type { AnomalyResult } from '@frcs/shared';

@customElement('anomaly-list')
export class AnomalyList extends LitElement {
  @property({ type: Array }) anomalies: AnomalyResult[] = [];

  static styles = [sharedStyles, css`
    :host { display: block; }
    .header {
      font-size: var(--text-lg, 1.0625rem);
      font-weight: 700;
      color: var(--color-text, #f5f5f7);
      margin-bottom: var(--space-4, 1rem);
    }
    .anomaly {
      display: flex;
      gap: var(--space-4, 1rem);
      padding: var(--space-5, 1.25rem) 0;
      border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.08));
    }
    .anomaly:last-child { border-bottom: none; }
    .anomaly-dot {
      flex-shrink: 0;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--color-risk-moderate, #ff9f0a);
      margin-top: 5px;
    }
    .anomaly-date {
      flex-shrink: 0;
      width: 64px;
      font-size: var(--text-sm, 0.8125rem);
      color: var(--color-text-muted, #6e6e73);
    }
    .anomaly-content {
      flex: 1;
      min-width: 0;
    }
    .anomaly-title {
      font-weight: 600;
      font-size: var(--text-sm, 0.8125rem);
      color: var(--color-text, #f5f5f7);
      margin-bottom: var(--space-1, 0.25rem);
    }
    .anomaly-desc {
      font-size: var(--text-sm, 0.8125rem);
      color: var(--color-text-secondary, #a1a1a6);
      line-height: 1.5;
    }
    .correlated {
      display: inline-flex;
      font-size: var(--text-xs, 0.6875rem);
      margin-top: var(--space-2, 0.5rem);
      padding: 3px 10px;
      background: rgba(255, 59, 48, 0.1);
      border: 1px solid rgba(255, 59, 48, 0.2);
      border-radius: var(--radius-full, 9999px);
      color: var(--color-risk-high, #ff3b30);
      font-weight: 500;
    }
    .empty {
      font-size: var(--text-sm, 0.8125rem);
      color: var(--color-text-muted, #6e6e73);
      text-align: center;
      padding: var(--space-8, 2rem) 0;
    }
  `];

  render() {
    if (this.anomalies.length === 0) {
      return html`
        <div class="header">Rerouting events &middot; last 7 days</div>
        <div class="empty">No rerouting anomalies detected. Airlines are flying their standard routes.</div>
      `;
    }
    return html`
      <div class="header">Rerouting events &middot; last 7 days</div>
      ${this.anomalies.map(a => html`
        <div class="anomaly">
          <div class="anomaly-dot"></div>
          <div class="anomaly-date">${this.formatDate(a.detectedAt)}</div>
          <div class="anomaly-content">
            <div class="anomaly-title">${a.callsign} &middot; ${a.maxDeviationKm}km deviation ${a.deviationDirection}</div>
            <div class="anomaly-desc">${a.reasoning}</div>
            ${a.correlatedConflictZone ? html`
              <span class="correlated">Correlated: ${a.correlatedConflictZone}</span>
            ` : nothing}
          </div>
        </div>
      `)}
    `;
  }

  private formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return iso; }
  }
}
