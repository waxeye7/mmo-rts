<script setup>
import UserIdentifier from "../components/UserIdentifier.vue";
import ActionBubble from "../components/ActionBubble.vue";
import ActionsDashboard from "../components/ActionsDashboard.vue";
import CurrentAction from "../components/CurrentAction.vue";
import { v4 as uuidv4 } from "uuid";
import { io } from "socket.io-client";
</script>

<template>
  <div class="father">
    <div class="header-container">
      <div class="left-section">
        <UserIdentifier
          v-if="user && user.username && userIdentifierInfo[user.username]"
          y
          style="margin-right: 10px"
          :backgroundColor="userIdentifierInfo[user.username].backgroundColor"
          :shape="userIdentifierInfo[user.username].shape"
          :fillColor="userIdentifierInfo[user.username].fillColor"
          :zoom="null"
        />

        <div v-if="timer" class="header-item">
          Time until actions are refilled:
          {{
            timer > 86400
              ? Math.floor(timer / 86400) + " days"
              : timer > 3600
              ? Math.floor(timer / 3600) + " hours"
              : timer > 60
              ? Math.floor(timer / 60) + " minutes"
              : timer + " seconds"
          }}
        </div>
        <div v-if="user" class="header-item">
          Your actions: {{ 10 - user.actions.length }}
        </div>
        <div v-if="user && user.resources" class="resource-item">
          <img class="resource-icon" src="images/icons/gold.png" alt="Gold" />
          <span>Gold: {{ user.resources.gold }}</span>
        </div>
        <div v-if="user && user.resources" class="resource-item">
          <img
            class="resource-icon"
            src="images/icons/wood.png"
            style="margin-bottom: 2px"
            alt="Wood"
          />
          <span>Wood: {{ user.resources.wood }}</span>
        </div>
        <div v-if="user && user.resources" class="resource-item">
          <img
            class="resource-icon"
            src="images/icons/stone.png"
            style="margin-bottom: 2px"
            alt="Stone"
          />
          <span>Stone: {{ user.resources.stone }}</span>
        </div>
        <div v-if="user && user.resources" class="resource-item">
          <img
            class="resource-icon"
            src="images/icons/food.png"
            style="margin-bottom: 2px"
            alt="Wood"
          />
          <span>Food: {{ user.resources.food }}</span>
        </div>
      </div>

      <div class="alerts">
        <transition-group name="fade" tag="div">
          <div class="alert" v-for="alert in alerts" :key="alert.id">
            {{ alert.message }}
          </div>
        </transition-group>
      </div>

      <CurrentAction
        v-if="selectedActionType"
        :actionType="selectedActionType"
        @cancel_target_selection="cancelTargetSelection"
      />

      <CurrentAction
        v-if="hasNothing"
        :actionType="'Placing your first spawn - choose wisely'"
        @cancel_target_selection="cancelTargetSelection"
      />

      <div v-if="user" class="right-section">
        <h1 class="header-item logout-size">
          Logged in as: {{ user.username }}
        </h1>
        <h1 @click="logout" class="logout logout-size">Log Out</h1>
      </div>
    </div>

    <div class="modal-spawn" v-if="confirmFirstSpawnLocationPopup">
      <div class="modal-content-spawn">
        <h3 class="message">Confirm spawn location</h3>
        <div class="buttons">
          <div class="modal-spawn-button" @click="confirmFirstSpawn">
            Confirm
          </div>
          <div class="modal-spawn-button" @click="cancelFirstSpawn">Cancel</div>
        </div>
      </div>
    </div>

    <div v-if="selectedCell" class="info-panel relative">
      <h3>Cell Information</h3>
      <div
        v-if="selectedCell.unit"
        class="user-identifier-absolute-cell-information"
      >
        <UserIdentifier
          v-if="
            selectedCell.unit.owner &&
            selectedCell.unit.owner !== 'game' &&
            userIdentifierInfo[selectedCell.unit.owner]
          "
          :backgroundColor="
            userIdentifierInfo[selectedCell.unit.owner].backgroundColor
          "
          :shape="userIdentifierInfo[selectedCell.unit.owner].shape"
          :fillColor="userIdentifierInfo[selectedCell.unit.owner].fillColor"
          :zoom="null"
        />
      </div>
      <div
        v-if="selectedCell.building"
        class="user-identifier-absolute-cell-information"
      >
        <UserIdentifier
          v-if="
            selectedCell.building.owner &&
            selectedCell.building.owner !== 'game' &&
            userIdentifierInfo[selectedCell.building.owner]
          "
          :backgroundColor="
            userIdentifierInfo[selectedCell.building.owner].backgroundColor
          "
          :shape="userIdentifierInfo[selectedCell.building.owner].shape"
          :fillColor="userIdentifierInfo[selectedCell.building.owner].fillColor"
          :zoom="null"
        />
      </div>
      <div class="first-part-info">
        <div class="info-item">
          <span>X:</span>
          <span>{{ selectedCell.x }}</span>
        </div>
        <div class="info-item">
          <span>Y:</span>
          <span>{{ selectedCell.y }}</span>
        </div>
        <div class="info-item">
          <span>Terrain:</span>
          <span>{{ selectedCell.terrain }}</span>
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

          <div v-if="selectedCell.building.damage" class="info-item">
            <span>Damage:</span>
            <span>{{ selectedCell.building.damage }}</span>
          </div>
          <div v-if="selectedCell.building.range" class="info-item">
            <span>Range:</span>
            <span>{{ selectedCell.building.range }}</span>
          </div>
        </div>
        <div v-if="selectedCell.unit">
          <div v-if="selectedCell.unit.unitType" class="info-item">
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
              >{{ selectedCell.unit.hits }}/{{
                selectedCell.unit.hitsMax
              }}</span
            >
          </div>
          <div v-if="selectedCell.unit.damage" class="info-item">
            <span>Damage:</span>
            <span>{{ selectedCell.unit.damage }}</span>
          </div>
          <div v-if="selectedCell.unit.range" class="info-item">
            <span>Range:</span>
            <span>{{ selectedCell.unit.range }}</span>
          </div>
        </div>
        <div v-if="selectedCell.resource">
          <div class="info-item">
            <span>Resource:</span>
            <span>{{ selectedCell.resource.resourceType }}</span>
          </div>
        </div>
      </div>

      <div class="second-part-info">
        <div class="info-item info-section-image">
          <img v-if="imageSource" :src="imageSource" />
        </div>
        <div v-if="selectedCell.building" class="info-item">
          <div class="progress-bar">
            <div
              class="progress-bar-inner"
              :style="{
                width:
                  (selectedCell.building.hits / selectedCell.building.hitsMax) *
                    100 +
                  '%',
                backgroundColor: getHitsColor(
                  selectedCell.building.hits,
                  selectedCell.building.hitsMax
                ),
              }"
            ></div>
          </div>
        </div>
        <div v-if="selectedCell.unit" class="info-item">
          <div class="progress-bar">
            <div
              class="progress-bar-inner"
              :style="{
                width:
                  (selectedCell.unit.hits / selectedCell.unit.hitsMax) * 100 +
                  '%',
                backgroundColor: getHitsColor(
                  selectedCell.unit.hits,
                  selectedCell.unit.hitsMax
                ),
              }"
            ></div>
          </div>
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
              <div class="cell-wrapper">
                <button
                  class="actual-cell"
                  @click="
                    if (
                      !selectedCell ||
                      selectedCell.x !== cell.x ||
                      selectedCell.y !== cell.y
                    ) {
                      actionPopup ? selectTargetCell(cell) : selectCell(cell);
                    } else if (!actionPopup) {
                      selectedCell = null;
                    } else if (actionPopup) addAlert('cannot target itself');
                  "
                  :style="getCellStyle(cell)"
                >
                  <UserIdentifier
                    v-if="
                      cell.unit ||
                      (cell.building &&
                        userIdentifierInfo[
                          (cell.unit && cell.unit.owner) ||
                            (cell.building && cell.building.owner)
                        ])
                    "
                    :backgroundColor="
                      userIdentifierInfo &&
                      userIdentifierInfo[
                        (cell.unit && cell.unit.owner) ||
                          (cell.building && cell.building.owner)
                      ] &&
                      userIdentifierInfo[
                        (cell.unit && cell.unit.owner) ||
                          (cell.building && cell.building.owner)
                      ].backgroundColor
                    "
                    :shape="
                      userIdentifierInfo &&
                      userIdentifierInfo[
                        (cell.unit && cell.unit.owner) ||
                          (cell.building && cell.building.owner)
                      ] &&
                      userIdentifierInfo[
                        (cell.unit && cell.unit.owner) ||
                          (cell.building && cell.building.owner)
                      ].shape
                    "
                    :fillColor="
                      userIdentifierInfo &&
                      userIdentifierInfo[
                        (cell.unit && cell.unit.owner) ||
                          (cell.building && cell.building.owner)
                      ] &&
                      userIdentifierInfo[
                        (cell.unit && cell.unit.owner) ||
                          (cell.building && cell.building.owner)
                      ].fillColor
                    "
                    :zoom="zoom"
                  />
                </button>
                <ActionBubble
                  v-if="
                    selectedCell && selectedCell.x === x && selectedCell.y === y
                  "
                  :cell="cell"
                  :user="user"
                  :chosen="chosen"
                  :zoom="zoom"
                  @action="handleAction"
                  @cancel_target_selection="cancelTargetSelection"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <ActionsDashboard
        v-if="user && user.username && user.actions && user.actions.length"
        style="transition-delay: 100ms"
        :actions="user.actions"
        :board="board"
        :getCellStyle="getCellStyle"
        :timer="timer"
        @cancel-action="cancelAction"
      />
    </div>

    <!-- Question mark button -->
    <button class="help-button" @click="showModal">?</button>

    <!-- Help modal -->
    <div v-if="isModalVisible" class="modal" @click.self="hideModal">
      <div class="modal-content">
        <span @click="hideModal" class="close">&times;</span>
        <h2>Welcome to Our MMO RTS Game!</h2>
        <p>
          This game is a thrilling multiplayer online real-time strategy game
          where players build structures, train units, gather resources, and
          engage in strategic battles in a shared game world. This guide
          introduces you to the game's core mechanics, key concepts, and
          strategic considerations to help you get started.
        </p>
        <h3>Game Mechanics</h3>
        <h4>Structures and Units</h4>
        <p>
          Players can construct strategic structures such as Spawns and Towers,
          and train versatile units including Workers and Axemen. Spawns are
          used to train new units while Towers provide a defensive edge.
        </p>
        <h4>Resources and Biomes</h4>
        <p>
          Efficient resource management is key to success. Players must gather
          and manage four types of resources - gold, wood, stone, and food.
          Exploring and exploiting various biomes like plains, tundra, and
          mountains can yield these resources.
        </p>
        <h4>Actions and Combat</h4>
        <p>
          Every turn, players have a limited number of actions such as building
          structures, training and moving units, attacking enemies, and
          gathering resources. Engage in thrilling combat with your trained
          Axemen or use your Towers for defensive strategies.
        </p>
        <h3>Game Loop</h3>
        <p>
          The server runs a game loop that processes player actions and updates
          the game world at customizable intervals. It processes all queued
          actions, updates the game state and saves it to the database,
          broadcasts the updated game state to all connected clients, resets the
          actions queue, and updates the next task timestamp.
        </p>
        <h3>Strategic Considerations</h3>
        <p>
          It's important to strategize your moves considering the game mechanics
          and the order of actions. The game processes action types in the
          following order: construction, spawning, resource gathering,
          conflicts, and then movement. This means that even if your worker is
          killed on the same turn it gathers resources, the resource will still
          be stockpiled before the worker is removed.
        </p>
        <p>
          Please note that within each action type, the specific actions are
          processed in a random order. This adds an element of unpredictability
          and requires you to think on your feet.
        </p>
        <p>
          Also, keeping track of your resource spending is crucial. As you
          construct buildings, train units, and perform actions, your resources
          deplete. Make sure to balance your spending and resource gathering to
          ensure steady growth.
        </p>
        <p>
          Make sure to plan your moves and use your limited actions per turn
          wisely. We hope this guide helps you get started with our game. Dive
          in, strategize, and conquer. Good luck and have fun!
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      confirmFirstSpawnLocationPopup: false,
      hasNothing: false,
      alerts: [],
      chosen: false,

      user: null,
      userIdentifierInfo: {},
      board: [],

      selectedCell: null,
      targetCell: null,
      actionPopup: false,
      selectedActionType: null,
      timer: 0,
      zoom: 0.4,
      originX: 0,
      originY: 0,
      isDragging: false,
      dragging: false,
      dragStartX: 0,
      dragStartY: 0,
      isModalVisible: false,
      imageMapping: {
        units: {
          worker: "/images/units/worker.png",
          axeman: "/images/units/axeman.png",
          archer: "/images/units/archer.png",
          deer: "/images/units/deer.png",
          // ... other unit types
        },
        buildings: {
          structureSpawn: "/images/buildings/structureSpawn.png",
          structureTower: "/images/buildings/structureTower.png",
          // ... other building types
        },
        terrain: {
          plains: "/images/terrain/plains.png",
          mountain: "/images/terrain/mountain.png",
          tundra: "/images/terrain/tundra.png",
        },
        resources: {
          gold: "/images/resources/gold.png",
          gold2: "/images/resources/gold2.png",
          wood: "/images/resources/wood.png",
          stone: "images/resources/stone.png",
          food: "images/resources/food.png",
          // ... other resource types
        },
      },
    };
  },
  computed: {
    actionButtonsPosition() {
      if (!this.selectedCell) return {};
      const cellSize = 100;
      const x = this.selectedCell.x * cellSize;
      const y = this.selectedCell.y * cellSize;
      return {
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
      };
    },
    imageSource() {
      if (this.selectedCell.unit) {
        return this.imageMapping.units[this.selectedCell.unit.unitType];
      } else if (this.selectedCell.building) {
        return this.imageMapping.buildings[
          this.selectedCell.building.structureType
        ];
      } else if (this.selectedCell.resource) {
        if (
          this.selectedCell.resource.resourceType === "gold" &&
          this.selectedCell.terrain === "plains"
        ) {
          return this.imageMapping.resources["gold2"];
        }
        return this.imageMapping.resources[
          this.selectedCell.resource.resourceType
        ];
      } else {
        return this.imageMapping.terrain[this.selectedCell.terrain];
      }
    },
  },
  methods: {
    async confirmFirstSpawn() {
      let cell = this.confirmFirstSpawnLocationPopup;
      if (
        cell &&
        this.board[cell.y] &&
        this.board[cell.x] &&
        !cell.unit &&
        !cell.building &&
        !cell.resource
      ) {
        try {
          const details = { cell }; // Replace with the desired cell position
          const response = await fetch(
            `${process.env.VUE_APP_API_URL}/users/placefirstspawn`,
            {
              method: "POST",
              credentials: "include", // This is required to include the cookie in the request.
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(details),
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
          }
        } catch (error) {
          console.error("Error building first spawn:", error);
        }
        if (
          this.user &&
          !this.user.buildings.length &&
          !this.user.units.length
        ) {
          this.hasNothing = true;
        } else {
          this.hasNothing = false;
        }
      } else {
        this.addAlert("invalid location for spawn location");
      }
      this.confirmFirstSpawnLocationPopup = false;
    },
    cancelFirstSpawn() {
      this.confirmFirstSpawnLocationPopup = false;
    },
    addAlert(message) {
      const id = Date.now(); // Unique ID for the alert
      this.alerts.push({ id, message });

      setTimeout(() => {
        this.alerts = this.alerts.filter((alert) => alert.id !== id);
      }, 5000);
    },
    connectToSocket() {
      // Disconnect the current socket if it exists
      if (this.$socket) {
        this.$socket.disconnect();
      }

      // Connect to the socket
      this.$socket = io(process.env.VUE_APP_API_URL, {
        withCredentials: true,
      });

      // Emit the loggedIn event
      this.$socket.emit("loggedIn");
    },
    sendAction(action) {
      this.$socket.emit("action", action);
    },
    handleAction(action, creator) {
      const buildAction = (action) => {
        let structureType;
        if (action === "build spawn") {
          structureType = "structureSpawn";
        } else if (action === "build tower") {
          structureType = "structureTower";
        }
        // Define the cost of the structure
        const structureCost = {
          structureSpawn: 1500,
          structureTower: 750,
        };
        // Check if the user has enough gold
        if (this.user.resources.gold >= structureCost[structureType]) {
          // Deduct the cost from the user's gold
          this.user.resources.gold -= structureCost[structureType];

          let payload = {
            x: this.selectedCell.x,
            y: this.selectedCell.y,
            username: this.user.username,
            structureType: structureType,
          };

          if (creator) payload.creatorId = creator.id;

          // Send the action
          this.sendAction({
            id: uuidv4(),
            type: action,
            payload,
          });
        } else {
          this.addAlert("Not enough gold to build", structureType + ".");
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
        };
        if (
          this.selectedActionType === "move worker" ||
          this.selectedActionType === "move axeman" ||
          this.selectedActionType === "move archer" ||
          this.selectedActionType === "spawn worker" ||
          this.selectedActionType === "spawn axeman" ||
          this.selectedActionType === "spawn archer" ||
          this.selectedActionType === "axeman attack" ||
          this.selectedActionType === "worker attack" ||
          this.selectedActionType === "worker mine" ||
          this.selectedActionType === "archer shoot" ||
          this.selectedActionType === "tower shoot"
        ) {
          if (!this.user.resources) {
            this.addAlert("Please relogin");
            this.logout();
            return;
          }
          // if (
          //   !checkUserCanAffordAction(
          //     this.selectedActionType,
          //     this.user.resources
          //   )
          // ) {
          //   this.addAlert("Not enough resources to perform this action");
          //   return;
          // }
          this.sendAction({
            id: uuidv4(),
            type: this.selectedActionType,
            payload: actionPayload,
          });
        }

        this.actionPopup = false;
        this.selectedActionType = null;
        this.chosen = false;
        this.selectedCell = null;
      };

      const actionsMap = {
        "build tower": () => buildAction("build tower"),
        "build spawn": () => buildAction("build spawn"),
        "move worker": () => moveOrShootOrMineAction("move worker"),
        "move axeman": () => moveOrShootOrMineAction("move axeman"),
        "move archer": () => moveOrShootOrMineAction("move archer"),

        "worker mine": () => moveOrShootOrMineAction("worker mine"),
        "tower shoot": () => moveOrShootOrMineAction("tower shoot"),
        "axeman attack": () => moveOrShootOrMineAction("axeman attack"),
        "worker attack": () => moveOrShootOrMineAction("worker attack"),
        "archer shoot": () => moveOrShootOrMineAction("archer shoot"),
        "spawn worker": () => moveOrShootOrMineAction("spawn worker"),
        "spawn axeman": () => moveOrShootOrMineAction("spawn axeman"),
        "spawn archer": () => moveOrShootOrMineAction("spawn archer"),
      };

      if (Object.prototype.hasOwnProperty.call(actionsMap, action)) {
        actionsMap[action]();
      } else {
        console.error("Invalid action type:", action);
      }
    },

    onActionClick(actionType) {
      if (actionType === "spawn worker" && this.user.resources.gold < 150) {
        this.addAlert("Not enough gold to spawn a worker.");
        return;
      }
      if (actionType === "spawn axeman" && this.user.resources.gold < 250) {
        this.addAlert("Not enough gold to spawn an axeman.");
        return;
      }
      if (actionType === "spawn archer" && this.user.resources.gold < 300) {
        this.addAlert("Not enough gold to spawn an archer.");
        return;
      }
      this.actionPopup = true;
      this.selectedActionType = actionType;
      this.targetCell = null;
      this.chosen = true;
    },
    selectTargetCell(cell) {
      this.targetCell = cell;
      let creator;

      this.handleAction(this.selectedActionType, creator);
    },
    cancelTargetSelection() {
      this.selectedCell = null;
      this.actionPopup = false;
      this.selectedActionType = null;
      this.targetCell = null;
      this.chosen = false;
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
          (cell.unit && cell.unit.owner === this.user?.username) ||
          (cell.building && cell.building.owner === this.user?.username);
        baseStyle.border = ownedByUser ? "1px solid green" : "1px solid red";
      }

      if ((cell.unit && cell.unit.owner === "game") || this.zoom <= 0.35)
        baseStyle.border = "none";

      if (cell === this.selectedCell) {
        baseStyle.border = "2px solid blue !important";
        baseStyle.filter = "brightness(1.05)";
      }

      if (cell.building) {
        if (cell.building.structureType === "structureSpawn") {
          backgroundImageUrl = "/images/buildings/structureSpawn.png";
        } else if (cell.building.structureType === "structureTower") {
          backgroundImageUrl = "/images/buildings/structureTower.png";
        }
      } else if (cell.unit && cell.unit.unitType === "worker") {
        backgroundImageUrl = "/images/units/worker.png";
      } else if (cell.unit && cell.unit.unitType === "axeman") {
        backgroundImageUrl = "/images/units/axeman.png";
      } else if (cell.unit && cell.unit.unitType === "archer") {
        backgroundImageUrl = "/images/units/archer.png";
      } else if (cell.unit && cell.unit.unitType === "deer") {
        backgroundImageUrl = "/images/units/deer.png";
      } else if (
        cell.resource &&
        cell.resource.resourceType === "gold" &&
        cell.terrain === "mountain"
      ) {
        backgroundImageUrl = "/images/resources/gold.png";
      } else if (
        cell.resource &&
        cell.resource.resourceType === "gold" &&
        cell.terrain === "plains"
      ) {
        backgroundImageUrl = "/images/resources/gold2.png";
      } else if (cell.resource && cell.resource.resourceType === "wood") {
        backgroundImageUrl = "/images/resources/wood.png";
      } else if (cell.resource && cell.resource.resourceType === "stone") {
        backgroundImageUrl = "/images/resources/stone.png";
      } else if (cell.terrain === "plains") {
        backgroundImageUrl = "/images/terrain/plains.png";
      } else if (cell.terrain === "tundra") {
        backgroundImageUrl = "/images/terrain/tundra.png";
      } else if (cell.terrain === "mountain") {
        backgroundImageUrl = "/images/terrain/mountain.png";
      }

      if (
        cell.unit &&
        cell.unit.owner !== this.user?.username &&
        this.zoom <= 0.35
      )
        baseStyle.backgroundColor = "red";

      if (backgroundImageUrl) {
        baseStyle.backgroundImage = `url("${backgroundImageUrl}")`;
        baseStyle.backgroundPosition = "center";
        // if (cell.resource) baseStyle.backgroundColor = "black";
      }

      // // Identifier style
      // if (cell.unit || cell.building) {
      //   const identifierSize = this.zoom <= 0.5 ? 20 : 100;
      //   const identifierPosition = this.zoom <= 0.5 ? "0 0" : "center";
      //   baseStyle.backgroundColor = cell.user.identifier.backgroundColor;
      //   baseStyle.backgroundPosition = identifierPosition;
      //   baseStyle.backgroundSize = `${identifierSize}px ${identifierSize}px`;
      //   baseStyle.borderColor = cell.user.identifier.fillColor;
      // }

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
        case "move archer":
          return noUnitBuildingResource && isInRangeOne;
        case "spawn worker":
        case "spawn axeman":
        case "spawn archer":
          return noUnitBuildingResource && !cell.building && isInRangeOne;
        case "axeman attack":
        case "worker attack":
          return isInRangeOne && (cell.unit || cell.building);
        case "archer shoot":
          return (
            this.isInRange(this.selectedCell, cell, 2) &&
            (cell.unit || cell.building)
          );
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
      try {
        const response = await fetch(
          process.env.VUE_APP_API_URL + `/users/me`,
          {
            credentials: "include", // This is required to include the cookie in the request.
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        const user = await response.json();
        this.user = user;
        console.log(user);
      } catch (error) {
        console.error("Error fetching user by ID:", error);
        this.logout();
      }
    },
    selectCell(cell) {
      if (this.isDragging) {
        return;
      }
      if (this.selectedActionType) {
        return;
      }
      if (this.hasNothing) {
        this.confirmFirstSpawnLocationPopup = cell;
        return;
      }
      this.chosen = false;
      this.selectedCell = cell;
    },
    handleWheel(event) {
      event.preventDefault();

      const container = this.$el.querySelector(".scroll-container");
      const boardContainer = this.$el.querySelector(".board-container");
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left; // x position within the element.
      const y = event.clientY - rect.top; // y position within the element.

      const oldZoom = this.zoom;

      if (event.deltaY < 0) {
        this.zoom = Math.min(this.zoom + 0.075, 3); // Limit max zoom level (e.g., 3)
      } else {
        if (this.zoom <= 0.3) return;
        this.zoom = Math.max(this.zoom - 0.075, 0.3); // Limit min zoom level (e.g., 0.35)
      }

      const newZoom = this.zoom;

      // The following calculations essentially figure out the new "center"
      // based on the mouse position and adjust the scroll position accordingly.
      const mousePointToCenterX = x - container.scrollLeft;
      const mousePointToCenterY = y - container.scrollTop;
      const newX =
        mousePointToCenterX * (newZoom / oldZoom) - mousePointToCenterX;
      const newY =
        mousePointToCenterY * (newZoom / oldZoom) - mousePointToCenterY;

      container.scrollLeft += newX;
      container.scrollTop += newY;

      // Apply the scale to the board container
      boardContainer.style.transform = `scale(${newZoom})`;
    },
    startDrag(event) {
      event.preventDefault();
      this.dragging = true;
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
      // Attach mousemove event handler
      this.$el.addEventListener("mousemove", this.mouseMoveHandler);
    },
    endDrag() {
      this.dragging = false;
      this.$el.removeEventListener("mousemove", this.mouseMoveHandler);
      setTimeout(() => {
        this.isDragging = false;
      }, 50);
    },
    mouseMoveHandler() {
      this.isDragging = true;
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

    async logout() {
      try {
        const response = await fetch(
          process.env.VUE_APP_API_URL + `/auth/logout`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Error logging out.");
        }
        this.$router.push("/login");
      } catch (error) {
        console.error("Error logging out:", error);
        alert("Error logging out. Please try again.");
      }
    },
    showModal() {
      this.isModalVisible = true;
    },
    hideModal() {
      this.isModalVisible = false;
    },
    getHitsColor(hits, hitsMax) {
      const percentage = hits / hitsMax;
      if (percentage > 0.5) {
        return "green";
      } else if (percentage > 0.25) {
        return "orange";
      } else {
        return "red";
      }
    },
    async getAllUserIdentifiers() {
      try {
        const response = await fetch(
          process.env.VUE_APP_API_URL + `/users/all`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const usersInfo = await response.json();
        this.userIdentifierInfo = usersInfo;
      } catch (error) {
        console.error("Error fetching user by ID:", error);
        this.logout();
      }
    },
    async cancelAction(id) {
      try {
        const response = await fetch(
          process.env.VUE_APP_API_URL + `/users/actions/${id}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (response.ok) {
          this.user.actions = this.user.actions.filter(
            (action) => action.id !== id
          );
        } else {
          console.error(`Failed to cancel action: ${response.statusText}`);
        }
      } catch (error) {
        console.error(`Failed to cancel action: ${error}`);
        this.logout();
      }
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
    this.$socket.off("serverRestart");
    this.$socket.off("authentication_error");

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
    this.connectToSocket();
    // get signed in user's object
    await this.fetchUserById();
    if (this.user && !this.user.buildings.length && !this.user.units.length) {
      this.hasNothing = true;
    } else {
      this.hasNothing = false;
    }
    // Set up the socket listeners
    this.$socket.on("updateBoard", (newBoard) => {
      console.log("Received updated board:", newBoard);
      this.selectedActionType = null;
      this.selectedCell = null;
      this.actionPopup = false;
      this.board = newBoard;
    });

    this.$socket.on("updateTimer", (timerValue) => {
      this.timer = timerValue;
    });

    this.$socket.on("updateUser", (updatedUser) => {
      this.user = updatedUser;
      if (
        this.user &&
        !this.user.buildings &&
        !this.user.units &&
        this.user.resources.gold === 300
      ) {
        this.hasNothing = true;
      } else {
        this.hasNothing = false;
      }
    });

    this.$socket.on("actionsReset", async () => {
      await this.fetchUserById();
    });

    this.$socket.on("serverRestart", () => {
      alert("You have been logged out due to a server restart.");

      this.logout();
    });

    this.$socket.on("authentication_error", () => {
      alert("You have been logged out due to an authentication error.");
      this.logout();
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

    this.getAllUserIdentifiers();
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
.progress-bar {
  background-color: #ddd;
  /* border-radius: 3px; */
  overflow: hidden;
  width: 100%;
}

.progress-bar-inner {
  height: 14px;
  /* border-radius: 3px; */
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #1d1e22;
  max-height: 50px;
  position: relative;
}

.left-section,
.right-section {
  display: flex;
  align-items: center;
  color: rgb(240, 240, 240);
}

.header-item {
  margin-right: 1rem;
  font-weight: 600;
  color: rgb(240, 240, 240);
}
.left-section div,
.logout-size {
  font-size: clamp(9px, 1.6vw, 18px);
}

.resource-item {
  display: flex;
  align-items: center;
  margin-right: 1.5rem;
}

.resource-icon {
  width: 26px;
  height: 26px;
  margin-right: 5px;
}

.logout {
  cursor: pointer;
  color: #61dafb;
  font-weight: 600;
  text-decoration: underline;
}
.logout:hover {
  color: #3fa7c4;
}
/* .logout {
  border: 2px solid black;
  padding: 2px;
  cursor: pointer;
  margin: 0;
} */
.right-side {
  margin-left: auto;
  margin-right: 6px;
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
  top: 70px;
  width: 260px;
  background-color: #1d1e22;
  color: rgb(240, 240, 240);
  padding: 16px;
  z-index: 2;
  border-radius: 0 0 0 6px;
}
.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* .first-part-info {
  min-height: 154px;
} */
.info-section-image {
  max-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.info-section-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.outer-container {
  position: relative;
  overflow: hidden;
  width: 100vw;
  height: calc(100vh - 70px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.scroll-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
}
.scroll-container:active {
  cursor: move !important;
}

.board-container {
  margin: 0 auto;
  position: relative;
  transform-origin: right;
  transition: transform 0.3s;
  padding: 240px;
  width: fit-content;
}

/* Help button */
.help-button {
  position: fixed;
  bottom: 14px;
  left: 14px;
  font-size: 24px;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  line-height: 50px;
  text-align: center;
  background-color: #333;
  color: rgb(240, 240, 240);
  cursor: pointer;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease-in-out;
  z-index: 999;
}

.help-button:hover {
  background-color: #666666;
  transform: scale(1.1);
  box-shadow: 0 2px 20px 0 rgba(0, 0, 0, 0.3);
}
.modal-spawn {
  position: fixed;
  z-index: 1000000000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.4);
}
.buttons {
  display: flex;
}
.modal-content-spawn {
  background-color: #1a1a1a;
  border: 1px solid #333333;
  border-radius: 8px;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.2);
  width: 80%;
  max-width: 600px;
  margin: 5% auto;
  padding: 30px;
  position: relative;
  animation-name: animatetop;
  animation-duration: 0.4s;
  font-family: "Helvetica Neue", Arial, sans-serif;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.modal-spawn-button {
  border: 1px black solid;
  width: 170px;
  text-align: center;
  padding: 14px 10px;
  cursor: pointer;
  margin: 0.5rem 0;
  transition: transform 0.4s ease-out;
  margin: 0 8px;
}
.modal-spawn-button:hover {
  background-color: #000000;
  transform: scale(1.075);
}
.modal-spawn-button:active {
  background-color: #000000;
  transform: scale(0.95);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
}
.modal {
  position: fixed;
  z-index: 1000000000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.4);
}

.modal-content {
  background-color: #1a1a1a;
  border: 1px solid #333333;
  border-radius: 8px;
  box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.2);
  width: 80%;
  max-width: 600px;
  margin: 5% auto;
  padding: 30px;
  position: relative;
  animation-name: animatetop;
  animation-duration: 0.4s;
  font-family: "Helvetica Neue", Arial, sans-serif;
}

@keyframes animatetop {
  from {
    top: -300px;
    opacity: 0;
  }
  to {
    top: 0;
    opacity: 1;
  }
}

.modal-content h2,
.modal-content h3,
.modal-content h4 {
  color: #eeeeee;
  margin-bottom: 10px;
}

.modal-content p {
  color: #bbbbbb;
  line-height: 1.6;
  margin-bottom: 20px;
}

.modal-content .close {
  color: #aaaaaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.modal-content .close:hover,
.modal-content .close:focus {
  color: rgb(240, 240, 240);
  text-decoration: none;
  cursor: pointer;
}
.cell-wrapper {
  box-sizing: border-box;
  position: relative;
  max-width: 100px;
  max-height: 100px;
  margin: 0;
  padding: 0;
  border: none;
  outline: none;
}
.actual-cell:hover {
  filter: brightness(1.1);
}
.father {
  background-color: #1d1e22f1;
  overflow: hidden;
}
.user-identifier-absolute-cell-information {
  border: 1px rgb(240, 240, 240) solid;
  position: absolute;
  top: 0;
  right: 0;
}
.actual-cell {
  display: flex;
  align-items: flex-start;
  background-repeat: no-repeat;
  background-size: cover;
  margin: 0;
  padding: 0;
  outline: none;
}
.alerts {
  position: fixed;
  top: 70px;
  left: 0;
  padding: 10px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 9999;
}

.alert {
  margin-top: 10px;
  background-color: #e74c3c;
  color: rgb(240, 240, 240);
  padding: 10px;
  border-radius: 5px;
  opacity: 0.9;
  transition: opacity 0.5s;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s;
}

.fade-leave-to {
  opacity: 0;
}
.first-spawn-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent black background */
  z-index: 1231535362653151;
}
.first-spawn-modal-popup-content {
  max-width: 400px;
  padding: 20px;
  background-color: #000;
  color: #fff;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
