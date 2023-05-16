<template>
  <div class="action-bubble">
    <div class="actions-list">
      <button
        v-for="(action, index) in availableActions"
        :key="index"
        :style="getButtonPosition(index)"
        @click="
          action.actionName === 'Cancel Action'
            ? $emit('cancel_target_selection')
            : $emit('action', action.actionName)
        "
        class="action-button"
      >
        <font-awesome-icon :icon="action.icon" />
        <span>{{ action.actionName }}</span>
        <div v-if="action.cost" class="cost-label">
          <i :class="`fa fa-${action.cost.type}`"></i>
          {{ action.cost.amount }}
        </div>
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
          actions.push(
            { actionName: "move worker", icon: "people-carry-box" },
            { actionName: "worker mine", icon: "people-carry-box" }
          );
        } else if (this.cell.unit.unitType === "axeman") {
          actions.push(
            { actionName: "move axeman", icon: "people-carry-box" },
            { actionName: "axeman attack", icon: "people-carry-box" }
          );
        }
      } else if (this.cell.building) {
        if (this.cell.building.structureType === "structureSpawn") {
          actions.push(
            {
              actionName: "spawn worker",
              icon: "people-carry-box",
              cost: { type: "gold", amount: 150 },
            },
            {
              actionName: "spawn axeman",
              icon: "people-carry-box",
              cost: { type: "gold", amount: 250 },
            }
          );
        } else if (this.cell.building.structureType === "structureTower") {
          actions.push({ actionName: "tower shoot", icon: "people-carry-box" });
        }
      } else {
        actions.push(
          {
            actionName: "build spawn",
            icon: "people-carry-box",
            cost: { type: "gold", amount: 1500 },
          },
          {
            actionName: "build tower",
            icon: "people-carry-box",
            cost: { type: "gold", amount: 750 },
          }
        );
      }

      // Add the "Cancel Action" as a separate action only if there are other actions
      if (actions.length > 0) {
        actions.push({ actionName: "Cancel Action", icon: "people-carry-box" });
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
.action-bubble {
  position: absolute;
  width: 100%;
  height: 100%;
  top: -50px;
  left: 0;
  pointer-events: none;
}

.action-button {
  z-index: 100000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
  border: 1px solid #cccccc;
  border-radius: 10px;
  width: 120px; /* Wider width */
  height: 80px;
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: auto;
  transition: all 0.2s ease-in-out;
  font-size: 14px; /* Smaller font size */
  color: #333;
  padding: 5px; /* Padding for better layout */
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1); /* Shadow for 3D effect */
  text-align: center; /* Center the text */
}
.action-button span {
  font-size: 18px;
}

.action-button:hover {
  background: #ebebeb;
  transform: translate(-50%, -50%) scale(1.05);
}

.action-button i {
  margin-bottom: 5px;
}

.action-button span {
  margin-bottom: 5px;
}

.cost-label {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #dddddd;
  color: #333;
  font-size: 12px;
  padding: 2px 5px;
  border-radius: 5px;
}

.cost-label i {
  margin-right: 5px;
}
</style>
