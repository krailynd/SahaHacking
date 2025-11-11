<?php


require __DIR__ . '/../vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// --- Configuración del correo (considera mover estas credenciales a un archivo fuera del repo o variables de entorno)
$recipient = 'krailyndg@gmail.com';
$from_email = 'krailyndg@gmail.com';
$from_name = 'SahaHacking Website';
$smtp_host = 'smtp.gmail.com';
$smtp_port = 587;
$smtp_username = 'krailyndg@gmail.com';
$smtp_password = 'mkxb fjdo aokr syvx';
$smtp_secure = 'tls';

// Helper: detector simple de plataforma/dispositivo a partir del User-Agent (básico)
function detect_device($ua) {
    $ua = strtolower($ua);
    if (strpos($ua, 'iphone') !== false || strpos($ua, 'ipad') !== false || strpos($ua, 'ipod') !== false) return 'iOS (iPhone/iPad)';
    if (strpos($ua, 'android') !== false) return 'Android';
    if (strpos($ua, 'windows') !== false) return 'Windows';
    if (strpos($ua, 'macintosh') !== false || strpos($ua, 'mac os') !== false) return 'macOS';
    if (strpos($ua, 'linux') !== false) return 'Linux';
    return 'Desconocido';
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    header('Content-Type: application/json; charset=UTF-8');
    try {
        // Sanitizar y validar entradas
        $name = htmlspecialchars(trim($_POST["name"] ?? ''));
        $email = filter_var(trim($_POST["email"] ?? ''), FILTER_SANITIZE_EMAIL);
        $message = trim($_POST["message"] ?? '');
        $subject = "Nuevo mensaje de contacto desde SahaHacking";

        if (empty($name) || empty($email) || empty($message)) {
            throw new Exception('Por favor complete todos los campos.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Por favor ingrese un email válido.');
        }

        // Metadatos útiles
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'Desconocida';
        // HTTP_X_FORWARDED_FOR puede contener múltiples IPs, tomamos la primera
        if (strpos($ip, ',') !== false) {
            $parts = explode(',', $ip);
            $ip = trim($parts[0]);
        }
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Desconocido';
        $device = detect_device($userAgent);
        $referer = $_SERVER['HTTP_REFERER'] ?? 'No disponible';
        $acceptLang = $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '';
        $sentAt = date('Y-m-d H:i:s');

        // Preparar PHPMailer
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = $smtp_host;
        $mail->SMTPAuth = true;
        $mail->Username = $smtp_username;
        $mail->Password = $smtp_password;
        $mail->SMTPSecure = $smtp_secure;
        $mail->Port = $smtp_port;
        $mail->CharSet = 'UTF-8';

        $mail->setFrom($from_email, $from_name);
        $mail->addAddress($recipient);
        $mail->addReplyTo($email, $name);

        // Email HTML mejorado (seguros: escapamos valores)
        $safeName = htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $safeEmail = htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
        $safeIp = htmlspecialchars($ip, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $safeUA = htmlspecialchars($userAgent, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $safeDevice = htmlspecialchars($device, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $safeReferer = htmlspecialchars($referer, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $safeLang = htmlspecialchars($acceptLang, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $safeSentAt = htmlspecialchars($sentAt, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        // Encabezados y prioridad para correo profesional
        $mail->Priority = 3; // 1 = High, 3 = Normal, 5 = Low
        $mail->addCustomHeader('X-Mailer', 'SahaHacking Mailer');
        $mail->addCustomHeader('X-Priority', '3');
        $mail->Sender = $smtp_username; // Return-Path

        $mail->isHTML(true);
        $mail->Subject = "[SahaHacking] Nuevo contacto: $safeName";

        // Intentar incrustar el logo del sitio si existe (email embebido)
        $logoPath = __DIR__ . '/img/favicon.png';
        $logoCid = '';
        if (file_exists($logoPath)) {
            // cid identifier
            $logoCid = 'logo_cid';
            try {
                $mail->addEmbeddedImage($logoPath, $logoCid, 'logo.png');
            } catch (Exception $e) {
                // si falla, continuamos sin logo
                $logoCid = '';
            }
        }

        // Plantilla HTML (table-based, inline CSS para mejor compatibilidad)
        $preheader = htmlspecialchars(substr(strip_tags($message), 0, 120), ENT_QUOTES, 'UTF-8');
        $mailHtml = '<!doctype html>' .
            '<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' .
            '<style>body{margin:0;padding:0;background:#f4f4f6;font-family:Arial,Helvetica,sans-serif;color:#222}table{border-collapse:collapse}a{color:#0b6efd}</style>' .
            '</head><body>' .
            '<span style="display:none!important;visibility:hidden;mso-hide:all;">' . $preheader . '</span>' .
            '<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center">' .
            '<table width="700" cellpadding="0" cellspacing="0" role="presentation" style="max-width:700px;margin:20px auto;background:#ffffff;border:1px solid #e9ecef;border-radius:6px;overflow:hidden">' .
            '<tr><td style="background:#0b6efd;padding:18px;color:#fff;">' .
            ($logoCid ? '<img src="cid:' . $logoCid . '" alt="SahaHacking" style="height:34px;vertical-align:middle;margin-right:10px">' : '') .
            '<strong style="font-size:16px">SahaHacking</strong></td></tr>' .
            '<tr><td style="padding:20px">' .
            '<h2 style="margin:0 0 12px;font-size:18px;color:#111">Nuevo mensaje de contacto</h2>' .
            '<p style="margin:0 0 18px;color:#555">Has recibido un nuevo mensaje desde el formulario de contacto.</p>' .

            '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:18px">' .
            '<tr><td style="width:140px;padding:6px 8px;font-weight:700;color:#333;border:1px solid #f1f1f1">Nombre</td><td style="padding:6px 8px;border:1px solid #f1f1f1">' . $safeName . '</td></tr>' .
            '<tr><td style="width:140px;padding:6px 8px;font-weight:700;color:#333;border:1px solid #f1f1f1">Email</td><td style="padding:6px 8px;border:1px solid #f1f1f1">' . $safeEmail . '</td></tr>' .
            '<tr><td style="width:140px;padding:6px 8px;font-weight:700;color:#333;border:1px solid #f1f1f1">Enviado</td><td style="padding:6px 8px;border:1px solid #f1f1f1">' . $safeSentAt . '</td></tr>' .
            '</table>' .

            '<p style="margin:0 0 8px;font-weight:700;color:#333">Mensaje:</p>' .
            '<div style="background:#f9f9f9;padding:12px;border-radius:6px;border:1px solid #eee;color:#333;margin-bottom:18px">' . $safeMessage . '</div>' .

            '<h3 style="margin:0 0 8px;font-size:14px;color:#111">Detalles del envío</h3>' .
            '<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size:13px">' .
            '<tr><td style="padding:6px 8px;border:1px solid #f1f1f1;font-weight:700;color:#333;width:180px">IP</td><td style="padding:6px 8px;border:1px solid #f1f1f1">' . $safeIp . '</td></tr>' .
            '<tr><td style="padding:6px 8px;border:1px solid #f1f1f1;font-weight:700;color:#333">Dispositivo</td><td style="padding:6px 8px;border:1px solid #f1f1f1">' . $safeDevice . '</td></tr>' .
            '<tr><td style="padding:6px 8px;border:1px solid #f1f1f1;font-weight:700;color:#333">User-Agent</td><td style="padding:6px 8px;border:1px solid #f1f1f1">' . $safeUA . '</td></tr>' .
            '<tr><td style="padding:6px 8px;border:1px solid #f1f1f1;font-weight:700;color:#333">Referer</td><td style="padding:6px 8px;border:1px solid #f1f1f1">' . $safeReferer . '</td></tr>' .
            '<tr><td style="padding:6px 8px;border:1px solid #f1f1f1;font-weight:700;color:#333">Accept-Language</td><td style="padding:6px 8px;border:1px solid #f1f1f1">' . $safeLang . '</td></tr>' .
            '</table>' .

            '<p style="margin:18px 0 0;color:#777;font-size:12px">Este mensaje fue enviado desde el formulario de contacto de SahaHacking. Responde a este correo para contactar al remitente.</p>' .
            '</td></tr>' .
            '<tr><td style="background:#f8f9fb;padding:12px;text-align:center;font-size:12px;color:#889">© ' . date('Y') . ' SahaHacking</td></tr>' .
            '</table></td></tr></table></body></html>';

        $mail->Body = $mailHtml;

        // Texto plano fallback (incluye metadatos)
        $mail->AltBody = "Nuevo mensaje de contacto\n\nNombre: $name\nEmail: $email\n\nMensaje:\n$message\n\n---\nIP: $ip\nDispositivo: $device\nUser-Agent: $userAgent\nReferer: $referer\nAccept-Language: $acceptLang\nEnviado: $sentAt";

        if ($mail->send()) {
            echo json_encode([
                'status' => 'success',
                'message' => '¡Gracias! Tu mensaje ha sido enviado correctamente.'
            ]);
        } else {
            throw new Exception($mail->ErrorInfo);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Método no permitido'
    ]);
}
?>