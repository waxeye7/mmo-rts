# MMO-RTS Game

This project is a massively multiplayer online real-time strategy (MMO-RTS) game where players build structures, gather resources, and battle with other players in a shared game world. The server is built using Node.js, Express, and Socket.IO, while the client is built using Vue.js. The game uses MongoDB for storing and retrieving game state data.

## Features

- Real-time updates of the game world
- User authentication and authorization
- Build structures, such as Spawns and Towers
- Train and move Worker units
- Tower-based combat system
- Resource gathering and management
- Action-based system, with a limited number of actions per user per turn
- Server-side game loop with configurable intervals
- Graceful server shutdown and restart

## Gameplay

### Structures

Players can build the following structures:

- **Spawn**: A structure where new Worker units can be spawned. Each player can only build one Spawn.
- **Tower**: A defensive structure that can shoot enemy units and buildings. Each player can build multiple towers.

### Units

Players can train the following units:

- **Worker**: A unit that can gather resources and perform various tasks. Workers can be trained at the Spawn.

### Actions

Players have a limited number of actions per turn. Actions include:

- Building structures
- Moving units
- Attacking with towers
- Spawning new workers

### Game Loop

The server runs a game loop that processes player actions and updates the game world at a configurable interval. The game loop does the following:

1. Processes all queued actions
2. Updates the game state and saves it to the database
3. Broadcasts the updated game state to all connected clients
4. Resets the actions queue and move worker actions queue
5. Updates the next task timestamp

The game loop is scheduled using the `node-cron` package.

## Contributing

Contributions to the project are welcome. Please submit a pull request with your changes or create an issue to discuss the proposed changes.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
