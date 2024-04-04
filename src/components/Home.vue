<template>
  <!-- <n-space vertical>
    <n-space justify="center">
      <n-button-group size="tiny">
        <n-button v-for="(item, index) in layersNames" ghost :type="index === activeMap ? 'primary' : 'default'"
          @click="handleClick(index)">
          {{ item }}
        </n-button>
      </n-button-group>
    </n-space>

    <div class="about">
      <div class="map-wrap">
        <div class="map" ref="mapContainer"></div>
      </div>
    </div>
  </n-space> -->
  <div class="map-wrap">
    <div class="map" ref="mapContainer"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, toRaw, markRaw, shallowRef, watch } from 'vue';
import { Map, IControl, NavigationControl, Marker, Popup, FullscreenControl, AttributionControl, LngLatBounds } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Position, Point, FeatureCollection, Feature } from 'geojson';
import type { GeoJSONSource, StyleSpecification, ResourceType, MapOptions, LngLatLike, LngLatBoundsLike } from 'maplibre-gl';
import { isMapboxURL, transformMapboxUrl } from 'maplibregl-mapbox-request-transformer';
// import store from '../store';
// import { useRoute } from 'vue-router';
// import { bbox } from '@turf/turf';

const layersNames = ['OpenStreetMap', 'Countries', 'Custom']
const popup = new Popup({ closeButton: false, closeOnClick: false, });
// const route = useRoute();
// console.log(route.query);
const mapContainer = ref<HTMLElement>();
const mapInstance = ref<Map>();
const geo = reactive({} as FeatureCollection);
const isInit = ref(false);
const activeMap = ref(0);

const osmStyle = {
  version: 8,
  sources: {
    'raster-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
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

const mapboxKey = import.meta.env.VITE_MAPBOX_KEY;
const attributionSources = import.meta.env.VITE_MAP_INFO;
const attributionOSM = '© <a target="_top" rel="noopener" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const styles = [osmStyle, 'https://demotiles.maplibre.org/style.json',];
if (mapboxKey && import.meta.env.VITE_MAPBOX_MAP) {
  styles.push('mapbox://styles/' + import.meta.env.VITE_MAPBOX_MAP);
}

const buttons = ['OSM', 'States', 'Blank'];

class LayerSwitcher implements IControl {
  private _container: HTMLElement | undefined;
  private _buttons: Array<HTMLButtonElement> | undefined;
  private _map: Map | undefined;

  onAdd(map: Map) {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl maplibregl-buttonset';
    this._buttons = buttons.map((x, i) => this._createButton(this._container!, (i ? '' : ' set ') + 'maplibregl-button', x));
    return this._container;
  }

  onRemove() {
    if (this?._container?.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._map = undefined;
  }

  _createButton(root: HTMLElement, className: string, title: string) {
    const el = window.document.createElement('button')
    el.className = className;
    el.textContent = title;
    el.addEventListener('click', () => {
      if (!el.classList.contains('set') && this._buttons?.length) {
        // console.log(title, buttons.indexOf(title));
        const selected = this._buttons.find(x => x.classList.contains('set'));
        if (selected) {
          selected.classList.remove('set');
        }
        el.classList.add('set');
        if (mapInstance.value) {
          mapInstance.value.setStyle(styles[buttons.indexOf(title)], { diff: false });
        }
      }
    });
    // this._setup = true;
    root.appendChild(el);
    return el;
  }

}

const handleClick = (index: number) => {
  if (mapInstance.value) {
    // console.log(mapInstance.value.getStyle().layers);
    mapInstance.value.setStyle(styles[index], { diff: false });
    activeMap.value = index;
    console.log('set map', activeMap.value);
    // console.log(mapInstance.value.getStyle().layers);
  };
}

const fitToData = (map: Map) => {
  const featuresCount = geo.features.length;
  if (featuresCount) {
    if (featuresCount === 1 && geo.features[0].geometry.type === 'Point') {
      const center = geo.features[0].geometry?.coordinates as LngLatLike;
      map.jumpTo({ center, zoom: 6 });
    }
    else {
      // const bounds = bbox(geo) as LngLatBoundsLike;
      const coordinates = geo.features.map((x: Feature) => (x?.geometry as Point)?.coordinates);
      const bounds: LngLatBoundsLike = coordinates.reduce(
        (bound: any, coord: Position) => bound.extend(coord),
        new LngLatBounds(coordinates[0] as LngLatLike, coordinates[0] as LngLatLike)
      );
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

// watch(route, async (to) => {
//   console.log("route change:", to.fullPath, isInit.value);
//   const map = mapInstance?.value;
//   if (isInit.value && map) {
//     const src = map.getSource('points-source') as GeoJSONSource;
//     if (src) {
//       await getGeoJSON(to.fullPath);
//       src.setData(geo as any);
//       fitToData(map);
//     }
//   }
// }, { flush: 'pre', immediate: true, deep: true });

const setMapData = async (url: string) => {
  // console.log("route change:", url, isInit.value);
  const map = mapInstance?.value;
  if (isInit.value && map) {
    const src = map.getSource('points-source') as GeoJSONSource;
    if (src) {
      await getGeoJSON(url);
      src.setData(geo as any);
      fitToData(map);
    }
  }
};

defineExpose({
  setMapData
});

const setPointsOverlay = () => {
  // map.addControl(new AttributionControl({
  //   customAttribution: attribution,
  //   compact: false
  // }));

  if (mapInstance?.value) {
    // console.log(mapInstance.value.getStyle());
    mapInstance.value.addSource('points-source', {
      type: 'geojson',
      data: geo,
      attribution: attributionSources + (activeMap.value ? '' : (' ' + attributionOSM)),
    });
    // const layers = mapInstance.value.getStyle().layers;
    // Find the index of the first symbol layer in the map style
    // let firstSymbolId;
    // for (let i = 0; i < layers.length; i++) {
    //   if (layers[i].type === 'symbol') {
    //     firstSymbolId = layers[i].id;
    //     break;
    //   }
    // }
    mapInstance.value.addLayer(
      {
        id: 'points-layer',
        type: 'circle',
        source: 'points-source',
        paint: {
          'circle-radius': 5,
          // 'circle-color': 'transparent',
          'circle-stroke-color': 'gray',
          'circle-stroke-width': 2,
          'circle-color': 'blue',
        },
      },
      // firstSymbolId
    );
  }
};

const showPopup = (e: any) => {
  if (mapInstance?.value && e?.features?.length) {
    // console.log(e.features[0]?.properties?.id, e.features[0]?.properties);
    mapInstance.value.getCanvas().style.cursor = 'pointer';
    const coordinates = (e.features?.[0]?.geometry as Point)?.coordinates?.slice();
    const description = e?.features?.[0]?.properties?.note || '🗅';
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
    popup
      .setLngLat(coordinates as LngLatLike)
      .setHTML(description)
      .addTo(mapInstance.value);
  }
};

const initMap = async () => {
  // const {
  //   map_vector: isVector,
  //   map_tile: tilePath,
  //   map_style: stylePath,
  //   map_mapbox: isMapbox,
  //   map_mapbox_key: mapboxKey,
  // } = opts;
  // const style = isVector ? stylePath : rasterStyle;

  if (styles.length && styles?.[0]) {
    const mapSetup = {
      container: mapContainer.value,
      style: styles?.[0],
      pixelRatio: window.devicePixelRatio,
      // pitch: 60, // pitch in degrees
      // center: lngLat,
      // zoom: 2,
      // zoom: 12,
    } as MapOptions;
    mapSetup.transformRequest = (url: string, rt?: ResourceType) =>
      isMapboxURL(url) ? transformMapboxUrl(url, String(rt), mapboxKey) : { url };

    const map = markRaw(new Map(mapSetup));
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new FullscreenControl({ container: mapContainer.value }));
    map.addControl(new LayerSwitcher(), 'top-left');
    map.on('load', async () => {
      console.log('map load');
      map.resize();
      if (geo?.features?.length) {
        setPointsOverlay();
        map.on('mouseenter', 'points-layer', showPopup);
        map.on('click', 'points-layer', showPopup);
        map.on('mouseleave', 'points-layer', () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
        });
        map.on('style.load', () => {
          console.log("switch");
          setPointsOverlay();
        });
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
  height: calc(100vh - 130px);
}

.map {
  position: absolute;
  width: 100%;
  height: calc(100vh - 130px);
  ;
}

.maplibregl-popup {
  max-width: 400px;
  font: 12px/20px 'Helvetica Neue', Arial, Helvetica, sans-serif;
}

:deep(.mapbox-improve-map) {
  display: none;
}

// :deep(.maplibregl-buttonset) {
// background-color: #fff;
// border-radius: 4px;
// }

:deep(.maplibregl-button) {
  background-color: #fff;
  border: 0;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, .1);
  margin-right: 3px;
  border-radius: 4px;

  &.set {
    box-shadow: 0 0 0 2px rgba(0, 0, 0, .3);
    background-color: lightgray !important;
  }

  &:hover:not(.set) {
    // background-color: rgb(0 0 0/5%) !important;
    background-color: #ddd !important;

  }
}
</style>
