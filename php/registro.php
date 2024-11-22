<?php
include 'config.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $nome = $_POST['nome'];
    $email = $_POST['email'];
    $senha = password_hash($_POST['senha'], PASSWORD_BCRYPT);
    $tipo_usuario = $_POST['tipo_usuario']; // cliente ou loja

    try {
        $con = new mysqli($host, $user, $password, $dbname, $port, $socket);

        $sql = "INSERT INTO usuarios (nome, email, senha, tipo_usuario) VALUES (?, ?, ?, ?)";
        $stmt = $con->prepare($sql);
        $stmt->bind_param('ssss', $nome, $email, $senha, $tipo_usuario);

        if ($stmt->execute()) {
            echo "Registro concluído!";
        } else {
            echo "Erro: " . $con->error;
        }
        $stmt->close();
        $con->close();
    } catch (Exception $e) {
        die("Erro: " . $e->getMessage());
    }
}
?>
