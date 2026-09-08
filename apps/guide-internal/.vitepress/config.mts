import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'LuckyCat Internal Guide',
  description: 'Architecture and development knowledge for LuckyCat.',
  lang: 'en-US',
  cleanUrls: true,
  themeConfig: {
    outline: [2, 3],
    nav: [{ text: 'Internal guide', link: '/' }]
  }
})
