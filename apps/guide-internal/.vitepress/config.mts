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
        nav: [{ text: '内部ガイド', link: '/ja/' }],
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
    nav: [{ text: 'Internal guide', link: '/' }]
  }
})
