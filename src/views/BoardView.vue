<template>
  <div>
    <div class="flex no-pointer-events">
      <h1 v-if="timer > 86400" class="mr-4">
        Days until actions are refilled: {{ Math.floor(timer / 86400) }}
      </h1>
      <h1 v-else-if="timer > 3600" class="mr-4">
        Hours until actions are refilled: {{ Math.floor(timer / 3600) }}
      </h1>
      <h1 v-else-if="timer > 60" class="mr-4">
        Minutes until actions are refilled: {{ Math.floor(timer / 60) }}
      </h1>
      <h1 v-else class="mr-4">
        Seconds until actions are refilled: {{ timer }}
      </h1>
      <h1 v-if="user" class="mr-4">Your actions: {{ user.actions }}</h1>
      <h1 v-if="user" class="mr-4">Logged in as: {{ user.username }}</h1>
    </div>

    <div v-if="selectedCell && user" class="actions-panel">
      <h3>Actions</h3>
      <div
        v-if="
          selectedCell.building &&
          selectedCell.building.structureType === 'structureSpawn' &&
          selectedCell.building.owner === user.username
        "
      >
        <div @click="handleAction('spawn worker')" class="button">
          Spawn Worker
        </div>
        <div @click="handleAction('spawn axeman')" class="button">
          Spawn Axeman
        </div>
      </div>

      <div
        v-if="
          selectedCell.building &&
          selectedCell.building.structureType === 'structureTower' &&
          selectedCell.building.owner === user.username
        "
      >
        <div @click="handleAction('tower shoot')" class="button">
          Tower Shoot
        </div>
      </div>

      <div
        v-if="
          selectedCell.unit &&
          selectedCell.unit.owner === user.username &&
          selectedCell.unit.unitType === 'worker'
        "
      >
        <div @click="handleAction('move worker')" class="button">Move</div>
        <div @click="handleAction('worker mine')" class="button">Mine</div>
      </div>

      <div
        v-if="
          !selectedCell.unit && !selectedCell.resource && !selectedCell.building
        "
      >
        <div @click="handleAction('build spawn')" class="button">
          Build Spawn
        </div>
        <div @click="handleAction('build tower')" class="button">
          Build Tower
        </div>
      </div>

      <div v-if="actionPopup && selectedActionType" class="button">
        <div @click="cancelTargetSelection">Cancel Action</div>
      </div>
    </div>

    <div v-if="selectedCell" class="info-panel">
      <h3>Cell Information</h3>
      <div class="info-item">
        <span>X:</span>
        <span>{{ selectedCell.x }}</span>
      </div>
      <div class="info-item">
        <span>Y:</span>
        <span>{{ selectedCell.y }}</span>
      </div>
      <div v-if="selectedCell.building">
        <div class="info-item">
          <span>Structure:</span>
          <span>{{ selectedCell.building.structureType }}</span>
        </div>
        <div class="info-item">
          <span>Owner:</span>
          <span>{{ selectedCell.building.owner }}</span>
        </div>
        <div class="info-item">
          <span>Hits:</span>
          <span>{{ selectedCell.building.hits }}</span>
        </div>
        <div class="info-item">
          <span>Max Hits:</span>
          <span>{{ selectedCell.building.hitsMax }}</span>
        </div>
      </div>
      <div v-if="selectedCell.unit">
        <div class="info-item">
          <span>Unit:</span>
          <span>{{ selectedCell.unit.unitType }}</span>
        </div>
        <div class="info-item">
          <span>Owner:</span>
          <span>{{ selectedCell.unit.owner }}</span>
        </div>
        <div class="info-item">
          <span>Hits:</span>
          <span>{{ selectedCell.unit.hits }}</span>
        </div>
        <div class="info-item">
          <span>Max Hits:</span>
          <span>{{ selectedCell.unit.hitsMax }}</span>
        </div>
      </div>
      <div v-if="selectedCell.resource">
        <div class="info-item">
          <span>Resource:</span>
          <span>{{ selectedCell.resource.resourceType }}</span>
        </div>
      </div>
      <!-- Add more properties as needed -->
    </div>

    <div class="outer-container">
      <div
        class="scroll-container"
        @wheel="handleWheel"
        @mousedown="startDrag"
        @mouseup="endDrag"
        @mouseleave="endDrag"
        @mousemove="moveCamera"
      >
        <div
          class="board-container"
          :style="{
            transform: 'scale(' + zoom + ')',
            transformOrigin: originX + 'px ' + originY + 'px',
          }"
        >
          <div v-for="(row, y) in board" :key="y" style="display: flex">
            <div v-for="(cell, x) in row" :key="x">
              <button
                @click="
                  if (
                    !selectedCell ||
                    selectedCell.x !== cell.x ||
                    selectedCell.y !== cell.y
                  ) {
                    actionPopup ? selectTargetCell(cell) : selectCell(cell);
                  } else if (!actionPopup) {
                    selectedCell = null;
                  } else if (actionPopup) sendAlert('cannot target itself');
                "
                :style="getCellStyle(cell)"
              ></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      user: null,
      board: [],
      selectedCell: null,
      targetCell: null,
      actionPopup: false,
      selectedActionType: null,
      timer: 0,
      zoom: 1,
      originX: 0,
      originY: 0,
      dragging: false,
      dragStartX: 0,
      dragStartY: 0,
    };
  },
  methods: {
    sendAction(action) {
      this.$socket.emit("action", action);
    },
    handleAction(action) {
      if (action === "build tower") {
        this.sendAction({
          type: "build",
          payload: {
            x: this.selectedCell.x,
            y: this.selectedCell.y,
            username: this.user.username,
            structureType: "structureTower",
            userId: this.user._id,
          },
        });
      } else if (action === "build spawn") {
        this.sendAction({
          type: "build",
          payload: {
            x: this.selectedCell.x,
            y: this.selectedCell.y,
            username: this.user.username,
            structureType: "structureSpawn",
            userId: this.user._id,
          },
        });
      } else if (action === "move worker") {
        if (!this.actionPopup || !this.selectedActionType)
          this.onActionClick(action);
        else {
          if (this.isValidActionTarget(this.targetCell)) {
            this.sendAction({
              type: "move worker",
              payload: {
                x: this.selectedCell.x,
                y: this.selectedCell.y,
                targetX: this.targetCell.x,
                targetY: this.targetCell.y,
                username: this.user.username,
                userId: this.user._id,
              },
            });
            this.actionPopup = false;
            this.selectedActionType = null;
          } else {
            alert("Invalid Location");
          }
        }
      } else if (action === "worker mine") {
        if (this.isValidActionTarget(this.targetCell)) {
          this.sendAction({
            type: "mine",
            payload: {
              x: this.selectedCell.x,
              y: this.selectedCell.y,
              username: this.user.username,
              userId: this.user._id,
            },
          });
        } else {
          alert("Invalid Location");
        }
      } else if (action === "tower shoot") {
        if (!this.actionPopup || !this.selectedActionType)
          this.onActionClick(action);
        else {
          if (this.isValidActionTarget(this.targetCell)) {
            this.sendAction({
              type: "tower shoot",
              payload: {
                x: this.selectedCell.x,
                y: this.selectedCell.y,
                targetX: this.targetCell.x,
                targetY: this.targetCell.y,
                username: this.user.username,
                userId: this.user._id,
              },
            });
            this.actionPopup = false;
            this.selectedActionType = null;
          } else {
            alert("Invalid Location");
          }
        }
      } else if (action === "spawn worker") {
        if (!this.actionPopup || !this.selectedActionType)
          this.onActionClick(action);
        else {
          if (this.isValidActionTarget(this.targetCell)) {
            this.sendAction({
              type: "spawn worker",
              payload: {
                x: this.selectedCell.x,
                y: this.selectedCell.y,
                targetX: this.targetCell.x,
                targetY: this.targetCell.y,
                username: this.user.username,
                userId: this.user._id,
              },
            });
            this.actionPopup = false;
            this.selectedActionType = null;
          } else {
            alert("Invalid Location");
          }
        }
      }
    },
    onActionClick(actionType) {
      this.actionPopup = true;
      this.selectedActionType = actionType;
      this.targetCell = null;
    },
    selectTargetCell(cell) {
      this.targetCell = cell;
      this.handleAction(this.selectedActionType);
    },
    cancelTargetSelection() {
      this.actionPopup = false;
      this.selectedActionType = null;
      this.targetCell = null;
    },
    getCellStyle(cell) {
      const baseStyle = {
        // backgroundColor: "black",
        width: "100px",
        height: "100px",
      };

      if (this.actionPopup) {
        if (this.isValidActionTarget(cell)) {
          baseStyle["filter"] = "brightness(1.05)";
        } else {
          baseStyle["filter"] = "brightness(0.4)";
        }
      }

      if (cell.unit || cell.building) {
        if (
          (cell.unit && cell.unit.owner === this.user.username) ||
          (cell.building && cell.building.owner === this.user.username)
        )
          baseStyle.border = "2px solid green";
        else baseStyle.border = "2px solid red";
        // baseStyle.=
      }

      if (cell === this.selectedCell) {
        baseStyle.border = "2px solid blue !important";
      }

      if (cell.building && cell.building.structureType === "structureSpawn") {
        return {
          ...baseStyle,
          backgroundImage: 'url("/images/hut.jpg")',
          backgroundSize: "cover",
        };
      }
      if (cell.building && cell.building.structureType === "structureTower") {
        return {
          ...baseStyle,
          backgroundImage: 'url("/images/tower.jpg")',
          backgroundSize: "cover",
        };
      }
      if (cell.unit && cell.unit.unitType === "worker") {
        return {
          ...baseStyle,
          backgroundImage: 'url("/images/worker.jpg")',
          backgroundSize: "cover",
        };
      }
      if (cell.resource && cell.resource.resourceType === "gold") {
        return {
          ...baseStyle,
          backgroundImage: 'url("/images/gold.avif")',
          backgroundSize: "cover",
        };
      }
      // Add more conditions for other structure types here

      return baseStyle;
    },
    isValidActionTarget(cell) {
      if (!this.selectedActionType) {
        return false;
      }
      if (
        this.selectedActionType === "mine" ||
        this.selectedActionType === "build"
      ) {
        return this.isInRange(this.selectedCell, cell, 1);
      } else if (this.selectedActionType === "move worker") {
        return (
          !cell.unit &&
          !cell.building &&
          !cell.resource &&
          this.isInRange(this.selectedCell, cell, 1)
        );
      } else if (this.selectedActionType === "spawn worker") {
        return (
          !cell.unit &&
          !cell.resource &&
          !cell.building &&
          this.isInRange(this.selectedCell, cell, 1)
        );
      } else if (this.selectedActionType === "tower shoot") {
        return (
          this.isInRange(this.selectedCell, cell, 3) &&
          (cell.unit || cell.building)
        );
      } else {
        return true;
      }
    },
    isInRange(cell1, cell2, range) {
      if (!cell1 || !cell2) {
        return false;
      }
      const xDistance = Math.abs(cell1.x - cell2.x);
      const yDistance = Math.abs(cell1.y - cell2.y);

      return xDistance <= range && yDistance <= range;
    },
    async fetchUserById() {
      const userId = sessionStorage.getItem("userId");
      const token = sessionStorage.getItem("token");

      try {
        const response = await fetch(`http://localhost:3000/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const user = await response.json();
        this.user = user;
        console.log(user);
      } catch (error) {
        console.error("Error fetching user by ID:", error);
      }
    },
    selectCell(cell) {
      this.selectedCell = cell;
    },
    handleWheel(event) {
      event.preventDefault();

      const container = this.$el.querySelector(".scroll-container");
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const oldZoom = this.zoom;

      if (event.deltaY < 0) {
        this.zoom += 0.1;
      } else {
        if (this.zoom > 0.2) {
          this.zoom -= 0.1;
        }
      }

      const offsetX = x / oldZoom - x / this.zoom;
      const offsetY = y / oldZoom - y / this.zoom;

      container.scrollLeft += offsetX * this.zoom;
      container.scrollTop += offsetY * this.zoom;
    },
    startDrag(event) {
      event.preventDefault();
      this.dragging = true;
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
    },
    endDrag() {
      this.dragging = false;
    },
    moveCamera(event) {
      if (!this.dragging) return;

      const container = this.$el.querySelector(".scroll-container");
      const deltaX = event.clientX - this.dragStartX;
      const deltaY = event.clientY - this.dragStartY;

      container.scrollLeft -= deltaX;
      container.scrollTop -= deltaY;

      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
    },
    sendAlert(message) {
      alert(message);
    },
  },
  beforeUnmount() {
    // Remove the socket listeners
    this.$socket.off("updateBoard");
    this.$socket.off("updateTimer");
    this.$socket.off("updateUser");
    this.$socket.off("actionsReset");
    this.$socket.off("warning");
    this.$socket.off("forceLogout");

    this.$el
      .querySelector(".scroll-container")
      .removeEventListener("mouseleave", this.handleMouseUp);
  },
  mounted() {
    this.$el
      .querySelector(".scroll-container")
      .addEventListener("mouseleave", this.handleMouseUp);
  },
  async created() {
    // get signed in user's object
    await this.fetchUserById();

    // Set up the socket listeners
    this.$socket.on("updateBoard", (newBoard) => {
      console.log("Received updated board:", newBoard);

      this.board = newBoard;
    });

    this.$socket.on("updateTimer", (timerValue) => {
      this.timer = timerValue;
    });

    this.$socket.on("updateUser", (updatedUser) => {
      this.user = updatedUser;
    });

    this.$socket.on("actionsReset", async () => {
      await this.fetchUserById();
    });

    this.$socket.on("serverRestart", () => {
      alert("You have been logged out due to a server restart.");
      sessionStorage.removeItem("userId");
      sessionStorage.removeItem("token");
      this.$router.push("/login");
    });

    // Listen for 'warning' and 'forceLogout' events
    this.$socket.on("warning", (message) => {
      alert(message);
    });

    this.$socket.on("forceLogout", () => {
      alert("You have been logged out due to excessive action attempts.");
      sessionStorage.removeItem("userId");
      sessionStorage.removeItem("token");
      this.$router.push("/login");
    });

    // Request the initial board state from the server
    this.$socket.emit("getInitialValues");

    setInterval(() => {
      if (this.timer > 0) {
        this.timer -= 1;
      }
    }, 1000);
  },
  // watch: {
  //   board: {
  //     handler(newBoard) {
  //       this.board = newBoard;
  //       this.$nextTick(() => {
  //         this.$forceUpdate();
  //       });
  //     },
  //     deep: true,
  //   },
  // },
};
</script>

<style scoped>
.selected {
  border: 2px solid red;
}
.actions-panel {
  position: absolute;
  right: 240px;
  top: 0;
  width: 240px;
  background-color: rgba(255, 255, 255, 1);
  border-right: 1px solid #ccc;
  padding: 16px;
  z-index: 2;
}
.info-panel {
  position: absolute;
  right: 0;
  top: 0;
  width: 240px;
  background-color: rgba(255, 255, 255, 1);
  border-left: 1px solid #ccc;
  padding: 16px;
  z-index: 2;
}
.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.outer-container {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 86vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.scroll-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
}
.board-container {
  position: relative;
  transform-origin: top left;
  transition: transform 0.3s;
}
</style>
