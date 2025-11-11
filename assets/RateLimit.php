<?php
namespace SahaHacking;

class RateLimit {
    private $cacheFile;
    private $limits;
    private $timeWindow = 3600; // 1 hora

    public function __construct() {
        $this->cacheFile = __DIR__ . '/rate_limits.json';
        $this->loadLimits();
    }

    private function loadLimits() {
        if (file_exists($this->cacheFile)) {
            $this->limits = json_decode(file_get_contents($this->cacheFile), true) ?? [];
        } else {
            $this->limits = [];
        }

        // Limpiar registros antiguos
        $this->cleanup();
    }

    private function saveLimits() {
        file_put_contents($this->cacheFile, json_encode($this->limits));
    }

    private function cleanup() {
        $now = time();
        foreach ($this->limits as $ip => $data) {
            if ($now - $data['timestamp'] > $this->timeWindow) {
                unset($this->limits[$ip]);
            }
        }
        $this->saveLimits();
    }

    public function checkLimit($ip) {
        if (!isset($this->limits[$ip])) {
            return true;
        }

        $limit = $this->limits[$ip];
        if (time() - $limit['timestamp'] > $this->timeWindow) {
            unset($this->limits[$ip]);
            $this->saveLimits();
            return true;
        }

        return $limit['count'] < 5;
    }

    public function increment($ip) {
        if (!isset($this->limits[$ip])) {
            $this->limits[$ip] = [
                'count' => 1,
                'timestamp' => time()
            ];
        } else {
            $this->limits[$ip]['count']++;
        }
        $this->saveLimits();
    }
}