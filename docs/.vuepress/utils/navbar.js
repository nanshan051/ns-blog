const nav = [
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
];

const sidebar = [
  {
    title: "权限",
    path: "/auth/digest",
    collapsable: false,
    children: [{ title: "Digest Auth", path: "/auth/digest" }],
  },
];

module.exports = {
  nav,
  sidebar,
};
