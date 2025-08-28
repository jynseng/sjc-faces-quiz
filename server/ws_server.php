<?php
error_reporting(E_ALL & ~E_DEPRECATED);
ini_set('display_errors', 1);
require __DIR__ . '/vendor/autoload.php';
require dirname(__DIR__) . '/server/vendor/autoload.php';
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

use React\EventLoop\Factory;
use Clue\React\Redis\Factory as RedisFactory;

class Chat implements MessageComponentInterface {
    protected $clients;
    protected $redis;
    protected $loop;

    public function __construct($loop) {
        $this->loop = $loop;
        $this->clients = new \SplObjectStorage();

        $factory = new RedisFactory($loop); // Create Redis factory tied to this loop

        // Normal redis client
        $factory->createClient('redis://127.0.0.1:6379')->then(function ($client) use (&$redis) {
            $this->redis = $client;
            $client->del('active_users');
            echo "Normal Redis client connected\n";
        });

        // Subscriber redis client
        $factory->createClient('redis://127.0.0.1:6379')->then(function ($client) use (&$subscriber) {
            $this->subscriber = $client;
            echo "Subscriber Redis client connected\n";

            $client->subscribe('scores');
            $client->on('message', function ($channel, $message) {
                $data = json_decode($message, true);
                foreach ($this->clients as $wsClient) {
                    $wsClient->send(json_encode([
                        'type' => 'score',
                        'user' => $data['user'],
                        'score' => $data['score'],
                        'gameMode' => $data['gameMode'],
                        'newPersonalBest' => $data['newPersonalBest']
                    ]));
                }
            });
        });
    }

    public function onOpen(ConnectionInterface $conn) {
        // Store the new connection
        $this->clients->attach($conn);
        echo "New connection! ({$conn->resourceId})\n";
        $conn->username = "unknown";
        $this->sendUpdate();
    }

    public function onMessage(ConnectionInterface $conn, $msg) {
        if (!$msg) return;
        $data = json_decode($msg, true);
        if (!$data) return;

        switch ($data['type'] ?? '') {
            case 'wave':
                echo "Wave processing...";
                if (!isset($data['to'])) {
                    echo "Wave processed but no recipient set!\n";
                    return;
                }

                $toUser = $data['to'];
                $fromUser = $conn->username ?? 'unknown';

                // Prevent spamming same user with waves
                $key = "wave_cooldown:{$fromUser}:{$toUser}";
                $this->redis->exists($key)->then(function ($exists) use ($key, $fromUser, $toUser, $conn) {
                    if ($exists) return; // still on cooldown

                    $this->redis->setex($key, 30, 1);

                    foreach ($this->clients as $client) {
                        if (($client->username ?? null) === $toUser) {
                            $client->send(json_encode([
                                'type' => 'wave',
                                'from' => $fromUser
                            ]));
                            echo "Wave sent from $fromUser to $toUser\n";
                            return;
                        }
                    }
                    echo "Wave target $toUser not found online\n";
                });
                break;

            case 'sign_in':
                if (!isset($data['username'])) return;

                $user = $data['username'];
                $conn->username = $user; // bind username to this connection
                $this->redis->sadd('active_users', $user)->then(function() use ($user) {
                    echo $user . " has logged on\n";
                    $this->sendUpdate();
                });
                break;

            case 'sign_out':
                if (isset($conn->username)) {
                    $user = $conn->username;
                    $this->redis->srem('active_users', $user)->then(function () use ($user) {
                        echo $user . " signed out\n";
                        $this->sendUpdate();

                    });
                    unset($conn->username);
                }
                break;

            case 'ping':
                break;

            default:
                echo "Unknown message type: " . ($data['type'] ?? 'missing') . "\n";
                break;
        }
    }

    public function onClose(ConnectionInterface $conn) {
        if (isset($conn->username)) {
            $user = $conn->username;
            $this->redis->srem('active_users', $user)->then(function () use ($conn, $user) {
                $this->clients->detach($conn);
                echo "Connection {$conn->resourceId} ($user) has disconnected\n";
                $this->sendUpdate();
            });
        } else {
            $this->clients->detach($conn);
            echo "Connection {$conn->resourceId} has disconnected (no username)\n";
        }
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error occurred: {$e->getMessage()}\n";
        $conn->close();
    }

    public function sendUpdate() {
        if (!$this->redis) {
            echo "Redis not connected yet, skipping update\n";
            return;
        }
        
        // Broadcast the message to all WebSocket clients
        $this->redis->smembers('active_users')->then(function ($users) {
            $usersArray = $users;
            $json = json_encode($usersArray);
            foreach ($this->clients as $client) {
                $client->send($json);
            }
        });
    }
    
}

$loop = Factory::create();
$chatApp = new Chat($loop);

$server = new IoServer(
    new HttpServer(
        new WsServer($chatApp)
    ),
    new React\Socket\Server('0.0.0.0:8080', $loop),
    $loop
);

echo "WebSocket server started at ws://127.0.0.1:8080\n"; // Add this line for logging

$loop->run();