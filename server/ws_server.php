<?php
error_reporting(E_ALL & ~E_DEPRECATED);
require __DIR__ . '/vendor/autoload.php';
require dirname(__DIR__) . '/server/vendor/autoload.php';
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpsServer;
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
            $user = $data['username'];
        } else { return; }

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

$context = stream_context_create([
    'ssl' => [
        'local_cert' => '/etc/letsencrypt/live/sjcfacesgame.com/fullchain.pem',
        'local_pk' => '/etc/letsencrypt/live/sjcfacesgame.com/privkey.pem',
        'allow_self_signed' => false,
        'verify_peer' => false
    ]
]);

$server = IoServer::factory(
    new HttpsServer(
        new WsServer(
            new Chat()
        )
    ),
    443,
    '0.0.0.0',
    $context
);

$server->run();