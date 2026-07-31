<template>
  <div class="action-selector" v-show="actionType">
    <h3 v-if="actionType === 'Placing your first spawn - choose wisely'">
      {{ actionType }}
    </h3>

    <h3 v-else class="action-title">
      Selecting Action Location for: {{ actionType }}
    </h3>
    <button
      v-if="actionType !== 'Placing your first spawn - choose wisely'"
      @click="$emit('cancel_target_selection')"
      class="cancel-button"
    >
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
  background-color: var(--panel);
  border: 1px solid var(--line);
  border-top: none;
  padding: 18px 20px;
  border-radius: 0 0 var(--radius) var(--radius);
  box-shadow: var(--shadow);
  width: 80%;
  max-width: 500px;
  text-align: center;
  color: var(--parchment);
  z-index: 999999999;
}

.action-title {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 700;
  margin-bottom: 15px;
}

.cancel-button {
  padding: 9px 20px;
  background-color: transparent;
  color: var(--parchment-dim);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  font-family: var(--font-ui);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.cancel-button:hover {
  border-color: var(--rust);
  color: var(--parchment);
}
</style>
