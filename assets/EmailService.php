<?php
namespace SahaHacking;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class EmailService {
    private $config;
    private $mailer;
    private $throttler;

    public function __construct() {
        $this->config = require __DIR__ . '/config.php';
        $this->mailer = new PHPMailer(true);
        $this->setupMailer();
        $this->throttler = new RateLimit();
    }

    private function setupMailer() {
        // Configuración básica de PHPMailer
        $this->mailer->isSMTP();
        $this->mailer->Host = $this->config['mail']['smtp_host'];
        $this->mailer->SMTPAuth = $this->config['mail']['smtp_auth'];
        $this->mailer->Username = $this->config['mail']['smtp_username'];
        $this->mailer->Password = $this->config['mail']['smtp_password'];
        $this->mailer->SMTPSecure = $this->config['mail']['smtp_secure'];
        $this->mailer->Port = $this->config['mail']['smtp_port'];
        $this->mailer->CharSet = 'UTF-8';
    }

    public function sendContactEmail($data) {
        try {
            // Validar límite de envíos
            if (!$this->throttler->checkLimit($_SERVER['REMOTE_ADDR'])) {
                throw new Exception('Has excedido el límite de mensajes. Por favor, intenta más tarde.');
            }

            // Validar datos
            $this->validateData($data);

            // Configurar correo
            $this->mailer->clearAddresses();
            $this->mailer->setFrom($this->config['mail']['from_email'], $this->config['mail']['from_name']);
            $this->mailer->addAddress($this->config['mail']['recipient_email']);
            $this->mailer->addReplyTo($data['email'], $data['name']);

            // Configurar contenido
            $this->mailer->isHTML(true);
            $this->mailer->Subject = $this->sanitizeString($data['subject'] ?? 'Nuevo mensaje de contacto');
            
            // Crear contenido HTML y texto plano
            $emailContent = $this->createEmailContent($data);
            $this->mailer->Body = $emailContent['html'];
            $this->mailer->AltBody = $emailContent['text'];

            // Enviar
            $this->mailer->send();
            $this->throttler->increment($_SERVER['REMOTE_ADDR']);

            return ['status' => 'success', 'message' => '¡Mensaje enviado exitosamente!'];
        } catch (Exception $e) {
            error_log("Error en envío de correo: " . $e->getMessage());
            throw new Exception('Error al enviar el mensaje: ' . $e->getMessage());
        }
    }

    private function validateData($data) {
        // Validar campos requeridos
        if (empty($data['name']) || empty($data['email']) || empty($data['message'])) {
            throw new Exception('Todos los campos son requeridos.');
        }

        // Validar formato de email
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new Exception('El formato del email no es válido.');
        }

        // Validar longitud del mensaje
        if (strlen($data['message']) > $this->config['security']['max_message_length']) {
            throw new Exception('El mensaje es demasiado largo.');
        }

        // Validar dominio del email
        $domain = substr(strrchr($data['email'], "@"), 1);
        if (!in_array($domain, $this->config['security']['allowed_domains'])) {
            throw new Exception('Dominio de email no permitido.');
        }
    }

    private function sanitizeString($str) {
        return htmlspecialchars(strip_tags(trim($str)), ENT_QUOTES, 'UTF-8');
    }

    private function createEmailContent($data) {
        $html = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #f8f9fa; padding: 15px; border-radius: 5px; }
                .content { margin: 20px 0; }
                .field { margin-bottom: 15px; }
                .label { font-weight: bold; color: #555; }
                .message { background: #fff; padding: 15px; border-left: 4px solid #007bff; }
                .footer { font-size: 12px; color: #666; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>Nuevo mensaje de contacto</h2>
                </div>
                <div class='content'>
                    <div class='field'>
                        <span class='label'>Nombre:</span> 
                        {$this->sanitizeString($data['name'])}
                    </div>
                    <div class='field'>
                        <span class='label'>Email:</span> 
                        {$this->sanitizeString($data['email'])}
                    </div>
                    <div class='field'>
                        <span class='label'>Asunto:</span> 
                        {$this->sanitizeString($data['subject'] ?? 'Sin asunto')}
                    </div>
                    <div class='message'>
                        " . nl2br($this->sanitizeString($data['message'])) . "
                    </div>
                </div>
                <div class='footer'>
                    Enviado desde el formulario de contacto de SahaHacking
                    <br>IP: {$_SERVER['REMOTE_ADDR']}
                    <br>Fecha: " . date('Y-m-d H:i:s') . "
                </div>
            </div>
        </body>
        </html>";

        $text = "Nuevo mensaje de contacto\n\n" .
                "Nombre: {$this->sanitizeString($data['name'])}\n" .
                "Email: {$this->sanitizeString($data['email'])}\n" .
                "Asunto: {$this->sanitizeString($data['subject'] ?? 'Sin asunto')}\n\n" .
                "Mensaje:\n{$this->sanitizeString($data['message'])}\n\n" .
                "IP: {$_SERVER['REMOTE_ADDR']}\n" .
                "Fecha: " . date('Y-m-d H:i:s');

        return ['html' => $html, 'text' => $text];
    }
}