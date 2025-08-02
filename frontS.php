<?php

session_start();

require 'vendor/autoload.php';
require 'db.php';
$errors = require 'error.php';

/** LOAD Environment variables */
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

use \Slim\Http\Request as Request;
use \Slim\Http\Response as Response;

$config = [
    'settings' => [
        'displayErrorDetails' => (bool)$_ENV['DISPLAY_ERRORS']
    ]
];

$app = new \Slim\App($config);

$client = new Google\Client();
$client->setAuthConfig('client_secret.json');

$client->setRedirectUri($_ENV['BASE_URL'] . '/auth');

$client->setScopes('openid email profile');

$app->get('/auth', function (Request $req, Response $res, $args) {
    global $client;
    if (isset($_GET['code'])) {
        $token = $client->fetchAccessTokenWithAuthCode($_GET['code']);
        $client->setAccessToken($token);
        $token_data = $client->verifyIdToken();
        $user = upsert_user($token_data);
        $_SESSION['user'] = $user;
        if (isset($_SESSION['invite-in-progress'])) {
            $listId = $_SESSION['invite-in-progress'];
            unset($_SESSION['invite-in-progress']);
            return $res->withRedirect($_ENV['BASE_URL'] . "/api/lists/{$listId}/join", 302);
        }
        return $res->withRedirect($_ENV['BASE_URL'] . '/index.html', 302);
    }
    return $res->withRedirect($_ENV['BASE_URL'] . '/login.html', 302);
});

$app->get('/api/login', function (Request $req, Response $res, $args) {
    global $client;
    return $res->withRedirect($client->createAuthUrl(), 302);
});

$app->get('/api/userinfo', function (Request $req, Response $res, $args) {
    if (!isset($_SESSION['user']))
        return $res->withStatus(401);

    return $res->withJson($_SESSION['user']);
});

$app->get('/api/lists', function ($request, $response, $args) use ($mysqli, $errors) {
    if (!isset($_SESSION['user'])) {
        $errorDetails = $errors['unauthorized'];
        return $response
            ->withJson(['error' => $errorDetails['message']])
            ->withStatus($errorDetails['code']);
    }
    $userId = $_SESSION['user']['id'];
    $query = "SELECT DISTINCT lists.*, users.display_name 
              FROM lists 
              JOIN users ON lists.user_id = users.id
              LEFT JOIN lists_users ON lists.id = lists_users.list_id
              WHERE lists.user_id = ? OR lists_users.user_id = ?";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param('ss', $userId, $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    $lists = [];
    while ($row = $result->fetch_assoc()) {
        $lists[] = $row;
    }
    return $response->withJson($lists);
});

$app->get('/api/lists/{listId:\d+}', function ($request, $response, $args) use ($mysqli, $errors) {
    if (!isset($_SESSION['user'])) {
        $errorDetails = $errors['unauthorized'];
        return $response
            ->withJson(['error' => $errorDetails['message']])
            ->withStatus($errorDetails['code']);
    }
    $listId = $args['listId'];
    $query = "SELECT lists.*, users.display_name 
              FROM lists 
              JOIN users ON lists.user_id = users.id
              WHERE lists.id = ?";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param('i', $listId);
    $stmt->execute();
    $result = $stmt->get_result();
    $list = $result->fetch_assoc();
    return $response->withJson($list);
});

$app->get("/api/lists/{listId:\d+}/posts", function ($request, $response, $args) use ($mysqli, $errors) {
    if (!isset($_SESSION['user'])) {
        $errorDetails = $errors['unauthorized'];
        return $response
            ->withJson(['error' => $errorDetails['message']])
            ->withStatus($errorDetails['code']);
    }
    $listId = $args["listId"];
    $query = "SELECT posts.*, users.display_name 
              FROM posts 
              JOIN users ON posts.user_id=users.id 
              WHERE list_id = ?";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param("i", $listId);
    $stmt->execute();
    $result = $stmt->get_result();

    $posts = [];
    while ($row = $result->fetch_assoc()) {
        $completionQuery = "SELECT users.display_name 
                            FROM completed_posts 
                            JOIN users ON completed_posts.user_id = users.id 
                            WHERE completed_posts.post_id = ?";
        $completionStmt = $mysqli->prepare($completionQuery);
        $completionStmt->bind_param("i", $row['id']);
        $completionStmt->execute();
        $completionResult = $completionStmt->get_result();

        if ($completedBy = $completionResult->fetch_assoc()) {
            $row['completed_by_name'] = $completedBy['display_name'];
        } else {
            $row['completed_by_name'] = "";
        }
        $posts[] = $row;
    }
    return $response->withJson($posts);
});

$app->post("/api/lists", function ($request, $response, $args) use ($mysqli, $errors) {
    if (!isset($_SESSION['user'])) {
        $errorDetails = $errors['unauthorized'];
        return $response
            ->withJson(['error' => $errorDetails['message']])
            ->withStatus($errorDetails['code']);
    }

    $data = $request->getParsedBody();
    $list_name = isset($data['list_name']) ? $data['list_name'] : '';
    $userId = $_SESSION['user']['id'];
    $query = "INSERT INTO lists (list_name, user_id) 
              VALUES (?, ?)";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param("ss", $list_name, $userId);
    $stmt->execute();

    $listId = $mysqli->insert_id;

    $query2 = "INSERT INTO lists_users (list_id, user_id) VALUES (?, ?)";
    $stmt2 = $mysqli->prepare($query2);
    $stmt2->bind_param("is", $listId, $userId);
    $stmt2->execute();

    $query3 = "INSERT INTO user_karma (user_id, list_id, total_karma) VALUES (?, ?, 0)";
    $stmt3 = $mysqli->prepare($query3);
    $stmt3->bind_param("si", $userId, $listId);
    $stmt3->execute();

    $stmt->close();
    $stmt2->close();
    $stmt3->close();
    return $response->withJson(['success' => true], 201);
});

$app->post('/api/lists/{listId:\d+}/posts', function ($request, $response, $args) use ($mysqli, $errors) {
    if (!isset($_SESSION['user'])) {
        $errorDetails = $errors['unauthorized'];
        
        return $response
            ->withJson(['error' => $errorDetails['message']])
            ->withStatus($errorDetails['code']);
    }
    $listId = $args['listId'];
    $data = $request->getParsedBody();
    $post_name = isset($data['post_name']) ? $data['post_name'] : '';
    $karma_value = isset($data['karma_value']) ? $data['karma_value'] : 0;
    $userId = $_SESSION['user']['id'];
    $query = "INSERT INTO posts (post_name, user_id, list_id, karma_value)
              VALUES (?, ?, ?, ?)";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param("ssii", $post_name, $userId, $listId, $karma_value);
    $stmt->execute();

    $stmt->close();
    return $response->withJson(['success' => true], 201);
});

$app->post('/api/lists/{listId:\d+}/delete', function ($request, $response, $args) use ($mysqli, $errors) {
    if (!isset($_SESSION['user'])) {
        $errorDetails = $errors['unauthorized'];
        return $response
            ->withJson(['error' => $errorDetails['message']])
            ->withStatus($errorDetails['code']);
    }
    $userId = $_SESSION['user']['id'];
    $listId = $args['listId'];
    $controlQuery = "SELECT user_id FROM lists WHERE lists.id = ?";
    $controlStmt = $mysqli->prepare($controlQuery);
    $controlStmt->bind_param("i", $listId);
    $controlStmt->execute();
    $result = $controlStmt->get_result();
    $row = $result->fetch_assoc();
    $controlStmt->close();

    if ($userId == $row['user_id']) {
        $query = "DELETE FROM lists 
              WHERE lists.id = ?";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("i", $listId);
        $stmt->execute();
        $stmt->close();
    } else {
        $query = "DELETE FROM lists_users WHERE list_id = ? AND user_id = ?";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("is", $listId, $userId);
        $stmt->execute();
        $stmt->close();
    }
    return $response->withJson(['success' => true], 201);
});

$app->post('/api/posts/{postId:\d+}/delete', function ($request, $response, $args) use ($mysqli, $errors) {
    if (!isset($_SESSION['user'])) {
        $errorDetails = $errors['unauthorized'];
        return $response
            ->withJson(['error' => $errorDetails['message']])
            ->withStatus($errorDetails['code']);
    }
    $postId = $args['postId'];
    $query = "DELETE FROM posts 
              WHERE posts.id = ?";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param("i", $postId);
    $stmt->execute();
    $stmt->close();
    return $response->withJson(['success' => true], 201);
});

$app->post('/api/posts/{postId}/complete', function ($request, $response, $args) use ($mysqli, $errors) {
    if (!isset($_SESSION['user'])) {
        $errorDetails = $errors['unauthorized'];
        return $response
            ->withJson(['error' => $errorDetails['message']])
            ->withStatus($errorDetails['code']);
    }
    $postId = $args['postId'];
    $data = $request->getParsedBody();
    $completed = isset($data['completed']) ? $data['completed'] : 0;

    $userId = $_SESSION['user']['id'];

    $query = "UPDATE posts SET completed = ? WHERE id = ?";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param("ii", $completed, $postId);
    $stmt->execute();
    $stmt->close();

    $query = "SELECT karma_value, list_id FROM posts WHERE id = ?";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param("i", $postId);
    $stmt->execute();
    $result = $stmt->get_result();
    $post = $result->fetch_assoc();
    $stmt->close();

    if ($completed == 1) {
        $query = "SELECT id FROM completed_posts WHERE post_id = ? AND user_id = ?";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("is", $postId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $stmt->close();

        if ($result->num_rows == 0) {
            $query = "INSERT INTO completed_posts (post_id, user_id, list_id, karma_earned) 
                          VALUES (?, ?, ?, ?)";
            $stmt = $mysqli->prepare($query);
            $stmt->bind_param("isii", $postId, $userId, $post['list_id'], $post['karma_value']);
            $stmt->execute();
            $stmt->close();

            $query = "INSERT INTO user_karma (user_id, list_id, total_karma) 
                          VALUES (?, ?, ?) 
                          ON DUPLICATE KEY UPDATE total_karma = total_karma + ?";
            $stmt = $mysqli->prepare($query);
            $stmt->bind_param("siii", $userId, $post['list_id'], $post['karma_value'], $post['karma_value']);
            $stmt->execute();
            $stmt->close();
        }
    } else {
        $query = "DELETE FROM completed_posts WHERE post_id = ? AND user_id = ?";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("is", $postId, $userId);
        $stmt->execute();
        $affected = $stmt->affected_rows;
        $stmt->close();

        if ($affected > 0) {
            $query = "UPDATE user_karma 
                          SET total_karma = total_karma - ? 
                          WHERE user_id = ? AND list_id = ?";
            $stmt = $mysqli->prepare($query);
            $stmt->bind_param("isi", $post['karma_value'], $userId, $post['list_id']);
            $stmt->execute();
            $stmt->close();
        }
    }

    return $response->withJson(['success' => true], 200);
});

$app->get('/api/{listId:\d+}/leaderboard', function ($request, $response, $args) use ($mysqli, $errors) {
    if (!isset($_SESSION['user'])) {
        $errorDetails = $errors['unauthorized'];
        return $response
            ->withJson(['error' => $errorDetails['message']])
            ->withStatus($errorDetails['code']);
    }
    $listId = $args['listId'];
    $query = "SELECT user_karma.total_karma, users.* 
          FROM lists_users 
          JOIN users ON lists_users.user_id = users.id
          LEFT JOIN user_karma ON users.id = user_karma.user_id AND user_karma.list_id = ?
          WHERE lists_users.list_id = ?";
    $stmt = $mysqli->prepare($query);
    $stmt->bind_param("ii", $listId, $listId);

    $stmt->execute();
    $result = $stmt->get_result();

    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    return $response->withJson($users);
});

$app->get('/api/lists/{listId:\d+}/join', function ($request, $response, $args) use ($mysqli) {
    $listId = $args['listId'];

    if (!isset($_SESSION['user'])) {
        $_SESSION['invite-in-progress'] = $listId;
        return $response->withRedirect($_ENV['BASE_URL'] . '/login.html', 302);
    }

    $userId = $_SESSION['user']['id'];

    $checkQuery = "SELECT * FROM lists_users WHERE list_id = ? AND user_id = ?";
    $checkStmt = $mysqli->prepare($checkQuery);
    $checkStmt->bind_param("is", $listId, $userId);
    $checkStmt->execute();
    $result = $checkStmt->get_result();

    if ($result->num_rows == 0) {
        $query = "INSERT INTO lists_users (list_id, user_id) VALUES (?, ?)";
        $stmt = $mysqli->prepare($query);
        $stmt->bind_param("is", $listId, $userId);
        $stmt->execute();

        $query2 = "INSERT INTO user_karma (user_id, list_id, total_karma) VALUES (?, ?, 0)";
        $stmt2 = $mysqli->prepare($query2);
        $stmt2->bind_param("si", $userId, $listId);
        $stmt2->execute();

        $stmt->close();
        $stmt2->close();
    }

    return $response->withRedirect($_ENV['BASE_URL'] . "/posts.html?listId={$listId}", 302);
});

$app->get('/api/logout', function (Request $req, Response $res, $args) {
    unset($_SESSION['user']);
    unset($_SESSION['invite-in-progress']);

    session_destroy();

    return $res->withRedirect($_ENV['BASE_URL'] . '/login.html', 302);
});

$app->run();
