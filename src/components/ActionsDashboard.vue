<template>
  <div>
    <div
      v-show="!expanded"
      @click="toggleVisibility"
      class="curved-maximiser"
    ></div>

    <div
      v-if="actions && board && getCellStyle"
      class="actions-dashboard overflow-scroll-y"
      :class="expanded && timerGreaterThanOne ? 'big' : 'small'"
    >
      <div class="relative">
        <div v-if="expanded" @click="toggleVisibility" class="curved-minimiser">
          <div></div>
        </div>
      </div>
      <div class="relative">
        <h2 style="margin: -6px 0 14px 0px" class="text-align-center">
          Pending Actions
        </h2>
        <div
          v-for="(action, index) in actions"
          :key="index"
          class="action-item"
        >
          <div
            v-if="
              action &&
              action.payload &&
              action.type &&
              action.payload.x &&
              action.payload.y &&
              action.payload.username &&
              action.id
            "
            @click="cancelAction(action.id)"
            class="action-container"
          >
            <div class="content-wrapper">
              <h3 class="action-type text-align-center">
                {{ action.type }}
              </h3>

              <div class="flex">
                <div
                  v-if="
                    board &&
                    action &&
                    action?.payload &&
                    action?.payload?.x &&
                    action?.payload?.y
                  "
                  class="cell-wrapper"
                  :style="
                    getCellStyle(board[action.payload.y][action.payload.x])
                  "
                  style="border: none; background-size: cover"
                ></div>
                <div
                  v-if="action.payload.targetX && action.payload.targetY"
                  class="cell-wrapper"
                  :style="
                    getCellStyle(
                      board[action.payload.targetY][action.payload.targetX]
                    )
                  "
                  style="margin-left: 1px border: none; background-size: cover;"
                ></div>
              </div>

              <div class="flex justify-content-center">
                <p v-if="action.payload.x && action.payload.y">
                  x:{{ action.payload.x }}, y:{{ action.payload.y }}
                </p>
                <img
                  v-if="action.payload.targetX && action.payload.targetY"
                  style="width: 18px; height: 18px; margin: auto 0"
                  src="../../public/images/icons/arrow-right.png"
                  alt=""
                />
                <p v-if="action.payload.targetY">
                  x:{{ action.payload.targetX }}, y:{{ action.payload.targetY }}
                </p>
              </div>
            </div>

            <div class="cancel-action">Cancel Action</div>
            <div class="cover"></div>
          </div>
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
    board: {
      type: Array,
      required: true,
    },
    getCellStyle: {
      type: Function,
      required: true,
    },
    timer: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      expanded: this.timer > 1,
      timerGreaterThanOne: this.timer > 1,
    };
  },
  watch: {
    timer(newVal) {
      this.timerGreaterThanOne = newVal > 1;
    },
  },
  methods: {
    cancelAction(id) {
      this.$emit("cancel-action", id);
    },
    toggleVisibility() {
      if (this.timerGreaterThanOne) {
        this.expanded = !this.expanded;
      }
    },
  },
};
</script>

<style scoped>
h2 {
  margin: 0;
}
.cell-wrapper {
  max-height: 80px;
  max-width: 80px;
}
.cell-wrapper div {
  height: 100%;
  width: 100%;
}
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
  /* border-radius: 6px 0 0 0; */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9000;
  cursor: pointer;
}
.curved-minimiser div {
  margin-left: 8px;
  margin-right: 10px;
  height: 4px;
  width: 20px;
  background-color: white;
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
  -ms-overflow-style: none; /* Internet Explorer and Edge */
  scrollbar-width: none; /* Firefox */
}
.actions-dashboard::-webkit-scrollbar {
  display: none;
}

.action-item {
  border: 1px white solid;
  padding: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

button {
  margin-left: 10px;
}
.big {
  width: 260px;
  height: calc(96.5vh - 70px);
}
.small {
  height: 20px;
  width: 20px;
  overflow: hidden;
}
.small * {
  display: none;
}
.action-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  cursor: pointer;
  padding: 6px 0;
  position: relative; /* Needed for absolute positioning of cancel-action */
  transition: background-color 0.3s ease; /* This will animate the background color */
}

.content-wrapper {
  opacity: 1;
  transition: opacity 0.3s ease;
}

.cancel-action {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none; /* Prevents click events on this element when it's not visible */
  font-size: 20px;
  text-align: center;
  width: 100%;
  padding: 4px 0;
  background-color: rgba(0, 0, 0, 1);
}

.action-container:hover {
  background-color: rgba(
    0,
    0,
    0,
    0.9
  ); /* Your hover background color, semi-transparent black in this case */
}

.action-container:hover .content-wrapper {
  opacity: 0.75;
}

.action-container:hover .cancel-action {
  opacity: 1;
}
p {
  margin: 8px 0;
}
</style>
