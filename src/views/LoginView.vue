<script setup>
import UserIdentifier from "../components/UserIdentifier.vue";
import { io } from "socket.io-client";
</script>
<template>
  <div
    id="app"
    :style="{ backgroundImage: 'url(' + bgImage + ')' }"
    class="blur"
  >
    <header>
      <h1 class="title">MMO RTS</h1>
      <p class="connected-users">Connected Users: {{ connectedUsers }}</p>
      <p class="version-number">Version: {{ version }}</p>
    </header>
    <div class="main">
      <div v-if="!selectedForm">
        <button class="decider-button" @click="selectForm('login')">
          Login
        </button>
        <button class="decider-button" @click="selectForm('signup')">
          Sign up
        </button>
      </div>

      <div class="socials">
        <a href="https://github.com/waxeye7/mmo-rts" target="_blank">
          <img src="/images/icons/github-icon.svg" alt="GitHub" />
        </a>

        <a href="https://discord.gg/ptUjrfSRPq" target="_blank">
          <img src="/images/icons/discord-icon.svg" alt="Discord" />
        </a>
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
      bgImage: "",
      connectedUsers: null, // This would be updated via socket
      version: "1.0.1", // This would be updated as needed
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
    selectRandomImage() {
      const images = [
        "/images/misc/background/background.png",
        "/images/misc/background/background2.png",
        "/images/misc/background/background3.png",
        "/images/misc/background/background5.png",
        "/images/misc/background/background6.png",
        "/images/misc/background/background7.png",
        "/images/misc/background/background9.png",
        "/images/misc/background/background11.png",
      ];
      const randomIndex = Math.floor(Math.random() * images.length);
      const selectedImage = images[randomIndex];
      document.documentElement.style.setProperty(
        "--bg-image",
        `url(${selectedImage})`
      );
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
    selectForm(form) {
      this.selectedForm = form;
    },
    goBack() {
      this.selectedForm = null;
    },
    async login() {
      try {
        const response = await fetch(
          process.env.VUE_APP_API_URL + `/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: this.loginForm.username,
              password: this.loginForm.password,
            }),
            credentials: "include", // Include cookies in the request
          }
        );

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
      if (this.signupForm.username === "game") {
        alert(
          "Username cannot be 'game', please don't use a reserved username."
        );
        return;
      }
      if (this.signupForm.password !== this.signupForm.passwordConfirm) {
        alert("Passwords do not match!");
        return;
      }
      console.log("Signup data:", this.signupForm);
      try {
        const response = await fetch(
          process.env.VUE_APP_API_URL + `/auth/signup`,
          {
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
          }
        );

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
  async beforeUnmount() {
    this.$socket.off("user count");
  },

  mounted() {
    setTimeout(() => {
      document.getElementById("app").classList.remove("blur");
    }, 100); // Wait a bit for the page to load before starting the transition

    // Define the socket event handler
    const handleUserCount = (numUsers) => {
      console.log("updating number of users");
      this.connectedUsers = numUsers;
    };

    // Register the socket event handler
    this.$socket.on("user count", handleUserCount);

    // Emit an event to request the current count of connected users
    this.$socket.emit("get user count");

    this.selectRandomImage();
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
/* background-image: url("../../public/images/misc/background/background3.png"); */

#app::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: var(--bg-image);
  background-repeat: no-repeat;
  background-position: 0% 0%; /* position the image at the top */

  background-size: cover;
  -webkit-background-size: cover;
  -moz-background-size: cover;
  -o-background-size: cover;
  filter: blur(50px);
  animation: blurFade 3s forwards, backgroundPan 60s infinite linear;
  z-index: -1;
}

@keyframes blurFade {
  to {
    filter: blur(0px);
  }
}

@keyframes backgroundPan {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
#app {
  background-color: #1d1e229a;
  color: rgb(240, 240, 240);
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
}
header {
  pointer-events: none;
  display: flex;
  padding: 0 2rem;
  align-items: center;
  background-color: #1d1e22;
  color: rgb(240, 240, 240);
  height: 70px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
}
header * {
  flex: 1;
}

h1 {
  margin: 0;
}

.version-number {
  font-size: clamp(12px, 3vw, 16px);

  text-align: end;
}

.connected-users {
  font-size: clamp(12px, 3vw, 16px);
  text-align: center;
}

.main {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 70px);
}

.decider-button {
  font-size: clamp(16px, 2.4vw, 24px);
  background-color: #1d1e22;
  border: 1px solid rgb(240, 240, 240);
  color: rgb(240, 240, 240);
  padding: 1.2em 3em;
  margin: 0.5em;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

.decider-button:hover {
  background-color: #686868;
  color: rgb(240, 240, 240);
}

.form-container {
  background-color: #1d1e22;
  color: rgb(240, 240, 240);
  padding: 1em;
  margin-top: 1em;
  width: 300px;
  border: 1px solid rgb(240, 240, 240);
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
  background-color: rgb(240, 240, 240);
  color: #1d1e22;
  padding: 0.5em;
  margin-top: 1em;
}

button:hover {
  background-color: #686868;
  color: rgb(240, 240, 240);
}

button:disabled {
  background-color: #999;
  color: #ccc;
}
.title {
  font-size: clamp(20px, 5vw, 30px);
  font-weight: 400;
}

.socials {
  display: flex;
  position: absolute;
  bottom: 0;
  left: 0;
  margin: 10px;
}

.socials a img {
  height: 64px;
  width: 64px;
  transition: transform 0.2s ease-in-out;
  opacity: 0.75;
  margin-left: 4px;
  margin-right: 4px;
}
.socials a img:hover {
  transform: scale(1.1);
  opacity: 1;
}

@media (max-width: 480px) {
  .title {
    margin-bottom: 0.5rem;
    font-size: 24px;
  }

  .connected-users,
  .version-number {
    font-size: 12px;
  }

  .main {
    padding: 1rem;
  }

  .decider-button {
    font-size: 16px;
    padding: 0.8em 2.4em;
    margin: 0.5em 0;
  }

  .form-container {
    max-width: 300px;
    margin: 0 auto;
  }

  .form-container h1 {
    font-size: 20px;
    margin-bottom: 0.5rem;
  }

  form label,
  form input {
    margin-bottom: 0.5rem;
    width: 100%;
  }

  button {
    width: 100%;
  }
}
</style>
