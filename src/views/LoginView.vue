<script setup>
import UserIdentifier from "../components/UserIdentifier.vue";
import { io } from "socket.io-client";
</script>
<template>
  <div id="app">
    <header>
      <h1>MMO RTS</h1>
      <p class="connected-users">Connected Users: {{ connectedUsers }}</p>
      <p class="version-number">Version: {{ version }}</p>
    </header>
    <div class="main">
      <div v-if="!selectedForm">
        <button class="decider-button" @click="selectForm('login')">
          Login
        </button>
        <button class="decider-button" @click="selectForm('signup')">
          Signup
        </button>
      </div>

      <div v-if="selectedForm === 'login'" class="form-container">
        <h1>Login</h1>
        <form @submit.prevent="login">
          <label for="login-username">Username:</label>
          <input
            id="login-username"
            v-model="loginForm.username"
            type="text"
            required
          />

          <label for="login-password">Password:</label>
          <input
            id="login-password"
            v-model="loginForm.password"
            type="password"
            required
          />

          <button type="submit">Login</button>
        </form>
        <button @click="goBack">Back</button>
      </div>

      <div v-if="selectedForm === 'signup'" class="form-container">
        <h1>Signup</h1>
        <form @submit.prevent="signup">
          <label for="signup-username">Username:</label>
          <input
            id="signup-username"
            v-model="signupForm.username"
            type="text"
            required
          />

          <label for="signup-password">Password:</label>
          <input
            id="signup-password"
            v-model="signupForm.password"
            type="password"
            required
          />

          <label for="signup-password-confirm">Confirm Password:</label>
          <input
            id="signup-password-confirm"
            v-model="signupForm.passwordConfirm"
            type="password"
            required
          />
          <h3
            style="margin: 10px 0 12px 0; font-size: 20px"
            class="text-align-center"
          >
            Avatar
          </h3>
          <div class="center-and-maximise-width">
            <div class="input-block">
              <!-- Input fields for background color and fill color -->
              <label for="background-color">Background color:</label>
              <input
                id="background-color"
                type="color"
                v-model="signupForm.identifier.backgroundColor"
              />
            </div>

            <div class="input-block">
              <label for="fill-color">Fill color:</label>
              <input
                id="fill-color"
                type="color"
                v-model="signupForm.identifier.fillColor"
              />
            </div>

            <div class="input-block" style="margin-bottom: 0.6rem">
              <!-- Input field for shape -->
              <label for="shape">Shape:</label>
              <select id="shape" v-model="signupForm.identifier.shape">
                <option value="circle">Circle</option>
                <option value="square">Square</option>
                <option value="triangle">Triangle</option>
                <option value="ellipse">Ellipse</option>
                <option value="rhombus">Rhombus</option>
                <option value="star">Star</option>
                <option value="hexagon">Hexagon</option>
                <option value="trapezoid">Trapezoid</option>
                <option value="candle">Candle</option>
                <option value="arrow">Arrow</option>
                <option value="tetris">Tetris</option>
                <option value="stick">Stick</option>
              </select>
            </div>

            <UserIdentifier
              style="margin: 0 auto"
              :backgroundColor="signupForm.identifier.backgroundColor"
              :shape="signupForm.identifier.shape"
              :fillColor="signupForm.identifier.fillColor"
            />
          </div>
          <button
            style="width: 100%"
            class="button margin-center"
            type="submit"
          >
            Signup
          </button>
        </form>
        <button @click="goBack">Back</button>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      connectedUsers: 0, // This would be updated via socket
      version: "1.0.0", // This would be updated as needed
      selectedForm: null,
      loginForm: {
        username: "",
        password: "",
      },
      signupForm: {
        username: "",
        password: "",
        passwordConfirm: "",
        identifier: {
          backgroundColor: "#000000",
          shape: "circle",
          fillColor: "#ffffff",
        },
      },
    };
  },
  methods: {
    connectToSocket() {
      // Disconnect the current socket if it exists
      if (this.$socket) {
        this.$socket.disconnect();
      }

      // Connect to the socket
      this.$socket = io("http://localhost:3000", { withCredentials: true });

      // Emit the loggedIn event
      this.$socket.emit("loggedIn");
    },
    selectForm(form) {
      this.selectedForm = form;
    },
    goBack() {
      this.selectedForm = null;
    },
    async login() {
      try {
        const response = await fetch(`http://localhost:3000/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: this.loginForm.username,
            password: this.loginForm.password,
          }),
          credentials: "include", // Include cookies in the request
        });

        if (!response.ok) {
          throw new Error("Error logging in.");
        }

        const data = await response.json();
        console.log("Login response:", data);

        this.$socket.emit("loggedIn");
        this.connectToSocket();

        this.$router.push("/");
      } catch (error) {
        console.error("Error logging in:", error);
        alert("Error logging in. Please check your username and password.");
      }
    },
    async signup() {
      if (this.signupForm.password !== this.signupForm.passwordConfirm) {
        alert("Passwords do not match!");
        return;
      }
      console.log("Signup data:", this.signupForm);
      try {
        const response = await fetch(`http://localhost:3000/auth/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: this.signupForm.username,
            password: this.signupForm.password,
            identifier: this.signupForm.identifier,
          }),
          credentials: "include", // Include cookies in the request
        });

        if (!response.ok) {
          throw new Error("Error signing up.");
        }

        const data = await response.json();
        console.log("Signup response:", data);

        this.$socket.emit("loggedIn");
        this.connectToSocket();

        this.$router.push("/");
      } catch (error) {
        console.error("Error signing up:", error);
        alert("Error signing up. Please check your input.");
      }
    },
  },
  beforeUnmount() {
    this.$socket.off("user count");
  },
  created() {
    this.$socket.on("user count", (numUsers) => {
      this.connectedUsers = numUsers;
    });
  },
};
</script>

<style scoped>
.center-and-maximise-width {
  width: 200px;
  margin: 0 auto;
}
.center-and-maximise-width .input-block {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
.center-and-maximise-width .input-block input {
  margin-left: auto;
}

.shape-input {
  display: flex;
  flex-direction: column;
  align-items: center;
}

#shape {
  font-size: 1.2em;
}
#app {
  background-color: #1d1e22f1;
  color: #fff;
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  /* background: url("path_to_your_image.jpg") no-repeat center center fixed; */
  -webkit-background-size: cover;
  -moz-background-size: cover;
  -o-background-size: cover;
  background-size: cover;
}

header {
  pointer-events: none;
  display: flex;
  padding: 0 2rem;
  align-items: center;
  background-color: #1d1e22;
  color: #ffffff;
  height: 70px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2);
}
header * {
  flex: 1;
}

h1 {
  margin: 0;
}

.version-number {
  font-size: 1.2em;
  text-align: end;
}

.connected-users {
  font-size: 1em;
  text-align: center;
}

.main {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 70px);
}

.decider-button {
  background-color: #1d1e22;
  border: 1px solid #fff;
  color: #fff;
  padding: 1.2em 3em;
  margin: 0.5em;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

.decider-button:hover {
  background-color: #686868;
  color: #fff;
}

.form-container {
  background-color: #1d1e22;
  color: #fff;
  padding: 1em;
  margin-top: 1em;
  width: 300px;
  border: 1px solid #fff;
  border-radius: 5px;
}

form {
  display: flex;
  flex-direction: column;
}

label,
input {
  margin-bottom: 0.5em;
}

button {
  cursor: pointer;
  background-color: #fff;
  color: #1d1e22;
  padding: 0.5em;
  margin-top: 1em;
}

button:hover {
  background-color: #686868;
  color: #fff;
}

button:disabled {
  background-color: #999;
  color: #ccc;
}
</style>
