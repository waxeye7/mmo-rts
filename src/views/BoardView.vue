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
      <h1 v-if="user && user.resources" class="mr-4">
        Your gold: {{ user.resources.gold }}
      </h1>
      <!-- <h1 v-if="user && user.resources" class="mr-4">
        Your wood: {{ user.resources.wood }}
      </h1> -->
      <h1 @click="logout" class="logout">Log Out</h1>
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
          selectedCell.unit &&
          selectedCell.unit.owner === user.username &&
          selectedCell.unit.unitType === 'axeman'
        "
      >
        <div @click="handleAction('move axeman')" class="button">Move</div>
        <div @click="handleAction('axeman attack')" class="button">Attack</div>
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
          <span
            >{{ selectedCell.building.hits }}/{{
              selectedCell.building.hitsMax
            }}</span
          >
        </div>
        <div class="info-item">
          <span>Damage:</span>
          <span>{{ selectedCell.building.damage }}</span>
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
          <span
            >{{ selectedCell.unit.hits }}/{{ selectedCell.unit.hitsMax }}</span
          >
        </div>
        <div class="info-item">
          <span>Damage:</span>
          <span>{{ selectedCell.unit.damage }}</span>
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
    <!-- Question mark button -->
    <button class="help-button" @click="showModal">?</button>

    <!-- Help modal -->
    <div v-if="isModalVisible" class="modal" @click.self="hideModal">
      <div class="modal-content">
        <span @click="hideModal" class="close">&times;</span>
        <h2>Welcome to Our MMO RTS Game!</h2>
        <p>
          This game is a multiplayer online real-time strategy game where
          players build and control their own armies to conquer territories and
          defeat their opponents. In this guide, we will introduce you to the
          game's basic mechanics and key concepts to help you get started.
        </p>
        <h3>Turn Lifecycle</h3>
        <p>Each turn in the game consists of the following phases:</p>
        <ol>
          <li>
            <strong>Action Phase:</strong> During this phase, you can perform
            various actions, such as moving units, building structures, and
            attacking enemies. Remember, you have a limited number of actions
            per turn, so use them wisely!
          </li>
          <li>
            <strong>Resolution Phase:</strong> In this phase, all actions taken
            during the Action Phase are resolved. This includes movement,
            battles, and building construction. Some actions might be canceled
            due to other events happening during the Resolution Phase.
          </li>
        </ol>
        <h3>Movement and Action Cancellation</h3>
        <p>
          When you move a unit, keep in mind that its movement might be canceled
          in the following scenarios:
        </p>
        <ul>
          <li>If a new unit spawns at the destination cell.</li>
          <li>If a building is constructed at the destination cell.</li>
          <li>
            If another unit moves to the same destination cell. In this case,
            one of the units will be randomly chosen to occupy the cell, while
            the other unit's movement will be canceled.
          </li>
        </ul>
        <p>
          It's important to strategize and consider these possibilities when
          planning your moves and actions.
        </p>
        <h3>Actions Per Turn</h3>
        <p>
          Each player has a limited number of actions they can perform during
          their turn. Be sure to use your actions wisely and strategically to
          gain an advantage over your opponents. Efficiently managing your
          actions is crucial for success in the game.
        </p>
        <p>
          We hope this information helps you get started with our game. Good
          luck and have fun!
        </p>
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
      isModalVisible: false,
    };
  },
  methods: {
    sendAction(action) {
      this.$socket.emit("action", action);
    },
    handleAction(action) {
      const buildAction = (structureType) => {
        // Define the cost of the structure
        const structureCost = {
          structureSpawn: 1500,
          structureTower: 750,
        };
        // Check if the user has enough gold
        if (this.user.resources.gold >= structureCost[structureType]) {
          // Deduct the cost from the user's gold
          this.user.resources.gold -= structureCost[structureType];

          // Send the action
          this.sendAction({
            type: "build",
            payload: {
              x: this.selectedCell.x,
              y: this.selectedCell.y,
              username: this.user.username,
              structureType: structureType,
              userId: this.user._id,
            },
          });
        } else {
          this.sendAlert("Not enough gold to build this structure.");
        }
      };
      const moveOrShootOrMineAction = (action) => {
        if (!this.selectedActionType || this.selectedActionType !== action) {
          this.onActionClick(action);
          return;
        }
        if (!this.validateTarget(this.targetCell)) return;
        const { x: targetX, y: targetY } = this.targetCell;
        const { x: selectedX, y: selectedY } = this.selectedCell;
        const actionPayload = {
          x: selectedX,
          y: selectedY,
          targetX,
          targetY,
          username: this.user.username,
          userId: this.user._id,
        };
        if (
          this.selectedActionType === "move worker" ||
          this.selectedActionType === "move axeman" ||
          this.selectedActionType === "spawn worker" ||
          this.selectedActionType === "spawn axeman" ||
          this.selectedActionType === "axeman attack" ||
          this.selectedActionType === "worker mine" ||
          this.selectedActionType === "tower shoot"
        ) {
          if (!this.user.resources) {
            this.sendAlert("Please relogin");
            this.logout();
            return;
          }
          // if (
          //   !checkUserCanAffordAction(
          //     this.selectedActionType,
          //     this.user.resources
          //   )
          // ) {
          //   this.sendAlert("Not enough resources to perform this action");
          //   return;
          // }
          this.sendAction({
            type: this.selectedActionType,
            payload: actionPayload,
          });
        }

        this.actionPopup = false;
        this.selectedActionType = null;
      };

      const actionsMap = {
        "build tower": () => buildAction("structureTower"),
        "build spawn": () => buildAction("structureSpawn"),
        "move worker": () => moveOrShootOrMineAction("move worker"),
        "move axeman": () => moveOrShootOrMineAction("move axeman"),
        "worker mine": () => moveOrShootOrMineAction("worker mine"),
        "tower shoot": () => moveOrShootOrMineAction("tower shoot"),
        "axeman attack": () => moveOrShootOrMineAction("axeman attack"),
        "spawn worker": () => moveOrShootOrMineAction("spawn worker"),
        "spawn axeman": () => moveOrShootOrMineAction("spawn axeman"),
      };

      if (Object.prototype.hasOwnProperty.call(actionsMap, action)) {
        actionsMap[action]();
      } else {
        console.error("Invalid action type:", action);
      }
    },

    onActionClick(actionType) {
      if (actionType === "spawn worker" && this.user.resources.gold < 150) {
        this.sendAlert("Not enough gold to spawn a worker.");
        return;
      }
      if (actionType === "spawn axeman" && this.user.resources.gold < 250) {
        this.sendAlert("Not enough gold to spawn an axeman.");
        return;
      }
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
        width: "100px",
        height: "100px",
      };

      let backgroundImageUrl = "";

      if (this.actionPopup) {
        baseStyle["filter"] = this.validateTarget(cell)
          ? "brightness(1.05)"
          : "brightness(0.4)";
      }

      if (cell.unit || cell.building) {
        const ownedByUser =
          (cell.unit && cell.unit.owner === this.user.username) ||
          (cell.building && cell.building.owner === this.user.username);
        baseStyle.border = ownedByUser ? "2px solid green" : "2px solid red";
      }

      if (cell === this.selectedCell) {
        baseStyle.border = "2px solid blue !important";
      }

      if (cell.building) {
        if (cell.building.structureType === "structureSpawn") {
          backgroundImageUrl = "/images/hut.jpg";
        } else if (cell.building.structureType === "structureTower") {
          backgroundImageUrl = "/images/tower.jpg";
        }
      } else if (cell.unit && cell.unit.unitType === "worker") {
        backgroundImageUrl = "/images/worker.jpg";
      } else if (cell.unit && cell.unit.unitType === "axeman") {
        backgroundImageUrl = "/images/axeman.jpg";
      } else if (cell.resource && cell.resource.resourceType === "gold") {
        backgroundImageUrl = "/images/gold.avif";
      }

      if (backgroundImageUrl) {
        baseStyle.backgroundImage = `url("${backgroundImageUrl}")`;
        baseStyle.backgroundSize = "cover";
      }

      return baseStyle;
    },
    validateTarget(cell) {
      if (!cell || !this.selectedCell) {
        return false;
      }

      const isInRangeOne = this.isInRange(this.selectedCell, cell, 1);
      const noUnitBuildingResource =
        !cell.unit && !cell.building && !cell.resource;

      switch (this.selectedActionType) {
        case "build":
          return isInRangeOne;
        case "worker mine":
          return cell.resource && isInRangeOne;
        case "move worker":
        case "move axeman":
          return noUnitBuildingResource && isInRangeOne;
        case "spawn worker":
        case "spawn axeman":
          return noUnitBuildingResource && !cell.building && isInRangeOne;
        case "axeman attack":
          return isInRangeOne && (cell.unit || cell.building);
        case "tower shoot":
          return (
            this.isInRange(this.selectedCell, cell, 3) &&
            (cell.unit || cell.building)
          );
        default:
          return false;
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
    logout() {
      sessionStorage.removeItem("userId");
      sessionStorage.removeItem("token");
      this.$router.push("/login");
    },
    showModal() {
      this.isModalVisible = true;
    },
    hideModal() {
      this.isModalVisible = false;
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
      this.logout();
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
.logout {
  border: 2px solid black;
  padding: 2px;
  cursor: pointer;
}

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
/* Help button */
.help-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  font-size: 24px;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  text-align: center;
  line-height: 50px;
  background-color: #333;
  color: white;
  cursor: pointer;
  z-index: 999;
}

.help-button {
  text-align: center;
  position: fixed;
  bottom: 20px;
  right: 30px;
  font-size: 24px;
  background-color: #000000;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  cursor: pointer;
  transition: all 0.1s ease-in-out;
}
.help-button:hover {
  background-color: #333333;
  scale: 1.1;
}

.modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.4);
}

.modal-content {
  background-color: #fefefe;
  margin: 15% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 80%;
}

.close {
  color: #aaaaaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
}

.close:hover,
.close:focus {
  color: #000;
  text-decoration: none;
  cursor: pointer;
}
</style>
