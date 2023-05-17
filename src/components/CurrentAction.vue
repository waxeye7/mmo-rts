<template>
  <div class="action-selector" v-show="actionType">
    <h3 class="action-title">
      Selecting Action Location for: {{ actionType }}
    </h3>
    <button @click="$emit('cancel_target_selection')" class="cancel-button">
      Cancel Action
    </button>
  </div>
</template>
<script>
export default {
  props: {
    actionType: {
      type: String,
      required: true,
    },
  },

  methods: {},
};
</script>

<style scoped>
@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
.action-selector {
  animation: fadeIn 0.4s ease-out;

  position: absolute;
  top: 70px; /* adjust this value based on your header height */
  left: 50%;
  transform: translateX(-50%);
  background-image: linear-gradient(#1d1e22, #101113);
  padding: 20px;
  border-radius: 0 0 10px 10px;
  width: 80%;
  max-width: 500px;
  text-align: center;
  color: rgb(240, 240, 240);
  z-index: 999999999;
}

.action-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  text-transform: uppercase;
}

.cancel-button {
  padding: 10px 20px;
  background-color: #e74c3c;
  color: rgb(240, 240, 240);
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cancel-button:hover {
  background-color: #c0392b;
}
</style>
