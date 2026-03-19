import { LitElement, html, css, unsafeCSS } from 'lit';
import leafletCss from 'leaflet/dist/leaflet.css?raw';
import { customElement, property, state } from 'lit/decorators.js';
import type { AlternativeRoute, ScoredRoute } from '@frcs/shared';
import L from 'leaflet';

@customElement('route-map')
export class RouteMap extends LitElement {
  /** One-stop / hub itineraries (shown when non-empty) */
  @property({ type: Array }) alternatives: AlternativeRoute[] = [];
  /** Great-circle geometry options when there are no itinerary alternatives */
  @property({ type: Array }) routes: ScoredRoute[] = [];
  @property({ type: Object }) origin: { lat: number; lon: number; code: string } | null = null;
  @property({ type: Object }) destination: { lat: number; lon: number; code: string } | null = null;
  @property({ type: Number }) selectedRouteIndex = 0;

  @state() private map: L.Map | null = null;
  private routeLayers: L.LayerGroup = L.layerGroup();
  private markerLayer: L.LayerGroup = L.layerGroup();
  private zoneLayer: L.LayerGroup = L.layerGroup();

  static styles = [
    unsafeCSS(leafletCss),
    css`
      :host {
        display: flex;
        flex-direction: column;
        min-height: 400px;
        height: 400px;
        border: 1px solid var(--color-border, #e0e0e0);
        border-radius: var(--radius-lg, 8px);
        overflow: hidden;
        background: var(--color-bg, #fff);
      }
      .map-header {
        flex-shrink: 0;
        padding: 0.45rem 0.75rem;
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--color-text-muted, #737373);
        background: var(--color-surface, #f8f8f8);
        border-bottom: 1px solid var(--color-border, #e0e0e0);
      }
      .map-panel {
        flex: 1;
        min-height: 0;
        position: relative;
      }
      .map-container {
        width: 100%;
        height: 100%;
        min-height: 0;
      }
    `,
  ];

  firstUpdated() {
    const container = this.renderRoot.querySelector('.map-container') as HTMLElement | null;
    if (!container) return;

    this.map = L.map(container, { zoomControl: true }).setView([30, 30], 3);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(this.map);

    this.routeLayers.addTo(this.map);
    this.markerLayer.addTo(this.map);
    this.zoneLayer.addTo(this.map);

    requestAnimationFrame(() => {
      this.map?.invalidateSize();
      this.updateMap();
    });
  }

  updated(changed: Map<string, unknown>) {
    if (
      changed.has('routes') ||
      changed.has('alternatives') ||
      changed.has('origin') ||
      changed.has('destination') ||
      changed.has('selectedRouteIndex')
    ) {
      this.updateMap();
    }
  }

  private updateMap() {
    if (!this.map) return;

    this.routeLayers.clearLayers();
    this.markerLayer.clearLayers();
    this.zoneLayer.clearLayers();

    if (!this.origin || !this.destination) return;

    try {
      const originIcon = L.divIcon({
        className: '',
        html: `<div style="background:#111;color:#fff;padding:2px 6px;border-radius:2px;font-size:12px;font-weight:700;font-family:monospace;white-space:nowrap">${this.origin.code}</div>`,
      });
      const destIcon = L.divIcon({
        className: '',
        html: `<div style="background:#111;color:#fff;padding:2px 6px;border-radius:2px;font-size:12px;font-weight:700;font-family:monospace;white-space:nowrap">${this.destination.code}</div>`,
      });

      L.marker([this.origin.lat, this.origin.lon], { icon: originIcon }).addTo(this.markerLayer);
      L.marker([this.destination.lat, this.destination.lon], { icon: destIcon }).addTo(this.markerLayer);

      const riskColors: Record<string, string> = {
        low: '#22c55e',
        moderate: '#f59e0b',
        high: '#ef4444',
        critical: '#dc2626',
      };

      const boundsPoints: [number, number][] = [
        [this.origin.lat, this.origin.lon],
        [this.destination.lat, this.destination.lon],
      ];

      const useAlternatives = this.alternatives.length > 0;

      if (useAlternatives) {
        for (let i = 0; i < this.alternatives.length; i++) {
          const alt = this.alternatives[i];
          if (!alt.path?.coordinates?.length) continue;
          const coords = alt.path.coordinates.map(c => [c[1], c[0]] as [number, number]);
          coords.forEach(c => boundsPoints.push(c));
          const isSelected = i === this.selectedRouteIndex;
          const color = riskColors[alt.riskLevel] || '#999';

          L.polyline(coords, {
            color,
            weight: isSelected ? 4 : 1.5,
            opacity: isSelected ? 1 : 0.35,
            dashArray: isSelected ? undefined : '6 5',
          }).addTo(this.routeLayers);

          if (
            isSelected &&
            alt.viaLatitude !== undefined &&
            alt.viaLongitude !== undefined
          ) {
            const hubIcon = L.divIcon({
              className: '',
              html: `<div style="background:#b45309;color:#fff;padding:2px 6px;border-radius:2px;font-size:11px;font-weight:700;font-family:monospace;white-space:nowrap;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.2)">Via ${alt.via}</div>`,
            });
            L.marker([alt.viaLatitude, alt.viaLongitude], { icon: hubIcon }).addTo(this.markerLayer);
          }
        }
      } else {
        for (let i = 0; i < this.routes.length; i++) {
          const route = this.routes[i];
          if (!route.path?.coordinates?.length) continue;
          const coords = route.path.coordinates.map(c => [c[1], c[0]] as [number, number]);
          coords.forEach(c => boundsPoints.push(c));
          const isSelected = i === this.selectedRouteIndex;
          const color = riskColors[route.riskLevel] || '#999';

          L.polyline(coords, {
            color,
            weight: isSelected ? 3 : 1.5,
            opacity: isSelected ? 1 : 0.4,
            dashArray: isSelected ? undefined : '4 4',
          }).addTo(this.routeLayers);

          if (isSelected) {
            for (const nz of route.nearbyZones) {
              L.circle([nz.zone.centroidLat, nz.zone.centroidLon], {
                radius: nz.zone.radiusKm * 1000,
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.1,
                weight: 1,
              }).addTo(this.zoneLayer);
            }
          }
        }
      }

      this.map.fitBounds(L.latLngBounds(boundsPoints), { padding: [40, 40] });
    } catch (e) {
      console.error('route-map: updateMap failed', e);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.map?.remove();
    this.map = null;
  }

  render() {
    return html`
      <div class="map-header">Scan results</div>
      <div class="map-panel">
        <div class="map-container"></div>
      </div>
    `;
  }
}
