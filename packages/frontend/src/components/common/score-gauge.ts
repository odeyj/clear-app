import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('score-gauge')
export class ScoreGauge extends LitElement {
  @property({ type: Number }) value = 0;
  @property() label = 'Risk Score';

  static styles = css`
    :host { display: block; }
    .gauge {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: var(--space-3, 0.75rem);
    }
    .gauge-label {
      font-size: var(--text-lg, 1.0625rem);
      font-weight: 700;
      color: var(--color-text, #f5f5f7);
    }
    .gauge-level {
      font-size: var(--text-2xl, 1.5rem);
      font-weight: 800;
    }
    .bar {
      height: 4px;
      background: var(--color-surface-elevated, #3a3a3c);
      border-radius: 2px;
      overflow: hidden;
    }
    .fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.5s ease;
    }
    .low .gauge-level { color: var(--color-risk-low, #34c759); }
    .low .fill { background: var(--color-risk-low, #34c759); }
    .moderate .gauge-level { color: var(--color-risk-moderate, #ff9f0a); }
    .moderate .fill { background: var(--color-risk-moderate, #ff9f0a); }
    .high .gauge-level { color: var(--color-risk-high, #ff3b30); }
    .high .fill { background: var(--color-risk-high, #ff3b30); }
    .critical .gauge-level { color: var(--color-risk-critical, #ff2d55); }
    .critical .fill { background: var(--color-risk-critical, #ff2d55); }
  `;

  private get riskClass(): string {
    if (this.value < 30) return 'low';
    if (this.value < 60) return 'moderate';
    if (this.value < 80) return 'high';
    return 'critical';
  }

  private get riskLabel(): string {
    if (this.value < 30) return 'Low';
    if (this.value < 60) return 'Moderate';
    if (this.value < 80) return 'High';
    return 'Critical';
  }

  render() {
    return html`
      <div class=${this.riskClass}>
        <div class="gauge">
          <span class="gauge-label">${this.label}</span>
          <span class="gauge-level">${this.riskLabel}</span>
        </div>
        <div class="bar">
          <div class="fill" style="width: ${this.value}%"></div>
        </div>
      </div>
    `;
  }
}
