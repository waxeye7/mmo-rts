<template>
  <div class="action-bubble">
    <div class="actions-list">
      <button
        v-for="(action, index) in availableActions"
        :key="index"
        :style="getButtonPosition(index)"
        @click="
          action === 'Cancel Action'
            ? $emit('cancel_target_selection')
            : $emit('action', action)
        "
      >
        {{ action }}
      </button>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    cell: {
      type: Object,
      required: true,
    },
    user: {
      type: Object,
      required: true,
    },
  },
  computed: {
    availableActions() {
      let actions = [];

      // Check if the current user owns the unit or building
      if (
        this.cell.resource ||
        (this.cell.unit && this.cell.unit.owner !== this.user.username) ||
        (this.cell.building && this.cell.building.owner !== this.user.username)
      ) {
        return actions;
      }

      if (this.cell.unit) {
        if (this.cell.unit.unitType === "worker") {
          actions.push("move worker", "worker mine");
        } else if (this.cell.unit.unitType === "axeman") {
          actions.push("move axeman", "axeman attack");
        }
      } else if (this.cell.building) {
        if (this.cell.building.structureType === "structureSpawn") {
          actions.push("spawn worker", "spawn axeman");
        } else if (this.cell.building.structureType === "structureTower") {
          actions.push("tower shoot");
        }
      } else {
        actions.push("build spawn", "build tower");
      }

      // Add the "Cancel Action" as a separate action only if there are other actions
      if (actions.length > 0) {
        actions.push("Cancel Action");
      }
      return actions;
    },
  },
  methods: {
    getButtonPosition(index) {
      const angle = (2 * Math.PI * index) / this.availableActions.length;
      const radius = 94; // Adjust the radius to position the buttons
      const x = radius * Math.cos(angle) + 15;
      const y = radius * Math.sin(angle) + 64;

      return {
        position: "absolute",
        left: `calc(50% - 15px + ${x}px)`, // Subtract half of the button width (15px) from the left position
        top: `calc(50% - 15px + ${y}px)`, // Subtract half of the button height (15px) from the top position
        transform: "translate(-50%, -50%)", // Center the button relative to the calculated position
      };
    },
  },
};
</script>

<style scoped>
.cell-wrapper {
  position: relative;
}
.actions-list {
  position: relative;
}
.action-bubble {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

.action-bubble button {
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid black;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  position: absolute;
  /* Center the button to the container */
  transform: translate(-50%, -50%);
  pointer-events: auto;
}
</style>
