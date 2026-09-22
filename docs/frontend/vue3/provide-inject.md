1. provide 为组件后代提供数据

   ```js
   import {provide} from vue
   const key=ref(0)
   provide('key',key)
   ```

2. inject。注入上层数据提供的数据
   如果提供的是一个ref的数据，那么会保持响应式

3. 尽量将对响应式数据的变更保留在提供方，
   如果注入方确实需要更改提供的数据，提供方 可传入一个更改数据的函数
   如果不想让注入方更改注入数据，可提供readonly包装过的值
4. 使用Symbol
   推荐在一个单独文件中保持所有注入名
