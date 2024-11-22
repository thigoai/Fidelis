<?php
session_start();
include 'config.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $email = $_POST['email'];
    $senha = $_POST['senha'];

    try {
        $con = new mysqli($host, $user, $password, $dbname, $port, $socket);

        $sql = "SELECT * FROM usuarios WHERE email = ?";
        $stmt = $con->prepare($sql);
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $usuario = $result->fetch_assoc();

        if ($usuario && password_verify($senha, $usuario['senha'])) {
            $_SESSION['usuario_id'] = $usuario['id'];
            $_SESSION['tipo_usuario'] = $usuario['tipo_usuario'];
            $_SESSION['nome'] = $usuario['nome'];
            header("Location: hub.html");
            exit;
        } else {
            echo "Email ou senha inválidos.";
        }
        $stmt->close();
        $con->close();
    } catch (Exception $e) {
        die("Erro: " . $e->getMessage());
    }
}
?>
