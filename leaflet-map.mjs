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
    script.onerror = () => {
      console.error('[LeafletMap] Failed to load Leaflet JS');
    };
    document.head.appendChild(script);
  } else {
    window.leafletReady = true;
  }
})();

// Inject Azure Maps Leaflet plugin too!
(function injectAzureMapsLeafletPlugin() {
  const id = 'azure-maps-leaflet-plugin';
  if (!document.getElementById(id)) {
    const script = document.createElement('script');
    script.id = id;
    script.src = 'https://peteyyy.github.io/formio-custom-map/azure-maps-leaflet.min.js';
    script.onload = () => {
      console.log('[LeafletMap] Azure Maps Leaflet Plugin loaded');
      window.azureLeafletReady = true;
    };
    script.onerror = () => {
      console.error('[LeafletMap] Failed to load Azure Maps Leaflet Plugin');
    };
    document.head.appendChild(script);
  } else {
    window.azureLeafletReady = true;
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

    static editForm(...extend) {
      const editForm = Formio.Components.components.field.editForm(...extend);

      editForm.components.push({
        type: 'textfield',
        key: 'linkedAddressField',
        label: 'Linked Address Field Key',
        tooltip: 'Enter the key of the address field to link the map to.',
        weight: 10,
        input: true
      });

      return editForm;
    }

    render() {
      console.log('[LeafletMap] render() called');
      return super.render(`
        <div ref="element">
          <div data-map-container style="width: 100%; max-width: 600px; height: 400px; margin: 0 auto; border:1px solid #ccc;"></div>
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

          const initialLat = 41.8781; // Chicago default
          const initialLng = -87.6298;

          const map = L.map(container).setView([initialLat, initialLng], 17);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
            detectRetina: true
          }).addTo(map);

          const marker = L.marker([initialLat, initialLng]).addTo(map);

          setTimeout(() => {
            map.invalidateSize();
            console.log('[LeafletMap] invalidateSize() called');
          }, 0);

          const moveMapToAddress = (addressValue) => {
            if (addressValue) {
              if (typeof addressValue === 'object') {
                let lat, lng;

                if (addressValue.position && addressValue.position.lat && addressValue.position.lon) {
                  // Azure Maps style (preferred)
                  console.log('[LeafletMap] Using Azure Maps position field');
                  lat = parseFloat(addressValue.position.lat);
                  lng = parseFloat(addressValue.position.lon);
                }
                else if (addressValue.lat && addressValue.lon) {
                  // Nominatim fallback
                  console.log('[LeafletMap] Using direct lat/lon fields');
                  lat = parseFloat(addressValue.lat);
                  lng = parseFloat(addressValue.lon);
                }

                if (lat !== undefined && lng !== undefined) {
                  map.setView([lat, lng], 17);
                  marker.setLatLng([lat, lng]);
                } else {
                  console.warn('[LeafletMap] Could not find valid lat/lon in address object:', addressValue);
                }
              } 
              else if (typeof addressValue === 'string') {
                console.log('[LeafletMap] Address is string, geocoding:', addressValue);
                this.geocodeAddress(addressValue).then(({ lat, lng }) => {
                  map.setView([lat, lng], 17);
                  marker.setLatLng([lat, lng]);
                }).catch(err => console.error('[LeafletMap] Geocoding failed:', err));
              }
              else {
                console.warn('[LeafletMap] Unexpected address format:', addressValue);
              }
            }
          };

          // Handle initial value (when form loads)
          const currentAddress = this.root?.submission?.data?.[this.component.linkedAddressField];
          if (currentAddress) {
            console.log('[LeafletMap] Found existing address:', currentAddress);
            moveMapToAddress(currentAddress);
          }

          // Handle future changes to address field
          this.on('change', (event) => {
            const currentAddress = this.root?.submission?.data?.[this.component.linkedAddressField];
            console.log("Current linkedAddressField is: ", this.component.linkedAddressField);
            console.log('[LeafletMap] Address field changed (from full form data):', currentAddress);
            moveMapToAddress(currentAddress);
          });
        };

        waitForLeaflet();
        return element;
      });
    }

    geocodeAddress(address) {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=1&q=${encodeURIComponent(address)}`;
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
