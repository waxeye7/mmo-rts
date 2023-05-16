# MMO-RTS Game

Immerse yourself in a world of strategy with our massively multiplayer online real-time strategy (MMO-RTS) game! Players engage in a captivating shared game world, building structures, training units, gathering resources, and battling with other players. The server architecture is powered by Node.js, Express, and Socket.IO, with Vue.js driving the client-side operations. MongoDB handles the task of storing and retrieving game state data.

## Features

- **Real-time updates** for a responsive and interactive game world.
- Secure **user authentication and authorization**.
- Construct strategic structures such as **Spawns** and **Towers**.
- Train versatile units, including **Workers** and **Axemen**.
- Manage resources effectively, including **gold, wood, stone**, and **food**.
- Explore and exploit various **biomes**, including plains, tundra, and mountains.
- Engage in thrilling combat.
- Experience the unique **action-based system**, with a set number of actions per user per turn.
- Server-side game loop with customizable intervals.
- Enjoy seamless gameplay with a **graceful server shutdown and restart** mechanism.

## Gameplay Mechanics

### Structures

Players can build the following structures:

- **Spawn**: A structure where new units can be spawned. Each player can only build one Spawn.
- **Tower**: A defensive structure capable of attacking enemy units and buildings. Each player can build multiple towers.

### Units

Players can train the following units:

- **Worker**: Workers are the primary resource gatherers and can perform various tasks. They can be trained at the Spawn.
- **Axeman**: A combat unit that provides an offensive edge to your army. Train them at the Spawn.

### Resources

Players need to manage the following resources effectively:

- **Gold**: Crucial for training units and building structures.
- **Wood** and **Stone**: Essential for constructing various structures.
- **Food**: Vital for sustaining your units.

### Biomes

Players can explore and exploit the following biomes:

- **Plains**: Ideal for building structures and farming.
- **Tundra**: A source of unique resources.
- **Mountain**: Rich in stone and other minerals.

### Actions

Every turn, players have a limited number of actions, including:

- Building structures
- Training and moving units
- Attacking with towers and Axemen
- Gathering resources

### Game Loop

The server runs a game loop that processes player actions and updates the game world at customizable intervals. The game loop performs the following:

1. Processes all queued actions
2. Updates the game state and saves it to the database
3. Broadcasts the updated game state to all connected clients
4. Resets the actions queue
5. Updates the next task timestamp

The game loop scheduling is handled by the `node-cron` package.

## Contributing

We welcome contributions to the project. Please submit a pull request with your changes or create an issue to discuss your proposed changes.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
