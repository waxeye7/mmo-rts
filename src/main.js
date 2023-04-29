import { createApp } from 'vue'
import App from './App.vue'
import "./assets/styles/index.css"
import socket from './scripts/socket';
import router from "./router";

const app = createApp(App);
app.use(router);
app.mixin({
  beforeCreate() {
    this.$socket = socket;
  },
});
app.mount('#app');