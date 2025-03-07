const nav = require("./utils/navSidebar/nav.js");
const sidebar = require("./utils/navSidebar/sidebar.js");

module.exports = {
  title: "NS-Blog",
  description: "Record a wonderful life",
  base: "/ns-blog/",
  locales: {
    "/": {
      lang: "zh-CN",
    },
  },
  theme: "reco",
  themeConfig: {
    nav,
    sidebar,
    sidebarDepth: 3,
    subSidebar: "auto",
    smoothScroll: true,
  },
  markdown: {
    lineNumbers: true,
  },
  plugins: {
    "@vuepress/medium-zoom": {
      selector: "img.zoomable",
      options: {
        background: "#333",
      },
    },
  },
};
