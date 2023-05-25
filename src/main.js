import { createApp } from "vue/dist/vue.esm-bundler";
import App from "./App.vue";
import "./assets/styles/index.css";
import socket from "./scripts/socket";
import router from "./router";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faUserSecret,
  faPeopleCarryBox,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import panZoom from "vue-panzoom";

library.add(faUserSecret, faPeopleCarryBox);

const app = createApp(App);
app.component("font-awesome-icon", FontAwesomeIcon);
app.use(panZoom);

app.use(router);
app.mixin({
  beforeCreate() {
    this.$socket = socket;
  },
});
app.mount("#app");
