1.  ```js
    <child v-bind='$attrs' />
    ```
2.  透传是指没有被props 和emits声明的attribute或v-on事件监听，一般是class id style
3.  在 <script setup> 中使用 useAttrs() API 来访问一个组件的所有透传 attribute：
4.  Vue 2 的 $listeners 在 Vue 3 中去哪了
  移除，合并进$attrs
5.  $attrs不是响应式的，useAttrs()返回也不是响应式的，但模版里能用，因为组件更新会获取
6.  如果想监听$attrs，可以使用onMounted()
7.  多根节点
    不会自动透传，需要显示绑定
    inheritAttrs: false + 手动 v-bind="$attrs" 到指定元素

    ```js
    <main v-bind='$attrs'>...</main>
    ```

8.  如果父组件和子组件都设置了 color，谁生效？
    1.  如果是$attrs透传进来的，则父优先
    2.  如果是style,则父优先
    3.  如果是class,则看class层级

9.  为什么 class 合并逻辑和普通 attrs 不同？

10. 既想透传原生 click，又想组件自己 emit click，怎么办？
    “自动透传原生 click”和“组件自己 emit click”在同一个 @click 上天然冲突
    解决：二选一或者换名字

[封装基础输入框组件的 attrs 设计](https://chat.deepseek.com/share/sm64rq27txmr68l5x5)
