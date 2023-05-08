<template>
  <div v-if="backgroundColor && shape && fillColor">
    <div class="identifier-container" :style="containerStyle">
      <div
        :class="['identifier-background']"
        :style="{ backgroundColor: backgroundColor }"
      ></div>
      <div :class="['identifier-shape', shape]" :style="getShapeStyles()"></div>
    </div>
  </div>
</template>

<script lang="js">
export default {
  props: {
    backgroundColor: String,
    shape: String,
    fillColor: String,
    zoom: Number || null,
  },

  methods:{
    getShapeStyles() {
    switch (this.shape) {
      case "circle":
        return this.circleStyles;
      case "square":
        return this.squareStyles;
      case "triangle":
        return this.triangleStyles;
        case "ellipse":
        return this.ellipseStyles;
      case "rhombus":
        return this.rhombusStyles;
      case "star":
        return this.starStyles;
        case "hexagon":
      return this.hexagonStyles;
    case "heart":
      return this.heartStyles;
    case "trapezoid":
      return this.trapezoidStyles;
    case "candle":
      return this.candleStyles;
    case "flag":
      return this.flagStyles;
      case "arrow":
      return this.arrowStyles;
    case "tetris":
      return this.tetrisStyles;
    case "stick":
      return this.stickStyles;
    default:
      return {};
    }
  },
  },

  computed: {
    containerStyle() {
  let width, height;
  if (this.zoom && this.zoom <= 0.45) {
    width = "100px";
    height = "100px";
  } else if (this.zoom && this.zoom > 0.45) {
    width = "20px";
    height = "20px";
  } else if (this.zoom === null) {
    width = "50px";
    height = "50px";
  } else {
    width = "200px";
    height = "200px";
  }

  return {
    width,
    height,
    '--width': width === '20px' ? '4px' : '20px',
    '--height': width === '20px' ? '16px' : '80px',
  };
},
    circleStyles() {
    return {
      backgroundColor: this.fillColor,
      borderRadius: "50%",
    };
  },
  squareStyles() {
    return {
      backgroundColor: this.fillColor,
    };
  },
  triangleStyles() {
  return {
    width: 0,
    height: 0,
    borderTop: `70px solid ${this.fillColor}`,
    borderLeft: "35px solid transparent",
    borderRight: "35px solid transparent",
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  };
},
ellipseStyles() {
  return {
    backgroundColor: this.fillColor,
    borderRadius: "50%",
    width: "75%",
    height: "50%",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  };
},
starStyles() {
  return {
    backgroundColor: this.fillColor,
    clipPath: 'polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
  };
},
rhombusStyles() {
  return {
    width: 0,
    height: 0,
    borderTop: '35px solid transparent',
    borderBottom: '35px solid transparent',
    borderLeft: `35px solid ${this.fillColor}`,
    borderRight: `35px solid ${this.fillColor}`,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  };
},
hexagonStyles() {
  return {
    backgroundColor: this.fillColor,
    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
  };
},
trapezoidStyles() {
  return {
    backgroundColor: this.fillColor,
    clipPath: 'polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)',
  };
},
candleStyles() {
  return {
    '--fill-color': this.fillColor,
  };
},

flagStyles() {
  return {
    '--fill-color': this.fillColor,
  };
},
stickStyles() {
  return {
    backgroundColor: this.fillColor,
    width: '5px',
    height: '50px',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  };
},
tetrisStyles() {
  return {
    backgroundColor: this.fillColor,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    clipPath: 'polygon(0 0, 100% 0, 100% 40%, 50% 40%, 50% 100%, 0 100%)',
  };
},

arrowStyles() {
  return {
    backgroundColor: this.fillColor,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    clipPath: 'polygon(50% 0, 100% 30%, 80% 30%, 80% 100%, 20% 100%, 20% 30%, 0 30%)',
  };
},

  },
};
</script>

<style scoped>
.identifier-container {
  position: relative;
  overflow: hidden;
  --width: 20px; /* Add this line */
  --height: 80px; /* Add this line */
}

.identifier-background {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 100%;
}
.identifier-shape {
  position: absolute;
  width: 60%;
  height: 60%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.identifier-shape.candle {
  background-color: var(--fill-color);
  width: var(--width);
  height: var(--height);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: calc(var(--width) / 2);
}

.identifier-shape.candle::before {
  content: "";
  position: absolute;
  top: calc(-0.15 * var(--height));
  left: calc(0.35 * var(--width));
  width: calc(0.3 * var(--width));
  height: calc(0.6 * var(--width));
  border-radius: 50%;
  background-color: var(--fill-color);
}

.identifier-shape.candle::after {
  content: "";
  position: absolute;
  top: -24px;
  left: 50%;
  margin-left: -3px;
  width: 6px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--fill-color);
}

.identifier-shape.stick {
  background-color: var(--fill-color);
  width: 5px;
  height: 50px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
