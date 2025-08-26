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

class Chat implements MessageComponentInterface {
    protected $clients;
    protected $redis;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->redis = new Redis();
        $this->redis->connect('127.0.0.1', 6379);
        $this->redis->del("active_users");
    }

    public function onOpen(ConnectionInterface $conn) {
        // Store the new connection
        $this->clients->attach($conn);
        echo "New connection! ({$conn->resourceId})\n";
        $conn->username = "guest";
        $this->sendUpdate();
    }

    public function onMessage(ConnectionInterface $conn, $msg) {
        if (!$msg) return;
        $data = json_decode($msg, true);
        if (!$data) return;

        switch ($data['type'] ?? '') {
            case 'wave':
                if (!isset($data['to'])) {
                    echo "Wave processed but no recipient set!\n";
                    return;
                }

                $toUser = $data['to'];
                $fromUser = $conn->username ?? 'unknown';

                // Prevent spamming same user with waves
                $key = "wave_cooldown:{$fromUser}:{$toUser}";
                if ($this->redis->exists($key)) { return; } // still on cooldown, ignore
                $this->redis->setex($key, 30, 1); // otherwise, set cooldown

                // Have to loop through clients to find recipient 
                foreach ($this->clients as $client) {
                    if (isset($client->username) && $client->username === $toUser) {
                        $client->send(json_encode([
                            'type' => 'wave',
                            'from' => $fromUser
                        ]));
                        echo "Wave sent from $fromUser to $toUser\n";
                        return; // stop after finding the recipient
                    }
                }

                echo "Wave target $toUser not found online\n";
                break;

            case 'sign_in':
                if (!isset($data['username'])) return;

                $user = $data['username'];
                $conn->username = $user; // bind username to this connection
                $this->redis->sAdd('active_users', $user);

                echo "$user has logged on\n";
                $this->sendUpdate();
                break;

            case 'sign_out':
                if (isset($conn->username)) {
                    $this->redis->sRem('active_users', $conn->username);
                    echo $conn->username . " signed out\n";
                    unset($conn->username);
                }
                $this->sendUpdate();
                break;

            default:
                echo "Unknown message type: " . ($data['type'] ?? 'missing') . "\n";
                break;
        }
    }

    public function onClose(ConnectionInterface $conn) {
        $this->redis->sRem('active_users', $conn->username);
        $this->clients->detach($conn);
        echo "Connection {$conn->resourceId} has disconnected\n";
        $this->sendUpdate();
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error occurred: {$e->getMessage()}\n";
        $conn->close();
    }

    public function sendUpdate() {
        // Broadcast the message to all WebSocket clients
        $usersArray = $this->redis->sMembers('active_users');
        $json = json_encode($usersArray);
        foreach ($this->clients as $client) {
            $client->send($json);
        }
    }
    
}

$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new Chat()
        )
    ),
    8080,
    '0.0.0.0'
);

echo "WebSocket server started at ws://127.0.0.1:8080\n"; // Add this line for logging

$server->run();