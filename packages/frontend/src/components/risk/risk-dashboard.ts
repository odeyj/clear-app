import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { sharedStyles } from '../../styles/shared-styles.js';
import type { RiskScore } from '@frcs/shared';
import '../common/score-gauge.js';
import '../common/risk-badge.js';

@customElement('risk-dashboard')
export class RiskDashboard extends LitElement {
  @property({ type: Object }) risk: RiskScore | null = null;

  static styles = [sharedStyles, css`
    :host { display: block; }
    .dashboard {
      background: var(--color-surface, #2c2c2e);
      border: 1px solid var(--color-border, rgba(255,255,255,0.08));
      border-radius: var(--radius-lg, 12px);
      padding: var(--space-6, 1.5rem);
    }
    .summary {
      font-size: var(--text-sm, 0.8125rem);
      line-height: 1.6;
      color: var(--color-text-secondary, #a1a1a6);
      margin: var(--space-5, 1.25rem) 0;
    }
    .factors {
      display: flex;
      flex-direction: column;
      gap: 0;
      margin-top: var(--space-4, 1rem);
    }
    .factor {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3, 0.75rem) 0;
      border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.08));
      font-size: var(--text-sm, 0.8125rem);
    }
    .factor:last-child { border-bottom: none; }
    .factor-name {
      color: var(--color-text, #f5f5f7);
      font-weight: 400;
    }
    .factor-impact {
      font-weight: 600;
      color: var(--color-text, #f5f5f7);
    }
    .factor-impact.high-impact { color: var(--color-risk-high, #ff3b30); }
    .factor-impact.medium-impact { color: var(--color-risk-moderate, #ff9f0a); }
    .factor-impact.low-impact { color: var(--color-text-secondary, #a1a1a6); }
  `];

  private getImpactClass(weight: number): string {
    if (weight >= 0.3) return 'high-impact';
    if (weight >= 0.2) return 'medium-impact';
    return 'low-impact';
  }

  private getImpactLabel(weight: number): string {
    if (weight >= 0.3) return 'High impact';
    if (weight >= 0.2) return 'Medium impact';
    return 'Low impact';
  }

  render() {
    if (!this.risk) return nothing;
    return html`
      <div class="dashboard">
        <score-gauge .value=${this.risk.overall} label="Cancellation risk"></score-gauge>
        <div class="summary">${this.risk.summary}</div>
        <div class="factors">
          ${this.risk.factors.map(f => html`
            <div class="factor">
              <span class="factor-name">${f.name}</span>
              <span class="factor-impact ${this.getImpactClass(f.weight)}">${this.getImpactLabel(f.weight)}</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}
