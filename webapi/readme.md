47.102.207.108
数据库：HanJianNet
数据库用户名：hanjian
数据库密码：fwp900209.


打包脚本
dotnet publish -c Release -r linux-x64 --self-contained false


useEffect 执行两次

是 React 18 开发模式的 StrictMode 导致的，不是后端问题。
web/src/main.tsx:8 启用了 <React.StrictMode>。React 18 的 StrictMode 在开发环境会对组件「挂载→卸载→再挂载」，导致 Home.tsx:98-101 的 useEffect 执行两次，于是 GET /api/traitors?page=1&pageSize=20 也会连带发两次。
这是官方预期行为（用于暴露副作用问题），生产构建 npm run build 后不会双调用。确认的方法：看请求的两条记录是否是 StrictMode 触发——通常只在 dev 下。