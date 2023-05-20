import { createRouter, createWebHistory } from "vue-router";

import BoardView from "../views/BoardView.vue";
import LoginView from "../views/LoginView.vue";
import userAuth from "./middlewares/userAuth";
import guestOnly from "./middlewares/guestOnly";

const routes = [
    {
      path:'/',
      name:'Board',
      component: BoardView,
      beforeEnter: userAuth,
    },
    {
      path:'/login',
      name:'Login',
      component: LoginView,
      beforeEnter: guestOnly,
    }
  ];

const router = createRouter({
    history:createWebHistory('/'),
    routes
})

export default router;