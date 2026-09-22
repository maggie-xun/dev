import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'xun.dev',
  description: 'xun dev',
  base: '/dev/',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'frontend',
        items: [
          {
            text: 'Vue3',
            link: '/frontend/vue3',
            items: [
              { text: 'props', link: '/frontend/vue3/props' },
              { text: 'async', link: '/frontend/vue3/async' },
              { text: 'attrs', link: '/frontend/vue3/attrs' },
              { text: 'slots', link: '/frontend/vue3/slots' },
              { text: 'provide/inject', link: '/frontend/vue3/provide-inject' },
              { text: 'direction', link: '/frontend/vue3/direction' },
              { text: 'composition-api', link: '/frontend/vue3/composition-api' }

              // { text: 'ref/reactive', link: '/frontend/vue3/ref-reactive' },
              // { text: 'watch/watchEffect', link: '/frontend/vue3/watch-watchEffect' }
            ]
          },
          {
            text: '一些最佳实践',
            link: '/frontend/best-practices',
            items: [{ text: '虚拟列表原理及实现', link: '/frontend/best-practices/virtual-list' }]
          }
        ]
      },
      {
        text: '读书笔记',
        items: [
          { text: '读书笔记模板', link: '/reading-notes/template' },
          { text: '高效能人士的七个习惯', link: '/reading-notes/the-7-habits-of-highly-effective-people' },
          { text: '重启人生', link: '/reading-notes/restart-your-life' }
        ]
      },
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/vuejs/vitepress' }]
  }
})
