import { createRouter, createWebHistory } from "vue-router";

import BoardView from "../views/BoardView.vue";
import LoginView from "../views/LoginView.vue";
import userAuth from "./middlewares/userAuth";
import guestOnly from "./middlewares/guestOnly";

const boardImages = [
  "/images/icons/gold.png",
  "/images/icons/wood.png",
  "/images/icons/stone.png",
  "/images/icons/food.png",
  "/images/units/worker.png",
  "/images/units/axeman.png",
  "/images/units/archer.png",
  "/images/units/deer.png",
  "/images/buildings/structureSpawn.png",
  "/images/buildings/structureTower.png",
  "/images/terrain/plains.png",
  "/images/terrain/mountain.png",
  "/images/terrain/tundra.png",
  "/images/resources/gold.png",
  "/images/resources/gold2.png",
  "/images/resources/wood.png",
  "/images/resources/stone.png",
];

const routes = [
  {
    path: "/",
    name: "Board",
    component: BoardView,
    beforeEnter: (to, from, next) => {
      preloadImages(boardImages, () => {
        userAuth(to, from, next);
      });
    },
  },
  {
    path: "/spectate",
    name: "Spectate",
    component: BoardView,
    meta: { spectate: true },
    beforeEnter: (to, from, next) => {
      preloadImages(boardImages, () => next());
    },
  },
  {
    path: "/login",
    name: "Login",
    component: LoginView,
    beforeEnter: guestOnly,
  },
];

const router = createRouter({
  history: createWebHistory("/"),
  routes,
});

function preloadImages(imageSources, callback) {
  let loadedCount = 0;
  const totalCount = imageSources.length;

  const onLoad = () => {
    loadedCount++;
    if (loadedCount === totalCount) {
      callback();
    }
  };

  imageSources.forEach((src) => {
    const img = new Image();
    img.onload = onLoad;
    img.src = src;
  });
}

export default router;
