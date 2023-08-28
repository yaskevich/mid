<template>
  <n-message-provider>
    <n-layout position="absolute">
      <n-layout-header id="nav">
      </n-layout-header>
      <n-layout-content class="content">
        <n-space justify="center" class="nav">
          <n-menu v-model:value="activeKey" mode="horizontal" :options="menuOptions" @update:value="processMenu" />
          <!-- <router-link to="/list">List</router-link> -->
        </n-space>
        <!-- <router-view /> -->
        <Home ref="mapComponentRef" />
      </n-layout-content>
      <n-layout-footer position="absolute" class="footer">
        <n-space justify="center">
          <n-button text tag="a" href="https://yaskevich.com/" target="_blank">
            2023&nbsp;•&nbsp;Alyaxey Yaskevich
          </n-button>
        </n-space>
      </n-layout-footer>
    </n-layout>
  </n-message-provider>
</template>
<script setup lang="ts">
// import router from './router';
import Home from './components/Home.vue';
import { h, Component, ref, reactive, watch, onMounted } from 'vue';
import { MenuOption, NIcon } from 'naive-ui';
// import { RouterLink, useRoute } from 'vue-router';
import {
  LogOutFilled,
  EditNoteFilled,
  CallMadeFilled,
  SendFilled,
  MailFilled,
  LogInFilled,
  CollectionsBookmarkFilled,
  BookmarksFilled,
  BookmarkFilled,
} from '@vicons/material';

const mapComponentRef = ref<typeof Home>();
// const route = useRoute();
const activeKey = ref<string | null>(null);

const setActiveKey = () => {
  const queryParts = window.location.search.split(/=|&/);
  activeKey.value = (queryParts?.[1] + queryParts?.[3]) || 'all';
};

setActiveKey();

window.onpopstate = async () => {
  // console.log("history change", window.location.search);
  if (mapComponentRef?.value) {
    await mapComponentRef.value.setMapData(window.location.search);
  }
  setActiveKey();
};

// watch(route, async (to) => {
// console.log("app route change:", to.fullPath, route.query);
// activeKey.value = Object.values(route.query).join('') || 'all';
// });

// onMounted(async () => {
// });

const renderIcon = (icon: Component) => {
  return () => h(NIcon, null, { default: () => h(icon) });
};

const processMenu = async (key: string, item: MenuOption) => {
  console.log("click", key);
  if (!item?.children && mapComponentRef?.value) {
    // router.push(String(item.path));
    history.pushState({}, '', String(item.path) || '/');
    await mapComponentRef.value.setMapData(window.location.search);
  }
};

const menuOptions: MenuOption[] = [
  {
    label: 'Corpus',
    key: 'corpus',
    icon: renderIcon(CollectionsBookmarkFilled),
    children: [
      {
        label: 'All',
        key: 'all',
        path: '',
        icon: renderIcon(MailFilled),
      },
      {
        label: 'Sending',
        key: 'allsending',
        path: '?corp=all&index=sending',
        icon: renderIcon(CallMadeFilled),
      },
      {
        label: 'Sending from ID',
        key: 'allsendingFrom',
        path: '?corp=all&index=sendingFrom',
        icon: renderIcon(LogOutFilled),
      },
      {
        label: 'Sending to ID',
        key: 'allsendingTo',
        path: '?corp=all&index=sendingTo',
        icon: renderIcon(SendFilled), // OutboundFilled
      },
      {
        label: 'Receiving to ID',
        key: 'allreceiving',
        path: '?corp=all&index=receiving',
        icon: renderIcon(LogInFilled),
      },
      {
        label: 'Mentions',
        key: 'allmentioned',
        path: '?corp=all&index=mentioned',
        icon: renderIcon(EditNoteFilled),
      },
    ],
  },
  {
    label: 'Latin',
    key: 'all-la',
    path: '',
    icon: renderIcon(BookmarksFilled),
    children: [
      {
        label: 'Sending from ID',
        key: 'clatsending',
        path: '?corp=clat&index=sending',
        icon: renderIcon(LogOutFilled),
      },
      {
        label: 'Mentions',
        key: 'clatmentioned',
        path: '?corp=clat&index=mentioned',
        icon: renderIcon(EditNoteFilled),
      },
    ]
  },
  {
    label: 'German',
    key: 'all-de',
    path: '',
    icon: renderIcon(BookmarkFilled),
    children: [
      {
        label: 'Sending from ID',
        key: 'cgersending',
        path: '?corp=cger&index=sending',
        icon: renderIcon(LogOutFilled),
      },
      {
        label: 'Mentions',
        key: 'cgermentioned',
        path: '?corp=cger&index=mentioned',
        icon: renderIcon(EditNoteFilled),
      },
    ]
  },
];

</script>

<style lang="scss" scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.content {
  padding-bottom: 1rem
}

.footer {
  padding: 0.25rem
}

.nav {
  padding: 1rem;
  // background-color: #aad3df;

}
</style>
