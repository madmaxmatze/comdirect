<?php

// https://evertpot.com/107/
class FileCache {
  private $cacheDir;

  public function __construct($cacheDir) {
    $this->cacheDir = $cacheDir;
  }

  public function put($namespace, $key, $data, $ttl = 0) {
    if (!$namespace || !$key) {
      return null;
    }

    $this->createNamespaceFolder($namespace); 
    $h = fopen($this->getPath($namespace, $key), 'w');
    if (!$h) {
      throw new Exception('Could not write to cache');
    }
    $expireTime = ($ttl ? time() + $ttl : 0);
    $data = json_encode(array($expireTime, $data));
    if (fwrite($h, $data) === false) {
      throw new Exception('Could not write to cache');
    }
    fclose($h);
  }

  public function get($namespace, $key) {
    if (!$namespace || !$key) {return false;}

    $data = false;

    $filepath = $this->getPath($namespace, $key);
    if (file_exists($filepath) && is_readable($filepath)) {
      $fileContent = file_get_contents($filepath);
      $data = @json_decode($fileContent, true);
    }

    // checking if the data was expired
    if ($data && $data[0] && time() > $data[0]) {
      @unlink($filepath);
      return false;
    }

    return ($data ? $data[1] : false);
  }

  public function getLast($namespace, $prefix) {
    if (!$namespace || !$prefix) {return null;}
    $lastKey = $this->getLastKey($namespace, $prefix);
    return $this->get($namespace, $lastKey);
  }

  public function getLastKey($namespace, $prefix) {
    if (!$namespace || !$prefix) {return null;}
    $keys = $this->getKeys($namespace, $prefix);
    return ($keys && count($keys) ? end($keys) : null);
  }

  public function getKeys($namespace, $prefix = null) {
    if (!$namespace) {
      return [];
    }
    $folder = $this->getPath($namespace);
    if (!is_dir($folder)) {
      return [];
    }

    $keys = array_diff(scandir($folder), ['..', '.']);
    $keys = preg_replace("/\.json$/", "", $keys);   // remove json extension
    if (isset($prefix) && $prefix) {
      $keys = array_values(array_filter($keys, 
        function ($fileName) use ($prefix) {
          return str_starts_with($fileName, $prefix);
        }
      ));
    }
    
    return $keys;
  }

  public function remove($namespace, $key) {
    if (!$namespace || !$key) {return false;}

    $filepath = $this->getPath($namespace, $key);
    return @unlink($filepath);
  } 
  
  private function createNamespaceFolder($namespace) {
    $folder = $this->getPath($namespace);
    if (!is_dir($folder)) {
      @mkdir ($folder);
    }
    return $folder;
  }

  private function getPath($namespace, $key = null) {      
    return $this->cacheDir . '/' . $namespace . ($key ? '/' . $key . ".json" : "");
  }
}