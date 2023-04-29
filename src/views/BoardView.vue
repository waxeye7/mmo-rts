<template>
  <div>
    <div v-if="user && timer" class="flex">
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
      <h1 class="mr-4">Your actions: {{ user.actions }}</h1>
      <h1 class="mr-4">Logged in as: {{ user.username }}</h1>
    </div>

    <div v-for="(row, y) in board" :key="y" style="display: flex">
      <div v-for="(cell, x) in row" :key="x">
        <button
          @click="
            sendAction({
              type: 'place',
              payload: {
                x: cell.x,
                y: cell.y,
                username: user.username,
                structureType: 'structureSpawn',
                userId: user._id,
              },
            })
          "
          :style="getCellStyle(cell)"
        ></button>
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
      timer: 0,
    };
  },
  methods: {
    sendAction(action) {
      this.$socket.emit("action", action);
    },
    getCellStyle(cell) {
      const baseStyle = {
        // backgroundColor: "black",
        width: "70px",
        height: "70px",
      };

      if (cell.building && cell.building.structureType === "structureSpawn") {
        return {
          ...baseStyle,
          backgroundImage: 'url("/images/hut.jpg")',
          backgroundSize: "cover",
        };
      }
      // Add more conditions for other structure types here

      return baseStyle;
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
  },
  async created() {
    // get signed in user's object
    await this.fetchUserById();

    // Set up the socket listeners
    this.$socket.on("updateBoard", (newBoard) => {
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

    // Listen for 'warning' and 'forceLogout' events
    this.$socket.on("warning", (message) => {
      alert(message);
    });

    this.$socket.on("forceLogout", () => {
      alert("You have been logged out due to excessive action attempts.");
      sessionStorage.clear();
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
};
</script>

<style scoped></style>
