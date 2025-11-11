<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Verificar que podemos acceder al archivo index.html
$html_file = __DIR__ . '/index.html';
if (file_exists($html_file)) {
    // Si el archivo existe, lo servimos
    readfile($html_file);
} else {
    // Si no existe, mostramos información de diagnóstico
    echo "<h1>Diagnóstico del Servidor</h1>";
    echo "<h2>Información de Rutas:</h2>";
    echo "Directorio actual: " . __DIR__ . "<br>";
    echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "<br>";
    echo "Script Filename: " . $_SERVER['SCRIPT_FILENAME'] . "<br>";
    echo "Request URI: " . $_SERVER['REQUEST_URI'] . "<br>";
    
    // Listar archivos en el directorio actual
    echo "<h2>Archivos en el directorio:</h2>";
    $files = scandir(__DIR__);
    echo "<ul>";
    foreach ($files as $file) {
        if ($file != "." && $file != "..") {
            echo "<li>$file</li>";
        }
    }
    echo "</ul>";
}
?>