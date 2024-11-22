<?php
include 'config.php';


try {

    $con = new mysqli($host, $user, $password, $dbname, $port, $socket);
    echo "Conexão bem-sucedida!";
} catch (Exception $e) {

    die("Falha na conexão: " . $e->getMessage());
}


// Verificar se a conexão foi bem-sucedida
if ($con->connect_error) {
    die("Connection failed: " . $con->connect_error);
}
echo "Connected successfully!";


$con->close();
?>