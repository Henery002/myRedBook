import { defineConfig, type UserConfigExport } from "@tarojs/cli";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import devConfig from "./dev";
import prodConfig from "./prod";

// https://taro-docs.jd.com/docs/next/config#defineconfig-辅助函数
export default defineConfig<"webpack5">(async (merge, { command, mode }) => {
  const baseConfig: UserConfigExport<"webpack5"> = {
    projectName: "myRedBook",
    date: "2025-3-17",
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: "src",
    outputRoot: "dist",
    plugins: [],
    defineConstants: {},
    copy: {
      patterns: [],
      options: {},
    },
    framework: "react",
    compiler: {
      type: "webpack5",
      prebundle: {
        enable: true,
        exclude: ["taro-ui"], // 关闭taro-ui预编译，**以解决[taro-ui组件无法渲染问题]**

        // 下面是prebundle进一步优化的配置
        // 开启打包时间统计
        timings: true,
        // 开启打包体积统计
        // pool: {
        //   minSize: 1024 * 30, // 最小30kb
        //   maxSize: 1024 * 200, // 最大200kb
        // },
      },
    },
    cache: {
      enable: true, // Webpack 持久化缓存配置，建议开启。默认配置请参考：https://docs.taro.zone/docs/config-detail#cache
    },
    optimization: {
      moduleIds: "deterministic",
      chunkIds: "deterministic",
      splitChunks: {
        chunks: "all",
        maxSize: 244 * 1024, // 限制chunk大小
      },
    },

    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: true, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: "global", // 转换模式，取值为 global/module，**是导入[x.less]文件中styles样式生效的关键设置**
            generateScopedName: "[name]__[local]___[hash:base64:5]",
          },
        },
        // 新增taroui第三方库样式警告过滤配置
        // cssnano: {
        //   preset: ['advanced', {
        //     calc: false,
        //     cssDeclarationSorter: false,
        //     discardComments: { removeAll: true },
        //     // 关键配置：禁用第三方库样式警告
        //     mergeRules: false,
        //     normalizeUrl: false
        //   }]
        // },
        // mini下单独配置less
        less: {},
        sass: {
          // implementation: require('sass'),
          // sourceMap: true,
        },
      },

      // 优化主包体积，开启tree shaking
      optimizeMainPackage: {
        enable: true,
      },

      webpackChain(chain) {
        chain.resolve.plugin("tsconfig-paths").use(TsconfigPathsPlugin);

        // 优化taro-ui
        chain.plugin("providePlugin").use(require("webpack").ProvidePlugin, [
          {
            "process.env.TARO_ENV": JSON.stringify(process.env.TARO_ENV),
          },
        ]);

        // 开启tree shaking
        chain.optimization.usedExports(true);
        chain.optimization.sideEffects(true);

        chain.merge({
          cache: {
            type: "filesystem",
            buildDependencies: {
              config: [__filename],
            },
            compression: "gzip",
          },
        });

        // chain.module
        //   .rule('wxml')
        //   .test(/\.wxml$/)
        //   .use('wxml-loader')
        //   .loader('wxml-loader');

        // chain.module.rule('sass').test(/\.s[ac]ss$/i).use('sass-loader').tap(options => ({
        //   ...options,
        //   sassOptions: {
        //     quietDeps: true // 禁用第三方库警告
        //   }
        // }))
      },
    },
    sass: {},
    less: {
      enable: true,
      sourceMap: true,
      implementation: require("less"),
      additionalData: `:global {
        @import "~@/styles/variables.less";
        @import "~@/styles/reset.less";
      }`, // 全局变量
      lessOptions: {
        javascriptEnabled: true,
        modifyVars: {},
      },
    },
    // h5: {
    //   publicPath: '/',
    //   staticDirectory: 'static',
    //   output: {
    //     filename: 'js/[name].[hash:8].js',
    //     chunkFilename: 'js/[name].[chunkhash:8].js'
    //   },
    //   miniCssExtractPluginOption: {
    //     ignoreOrder: true,
    //     filename: 'css/[name].[hash].css',
    //     chunkFilename: 'css/[name].[chunkhash].css'
    //   },
    //   postcss: {
    //     autoprefixer: {
    //       enable: true,
    //       config: {}
    //     },
    //     cssModules: {
    //       enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
    //       config: {
    //         namingPattern: 'module', // 转换模式，取值为 global/module
    //         generateScopedName: '[name]__[local]___[hash:base64:5]'
    //       }
    //     }
    //   },
    //   webpackChain(chain) {
    //     chain.resolve.plugin('tsconfig-paths').use(TsconfigPathsPlugin)
    //   }
    // },
    // rn: {
    //   appName: 'taroDemo',
    //   postcss: {
    //     cssModules: {
    //       enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
    //     }
    //   }
    // }
  };
  if (process.env.NODE_ENV === "development") {
    // 本地开发构建配置（不混淆压缩）
    return merge({}, baseConfig, devConfig);
  }
  // 生产构建配置（默认开启压缩混淆等）
  return merge({}, baseConfig, prodConfig);
});
