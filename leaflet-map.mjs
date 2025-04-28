(function injectLeafletCSS() {
  const id = 'leaflet-css';
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
})();

(function injectLeafletJS() {
  const id = 'leaflet-js';
  if (!document.getElementById(id)) {
    const script = document.createElement('script');
    script.id = id;
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      console.log('[LeafletMap] Leaflet JS loaded');
      window.leafletReady = true;
    };
    document.head.appendChild(script);
  } else {
    window.leafletReady = true;
  }
})();

(function waitForFormioAndRegister() {
  if (!window.Formio || !Formio.Components || !Formio.Components.components) {
    return setTimeout(waitForFormioAndRegister, 50);
  }

  Formio.Components.addComponent('leafletmap', class extends Formio.Components.components.field {
    static schema(...extend) {
      return Formio.Components.components.field.schema({
        label: 'Leaflet Map',
        type: 'leafletmap',
        key: 'leafletmap',
        input: true,
        linkedAddressField: '' // new config option
      }, ...extend);
    }

    static get builderInfo() {
      return {
        title: 'Leaflet Map',
        icon: 'map',
        group: 'advanced',
        weight: 50,
        schema: this.schema()
      };
    }

    static editForm() {
      return {
        components: [
          {
            type: 'textfield',
            key: 'linkedAddressField',
            label: 'Linked Address Field Key',
            tooltip: 'Enter the key of the address field to link the map to.',
            input: true
          }
        ]
      };
    }

    render() {
      console.log('[LeafletMap] render() called');
      return super.render(`
        <div ref="element">
          <div data-map-container style="width: 100%; max-width: 500px; height: 400px; margin: 0 auto; border:1px solid #ccc;"></div>
        </div>
      `);
    }

    attach(element) {
      console.log('[LeafletMap] attach() called');
      return super.attach(element).then(() => {
        const waitForLeaflet = () => {
          const container = this.element.querySelector('[data-map-container]');

          if (!window.leafletReady) {
            console.log('[LeafletMap] Waiting: leafletReady false');
            return setTimeout(waitForLeaflet, 50);
          }
          if (!window.L) {
            console.log('[LeafletMap] Waiting: L not defined');
            return setTimeout(waitForLeaflet, 50);
          }
          if (!window.L.map) {
            console.log('[LeafletMap] Waiting: L.map not defined');
            return setTimeout(waitForLeaflet, 50);
          }
          if (!container) {
            console.log('[LeafletMap] Waiting: map container not in DOM');
            return setTimeout(waitForLeaflet, 50);
          }

          console.log('[LeafletMap] Leaflet detected:', typeof L);
          console.log('[LeafletMap] Container:', container);

          const lat = 41.8781;
          const lng = -87.6298;

          const map = L.map(container).setView([lat, lng], 17);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
            detectRetina: true
          }).addTo(map);

          const marker = L.marker([lat, lng]).addTo(map);

          setTimeout(() => {
            map.invalidateSize();
            console.log('[LeafletMap] invalidateSize() called');
          }, 0);

          // Watch for address field changes
          this.on('change', (event) => {
            if (
              event.changed &&
              this.component.linkedAddressField &&
              event.changed[this.component.linkedAddressField]
            ) {
              const address = event.changed[this.component.linkedAddressField];
              if (address) {
                console.log('[LeafletMap] Address changed:', address);
                this.geocodeAddress(address).then(({ lat, lng }) => {
                  map.setView([lat, lng], 17);
                  marker.setLatLng([lat, lng]);
                }).catch(err => console.error('[LeafletMap] Geocoding failed:', err));
              }
            }
          });
        };

        waitForLeaflet();
        return element;
      });
    }

    geocodeAddress(address) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
      return fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data.length > 0) {
            return {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon)
            };
          } else {
            throw new Error('No results found');
          }
        });
    }
  });

  console.log('[LeafletMap] Component registered.');
})();
