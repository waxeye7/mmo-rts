<script setup>
import UserIdentifier from "../components/UserIdentifier.vue";
</script>
<template>
  <div id="auth-forms">
    <div class="login-signup-button-section" v-if="!selectedForm">
      <h1 class="text-align-center">MMO RTS</h1>
      <button class="decider-button" @click="selectForm('login')">Login</button>
      <button class="decider-button" @click="selectForm('signup')">
        Signup
      </button>
    </div>

    <div class="form-container" v-if="selectedForm === 'login'">
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

    <div class="form-container" v-if="selectedForm === 'signup'">
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

        <!-- Input field for background color -->
        <label for="background-color">Background color:</label>
        <input
          id="background-color"
          type="color"
          v-model="signupForm.identifier.backgroundColor"
        />

        <!-- Input field for fill color -->
        <label for="fill-color">Fill color:</label>
        <input
          id="fill-color"
          type="color"
          v-model="signupForm.identifier.fillColor"
        />

        <UserIdentifier
          :backgroundColor="signupForm.identifier.backgroundColor"
          :shape="signupForm.identifier.shape"
          :fillColor="signupForm.identifier.fillColor"
        />

        <button class="button margin-center" type="submit">Signup</button>
      </form>
      <button @click="goBack">Back</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
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
    selectForm(form) {
      this.selectedForm = form;
    },
    goBack() {
      this.selectedForm = null;
    },
    async login() {
      console.log("Login data:", this.loginForm);
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
        });

        if (!response.ok) {
          throw new Error("Error logging in.");
        }

        const data = await response.json();
        console.log("Login response:", data);

        // Save the token and user ID in local storage
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("userId", data.id);

        this.$socket.emit("loggedIn", data.id);

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
        });

        if (!response.ok) {
          throw new Error("Error signing up.");
        }

        const data = await response.json();
        console.log("Signup response:", data);

        // Save the token and user ID in local storage
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("userId", data.id);

        this.$socket.emit("loggedIn", data.id);

        this.$router.push("/");
      } catch (error) {
        console.error("Error signing up:", error);
        alert("Error signing up. Please check your input.");
      }
    },
  },
};
</script>

<style scoped>
.decider-button {
  background-color: rgb(186, 9, 209);
  color: white;
  font-size: 34px;
  height: 70px;
  width: 200px;
  text-align: center;
  padding: 10px 14px;
  cursor: pointer;
  margin: 0.5rem 1rem;
  transition-duration: 400ms;
}
.decider-button:hover {
  transform: scale(1.05);
}
/* Add your styles here */
form {
  display: flex;
  flex-direction: column;
  padding-bottom: 2rem;
}

label,
input {
  margin-bottom: 0.5rem;
}

button {
  cursor: pointer;
}
#auth-forms {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 97vh;
}
.form-container {
  padding: 20px;
  background-color: rgb(238, 238, 238);
}
.login-signup-button-section {
  background-color: rgb(218, 218, 253);
  padding: 40px;
  border: black 1px solid;
  border-radius: 14px;
}
</style>
