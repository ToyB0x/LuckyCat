import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'LuckyCat',
  description: 'A streamlined, minimalist approach to FinOps.',
  lang: 'en-US',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'Comparison', link: '/comparison' }
    ],
    sidebar: [
      { text: 'Getting started', link: '/getting-started' },
      { text: 'Product comparison', link: '/comparison' }
    ],
    footer: { message: 'LuckyCat · Simple by design.' }
  }
})
