import { createApp } from 'vue'
import App from './App.vue'
import "./assets/styles/index.css"
import socket from './scripts/socket';
import router from "./router";

import { library } from '@fortawesome/fontawesome-svg-core'
import { faUserSecret } from '@fortawesome/free-solid-svg-icons'
import { faPeopleCarryBox } from '@fortawesome/free-solid-svg-icons'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faUserSecret, faPeopleCarryBox);



const app = createApp(App);
app.component('font-awesome-icon', FontAwesomeIcon);
app.use(router);
app.mixin({
  beforeCreate() {
    this.$socket = socket;
  },
});
app.mount('#app');