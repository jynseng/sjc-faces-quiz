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
    }

    public function onOpen(ConnectionInterface $conn) {
        // Store the new connection
        $this->clients->attach($conn);
        echo "New connection! ({$conn->resourceId})\n";
        $this->sendUpdate();
    }

    public function onMessage(ConnectionInterface $conn, $msg) {
        if ($msg) {
            $data = json_decode($msg, true);
            if (isset($data['username'])) {
                $user = $data['username'];
                if ($data['type'] == 'sign_in') {
                    echo $user." has logged on\n";
                    $conn->username = $user;
                    $this->redis->sAdd('active_users', $user);
                } else if ($data['type'] == 'sign_out') {
                    $this->redis->sRem('active_users', $conn->username);
                    echo $conn->username." is inactive\n";
                }
                $this->sendUpdate();
            }
        } else { return; }
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