<template>
  <n-message-provider>
    <n-layout position="absolute">
      <n-layout-header id="nav" style="margin-top: 1rem; font-size: 1.2rem;padding-left:3px;padding-right: 3px;">
        <div style="text-align:center" class="main-title">
          <div style="text-align:left;display: inline-block;">
            <div style="margin-left:1.5rem;margin-right:1.5rem;"> Ioannes Dantiscus' Texts &amp; Correspondence: Map
            </div>
            <n-menu v-model:value="activeKey" mode="horizontal" :options="menuOptions" @update:value="processMenu"
              :root-indent="30" :indent="30" />
          </div>
        </div>
      </n-layout-header>
      <n-layout-content class="content">
        <Home ref="mapComponentRef" />
      </n-layout-content>
      <n-layout-footer class="f4ooter">
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
  MenuOpenFilled,
} from '@vicons/material';

const mapComponentRef = ref<typeof Home>();
// const route = useRoute();

const codemap =
{
  'all': 'All places',
  'allsending': 'Places of sending of all letters',
  'allsendingFrom': 'Places of sending of letters from Dantiscus',
  'allsendingTo': 'Places of sending of letters to Dantiscus',
  'allreceiving': 'Places of receiving of letters to Dantiscus',
  'allmentioned': 'Places mentioned in letters',
  'all-la': 'All places in Ioannes Dantiscus\' Latin texts',
  'clatsending': 'Places of sending of Dantiscus\' Latin letters',
  'clatmentioned': 'Places mentioned in Dantiscus\' Latin texts',
  'all-de': ' All places in Ioannes Dantiscus\' German texts',
  'cgersending': 'Places of sending of Dantiscus\' German letters',
  'cgermentioned': 'Places mentioned in Dantiscus\' German texts'
};

const activeKey = ref<keyof typeof codemap>();

const setActiveKey = () => {
  const queryParts = window.location.search.split(/=|&/);
  (activeKey.value as any) = (queryParts?.[1] + queryParts?.[3]) || 'all';
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
    label: () => activeKey.value ? codemap[activeKey.value] : '',
    key: 'hello',
    icon: renderIcon(MenuOpenFilled),
    children: [{
      label: 'Corpus',
      key: 'corpus',
      icon: renderIcon(CollectionsBookmarkFilled),
      children: [
        {
          label: codemap['all'],
          key: 'all',
          path: '',
          icon: renderIcon(MailFilled),
        },
        {
          label: codemap['allsending'],
          key: 'allsending',
          path: '?corp=all&index=sending',
          icon: renderIcon(CallMadeFilled),
        },
        {
          label: codemap['allsendingFrom'],
          key: 'allsendingFrom',
          path: '?corp=all&index=sendingFrom',
          icon: renderIcon(LogOutFilled),
        },
        {
          label: codemap['allsendingTo'],
          key: 'allsendingTo',
          path: '?corp=all&index=sendingTo',
          icon: renderIcon(SendFilled), // OutboundFilled
        },
        {
          label: codemap['allreceiving'],
          key: 'allreceiving',
          path: '?corp=all&index=receiving',
          icon: renderIcon(LogInFilled),
        },
        {
          label: codemap['allmentioned'],
          key: 'allmentioned',
          path: '?corp=all&index=mentioned',
          icon: renderIcon(EditNoteFilled),
        },
      ],
    },
    {
      label: codemap['all-la'],
      key: 'all-la',
      path: '',
      icon: renderIcon(BookmarksFilled),
      children: [
        {
          label: codemap['clatsending'],
          key: 'clatsending',
          path: '?corp=clat&index=sending',
          icon: renderIcon(LogOutFilled),
        },
        {
          label: codemap['clatmentioned'],
          key: 'clatmentioned',
          path: '?corp=clat&index=mentioned',
          icon: renderIcon(EditNoteFilled),
        },
      ]
    },
    {
      label: codemap['all-de'],
      key: 'all-de',
      path: '',
      icon: renderIcon(BookmarkFilled),
      children: [
        {
          label: codemap['cgersending'],
          key: 'cgersending',
          path: '?corp=cger&index=sending',
          icon: renderIcon(LogOutFilled),
        },
        {
          label: codemap['cgermentioned'],
          key: 'cgermentioned',
          path: '?corp=cger&index=mentioned',
          icon: renderIcon(EditNoteFilled),
        },
      ]
    },]
  }
];

</script>

<style lang="scss">
.main-title,
.n-layout {
  background-color: rgb(250, 250, 252) !important;

}

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
  margin-top: -1rem;
  padding: 0.25rem;
}

.nav {
  padding: 1rem;
  // background-color: #aad3df;

}
</style>
