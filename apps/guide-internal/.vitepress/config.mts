import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'LuckyCat Internal Guide',
  description: 'Architecture and development knowledge for LuckyCat.',
  lang: 'en-US',
  cleanUrls: true,
  locales: {
    root: { label: 'English', lang: 'en-US' },
    ja: {
      label: '日本語',
      lang: 'ja-JP',
      title: 'LuckyCat 内部ガイド',
      description: 'LuckyCatのアーキテクチャと開発に関するナレッジ。',
      themeConfig: {
        nav: [
          { text: 'コンセプト', link: '/ja/concept' },
          { text: 'ビジネスモデル', link: '/ja/business-model' },
          { text: '開発・技術', link: '/ja/' }
        ],
        sidebar: [
          {
            text: '製品方針',
            items: [
              { text: 'コンセプト', link: '/ja/concept' },
              { text: 'ビジネスモデル', link: '/ja/business-model' },
              { text: '開発方針', link: '/ja/product-strategy' }
            ]
          },
          {
            text: '技術',
            items: [
              { text: 'アーキテクチャとモノレポ', link: '/ja/' },
              { text: 'Google Cloud連携の設計', link: '/ja/google-cloud' },
              { text: '初回診断の設計', link: '/ja/diagnostics' }
            ]
          }
        ],
        outline: { level: [2, 3], label: 'このページの内容' },
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
    outline: [2, 3],
    nav: [
      { text: 'Concept', link: '/concept' },
      { text: 'Business model', link: '/business-model' },
      { text: 'Development & technology', link: '/' }
    ],
    sidebar: [
      {
        text: 'Product direction',
        items: [
          { text: 'Concept', link: '/concept' },
          { text: 'Business model', link: '/business-model' },
          { text: 'Development guidelines', link: '/product-strategy' }
        ]
      },
      {
        text: 'Technology',
        items: [
          { text: 'Architecture and monorepo', link: '/' },
          { text: 'Google Cloud connection design', link: '/google-cloud' },
          { text: 'Initial diagnostic design', link: '/diagnostics' }
        ]
      }
    ]
  }
})
