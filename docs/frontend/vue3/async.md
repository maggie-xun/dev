1. defineAsyncComponent
2. ES模块和 defineAsyncComponent 结合使用

   ```js
   import { defineAsyncComponent } from 'vue'

   const AsyncComp = defineAsyncComponent(() => import('./components/MyComponent.vue'))
   ```

3. 加载和错误状态

```js
const AsyncComp = defineAsyncComponent({
  loader: import(''),
  loadingComponent: LoadingComponent,
  delay: 200,
  errorComponent: ErrorComponent,
  timeout: 3000
})
```

4. 搭配suspense
