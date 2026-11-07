<template>
  <div style="padding: 20px;">
    <h1>我是 qiankun 主应用</h1>
    
    <!-- 导航按钮，利用 history API 改变 URL 触发 qiankun 匹配 -->
    <nav style="margin-bottom: 20px;">
      <button @click="goHome">回到主页</button>
      <button @click="goSubApp" style="margin-left: 10px;">打开子应用</button>
    </nav>

    <!-- 子应用挂载容器，ID 必须和 main.js 里的 container 一致 -->
    <div id="sub-container"></div>
  </div>
</template>

<script setup>
const goHome = () => {
  window.history.pushState(null, '', '/')
}

const goSubApp = () => {
  window.history.pushState(null, '', '/sub-vue')
}
</script>