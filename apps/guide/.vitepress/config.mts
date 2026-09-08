import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'LuckyCat',
  description: 'A streamlined, minimalist approach to FinOps.',
  lang: 'en-US',
  cleanUrls: true,
  locales: {
    root: { label: 'English', lang: 'en-US' },
    ja: {
      label: '日本語',
      lang: 'ja-JP',
      description: 'シンプルで実用的なFinOpsを目指すLuckyCat。',
      themeConfig: {
        nav: [
          { text: '製品方針', link: '/ja/product' },
          { text: '提供状況', link: '/ja/getting-started' },
          { text: '製品比較', link: '/ja/comparison' }
        ],
        sidebar: [
          { text: '製品方針', link: '/ja/product' },
          { text: '提供状況とはじめ方', link: '/ja/getting-started' },
          { text: '製品比較', link: '/ja/comparison' }
        ],
        footer: { message: 'LuckyCat · シンプルさを、設計から。' },
        outline: { label: 'このページの内容' },
        docFooter: { prev: '前のページ', next: '次のページ' },
        langMenuLabel: '言語を変更',
        sidebarMenuLabel: 'メニュー',
        returnToTopLabel: 'ページの先頭へ',
        skipToContentLabel: '本文へスキップ',
        darkModeSwitchLabel: '表示テーマ',
        darkModeSwitchTitle: 'ダークモードに切り替え',
        lightModeSwitchTitle: 'ライトモードに切り替え'
      }
    }
  },
  themeConfig: {
    nav: [
      { text: 'Product', link: '/product' },
      { text: 'Availability', link: '/getting-started' },
      { text: 'Comparison', link: '/comparison' }
    ],
    sidebar: [
      { text: 'Product direction', link: '/product' },
      { text: 'Availability and getting started', link: '/getting-started' },
      { text: 'Product comparison', link: '/comparison' }
    ],
    footer: { message: 'LuckyCat · Simple by design.' }
  }
})
