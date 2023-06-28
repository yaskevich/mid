<template>
  <div class="about">
    <div class="map-wrap">
      <div class="map" ref="mapContainer"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, toRaw, markRaw, shallowRef } from 'vue';
import { Map, NavigationControl, Marker, Popup, FullscreenControl, LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Position, Point, FeatureCollection, Feature } from 'geojson';
import type { GeoJSONSource, StyleSpecification, ResourceTypeEnum, MapOptions, LngLatLike } from 'maplibre-gl';
import { isMapboxURL, transformMapboxUrl } from 'maplibregl-mapbox-request-transformer';
import store from '../store';
// import project from '../../package.json';
// interface keyable {
//   [key: string]: any;
// }

// const serverUrl = `ws://${window.location.host}/ws`;

// const socket = new WebSocket(serverUrl);
// socket.addEventListener('open', event => {
//   console.log('ws open');
//   socket.send('hi from client');
// });

// socket.addEventListener('message', function (event) {
//   console.log('Message from server ', event.data);
// });

const mapContainer = ref<HTMLElement>();
const mapInstance = ref<Map>();
const hideMap = ref(false);
const marker = shallowRef<Marker>();
const showModal = ref(false);
const item = ref<Feature>();
const geo = store.source;

const opts = {
  map_vector: false,
  map_tile: null,
  map_style: 'https://demotiles.maplibre.org/style.json',
  map_mapbox: false,
  map_mapbox_key: null,
};

const initMap = async (lngLat: [number, number]) => {
  const {
    map_vector: isVector,
    map_tile: tilePath,
    map_style: stylePath,
    map_mapbox: isMapbox,
    map_mapbox_key: mapboxKey,
  } = opts;

  const tileServer = !isVector && tilePath ? tilePath : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  const rasterStyle = {
    version: 8,
    sources: {
      'raster-tiles': {
        type: 'raster',
        tiles: [tileServer],
        tileSize: 256,
        attribution:
          '© <a target="_top" rel="noopener" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    },
    layers: [
      {
        id: 'simple-tiles',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  } as StyleSpecification;

  const style = isVector ? stylePath : rasterStyle;

  if (style) {
    const mapSetup = {
      container: mapContainer.value,
      style,
      pixelRatio: window.devicePixelRatio,
      center: lngLat,
      zoom: 2,
      // zoom: 12,
    } as MapOptions;

    if (isMapbox && mapboxKey) {
      mapSetup.transformRequest = (url: string, rt?: ResourceTypeEnum) =>
        isMapboxURL(url) ? transformMapboxUrl(url, String(rt), mapboxKey) : { url };
    }

    const map = markRaw(new Map(mapSetup));
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new FullscreenControl({ container: mapContainer.value }));

    // var el = document.createElement('div');
    // el.className = 'marker';
    // el.style.backgroundImage = 'url(/api/media/center.png)';
    // el.style.width = '64px';
    // el.style.height = '64px';
    // el.style.backgroundSize = '50%';
    // el.style.backgroundRepeat = 'no-repeat';
    // el.style.backgroundPosition = 'center';
    // el.addEventListener('click', (e: Event) => {
    //   e.stopPropagation();
    //   console.log('clicked');
    // });

    // marker.value = new Marker(el, { color: 'gray', scale: 0.5 });
    // marker.value
    //   .setLngLat(lngLat)
    //   // .setPopup(new Popup().setText('test'))
    //   .addTo(map);

    // points.map(x => {
    //   new Marker({ color: x.color })
    //     .setLngLat([x.lon, x.lat])
    //     .setPopup(
    //       new Popup().setHTML(
    //         `<strong>${x.name}</strong> ${x.color === 'green' ? '🙂' : `[${x.num}]`}<br/>${
    //           placesMap[x.id]['Note']
    //         }  <br/><em>ID: ${x.id}</em><br/><button onclick="myFunction()">Approve</button>`
    //       )
    //     )
    //     // .setText())
    //     .addTo(map);
    // });

    const popup = new Popup({
      closeButton: false,
      closeOnClick: false,
    });

    map.on('load', async () => {
      map.resize();
      // console.log('pr', window.devicePixelRatio);
      // await Promise.all(
      //   ['orange', 'yellow', 'green'].map(img => {
      //     map.loadImage(`/api/media/${img}.png`, function (error, res) {
      //       if (error) {
      //         throw error;
      //       } else if (res) {
      //         map.addImage(img, imgBitmap, { pixelRatio: 2 });
      //       }
      //     });
      //   })
      // );
      // await Promise.all([1, 2, 3, 4, 5].map(image => loadImage(String(image))));
      // const allImages = map.listImages();
      // console.log('all', allImages);
      ////
      if (geo?.features?.length) {
        const layers = map.getStyle().layers;
        // Find the index of the first symbol layer in the map style
        let firstSymbolId;
        for (var i = 0; i < layers.length; i++) {
          if (layers[i].type === 'symbol') {
            firstSymbolId = layers[i].id;
            break;
          }
        }
        map.addSource('points-source', {
          type: 'geojson',
          data: geo,
        });
        map.addLayer(
          {
            id: 'points-layer',
            // type: 'symbol',
            type: 'circle',
            source: 'points-source',
            paint: {
              'circle-radius': 5,
              // 'circle-color': 'transparent',
              'circle-stroke-color': 'gray',
              'circle-stroke-width': 2,
              'circle-color': 'blue',
            },
            // layout: {
            //   'icon-image': ['get', 'status'],
            //   'icon-allow-overlap': true,
            // },
            // paint: {
            // 'icon-opacity': 0.5,
            // 'icon-color': 'green',
            // "icon-allow-overlap": true,
            // },
          },
          firstSymbolId
        );

        const showPopup = (e: any) => {
          if (e?.features?.length) {
            // console.log(e.features[0]?.properties?.id, e.features[0]?.properties);
            map.getCanvas().style.cursor = 'pointer';
            const coordinates = (e.features?.[0]?.geometry as Point)?.coordinates?.slice();
            const description = e?.features?.[0]?.properties?.info || '🗅';
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }
            popup
              .setLngLat(coordinates as LngLatLike)
              .setHTML(description)
              .addTo(map);
          }
        };

        map.on('mouseenter', 'points-layer', showPopup);
        map.on('click', 'points-layer', showPopup);

        map.on('mouseleave', 'points-layer', function () {
          map.getCanvas().style.cursor = '';
          popup.remove();
        });

        const coordinates = geo.features.map((x: Feature) => (x?.geometry as Point)?.coordinates);
        const bounds = coordinates.reduce(
          (bound: any, coord: Position) => bound.extend(coord),
          new LngLatBounds(coordinates[0], coordinates[0])
        );
        map.fitBounds(bounds, { padding: 50 });
      }
      ////
    });

    return map;
  }
};

onMounted(async () => {
  if (mapContainer.value) {
    // console.log('tkn',store.state.token);
    // if (store?.state?.token) {
    //   const response = await fetch('/api/geo', {
    //     headers: { Authorization: `Bearer ${store.state.token}` },
    //   });
    //   if (response.status === 200) {
    //     const data = await response.json();
    //     Object.assign(geo, data);
    //   } else {
    //     if (response.status === 401) {
    //       localStorage.removeItem('token');
    //     }
    //     store.state.token = '';
    //   }
    // }

    mapInstance.value = await initMap([18.652778, 54.350556]);
  }
});
</script>
<style lang="scss" scoped>
.map-wrap {
  position: relative;
  width: 100%;
  height: calc(100vh - 110px);
}

.map {
  position: absolute;
  width: 100%;
  height: calc(100vh - 110px);
}

.maplibregl-popup {
  max-width: 400px;
  font: 12px/20px 'Helvetica Neue', Arial, Helvetica, sans-serif;
}
</style>
