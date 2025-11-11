<?php
require 'vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'krailyndg@gmail.com';
    $mail->Password = 'mkxb fjdo aokr syvx';
    $mail->SMTPSecure = 'tls';
    $mail->Port = 587;
    
    $mail->setFrom('krailyndg@gmail.com', 'Test');
    $mail->addAddress('krailyndg@gmail.com');
    $mail->Subject = 'Test Email';
    $mail->Body = 'This is a test email';
    
    $mail->send();
    echo "Email sent successfully";
} catch (Exception $e) {
    echo "Error: {$mail->ErrorInfo}";
}