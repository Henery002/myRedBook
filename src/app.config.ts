export default defineAppConfig({
  pages: [
    "pages/index/index",
    "pages/publishPage/index",
    "pages/userPage/index",
    "pages/loginPage/index",
  ],
  subPackages: [
    {
      root: "packageA",
      pages: ["pages/listPage/index", "pages/detailsPage/index"],
    },
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#fff",
    navigationBarTitleText: "小黄书",
    navigationBarTextStyle: "black",
  },
  // 优化配置分包预加载规则
  preloadRule: {
    // "pages/index/index": {
    //   network: "all",
    //   packages: ["content"], // 在首页预加载内容分包
    // },
    // "packageA/pages/listPage/index": {
    //   network: "wifi",
    //   packages: ["user"], // 在wifi环境下预加载用户分包
    // },
  },
  // tabBar: {
  //   custom: false,
  //   color: "#999999",
  //   selectedColor: "#f09c20",
  //   backgroundColor: "#ffffff",
  //   list: [
  //     {
  //       pagePath: "pages/index/index",
  //       text: "首页",
  //       iconPath: "", // "assets/images/tab/home.png",
  //       selectedIconPath: "", //"assets/images/tab/home-active.png",
  //     },
  //     {
  //       pagePath: "pages/publishPage/index",
  //       text: "发布",
  //       iconPath: "", // "assets/images/tab/publish.png",
  //       selectedIconPath: "", // "assets/images/tab/publish-active.png",
  //     },
  //     {
  //       pagePath: "pages/userPage/index",
  //       text: "我的",
  //       iconPath: "", // "assets/images/tab/user.png",
  //       selectedIconPath: "", // "assets/images/tab/user-active.png",
  //     },
  //   ],
  // },
});
