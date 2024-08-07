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
  theme: "reco",
  themeConfig: {
    nav: [
      {
        text: "Home",
        link: "/",
      },
      {
        text: "常用网站",
        items: [
          {
            text: "GitHub",
            link: "https://github.com",
          },
          {
            text: "掘金",
            link: "https://juejin.cn",
          },
        ],
      },
    ],
    subSidebar: "auto",
    sidebar: [
      {
        title: "摘要",
        path: "/",
        collapsable: false, // 不折叠
        children: [{ title: "简述", path: "/" }],
      },
      // {
      //   title: "文件处理",
      //   path: "/fileHandle/upload",
      //   collapsable: false,
      //   children: [
      //     { title: "上传", path: "/fileHandle/upload" },
      //     { title: "下载", path: "/fileHandle/download" },
      //     { title: "导出", path: "/fileHandle/export" },
      //   ],
      // },
      {
        title: "权限",
        path: "/auth/digest",
        collapsable: false,
        children: [{ title: "Digest", path: "/auth/digest" }],
      },
    ],
  },
};
