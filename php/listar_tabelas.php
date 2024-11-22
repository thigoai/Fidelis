<?php
include 'config.php';

try {
    $con = new mysqli($host, $user, $password, $dbname, $port, $socket);

    $sql = "SHOW TABLES";
    $result = $con->query($sql);

    if ($result->num_rows > 0) {
        echo "Tabelas no banco de dados '$dbname':<br>";
        while ($row = $result->fetch_array()) {
            echo $row[0] . "<br>";
        }
    } else {
        echo "Nenhuma tabela encontrada.";
    }

    $con->close();
} catch (Exception $e) {
    die("Erro: " . $e->getMessage());
}
?>
