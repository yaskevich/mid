<template>
  <div class="about">
    <div class="map-wrap">
      <div class="map" ref="mapContainer"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, toRaw, markRaw, shallowRef, watch } from 'vue';
import { Map, NavigationControl, Marker, Popup, FullscreenControl, AttributionControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Position, Point, FeatureCollection, Feature } from 'geojson';
import type { GeoJSONSource, StyleSpecification, ResourceType, MapOptions, LngLatLike, LngLatBoundsLike } from 'maplibre-gl';
import { isMapboxURL, transformMapboxUrl } from 'maplibregl-mapbox-request-transformer';
// import store from '../store';
import { useRoute } from 'vue-router';
import { bbox } from '@turf/turf';

const route = useRoute();
console.log(route.query);

const mapContainer = ref<HTMLElement>();
const mapInstance = ref<Map>();
const geo = reactive({} as FeatureCollection);
const isInit = ref(false);

const fitToData = (map: Map) => {
  const featuresCount = geo.features.length;
  if (featuresCount) {
    if (featuresCount === 1 && geo.features[0].geometry.type === 'Point') {
      const center = geo.features[0].geometry?.coordinates as LngLatLike;
      map.jumpTo({ center, zoom: 6 });
    }
    else {
      const bounds = bbox(geo) as LngLatBoundsLike;
      // const bounds: LngLatBoundsLike = coordinates.reduce(
      //   (bound: any, coord: Position) => bound.extend(coord),
      //   new LngLatBounds(coordinates[0], coordinates[0])
      // );
      map.fitBounds(bounds, { padding: 50 });
    }
  }
};

const getGeoJSON = async (query: string) => {
  // return;
  const endpoint = import.meta.env.MODE === 'production' ? import.meta.env.VITE_API : '/api';
  const response = await fetch(`${endpoint}${query}`);
  if (response.status === 200) {
    const data = await response.json();
    Object.assign(geo, data);
  } else {
    console.log("fetching error");
  }
};

watch(route, async (to) => {
  // console.log("route change:", to.fullPath, isInit.value);
  const map = mapInstance?.value;
  if (isInit.value && map) {
    const src = map.getSource('points-source') as GeoJSONSource;
    if (src) {
      await getGeoJSON(to.fullPath);
      src.setData(geo as any);
      fitToData(map);
    }
  }
}, { flush: 'pre', immediate: true, deep: true });

const opts = {
  map_vector: false,
  map_tile: null,
  map_style: 'https://demotiles.maplibre.org/style.json',
  map_mapbox: false,
  map_mapbox_key: null,
};

const initMap = async () => {
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
      },
    },
    layers: [
      {
        id: 'simple-tiles',
        type: 'raster',
        source: 'raster-tiles',
        minzoom: 0,
        maxzoom: 20,
      },
    ],
  } as StyleSpecification;

  const style = isVector ? stylePath : rasterStyle;

  if (style) {
    const mapSetup = {
      container: mapContainer.value,
      style,
      pixelRatio: window.devicePixelRatio,
      // center: lngLat,
      zoom: 2,
      // zoom: 12,
    } as MapOptions;

    if (isMapbox && mapboxKey) {
      mapSetup.transformRequest = (url: string, rt?: ResourceType) =>
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
            const description = e?.features?.[0]?.properties?.note || '🗅';
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

        map.addControl(new AttributionControl({
          customAttribution: (import.meta.env.VITE_MAP ? import.meta.env.VITE_MAP + ' ' : '') + '© <a target="_top" rel="noopener" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          compact: false
        }));
        fitToData(map);
      }
    });

    return map;
  }
};

onMounted(async () => {
  if (mapContainer.value) {
    await getGeoJSON(window.location.search);
    mapInstance.value = await initMap();
    isInit.value = true;
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
