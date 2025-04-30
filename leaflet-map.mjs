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

      editForm.components.push(
        {
          type: 'textfield',
          key: 'linkedAddressField',
          label: 'Linked Address Field Key',
          tooltip: 'Enter the key of the address field to link the map to.',
          weight: 10,
          input: true
        },
        {
          type: 'textfield',
          key: 'subscriptionKeyField',
          label: 'Azure Maps Subscription Key',
          tooltip: 'Optional: Enter your Azure Maps subscription key. If left blank, the system will use the environment variable.',
          weight: 11,
          input: true
        }
      );

      return editForm;
    }

    render() {
      return super.render(`
        <div ref="element">
          <div style="text-align: center; margin-bottom: 10px;">
            <label for="basemap-select">Map Style:</label>
            <select id="basemap-select">
              <option value="microsoft.base.road" selected>Road</option>
              <option value="microsoft.imagery">Satellite</option>
            </select>
          </div>
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
          let currentTileLayer = null;

          const subscriptionKey = this.component.subscriptionKeyField || process.env.NEXT_PUBLIC_AZURE_MAPS_PK;


          function setTileLayer(tilesetId) {
            if (currentTileLayer) {
              map.removeLayer(currentTileLayer);
            }

            currentTileLayer = L.tileLayer(`https://atlas.microsoft.com/map/tile?api-version=2.1&tilesetId=${tilesetId}&zoom={z}&x={x}&y={y}&subscription-key=${subscriptionKey}`, {
              attribution: '&copy; <a href="https://azure.com/maps">Azure Maps</a>',
              tileSize: 256,
              maxZoom: 22
            });

            currentTileLayer.addTo(map);
          }

          if (!subscriptionKey) {
            console.error('[LeafletMap] Missing Azure Maps subscription key!');
          } else {
            setTileLayer('microsoft.base.road'); // Default map style
          }

          const styleSelect = this.element.querySelector('#basemap-select');
          if (styleSelect && subscriptionKey) {
            styleSelect.addEventListener('change', (e) => {
              console.log('[LeafletMap] Changing tileset to:', e.target.value);
              setTileLayer(e.target.value);
            });
          }

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
                  console.log('[LeafletMap] Using Azure Maps position field');
                  lat = parseFloat(addressValue.position.lat);
                  lng = parseFloat(addressValue.position.lon);
                } else if (addressValue.lat && addressValue.lon) {
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
              } else if (typeof addressValue === 'string') {
                console.log('[LeafletMap] Address is string, geocoding:', addressValue);
                this.geocodeAddress(addressValue).then(({ lat, lng }) => {
                  map.setView([lat, lng], 17);
                  marker.setLatLng([lat, lng]);
                }).catch(err => console.error('[LeafletMap] Geocoding failed:', err));
              } else {
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
          this.on('change', () => {
            const currentAddress = this.root?.submission?.data?.[this.component.linkedAddressField];
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