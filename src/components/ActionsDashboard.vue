<template>
  <div class="actions-dashboard">
    <h2>Pending Actions</h2>
    <div v-for="(action, index) in actions" :key="index" class="action-item">
      <div v-if="action.payload && action.type">
        <p>{{ action.type }}</p>
        <p v-if="action.payload.targetX">
          {{ action.payload.x }} -> {{ action.payload.targetX }}
        </p>
        <p v-if="action.payload.targetY">
          {{ action.payload.y }} -> {{ action.payload.targetY }}
        </p>
        <button @click="cancelAction(action.id)">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ActionsDashboard",
  props: {
    actions: {
      type: Array,
      required: true,
    },
  },
  methods: {
    cancelAction(id) {
      this.$emit("cancel-action", id);
    },
  },
};
</script>

<style scoped>
.actions-dashboard {
  z-index: 5000;
  position: fixed;
  bottom: 0;
  right: 0;
  padding: 20px;
  background-color: #1d1e22;
  color: white;
  border-radius: 6px 0 0 0;
  width: 260px;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

button {
  margin-left: 10px;
}
</style>
