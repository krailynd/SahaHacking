<?php
return [
    'mail' => [
        'recipient_email' => 'krailyndg@gmail.com',
        'from_email' => 'krailyndg@gmail.com',
        'from_name' => 'SahaHacking Website',
        'smtp_host' => 'smtp.gmail.com',
        'smtp_port' => 587,
        'smtp_secure' => 'tls',
        'smtp_auth' => true,
        'smtp_username' => 'krailyndg@gmail.com',
        'smtp_password' => 'mkxb fjdo aokr syvx'
    ],
    'security' => [
        'allowed_domains' => ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'],
        'max_message_length' => 3000,
        'throttle_limit' => 5, // máximo de correos por IP en 1 hora
        'recaptcha_secret' => '', // si decides añadir reCAPTCHA en el futuro
    ]
];