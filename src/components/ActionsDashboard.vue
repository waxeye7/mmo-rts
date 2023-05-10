<template>
  <div
    v-show="!expanded"
    @click="toggleVisibility"
    class="curved-maximiser"
  ></div>

  <div
    class="actions-dashboard overflow-scroll-y"
    :class="expanded ? 'big' : 'small'"
  >
    <div class="relative">
      <div @click="toggleVisibility" v-if="expanded" class="curved-minimiser">
        <div></div>
      </div>
    </div>
    <div class="relative">
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
  data() {
    return {
      expanded: true,
    };
  },
  methods: {
    cancelAction(id) {
      this.$emit("cancel-action", id);
    },
    toggleVisibility() {
      this.expanded = !this.expanded;
    },
  },
};
</script>

<style scoped>
.curved-maximiser {
  position: absolute;
  height: 100px;
  width: 100px;
  background-color: #1d1e22;
  z-index: 5001;
  bottom: -34px;
  right: -34px;
  border-radius: 50%;
}
.curved-minimiser {
  position: absolute;
  top: -16px;
  left: -16px;
  height: 30px;
  width: fit-content;
  background-color: #1d1e22;
  border-radius: 6px 0 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9000;
  cursor: pointer;
}
.curved-minimiser div {
  margin-left: 14px;
  margin-right: 10px;

  height: 4px;
  width: 20px;
  background-color: white;
  border-radius: 4px;
}
.curved-minimiser:hover {
  background-color: white;
}
.curved-minimiser:hover > div {
  background-color: #1d1e22;
}

.actions-dashboard {
  z-index: 5000;
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 16px;
  background-color: #1d1e22;
  color: white;
  border-radius: 6px 0 0 0;
  width: 260px;
  transition: all 0.5s ease;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

button {
  margin-left: 10px;
}
.big {
  width: 260px;
  height: 290px;
}
.small {
  height: 20px;
  width: 20px;
  overflow: hidden;
}
.small * {
  display: none;
}
</style>
