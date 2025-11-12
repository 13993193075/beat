import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

// 判断是否为生产环境（通过运行命令时传入的环境变量判断）
const isProduction = process.env.NODE_ENV === 'production';

export default {
    // 1. 入口文件
    input: 'src/index.js',

    // 2. 插件列表 (Rollup 是通过插件扩展功能的)
    plugins: [
        // 允许 Rollup 导入 node_modules 中的依赖
        resolve(),

        // 将 CommonJS 模块（如某些 npm 包）转换为 ES6，以便 Rollup 处理
        commonjs(),

        // 只有在生产环境才启用代码压缩
        isProduction && terser()
    ],

    // 3. 输出配置
    output: [
        {
            // CommonJS 格式 (通常用于 Node.js 环境，对应 package.json 的 "main")
            file: 'dist/index.cjs.js',
            format: 'cjs',
            sourcemap: true,
        },
        {
            // ES Module 格式 (通常用于现代浏览器和打包工具，对应 package.json 的 "module")
            file: 'dist/index.esm.js',
            format: 'esm',
            sourcemap: true,
        }
    ],
};