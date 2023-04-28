<template>
  <div>
    <h1>Welcome to Your Game</h1>
    <div v-for="(row, x) in board" :key="x" style="display: flex">
      <div v-for="(cell, y) in row" :key="y">
        <button
          @click="
            sendAction({ type: 'place', payload: { x, y, color: 'blue' } })
          "
          :style="{
            backgroundColor: cell.color || 'white',
            width: '50px',
            height: '50px',
          }"
        ></button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      board: [],
    };
  },
  created() {
    // Set up the socket listeners
    this.$socket.on("updateBoard", (newBoard) => {
      this.board = newBoard;
    });
  },
  methods: {
    sendAction(action) {
      this.$socket.emit("action", action);
    },
  },
};
</script>

<style scoped></style>
