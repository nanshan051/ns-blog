const { nav, sidebar } = require("./utils/navbar.js");

module.exports = {
  title: "NS-Blog",
  description: "Record a wonderful life",
  base: "/ns-blog/",
  locales: {
    "/": {
      lang: "zh-CN",
    },
  },
  markdown: {
    lineNumbers: true,
  },
  plugins: {
    '@vuepress/medium-zoom': {
      selector: 'img.zoomable',
      options: {
        background: '#333'
      }
    }
  },
  theme: "reco",
  themeConfig: {
    nav,
    sidebar,
    subSidebar: "auto",
  },
};
